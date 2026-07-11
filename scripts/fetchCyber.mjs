import axios from "axios";
import Parser from "rss-parser";
import { cleanEncoding, readNewsData, writeNewsData, isCyberItem, MAX_AGE_MS, translateText } from "./utils.mjs";

const parser = new Parser();
const RANSOM_LIVE_API = "https://api.ransomware.live/recent";

const INTERNATIONAL_CYBER_FEEDS = [
    "https://feeds.feedburner.com/TheHackersNews",
    "https://bleepingcomputer.com/feed/",
    "https://cyberpress.org/category/data-breach/",
    "https://cyberpress.org/category/cyber-attack/"
];

const FRENCH_CONTEXT_KEYWORDS = [
    "FRANCE", "FRENCH", "PARIS", "EUROPE", "EU", "NATO", "OTAN", 
    "GLOBAL", "CRITICAL", "VULNERABILITY", "ZERO-DAY", "MICROSOFT", 
    "GOOGLE", "APPLE", "ANSSI", "CERT-FR", "ORANGE", "THALES", 
    "AIRBUS", "EDF", "TOTAL", "MACRON", "BARNIER"
];

function isFrenchTarget(text) {
    if (!text) return false;
    const upper = text.toUpperCase();
    return FRENCH_CONTEXT_KEYWORDS.some(keyword => upper.includes(keyword));
}

// Fonction de traduction sécurisée avec Timeout interne de 3 secondes maximum
async function safeTranslate(text) {
    if (!text) return "";
    try {
        // Crée une promesse qui rejette après 3000ms pour éviter le gel sur GitHub Actions
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 3000));
        return await Promise.race([translateText(text), timeout]);
    } catch (e) {
        // En cas d'erreur ou de surcharge de l'API de trad, on garde le titre en Anglais
        return text; 
    }
}

async function fetchInternationalFeed(url, forceAll = false) {
    try {
        const feed = await parser.parseURL(url);
        let filtered = (feed.items || []).filter(
            i => forceAll || isFrenchTarget(i.title) || isFrenchTarget(i.contentSnippet || i.summary)
        );

        // PROTECTION CRITIQUE : On ne prend que les 5 articles les plus récents pour éviter d'asphyxier l'API de trad
        filtered = filtered.slice(0, 5);

        // Détermination dynamique de la source
        let sourceName = "CyberPress";
        if (url.includes("thehackernews")) sourceName = "The Hacker News";
        else if (url.includes("bleepingcomputer")) sourceName = "BleepingComputer";

        const mapped = await Promise.all(filtered.map(async (i) => {
            const rawTitle = i.title || "";
            const translatedTitle = await safeTranslate(rawTitle);
            
            return {
                title: cleanEncoding(`[CYBER${forceAll ? "" : " INT"}] ${translatedTitle}`),
                source: sourceName,
                time: i.pubDate ? new Date(i.pubDate).toISOString() : new Date().toISOString(),
                link: i.link || i.guid || "",
                score: forceAll ? 70 : 88
            };
        }));

        return mapped;
    } catch (e) {
        return [];
    }
}

async function fetchRansomwareLive() {
    let results = [];
    try {
        const resp = await axios.get(RANSOM_LIVE_API, { timeout: 5000 }); // Ajout d'un timeout sur l'API externe
        results = Array.isArray(resp.data) ? resp.data : (resp.data?.attacks || []);
    } catch (e) {}

    let targetPosts = results.filter(item => {
        const content = `${item.company || ""} ${item.country || ""} ${item.post_title || ""}`;
        return content.toUpperCase().includes("FRANCE") || item.country === "FR";
    });

    // Sécurité : Max 10 traductions pour Ransomware.live
    targetPosts = targetPosts.slice(0, 10);

    const mapped = await Promise.all(targetPosts.map(async (post) => {
        const rawInfo = post.company || post.post_title || "Cible française";
        const translatedInfo = await safeTranslate(rawInfo);

        return {
            title: cleanEncoding(`[CYBER] Rançon-live (${post.group_name || "Leak"}) : ${translatedInfo}`),
            source: "Ransomware.live",
            time: post.discovered || new Date().toISOString(),
            link: post.website || post.post_url || "https://www.ransomware.live/",
            score: 96
        };
    }));

    return mapped;
}

async function run() {
    const now = Date.now();
    const currentData = readNewsData();

    const existingNews = (currentData.items || []).filter(
        i => !isCyberItem(i) && now - new Date(i.time).getTime() < MAX_AGE_MS
    );
    const existingCyber = (currentData.items || []).filter(
        i => isCyberItem(i) && now - new Date(i.time).getTime() < MAX_AGE_MS
    );

    let newCyberItems = await fetchRansomwareLive();
    
    // Récupération séquentielle contrôlée pour éviter le spam réseau
    for (const url of INTERNATIONAL_CYBER_FEEDS) {
        const items = await fetchInternationalFeed(url, false);
        newCyberItems = newCyberItems.concat(items);
    }

    // Si on a moins de 5 news ciblées France, on pioche dans le flux général sans saturer
    if (newCyberItems.length < 5) {
        for (const url of INTERNATIONAL_CYBER_FEEDS) {
            const extra = await fetchInternationalFeed(url, true);
            newCyberItems = [...newCyberItems, ...extra];
        }
    }

    const allCyber = [...new Map([...existingCyber, ...newCyberItems].map(i => [i.link, i])).values()]
        .filter(i => now - new Date(i.time).getTime() < MAX_AGE_MS)
        .sort((a, b) => b.score - a.score)
        .slice(0, 50);

    const finalItems = [...existingNews, ...allCyber].sort((a, b) => b.score - a.score);
    writeNewsData(finalItems);
    console.log(`✔ Flux cyber mis à jour et traduit en parallèle (${allCyber.length} items).`);
}

run();
