import axios from "axios";
import Parser from "rss-parser";
import { cleanEncoding, readNewsData, writeNewsData, isCyberItem, MAX_AGE_MS, translateText } from "./utils.mjs";

const parser = new Parser();
const RANSOM_LIVE_API = "https://api.ransomware.live/recent";

const INTERNATIONAL_CYBER_FEEDS = [
    "https://feeds.feedburner.com/TheHackersNews",
    "https://bleepingcomputer.com/feed/"
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

async function fetchInternationalFeed(url, forceAll = false) {
    try {
        const feed = await parser.parseURL(url);
        const filtered = (feed.items || []).filter(
            i => forceAll || isFrenchTarget(i.title) || isFrenchTarget(i.contentSnippet || i.summary)
        );

        // Traduction en parallèle de tous les titres filtrés en un seul bloc
        const mapped = await Promise.all(filtered.map(async (i) => {
            const rawTitle = i.title || "";
            const translatedTitle = await translateText(rawTitle);
            
            return {
                title: cleanEncoding(`[CYBER${forceAll ? "" : " INT"}] ${translatedTitle}`),
                source: url.includes("thehackernews") ? "The Hacker News" : "BleepingComputer",
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
        const resp = await axios.get(RANSOM_LIVE_API);
        results = Array.isArray(resp.data) ? resp.data : (resp.data?.attacks || []);
    } catch (e) {}

    const targetPosts = results.filter(item => {
        const content = `${item.company || ""} ${item.country || ""} ${item.post_title || ""}`;
        return content.toUpperCase().includes("FRANCE") || item.country === "FR";
    });

    // Traduction en parallèle pour Ransomware live
    const mapped = await Promise.all(targetPosts.map(async (post) => {
        const rawInfo = post.company || post.post_title || "Cible française";
        const translatedInfo = await translateText(rawInfo);

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
    for (const url of INTERNATIONAL_CYBER_FEEDS) {
        newCyberItems = newCyberItems.concat(await fetchInternationalFeed(url, false));
    }

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
