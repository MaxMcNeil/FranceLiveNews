import fs from "fs";

// ... (votre logique de fetch RSS reste identique)

async function run(){
    // 1. Charger l'historique existant si le fichier existe
    let history = [];
    if (fs.existsSync("data/news.json")) {
        const raw = fs.readFileSync("data/news.json");
        history = JSON.parse(raw).items || [];
    }

    // 2. Récupérer les nouvelles dépêches (fetch RSS)
    let newNews = await getAllNewNews(); // Votre fonction de récupération

    // 3. Fusionner et dédupliquer par titre
    let allNews = [...new Map([...history, ...newNews].map(item => [item.title, item])).values()];

    // 4. Trier par score décroissant pour garder les plus importantes
    allNews.sort((a, b) => b.score - a.score);

    // 5. Ne garder que les 100 premières (les moins importantes sont éjectées)
    const finalList = allNews.slice(0, 100);

    const output = {
        updated: new Date().toISOString(),
        count: finalList.length,
        items: finalList
    };

    fs.writeFileSync("data/news.json", JSON.stringify(output, null, 2));
}
