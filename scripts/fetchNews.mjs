import Parser from "rss-parser";
import { cleanEncoding, readNewsData, writeNewsData, isCyberItem, MAX_AGE_MS } from "./utils.mjs";

const parser = new Parser();

const RSS_FEEDS = [
    "https://www.franceinfo.fr/titres.rss",
    "https://www.lefigaro.fr/rss/figaro_actualites.xml",
    "https://www.20minutes.fr/feeds/rss-une.xml"
];

// Remplace ton ancien getScore par celui-ci :
function getScore(title) {
    const t = (title || "").toUpperCase();
    if (t.includes("ATTENTAT") || t.includes("EXPLOSION") || t.includes("GUERRE") || t.includes(" CRISE")) {
        return 95;
    }
    return 70; // Score de base suffisant pour passer le filtre >= 65 de refineNews
}

async function fetchRSS(url) {
    try {
        const feed = await parser.parseURL(url);
        return feed.items.map(i => ({
            title: cleanEncoding(i.title || ""),
            source: url,
            time: i.pubDate ? new Date(i.pubDate).toISOString() : new Date().toISOString(),
            link: i.link || "",
            score: getScore(i.title || "")
        }));
    } catch (e) {
        return [];
    }
}

async function run() {
    const now = Date.now();
    const currentData = readNewsData();

    // Conserver uniquement les actus non-cyber récentes
    const existingNews = (currentData.items || []).filter(
        i => !isCyberItem(i) && now - new Date(i.time).getTime() < MAX_AGE_MS
    );
    const existingCyber = (currentData.items || []).filter(
        i => isCyberItem(i) && now - new Date(i.time).getTime() < MAX_AGE_MS
    );

    let newItems = [];
    for (const url of RSS_FEEDS) {
        newItems = newItems.concat(await fetchRSS(url));
    }

    const allNews = [...new Map([...existingNews, ...newItems].map(i => [i.link, i])).values()]
        .sort((a, b) => b.score - a.score)
        .slice(0, 50);

    const finalItems = [...allNews, ...existingCyber].sort((a, b) => b.score - a.score);
    writeNewsData(finalItems);
    console.log("✔ Flux actualités générales mis à jour.");
}

run();
