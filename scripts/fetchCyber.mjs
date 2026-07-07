import fs from "fs";
import axios from "axios";
import Parser from "rss-parser";

const parser = new Parser();
const API = "https://www.ransomlook.io/api";
const TARGET_FILE = "data/news.json";

const CYBER_RSS_FEEDS = [
    "https://www.zataz.com/feed/",
    "https://www.lemondeinformatique.fr/flux-rss/thematique/securite/rss.xml",
    "https://www.cert.ssi.gouv.fr/feed/"
];

const FRENCH_KEYWORDS = [
    "FRANCE", "FRANÇAIS", "FRANÇAISE", "PARIS", "LYON", "MARSEILLE", 
    "MAIRIE", "CONSEIL", "GOUVERNEMENT", "RÉGION", "BANQUE", 
    "ADMINISTRATION", "SNCF", "EDF", "MINISTÈRE", "HOPITAL", 
    "CYBER", "ATTAQUE", "RANÇONGICIEL", "VULNÉRABILITÉ", "ALERTE", "CERT"
];

function isCyberItem(item) {
    return item.source === "CERT-FR" || 
           item.source === "Zataz" || 
           item.source === "Le Monde Informatique" || 
           item.source === "Ransomlook.io" || 
           (item.title || "").startsWith("[CYBER]");
}

async function fetchCyberRSS(url) {
    try {
        const feed = await parser.parseURL(url);
        return (feed.items || []).map(i => {
            const rawTitle = i.title || "";
            const title = !rawTitle.startsWith("[CYBER]") ? `[CYBER] ${rawTitle}` : rawTitle;
            let score = 90;
            const tUpper = title.toUpperCase();
            if (tUpper.includes("CRITIQUE") || tUpper.includes("ALERTE") || tUpper.includes("ATTAQUE") || tUpper.includes("AVIS")) {
                score = 95;
            }
            return {
                title: title,
                source: url.includes("cert") ? "CERT-FR" : (url.includes("zataz") ? "Zataz" : "Le Monde Informatique"),
                time: i.pubDate ? new Date(i.pubDate).toISOString() : new Date().toISOString(),
                link: i.link || i.guid || "",
                score: score
            };
        });
    } catch(e) {
        return [];
    }
}

// Combinaison des 2 méthodes de Ransomlook (/posts et /search combinés)
async function fetchRansomlookAttacks() {
    let results = [];
    
    // 1. Méthode /posts (derniers jours)
    try {
        const respPosts = await axios.get(`${API}/posts`, { params: { days: 14 } });
        if (Array.isArray(respPosts.data)) {
            results = results.concat(respPosts.data);
        }
    } catch (e) {
        console.error("Erreur API Ransomlook /posts:", e.message);
    }

    // 2. Méthode /search (recherche explicite sur des termes clés français)
    for (const keyword of ["france", "french", "paris", "banque", "mairie"]) {
        try {
            const respSearch = await axios.get(`${API}/search`, { params: { query: keyword } });
            if (Array.isArray(respSearch.data)) {
                results = results.concat(respSearch.data);
            }
        } catch (e) {}
    }

    const uniqueRansom = [...new Map(results.map(post => [post.website || post.post_title, post])).values()];

    return uniqueRansom
        .filter(post => {
            const title = (post.post_title || "").toUpperCase();
            const country = (post.country || "").toUpperCase();
            const website = (post.website || "").toUpperCase();
            return country === "FR" || website.includes(".FR") || FRENCH_KEYWORDS.some(k => title.includes(k));
        })
        .map(post => ({
            title: `[CYBER] ${post.group_name || "Ransom"} : ${post.post_title}`,
            source: "Ransomlook.io",
            time: post.discovered || new Date().toISOString(),
            link: post.website || post.post_url || "https://www.ransomlook.io/",
            score: 95
        }));
}

async function run() {
    let currentFullData = { items: [] };
    if (fs.existsSync(TARGET_FILE)) {
        try { currentFullData = JSON.parse(fs.readFileSync(TARGET_FILE, "utf-8")); } catch (e) {}
    }

    // Isolation stricte des flux existants
    const existingNews = (currentFullData.items || []).filter(i => !isCyberItem(i));
    const existingCyber = (currentFullData.items || []).filter(i => isCyberItem(i));

    // Récupération des nouveaux éléments cyber (RSS + Ransomlook)
    let newCyberItems = [];
    for (const url of CYBER_RSS_FEEDS) {
        newCyberItems = newCyberItems.concat(await fetchCyberRSS(url));
    }
    newCyberItems = newCyberItems.concat(await fetchRansomlookAttacks());

    // Fusion, Déduplication par lien, Filtrage >= 65 et plafonnement STRICT à Max 50 pour la cyber
    let allCyber = [...new Map([...existingCyber, ...newCyberItems].map(i => [i.link, i])).values()]
        .filter(i => i.score >= 65)
        .sort((a, b) => b.score - a.score)
        .slice(0, 50); // 🔥 Écrasement des cyber les plus faibles pour garder uniquement les top 50 cyber

    // Fusion finale combinant les news générales préservées et les 50 cyber max
    const finalItems = [...existingNews, ...allCyber].sort((a, b) => b.score - a.score);

    fs.mkdirSync("data", { recursive: true });
    fs.writeFileSync(TARGET_FILE, JSON.stringify({
        updated: new Date().toISOString(),
        count: finalItems.length,
        items: finalItems
    }, null, 2));

    console.log("✔ Quota Cyber mis à jour :", allCyber.length, "alertes cyber retenues (Quota 50 max respecté).");
}

run();
