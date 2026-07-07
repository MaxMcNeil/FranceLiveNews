import fs from "fs";
import axios from "axios";

const API = "https://www.ransomlook.io/api";
const TARGET_FILE = "data/news.json";

const FRENCH_KEYWORDS = [
    "FRANCE", "FRANÇAIS", "FRANÇAISE", "PARIS", "LYON", "MARSEILLE", 
    "TOULOUSE", "NICE", "NANTES", "STRASBOURG", "MONTPELLIER", "BORDEAUX",
    "LILLE", "RENNES", "REIMS", "LE HAVRE", "SAINT-ETIENNE", "TOULON",
    "MAIRIE", "CONSEIL", "GOUVERNEMENT", "RÉGION", "BANQUE", 
    "ADMINISTRATION", "SNCF", "EDF", "MINISTÈRE", "HOPITAL", "CENTRE HOSPITALIER"
];

async function fetchCyberAttacks() {
    try {
        // On augmente la fenêtre à 14 jours au cas où l'activité est faible sur 7 jours
        const resp = await axios.get(`${API}/posts`, { params: { days: 14 } });
        if (!Array.isArray(resp.data)) return [];

        return resp.data
            .filter(post => {
                const title = (post.post_title || "").toUpperCase();
                const country = (post.country || "").toUpperCase();
                const website = (post.website || "").toUpperCase();
                
                // Critère élargi : Pays FR, ou présence de l'extension .fr dans le site web, ou mot-clé
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

    const cyberItems = await fetchCyberAttacks();
    
    let all = [...new Map([...(currentData.items || []), ...cyberItems].map(i => [i.link, i])).values()]
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
    console.log("✔ Cyber-alertes injectées (Seuil >= 65) :", cyberItems.length, "trouvées.");
}

run();
