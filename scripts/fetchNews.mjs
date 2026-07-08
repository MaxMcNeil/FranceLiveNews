import Parser from "rss-parser";
import fs from "fs";

const parser = new Parser();

const RSS_FEEDS = [
    // Vos sources initiales
    "https://www.franceinfo.fr/titres.rss",
    "https://www.lefigaro.fr/rss/figaro_actualites.xml",
    "https://www.20minutes.fr/feeds/rss-une.xml",
    "https://www.leparisien.fr/actualites-a-la-une/rss.xml",
    "https://www.sudouest.fr/faits-divers/rss.xml",
    "https://www.ledauphine.com/Faits-divers-Justice/rss",
    
    // Nouvelles sources spécialisées Faits Divers
    "https://www.cnews.fr/rss/categorie/faits%20divers",
    "https://rmccrime.bfmtv.com/rss/affaires-criminelles/france/",
    "https://rmccrime.bfmtv.com/rss/affaires-criminelles/",
    "https://www.ledauphine.com/Faits-divers-Justice/rss",
    "https://www.sudouest.fr/faits-divers/rss.xml"
];

// Liste pour hiérarchiser l'anxiété
const ANXIETY_KEYWORDS = [
    { k: "ATTENTAT", s: 100 }, { k: "MASSACRE", s: 100 },
    { k: "EXPLOSION", s: 95 }, { k: "FUSILLADE", s: 95 },
    { k: "MEURTRE", s: 90 }, { k: "ASSASSINAT", s: 90 },
    { k: "MORT", s: 85 }, { k: "TUÉ", s: 85 },
    { k: "INCENDIE", s: 80 }, { k: "ÉMEUTE", s: 80 },
    { k: "AGRESSION", s: 75 }, { k: "TRAQUE", s: 70 },
    { k: "DISPARITION", s: 65 }
];

// Liste pour pénaliser les titres "lisses" ou "propagande"
const SMOOTH_KEYWORDS = ["SAIN ET SAUF", "HISTORIQUE", "RENAÎT", "DIALOGUE", "AVANCÉE", "PORTRAIT", "INVESTISSEMENT"];

function isCyberItem(item) {
    return item.source === "CERT-FR" || 
           item.source === "Zataz" || 
           item.source === "Le Monde Informatique" || 
           item.source === "Ransomlook.io" || 
           (item.title || "").startsWith("[CYBER]");
}

function getScore(title) {
    let t = (title || "").toUpperCase();
    let score = 10; // Score de base très faible

    // 1. Boost pour les faits graves
    for (const item of ANXIETY_KEYWORDS) {
        if (t.includes(item.k)) {
            score = Math.max(score, item.s);
        }
    }

    // 2. Pénalité sévère pour le lissage médiatique
    for (const word of SMOOTH_KEYWORDS) {
        if (t.includes(word)) {
            score -= 40;
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
            time: i.pubDate ? new Date(i.pubDate).toISOString() : new Date().toISOString(),
            link: i.link || "",
            score: getScore(i.title || "")
        }));
    } catch(e) {
        return [];
    }
}

async function run() {
    let currentFullData = { items: [] };
    if (fs.existsSync("data/news.json")) {
        try { 
            currentFullData = JSON.parse(fs.readFileSync("data/news.json", "utf-8"));
        } catch(e) {}
    }

    // Isolation stricte des flux existants
    const existingItems = (currentFullData.items || []).filter(i => !isCyberItem(i));
    const existingCyber = (currentFullData.items || []).filter(i => isCyberItem(i));

    // Récupération des nouveaux flux RSS généraux
    let newItems = [];
    for(const url of RSS_FEEDS) { 
        newItems = newItems.concat(await fetchRSS(url)); 
    }

    // Fusion, Déduplication par lien, Filtrage >= 65 et plafonnement STRICT à Max 50 pour les news
    let allNews = [...new Map([...existingItems, ...newItems].map(i => [i.link, i])).values()]
        .filter(i => i.score >= 65) 
        .sort((a, b) => b.score - a.score)
        .slice(0, 50); // 🔥 Écrasement des plus faibles pour garder uniquement les top 50 news

    // Fusion finale combinant les 50 news max et la préservation intacte des cyber
    const finalItems = [...allNews, ...existingCyber].sort((a, b) => b.score - a.score);

    const output = {
        updated: new Date().toISOString(),
        count: finalItems.length,
        items: finalItems
    };

    fs.mkdirSync("data", { recursive: true });
    fs.writeFileSync("data/news.json", JSON.stringify(output, null, 2));

    console.log("✔ Pipeline actualités mise à jour :", allNews.length, "news générales retenues (Quota 50 max respecté).");
}

run();
