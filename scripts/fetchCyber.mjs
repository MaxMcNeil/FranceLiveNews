import fs from "fs";
import axios from "axios";

const API = "https://www.ransomlook.io/api";
const TARGET_FILE = "data/news.json";

// Mots-clés pour cibler l'impact français
const FRENCH_KEYWORDS = ["FRANCE", "FRANÇAIS", "PARIS", "LYON", "MARSEILLE", "MAIRIE", "CONSEIL", "GOUVERNEMENT", "RÉGION", "BANQUE", "ADMINISTRATION", "SNCF", "EDF", "FRANCAISE"];

async function fetchCyberAttacks() {
    try {
        const resp = await axios.get(`${API}/posts`, { params: { days: 7 } });
        return resp.data
            .filter(post => {
                const title = (post.post_title || "").toUpperCase();
                return FRENCH_KEYWORDS.some(k => title.includes(k));
            })
            .map(post => ({
                title: `[CYBER] ${post.group_name} : ${post.post_title}`,
                source: "Ransomlook.io",
                time: post.discovered,
                link: post.website || "https://www.ransomlook.io/",
                score: 95
            }));
    } catch (e) {
        console.error("Erreur lors de la récupération des données Ransomlook:", e.message);
        return [];
    }
}

async function run() {
    let currentData = { items: [] };
    if (fs.existsSync(TARGET_FILE)) {
        try { currentData = JSON.parse(fs.readFileSync(TARGET_FILE, "utf-8")); } catch (e) {}
    }

    const cyberItems = await fetchCyberAttacks();
    
    // Fusion : on combine l'historique et les nouvelles alertes cyber
    // La déduplication par URL (link) empêche les doublons
    let all = [...new Map([...currentData.items, ...cyberItems].map(i => [i.link, i])).values()];
    
    // Tri par score décroissant et limite à 100 éléments
    all.sort((a, b) => b.score - a.score);
    const final = all.slice(0, 100);

    const output = {
        updated: new Date().toISOString(),
        count: final.length,
        items: final
    };

    fs.writeFileSync(TARGET_FILE, JSON.stringify(output, null, 2));
    console.log("✔ Cyber-alertes intégrées :", cyberItems.length, "nouvelles menaces trouvées.");
}

run();
