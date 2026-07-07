import Parser from "rss-parser";
import fs from "fs";

const parser = new Parser();

const RSS_FEEDS = [
    "https://www.franceinfo.fr/titres.rss",
    "https://www.lefigaro.fr/rss/figaro_actualites.xml",
    "https://www.20minutes.fr/feeds/rss-une.xml",
    "https://www.leparisien.fr/actualites-a-la-une/rss.xml"
];

// 🧠 KEYWORDS + GRAVITÉ (Affiné pour éviter les faux positifs du Tour de France / sports)
const KEYWORDS = [
    // Catastrophe / Terrorisme / Morts multiples (Urgence maximale)
    { k:"ATTENTAT", s:100 },
    { k:"MASSACRE", s:100 },
    { k:"MORT", s:95 },
    { k:"MORTS", s:95 },
    { k:"DÉCÈS", s:90 },
    { k:"TUÉ", s:95 },
    { k:"TUÉS", s:95 },
    { k:"HOMICIDE", s:90 },
    { k:"MEURTRE", s:95 },
    { k:"ASSASSIN", s:95 },
    { k:"ASSASSINAT", s:95 },
    { k:"FUSILLADE", s:90 },
    { k:"EXPLOSION", s:85 },
    { k:"INCENDIE", s:80 },
    
    // Violences / Agressions / Armes
    { k:"VIOL", s:85 },
    { k:"COUTEAU", s:80 },
    { k:"BRAQUAGE", s:80 },
    { k:"AGRESSION", s:70 },
    { k:"ARME", s:75 },
    
    // Trafic / Criminalité
    { k:"NARCOTRAFIC", s:75 },
    { k:"COCAÏNE", s:70 },
    { k:"DROGUE", s:65 },
    
    // Politique / Crises / Institutions
    { k:"CORRUPTION", s:75 },
    { k:"ÉMEUTE", s:75 },
    { k:"DÉMISSION", s:70 },
    { k:"SCANDALE", s:65 },
    { k:"FAILLITE", s:60 },
    { k:"POLICE", s:55 },
    { k:"GENDARMERIE", s:55 },
    { k:"CRISE", s:50 },
    { k:"IMMIGRATION", s:45 }
];

// Fonction de scoring affinée (Neutralise les faux positifs sportifs)
function getScore(text) {
    let t = (text || "").toUpperCase();

    // 🛑 Filtre anti-faux positifs (Ex: Tour de France, sport, etc.)
    if (t.includes("TOUR DE FRANCE") || t.includes("CYCLISME") || t.includes("ÉTAPE") || t.includes("MAILLOT") || t.includes("FOOTBALL") || t.includes("MATCH")) {
        return 10; // Score très bas pour le sport
    }

    let score = 30; // Score de base par défaut pour une actu standard non classée
    
    for(const item of KEYWORDS) {
        if(t.includes(item.k)) {
            score = Math.max(score, item.s);
        }
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

    // Fusion, Déduplication
    let all = [...new Map([...history, ...newItems].map(i => [i.title, i])).values()];
    
    // 🔥 TRÈS IMPORTANT : Tri strict par gravité décroissante (du plus grave au moins grave)
    all.sort((a, b) => b.score - a.score);

    // Garde les 100 meilleures
    const final = all.slice(0, 100);

    const output = {
        updated: new Date().toISOString(),
        count: final.length,
        items: final
    };

    fs.mkdirSync("data", { recursive:true });
    fs.writeFileSync("data/news.json", JSON.stringify(output, null, 2));

    console.log("✔ news.json mis à jour et trié par gravité:", final.length);
}

run();
                                                                                                    
