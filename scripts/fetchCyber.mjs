import axios from "axios";
import Parser from "rss-parser";
import { cleanEncoding, readNewsData, writeNewsData, isCyberItem, MAX_AGE_MS } from "./utils.mjs";

const parser = new Parser();
const RANSOM_LIVE_API = "https://api.ransomware.live/recent";

const INTERNATIONAL_CYBER_FEEDS = [
    "https://feeds.feedburner.com/TheHackersNews",
    "https://www.bleepingcomputer.com/feed/"
];

// Mots-clés pour s'assurer que l'actualité internationale concerne la France ou un acteur francophone
const FRENCH_CONTEXT_KEYWORDS = [
    "FRANCE", "FRENCH", "PARIS", "MARSEILLE", "LYON", "TOULOUSE", "NICE", "NANTES", 
    "STRASBOURG", "MONTPELLIER", "BORDEAUX", "LILLE", "RENNES", "MINISTÈRE", 
    "GOUVERNEMENT", "ANSSI", "CERT-FR", "SNCF", "ORANGE", "THALES", "AIRBUS", 
    "EDF", "TOTAL", "FREE", "BOUYGUES", "MACRON", "BARNIER", "LEROY", "RENAULT", "SANofi"
];

function isFrenchTarget(text) {
    if (!text) return false;
    const upper = text.toUpperCase();
    return FRENCH_CONTEXT_KEYWORDS.some(keyword => upper.includes(keyword));
}

async function fetchInternationalFeed(url) {
    try {
        const feed = await parser.parseURL(url);
        return (feed.items || [])
            .filter(i => isFrenchTarget(i.title) || isFrenchTarget(i.contentSnippet || i.summary))
            .map(i => ({
                title: cleanEncoding(`[CYBER INT] ${i.title || ""}`),
                source: url.includes("thehackernews") ? "The Hacker News" : "BleepingComputer",
                time: i.pubDate ? new Date(i.pubDate).toISOString() : new Date().toISOString(),
                link: i.link || i.guid || "",
                score: 88
            }));
    } catch (e) {
        return [];
    }
}

async function fetchRansomwareLive() {
    let results = [];
    try {
        const resp = await axios.get(RANSOM_LIVE_API);
        if (Array.isArray(resp.data)) {
            results = resp.data;
        } else if (resp.data && Array.isArray(resp.data.attacks)) {
            results = resp.data.attacks;
        }
    } catch (e) {}

    // Filtrer les attaques liées à la France ou retenir les majeures si pertinent, ou tout garder si ciblé
    return results
        .filter(item => {
            const content = `${item.company || ""} ${item.country || ""} ${item.group_name || ""}`;
            return content.toUpperCase().includes("FRANCE") || item.country === "FR" || isFrenchTarget(item.post_title);
        })
        .map(post => ({
            title: cleanEncoding(`[CYBER] Rançon-live (${post.group_name || "Leak"}) : ${post.company || post.post_title || "Cible française"}`),
            source: "Ransomware.live",
            time: post.discovered || new Date().toISOString(),
            link: post.website || post.post_url || "https://www.ransomware.live/",
            score: 96
        }));
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

    let newCyberItems = [];
    
    // Récupération des flux internationaux filtrés France
    for (const url of INTERNATIONAL_CYBER_FEEDS) {
        newCyberItems = newCyberItems.concat(await fetchInternationalFeed(url));
    }
    
    // Récupération de l'API ransomware.live ciblée
    newCyberItems = newCyberItems.concat(await fetchRansomwareLive());

    const allCyber = [...new Map([...existingCyber, ...newCyberItems].map(i => [i.link, i])).values()]
        .filter(i => now - new Date(i.time).getTime() < MAX_AGE_MS)
        .sort((a, b) => b.score - a.score)
        .slice(0, 50);

    const finalItems = [...existingNews, ...allCyber].sort((a, b) => b.score - a.score);
    writeNewsData(finalItems);
    console.log("✔ Flux cyber international filtré France mis à jour.");
}

run();
