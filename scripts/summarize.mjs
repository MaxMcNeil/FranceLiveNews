import fs from "fs";

try {
    let summary = "Système opérationnel - Surveillance des flux en cours...";

    if (fs.existsSync("data/clusters.json")) {
        try {
            const clusters = JSON.parse(fs.readFileSync("data/clusters.json", "utf-8"));
            if (Array.isArray(clusters) && clusters.length > 0) {
                summary = clusters
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 5)
                    .map(c => c.title)
                    .join(" | ");
            }
        } catch (e) {
            console.warn("Attention: Erreur de lecture/parse de clusters.json, utilisation d'un résumé par défaut.");
        }
    } else {
        console.warn("Attention: clusters.json non trouvé, génération d'un résumé de repli.");
    }

    fs.mkdirSync("data", { recursive: true });
    fs.writeFileSync("data/summary.json", JSON.stringify({ summary }, null, 2));
    console.log("✔ summary.json généré avec succès.");
} catch (e) {
    console.error("ERREUR summarize:", e.message);
    process.exit(1);
}
