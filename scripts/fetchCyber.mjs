import fs from "fs";
import axios from "axios";
import Parser from "rss-parser";

const parser = new Parser();
const API = "https://www.ransomlook.io/api";
const TARGET_FILE = "data/news.json";

// Nouveaux flux RSS Cyber/Securité
const CYBER_RSS_FEEDS = [
    "https://www.zataz.com/feed/",
    "https://www.lemondeinformatique.fr/flux-rss/thematique/securite/rss.xml",
    "https://www.cert.ssi.gouv.fr/feed/"
    // Note : Le lien atlasflux est un script de redirection/agrégateur dynamique, 
    // les 3 flux directs ci-dessus garantissent une stabilité maximale en production.
];

const FRENCH_KEYWORDS = [
    "FRANCE", "FRANÇAIS", "FRANÇAISE", "PARIS", "LYON", "MARSEILLE", 
    "MAIRIE", "CONSEIL", "GOUVERNEMENT", "RÉGION", "BANQUE", 
    "ADMINISTRATION", "SNCF", "EDF", "MINISTÈRE", "HOPITAL", 
    "CYBER", "ATTAQUE", "RANÇONGICIEL", "VULNÉRABILITÉ", "ALERTE", "CERT"
];

// Fonction pour parser un flux RSS cyber
async function fetchCyberRSS(url) {
    try {
        const feed = await parser.parseURL(url);
        return feed.items.map(i => {
            const title = i.title || "";
            // Le CERT-FR ou Zataz ont une forte valeur tactique, on leur donne un score élevé
            let score = 90;
            const tUpper = title.toUpperCase();
            if (tUpper.includes("CRITIQUE") || tUpper.includes("ALERTE") || tUpper.includes("ATTAQUE")) {
                score = 95;
            }
            return {
                title: `[CYBER] ${title}`,
                source: url.includes("cert") ? "CERT-FR" : (url.includes("zataz") ? "Zataz" : "Le Monde Informatique"),
                time: i.pubDate ? new Date(i.pubDate).toISOString() : new Date().toISOString(),
                link: i.link || "",
                score: score
            };
        });
    } catch(e) {
        console.error("Erreur RSS Cyber:", url, e.message);
        return [];
    }
}

// Fonction pour l'API Ransomlook (élargie)
async function fetchRansomlookAttacks() {
    try {
        const resp = await axios.get(`${API}/posts`, { params: { days: 14 } });
        if (!Array.isArray(resp.data)) return [];

        return resp.data
            .filter(post => {
                const title = (post.post_title || "").toUpperCase();
                const country = (post.country || "").toUpperCase();
                const website = (post.website || "").toUpperCase();
                
                const isFrenchCountry = country === "FR";
                const isFrenchDomain = website.endsWith(".FR") || website.includes(".FR/");
                const matchedKeyword = FRENCH_KEYWORDS.some(k => title.includes(k) || website.includes(k));

                return isFrenchCountry || isFrenchDomain || matchedKeyword;
            })
            .map(post => ({
                title: `[CYBER] ${post.group_name} : ${post.post_title}`,
                source: "Ransomlook.io",
                time: post.discovered || new Date().toISOString(),
                link: post.website || post.post_url || "https://www.ransomlook.io/",
                score: 95
            }));
    } catch (e) {
        console.error("Erreur API Ransomlook:", e.message);
        return [];
    }
}

async function run() {
    let currentData = { items: [] };
    if (fs.existsSync(TARGET_FILE)) {
        try {
            currentData = JSON.parse(fs.readFileSync(TARGET_FILE, "utf-8"));
        } catch (e) {}
    }

    // 1. Récupération des alertes RSS Cyber
    let cyberRssItems = [];
    for (const url of CYBER_RSS_FEEDS) {
        const items = await fetchCyberRSS(url);
        cyberRssItems = cyberRssItems.concat(items);
    }

    // 2. Récupération des ransomwares (Ransomlook)
    const ransomItems = await fetchRansomlookAttacks();

    // 3. Fusion globale avec l'existant + Filtrage strict >= 65 + Déduplication par URL
    const allNew = [...cyberRssItems, ...ransomItems];
    let all = [...new Map([...(currentData.items || []), ...allNew].map(i => [i.link, i])).values()]
        .filter(i => i.score >= 65)
        .sort((a, b) => b.score - a.score);
    
    const final = all.slice(0, 100);

    const output = {
        updated: new Date().toISOString(),
        count: final.length,
        items: final
    };

    fs.mkdirSync("data", { recursive: true });
    fs.writeFileSync(TARGET_FILE, JSON.stringify(output, null, 2));
    console.log("✔ Volet cyber mis à jour :", cyberRssItems.length, "flux RSS et", ransomItems.length, "attaques injectés.");
}

run();
