import fs from "fs";

async function run(){
    // 1. Charger l'historique existant pour ne pas perdre les news précédentes
    let history = [];
    if (fs.existsSync("data/news.json")) {
        try {
            const raw = fs.readFileSync("data/news.json");
            history = JSON.parse(raw).items || [];
        } catch(e) {
            console.error("Erreur lecture fichier existant, création nouveau.");
        }
    }

    // 2. Récupérer les nouveaux flux (votre fonction actuelle)
    let newNews = await getAllNewNews(); 

    // 3. Fusionner : On combine tout, et on déduplique par titre (pour éviter les doublons)
    // Le Map utilise le titre comme clé unique
    let allNews = [...new Map([...history, ...newNews].map(item => [item.title, item])).values()];

    // 4. Trier par score décroissant : les plus importantes en premier
    allNews.sort((a, b) => b.score - a.score);

    // 5. Ne garder que les 100 meilleures
    const finalList = allNews.slice(0, 100);

    // 6. Sauvegarder
    const output = {
        updated: new Date().toISOString(),
        items: finalList
    };

    fs.writeFileSync("data/news.json", JSON.stringify(output, null, 2));
    console.log(`Pipeline terminé : ${finalList.length} dépêches conservées.`);
}
