import Parser from "rss-parser";
import fs from "fs";

const parser = new Parser();
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

function cleanEncoding(str) {
    if (!str) return "";
    return str
        .replace(/vulnrabilits/gi, "vulnérabilités")
        .replace(/excuter/gi, "exécuter")
        .replace(/scurit/gi, "sécurité")
        .replace(/manag/gi, "managé")
        .replace(/dcouverte/gi, "découverte")
        .replace(/sme/gi, "sème")
        .replace(/mne/gi, "mène")
        .replace(/re/gi, "ère")
        .replace(/tranger/gi, "étranger")
        .replace(/ge/gi, "âgée")
        .replace(/ /g, " à ")
        .replace(//g, "é")
        .replace(//gi, "è")
        .replace(//gi, "à")
        .replace(//gi, "ê")
        .replace(//gi, "ô")
        .replace(//gi, "û")
        .replace(//gi, "î")
        .replace(//gi, "ç");
}

const RSS_FEEDS = [
    "https://www.franceinfo.fr/titres.rss",
    "https://www.lefigaro.fr/rss/figaro_actualites.xml",
    "https://www.20minutes.fr/feeds/rss-une.xml",
    "https://www.leparisien.fr/actualites-a-la-une/rss.xml",
    "https://www.sudouest.fr/faits-divers/rss.xml",
    "https://www.ledauphine.com/Faits-divers-Justice/rss",
    "https://www.cnews.fr/rss/categorie/faits%20divers",
    "https://rmccrime.bfmtv.com/rss/affaires-criminelles/france/",
    "https://rmccrime.bfmtv.com/rss/affaires-criminelles/"
];

const ANXIETY_KEYWORDS = [
    { k: "ATTENTAT", s: 100 }, { k: "MASSACRE", s: 100 },
    { k: "EXPLOSION", s: 95 }, { k: "FUSILLADE", s: 95 },
    { k: "MEURTRE", s: 90 }, { k: "ASSASSINAT", s: 90 },
    { k: "MORT", s: 85 }, { k: "TUÉ", s: 85 },
    { k: "INCENDIE", s: 80 }, { k: "ÉMEUTE", s: 80 },
    { k: "AGRESSION", s: 75 }, { k: "TRAQUE", s: 70 },
    { k: "DISPARITION", s: 65 }
];

const SMOOTH_KEYWORDS = ["SAIN ET SAUF", "HISTORIQUE", "RENAÎT", "DIALOGUE", "AVANCÉE", "PORTRAIT", "INVESTISSEMENT"];

function isCyberItem(item) {
    return item.source === "CERT-FR" || item.source === "Zataz" || item.source === "Le Monde Informatique" || 
           item.source === "Ransomlook.io" || (item.title || "").startsWith("[CYBER]");
}

function getScore(title) {
    let t = (title || "").toUpperCase();
    let score = 10;
    for (const item of ANXIETY_KEYWORDS) { if (t.includes(item.k)) score = Math.max(score, item.s); }
    for (const word of SMOOTH_KEYWORDS) { if (t.includes(word)) score -= 40; }
    return score;
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
    if (fs.existsSync("data/news.json")) {
        try { currentFullData = JSON.parse(fs.readFileSync("data/news.json", "utf-8")); } catch(e) {}
    }

    const existingItems = (currentFullData.items || []).filter(i => 
        !isCyberItem(i) && (now - new Date(i.time).getTime() < MAX_AGE_MS)
    );
    const existingCyber = (currentFullData.items || []).filter(i => 
        isCyberItem(i) && (now - new Date(i.time).getTime() < MAX_AGE_MS)
    );

    let newItems = [];
    for(const url of RSS_FEEDS) { newItems = newItems.concat(await fetchRSS(url)); }

    let allNews = [...new Map([...existingItems, ...newItems].map(i => [i.link, i])).values()]
        .filter(i => i.score >= 65 && (now - new Date(i.time).getTime() < MAX_AGE_MS)) 
        .sort((a, b) => b.score - a.score)
        .slice(0, 50);

    const finalItems = [...allNews, ...existingCyber].sort((a, b) => b.score - a.score);

    const output = {
        updated: new Date().toISOString(),
        count: finalItems.length,
        items: finalItems
    };

    fs.mkdirSync("data", { recursive: true });
    fs.writeFileSync("data/news.json", JSON.stringify(output, null, 2));

    console.log("✔ Pipeline actualités mise à jour :", allNews.length, "news générales conservées.");
}

run();
