import Parser from "rss-parser";
import fs from "fs";

const parser = new Parser();

const RSS_FEEDS = [
    "https://www.franceinfo.fr/titres.rss",
    "https://www.lefigaro.fr/rss/figaro_actualites.xml",
    "https://www.20minutes.fr/feeds/rss-une.xml",
    "https://www.leparisien.fr/actualites-a-la-une/rss.xml"
];

const KEYWORDS = [
    { k:"MEURTRE", s:95 }, { k:"ASSASSIN", s:95 }, { k:"ASSASSINAT", s:95 },
    { k:"HOMICIDE", s:90 }, { k:"FUSILLADE", s:90 }, { k:"ATTENTAT", s:100 },
    { k:"EXPLOSION", s:85 }, { k:"VIOL", s:85 }, { k:"AGRESSION", s:70 },
    { k:"ARME", s:75 }, { k:"COUTEAU", s:80 }, { k:"DROGUE", s:65 },
    { k:"NARCOTRAFIC", s:75 }, { k:"COCAÏNE", s:70 }, { k:"POLICE", s:60 },
    { k:"GENDARMERIE", s:60 }, { k:"BRAQUAGE", s:80 }, { k:"SCANDALE", s:65 },
    { k:"CORRUPTION", s:75 }, { k:"DÉMISSION", s:70 }, { k:"IMMIGRATION", s:55 },
    { k:"ÉMEUTE", s:75 }, { k:"CRISE", s:50 }, { k:"FAILLITE", s:60 }
];

function getScore(text) {
    let score = 0;
    let t = text.toUpperCase();
    for(const item of KEYWORDS) {
        if(t.includes(item.k)) score = Math.max(score, item.s);
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
    // 1. Charger l'historique
    let history = [];
    if (fs.existsSync("data/news.json")) {
        try {
            history = JSON.parse(fs.readFileSync("data/news.json", "utf-8")).items || [];
        } catch(e) { console.error("Erreur lecture history"); }
    }

    // 2. Fetch nouveaux
    let newItems = [];
    for(const url of RSS_FEEDS) {
        const data = await fetchRSS(url);
        newItems = newItems.concat(data);
    }

    // 3. Fusionner, Dédupliquer et Trier par score
    let all = [...new Map([...history, ...newItems].map(i => [i.title, i])).values()];
    all = all.filter(n => n.score > 0); // On ne garde que ce qui a un score
    all.sort((a,b) => b.score - a.score); // Priorité aux plus graves

    // 4. Limite à 100
    const final = all.slice(0, 100);

    const output = {
        updated: new Date().toISOString(),
        count: final.length,
        items: final
    };

    fs.mkdirSync("data", { recursive:true });
    fs.writeFileSync("data/news.json", JSON.stringify(output, null, 2));

    console.log("✔ news.json mis à jour (100 max):", final.length);
}

run();
