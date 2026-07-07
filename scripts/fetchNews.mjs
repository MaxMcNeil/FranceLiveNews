import fs from "fs";
import { parseStringPromise } from "xml2js"; // Assurez-vous d'avoir installé xml2js ou d'utiliser votre méthode de parsing
import { analyzeText } from "../js/aiLight.js"; // Ou votre chemin vers l'analyseur de score

// 1. Définition de vos flux RSS ici directement
const FEEDS = [
  "https://www.franceinfo.fr/titres.rss",
  "https://www.lefigaro.fr/rss/figaro_actualites.xml",
  "https://www.20minutes.fr/feeds/rss-une.xml"
  // Ajoutez d'autres flux si besoin
];

// Fonction pour télécharger et parser un flux RSS
async function fetchFeed(url) {
    try {
        const response = await fetch(url);
        const xml = await response.text();
        const result = await parseStringPromise(xml);
        
        // Extraction générique des items RSS (selon la structure standard)
        const items = result.rss?.channel?.[0]?.item || result.feed?.entry || [];
        
        return items.map(item => {
            const title = item.title?.[0] || "";
            const link = item.link?.[0]?.$.href || item.link?.[0] || "";
            const pubDate = item.pubDate?.[0] || item.updated?.[0] || new Date().toISOString();
            
            // Calcul du score via votre IA light / mots-clés
            const analysis = analyzeText(title);

            return {
                title: title.trim(),
                link: link.trim(),
                time: new Date(pubDate).toISOString(),
                source: url.includes("franceinfo") ? "franceinfo" : (url.includes("lefigaro") ? "lefigaro" : "20minutes"),
                score: analysis.score || 50
            };
        });
    } catch (e) {
        console.error(`Erreur lecture flux ${url}:`, e.message);
        return [];
    }
}

// Récupération de tous les flux
async function getAllNewNews() {
    let allItems = [];
    for (const url of FEEDS) {
        const articles = await fetchFeed(url);
        allItems = allItems.concat(articles);
    }
    return allItems;
}

async function run() {
    console.log("Démarrage du fetch et de la fusion...");

    // 2. Charger l'historique existant de data/news.json
    let history = [];
    if (fs.existsSync("data/news.json")) {
        try {
            const raw = fs.readFileSync("data/news.json", "utf-8");
            const data = JSON.parse(raw);
            history = data.items || [];
        } catch (e) {
            console.error("Erreur lecture news.json, repart à zéro.", e);
        }
    }

    // 3. Récupérer les nouveaux articles des flux RSS
    let newNews = await getAllNewNews();

    // 4. Fusionner et dédupliquer par titre
    let allNews = [...new Map([...history, ...newNews].map(item => [item.title, item])).values()];

    // 5. Trier par score décroissant (les plus importants / graves en premier)
    allNews.sort((a, b) => b.score - a.score);

    // 6. Garder uniquement les 100 meilleures (les plus faibles sortent)
    const finalList = allNews.slice(0, 100);

    // 7. Sauvegarder dans data/news.json
    const output = {
        updated: new Date().toISOString(),
        count: finalList.length,
        items: finalList
    };

    fs.writeFileSync("data/news.json", JSON.stringify(output, null, 2));
    console.log(`Pipeline terminé : ${finalList.length} dépêches enregistrées dans data/news.json.`);
}

run().catch(err => {
    console.error("Erreur critique:", err);
    process.exit(1);
});
