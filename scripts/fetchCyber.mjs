import fs from "fs";
import axios from "axios";
import Parser from "rss-parser";

const parser = new Parser();
const API = "https://www.ransomlook.io/api";
const TARGET_FILE = "data/news.json";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

function cleanEncoding(str) {
    if (!str) return "";
    return str
        .replace(/\uFFFD/g, "é")
        .replace(/prpare/gi, "prépare")
        .replace(/corriâgée/gi, "corrigée")
        .replace(/franéaises/gi, "françaises")
        .replace(/similaire é/gi, "similaire à")
        .replace(/é l'ére/gi, "à l'ère")
        .replace(/excuter/gi, "exécuter")
        .replace(/ grande/gi, "à grande")
        .replace(/chelle/gi, "échelle");
}

const CYBER_RSS_FEEDS = [
    "https://www.zataz.com/feed/",
    "https://www.lemondeinformatique.fr/flux-rss/thematique/securite/rss.xml",
    "https://www.cert.ssi.gouv.fr/feed/"
];

const FRENCH_KEYWORDS = ["FRANCE", "CYBER", "ATTAQUE", "RANÇONGICIEL", "VULNÉRABILITÉ", "ALERTE", "CERT"];

function isCyberItem(item) {
    return item.source === "CERT-FR" || item.source === "Zataz" || item.source === "Le Monde Informatique" || item.source === "Ransomlook.io" || (item.title || "").startsWith("[CYBER]");
}

async function fetchCyberRSS(url) {
    try {
        const feed = await parser.parseURL(url);
        return (feed.items || []).map(i => {
            const rawTitle = cleanEncoding(i.title || "");
            const title = !rawTitle.startsWith("[CYBER]") ? `[CYBER] ${rawTitle}` : rawTitle;
            return {
                title: title,
                source: url.includes("cert") ? "CERT-FR" : (url.includes("zataz") ? "Zataz" : "Le Monde Informatique"),
                time: i.pubDate ? new Date(i.pubDate).toISOString() : new Date().toISOString(),
                link: i.link || i.guid || "",
                score: 90
            };
        });
    } catch(e) { return []; }
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
    const now = new Date().getTime();
    let currentFullData = { items: [] };
    if (fs.existsSync(TARGET_FILE)) { try { currentFullData = JSON.parse(fs.readFileSync(TARGET_FILE, "utf-8")); } catch (e) {} }

    const existingNews = (currentFullData.items || []).filter(i => !isCyberItem(i) && (now - new Date(i.time).getTime() < MAX_AGE_MS));
    const existingCyber = (currentFullData.items || []).filter(i => isCyberItem(i) && (now - new Date(i.time).getTime() < MAX_AGE_MS));

    let newCyberItems = [];
    for (const url of CYBER_RSS_FEEDS) { newCyberItems = newCyberItems.concat(await fetchCyberRSS(url)); }
    newCyberItems = newCyberItems.concat(await fetchRansomlookAttacks());

    let allCyber = [...new Map([...existingCyber, ...newCyberItems].map(i => [i.link, i])).values()]
        .filter(i => i.score >= 65 && (now - new Date(i.time).getTime() < MAX_AGE_MS))
        .sort((a, b) => b.score - a.score).slice(0, 50);

    const finalItems = [...existingNews, ...allCyber].sort((a, b) => b.score - a.score);
    fs.mkdirSync("data", { recursive: true });
    fs.writeFileSync(TARGET_FILE, JSON.stringify({ updated: new Date().toISOString(), count: finalItems.length, items: finalItems }, null, 2));
}
run();
