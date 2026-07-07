import Parser from "rss-parser";
import fs from "fs";

const parser = new Parser();

const RSS_FEEDS = [
    "https://www.franceinfo.fr/titres.rss",
    "https://www.lefigaro.fr/rss/figaro_actualites.xml",
    "https://www.20minutes.fr/feeds/rss-une.xml",
    "https://www.leparisien.fr/actualites-a-la-une/rss.xml"
];

const CRITICAL_KEYWORDS = [
    { k: "ATTENTAT", s: 100 },
    { k: "MASSACRE", s: 100 },
    { k: "EXPLOSION", s: 90 },
    { k: "FUSILLADE", s: 90 },
    { k: "MEURTRE", s: 85 },
    { k: "ASSASSINAT", s: 85 },
    { k: "MORT", s: 80 },
    { k: "MORTS", s: 80 },
    { k: "DÉCÈS", s: 75 },
    { k: "TUÉ", s: 80 },
    { k: "TUÉS", s: 80 },
    { k: "INCENDIE", s: 75 },
    { k: "ÉMEUTE", s: 70 },
    { k: "AGRESSION", s: 65 }
];

function getScore(title) {
    let t = (title || "").toUpperCase();

    if (t.includes("TOUR DE FRANCE") || t.includes("CYCLISME") || t.includes("FOOTBALL") || 
        t.includes("MATCH") || t.includes("BOMBE ATOMIQUE") || t.includes("DÉPOSÉ LES ARMES")) {
        return 15;
    }

    let score = 30;
    for (const item of CRITICAL_KEYWORDS) {
        if (t.includes(item.k)) {
            score = Math.max(score, item.s);
        }
    }

    if (t.includes("PORTRAIT") || t.includes("IL Y A UN AN") || t.includes("EN APPEL")) {
        score = Math.max(25, score - 20);
    }
    return score;
}

async function fetchRSS(url) {
    try {
        const feed = await parser.parseURL(url);
        return feed.items.map(i => ({
            title: i.title || "",
            source: url,
            time: new Date().toISOString(),
            link: i.link || "",
            score: getScore(i.title || "")
        }));
    } catch(e) {
        console.log("RSS error:", url);
        return [];
    }
}

async function run() {
    let history = [];
    if (fs.existsSync("data/news.json")) {
        try {
            history = JSON.parse(fs.readFileSync("data/news.json", "utf-8")).items || [];
        } catch(e) { console.error("Erreur lecture history"); }
    }

    let newItems = [];
    for(const url of RSS_FEEDS) {
        const data = await fetchRSS(url);
        newItems = newItems.concat(data);
    }

    // 🔥 DÉDUPLICATION PAR URL (i.link)
    // On utilise i.link comme clé unique pour le Map
    let all = [...new Map([...history, ...newItems].map(i => [i.link, i])).values()];
    
    all.sort((a, b) => b.score - a.score);
    const final = all.slice(0, 100);

    const output = {
        updated: new Date().toISOString(),
        count: final.length,
        items: final
    };

    fs.mkdirSync("data", { recursive: true });
    fs.writeFileSync("data/news.json", JSON.stringify(output, null, 2));

    console.log("✔ news.json mis à jour (Déduplication par URL):", final.length);
}

run();
