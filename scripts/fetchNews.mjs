import fs from "fs";
// Remplacez par vos imports réels pour les flux RSS et l'analyse (aiLight)
import { getAllNewNews } from "./fetchRSS.mjs"; 

async function run() {
    console.log("Démarrage du fetch et de la fusion...");

    // 1. Charger l'historique existant pour ne pas perdre les news précédentes
    let history = [];
    if (fs.existsSync("data/news.json")) {
        try {
            const raw = fs.readFileSync("data/news.json", "utf-8");
            const data = JSON.parse(raw);
            history = data.items || [];
        } catch (e) {
            console.error("Erreur lors de la lecture du fichier existant, démarrage avec une liste vide.", e);
        }
    }

    // 2. Récupérer les nouveaux flux
    let newNews = await getAllNewNews();

    // 3. Fusionner : On combine tout, et on déduplique par titre (pour éviter les doublons)
    // Le Map utilise le titre comme clé unique
    let allNews = [...new Map([...history, ...newNews].map(item => [item.title, item])).values()];

    // 4. Trier par score décroissant : les plus importantes en premier
    allNews.sort((a, b) => b.score - a.score);

    // 5. Ne garder que les 100 meilleures (les moins importantes sont éjectées automatiquement)
    const finalList = allNews.slice(0, 100);

    // 6. Sauvegarder
    const output = {
        updated: new Date().toISOString(),
        count: finalList.length,
        items: finalList
    };

    try {
        fs.writeFileSync("data/news.json", JSON.stringify(output, null, 2));
        console.log(`Pipeline terminé avec succès : ${finalList.length} dépêches conservées.`);
    } catch (e) {
        console.error("Erreur lors de l'écriture du fichier JSON :", e);
    }
}

// Lancement du script
run().catch(err => {
    console.error("Erreur critique dans le script fetchNews :", err);
    process.exit(1);
});
