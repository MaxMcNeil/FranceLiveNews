import Parser from "rss-parser";
import fs from "fs";

const parser = new Parser();
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

function cleanEncoding(str) {
    if (!str) return "";
    return str
        .replace(/\uFFFD/g, "é")
        .replace(/prpare/gi, "prépare")
        .replace(/excuter/gi, "exécuter")
        .replace(/ grande/gi, "à grande")
        .replace(/chelle/gi, "échelle");
}

const RSS_FEEDS = ["https://www.franceinfo.fr/titres.rss", "https://www.lefigaro.fr/rss/figaro_actualites.xml", "https://www.20minutes.fr/feeds/rss-une.xml"];

function getScore(title) {
    let t = (title || "").toUpperCase();
    return t.includes("ATTENTAT") || t.includes("EXPLOSION") ? 95 : 10;
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
    } catch(e) { return []; }
}

async function run() {
    const now = new Date().getTime();
    let currentFullData = { items: [] };
    if (fs.existsSync("data/news.json")) { try { currentFullData = JSON.parse(fs.readFileSync("data/news.json", "utf-8")); } catch(e) {} }

    const existingItems = (currentFullData.items || []).filter(i => (now - new Date(i.time).getTime() < MAX_AGE_MS));
    let newItems = [];
    for(const url of RSS_FEEDS) { newItems = newItems.concat(await fetchRSS(url)); }

    const finalItems = [...new Map([...existingItems, ...newItems].map(i => [i.link, i])).values()]
        .sort((a, b) => b.score - a.score).slice(0, 50);

    fs.mkdirSync("data", { recursive: true });
    fs.writeFileSync("data/news.json", JSON.stringify({ updated: new Date().toISOString(), count: finalItems.length, items: finalItems }, null, 2));
}
run();
