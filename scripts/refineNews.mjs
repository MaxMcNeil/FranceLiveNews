import { cleanEncoding, readNewsData, writeNewsData, MAX_AGE_MS } from "./utils.mjs";

function smartRefine(item, allItems) {
    let title = cleanEncoding(item.title || "");
    let summary = cleanEncoding(item.summary || "");
    let score = item.score;

    // 1. Correction si le résumé est identique au titre (ou vide)
    if (!summary || summary.trim() === title.trim()) {
        if (title.includes(" : ")) {
            summary = title.split(" : ")[1];
        } else if (title.includes(" — ")) {
            summary = title.split(" — ")[1];
        } else {
            summary = `Point de situation critique concernant : ${title.substring(0, 80)}...`;
        }
    }

    // 2. Intelligence factuelle pour l'affaire de Monaco (ID 5 & 6 / Suspecte retrouvée morte)
    const isMonacoExplosion = title.toUpperCase().includes("MONACO") || summary.toUpperCase().includes("MONACO");
    const isSuspectDead = title.toUpperCase().includes("MORT") || title.toUpperCase().includes("RETROUVÉE MORTE") || summary.toUpperCase().includes("MORTE");

    if (isMonacoExplosion && isSuspectDead) {
        summary = summary.replace(/Recherchée par Interpol[,]?/gi, "").replace(/mandat d'arrêt international/gi, "l'enquête sur l'attentat");
        score = Math.max(score, 95);
    }

    return {
        ...item,
        title: title,
        summary: summary.trim(),
        score: score
    };
}

async function run() {
    const data = readNewsData();
    if (!data.items || data.items.length === 0) {
        console.log("Aucun fichier ou élément news.json trouvé à raffiner.");
        return;
    }

    const now = new Date().getTime();
    
    // Filtrage strict : on éjecte tout ce qui a plus de 24h avant le raffinement
    let items = (data.items || []).filter(i => {
        const itemTime = new Date(i.time).getTime();
        return !isNaN(itemTime) && (now - itemTime < MAX_AGE_MS);
    });

    // Application du raffinement intelligent sur chaque item restant
    items = items.map(item => smartRefine(item, items));

    // Déduplication finale et respect des critères de score >= 65
    let all = [...new Map(items.map(i => [i.link, i])).values()]
        .filter(i => i.score >= 65)
        .sort((a, b) => b.score - a.score);

    const final = all.slice(0, 100);

    // Utilisation de la fonction unifiée d'écriture
    writeNewsData(final);
    console.log("✔ Raffinement sémantique et filtrage 24h appliqués :", final.length, "éléments conservés.");
}

run();
