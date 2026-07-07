import fs from "fs";

try {
    if (!fs.existsSync("data/news.json")) {
        throw new Error("Le fichier data/news.json est introuvable.");
    }
    
    const raw = JSON.parse(fs.readFileSync("data/news.json", "utf-8"));
    const items = raw.items || [];

    function normalize(t) {
        return (t || "").toUpperCase().replace(/[^\w\s]/gi, "").trim();
    }

    // Scoring lexical amélioré
    function similarity(a, b) {
        a = normalize(a); 
        b = normalize(b);
        const aWords = a.split(" ");
        const bWords = b.split(" ");
        let match = 0;
        for (const w of aWords) {
            if (w.length > 3 && bWords.includes(w)) match++;
        }
        return match;
    }

    // Clusters
    let clusters = [];
    for (const item of items) {
        let found = false;
        for (const c of clusters) {
            const sim = similarity(c.title, item.title);
            if (sim >= 3) {
                c.items.push(item);
                c.score = Math.max(c.score, item.score);
                c.sources.add(item.source);
                found = true;
                break;
            }
        }
        if (!found) {
            clusters.push({
                title: item.title,
                score: item.score,
                items: [item],
                sources: new Set([item.source])
            });
        }
    }

    // Enrichissement
    const output = clusters.map(c => {
        return {
            title: c.title,
            score: c.score,
            count: c.items.length,
            sources: [...c.sources],
            items: c.items,
            summary: c.items.slice(0, 2).map(i => i.title).join(" / ")
        };
    });

    fs.mkdirSync("data", { recursive: true });
    fs.writeFileSync("data/clusters.json", JSON.stringify(output, null, 2));

    console.log("✔ clusters.json généré avec succès :", output.length, "clusters.");
} catch (e) {
    console.error("ERREUR clusterNews:", e.message);
    process.exit(1);
}
