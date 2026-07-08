import axios from "axios";
import Parser from "rss-parser";
import { cleanEncoding, readNewsData, writeNewsData, isCyberItem, MAX_AGE_MS } from "./utils.mjs";

const parser = new Parser();
const API = "https://www.ransomlook.io/api";

const CYBER_RSS_FEEDS = [
    "https://www.zataz.com/feed/",
    "https://www.lemondeinformatique.fr/flux-rss/thematique/securite/rss.xml",
    "https://www.cert.ssi.gouv.fr/feed/"
];

async function fetchCyberRSS(url) {
    try {
        const feed = await parser.parseURL(url);
        return (feed.items || []).map(i => {
            const rawTitle = cleanEncoding(i.title || "");
            const title = !rawTitle.startsWith("[CYBER]") ? `[CYBER] ${rawTitle}` : rawTitle;
            return {
                title,
                source: url.includes("cert") ? "CERT-FR" : (url.includes("zataz") ? "Zataz" : "Le Monde Informatique"),
                time: i.pubDate ? new Date(i.pubDate).toISOString() : new Date().toISOString(),
                link: i.link || i.guid || "",
                score: 90
            };
        });
    } catch (e) {
        return [];
    }
}

async function fetchRansomlookAttacks() {
    let results = [];
    try {
        const respPosts = await axios.get(`${API}/posts`, { params: { days: 1 } });
        if (Array.isArray(respPosts.data)) results = results.concat(respPosts.data);
    } catch (e) {}

    return results.map(post => ({
        title: cleanEncoding(`[CYBER] ${post.group_name || "Ransom"} : ${post.post_title}`),
        source: "Ransomlook.io",
        time: post.discovered || new Date().toISOString(),
        link: post.website || post.post_url || "https://www.ransomlook.io/",
        score: 95
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
    for (const url of CYBER_RSS_FEEDS) {
        newCyberItems = newCyberItems.concat(await fetchCyberRSS(url));
    }
    newCyberItems = newCyberItems.concat(await fetchRansomlookAttacks());

    const allCyber = [...new Map([...existingCyber, ...newCyberItems].map(i => [i.link, i])).values()]
        .filter(i => now - new Date(i.time).getTime() < MAX_AGE_MS)
        .sort((a, b) => b.score - a.score)
        .slice(0, 50);

    const finalItems = [...existingNews, ...allCyber].sort((a, b) => b.score - a.score);
    writeNewsData(finalItems);
    console.log("✔ Flux cyber mis à jour.");
}

run();
