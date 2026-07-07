import fs from "fs";

const TARGET_FILE = "data/news.json";

function smartRefine(item, allItems) {
    let title = item.title || "";
    let summary = item.summary || "";
    let score = item.score;

    // 1. Correction si le résumé est identique au titre (ou vide)
    if (!summary || summary.trim() === title.trim()) {
        if (title.includes(" : ")) {
            // Extrait la partie après les deux-points comme sous-titre/résumé
            summary = title.split(" : ")[1];
        } else if (title.includes(" — ")) {
            summary = title.split(" — ")[1];
        } else {
            // Création d'un mini-résumé basé sur le ton de l'alerte
            summary = `Point de situation critique concernant : ${title.substring(0, 80)}...`;
        }
    }

    // 2. Intelligence factuelle pour l'affaire de Monaco (ID 5 & 6 / Suspecte retrouvée morte)
    const isMonacoExplosion = title.toUpperCase().includes("MONACO") || summary.toUpperCase().includes("MONACO");
    const isSuspectDead = title.toUpperCase().includes("MORT") || title.toUpperCase().includes("RETROUVÉE MORTE") || summary.toUpperCase().includes("MORTE");

    if (isMonacoExplosion && isSuspectDead) {
        // Nettoyage des mentions obsolètes d'Interpol si elle est confirmée morte
        summary = summary.replace(/Recherchée par Interpol[,]?/gi, "").replace(/mandat d'arrêt international/gi, "l'enquête sur l'attentat");
        // On s'assure d'un score maximal pour cette conclusion de crise
        score = Math.max(score, 95);
    }

    return {
        ...item,
        summary: summary.trim(),
        score: score
    };
}

async function run() {
    if (!fs.existsSync(TARGET_FILE)) {
        console.log("Aucun fichier news.json trouvé à raffiner.");
        return;
    }

    let data = { items: [] };
    try {
        data = JSON.parse(fs.readFileSync(TARGET_FILE, "utf-8"));
    } catch (e) {
        console.error("Erreur lecture news.json pour raffinement.");
        return;
    }

    let items = data.items || [];

    // Application du raffinement intelligent sur chaque item
    items = items.map(item => smartRefine(item, items));

    // Déduplication finale et respect des critères de score >= 65
    let all = [...new Map(items.map(i => [i.link, i])).values()]
        .filter(i => i.score >= 65)
        .sort((a, b) => b.score - a.score);

    const final = all.slice(0, 100);

    const output = {
        updated: new Date().toISOString(),
        count: final.length,
        items: final
    };

    fs.writeFileSync(TARGET_FILE, JSON.stringify(output, null, 2));
    console.log("✔ Raffinement sémantique et factuel appliqué :", final.length, "éléments traités.");
}

run();
  
