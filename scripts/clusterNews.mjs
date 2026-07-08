import fs from "fs";

const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 heures en millisecondes

try {
    if (!fs.existsSync("data/news.json")) {
        throw new Error("Le fichier data/news.json est introuvable.");
    }
    
    const raw = JSON.parse(fs.readFileSync("data/news.json", "utf-8"));
    const now = new Date().getTime();
    
    // 🔥 Filtrage strict : on ne garde que les éléments de moins de 24h
    const items = (raw.items || []).filter(i => {
        const itemTime = new Date(i.time).getTime();
        return !isNaN(itemTime) && (now - itemTime < MAX_AGE_MS);
    });

    function normalize(t){
        return (t || "")
        .toUpperCase()
        .replace(/[^\w\s]/gi,"")
        .trim();
    }

    // scoring lexical amélioré
    function similarity(a,b){
        a = normalize(a);
        b = normalize(b);

        const aWords = a.split(" ");
        const bWords = b.split(" ");

        let match = 0;

        for(const w of aWords){
            if(w.length > 3 && bWords.includes(w)) match++;
        }

        return match;
    }

    // clusters
    let clusters = [];

    for(const item of items){
        let found = false;

        for(const c of clusters){
            const sim = similarity(c.title, item.title);

            if(sim >= 3){
                c.items.push(item);
                c.score = Math.max(c.score, item.score);
                c.sources.add(item.source);
                found = true;
                break;
            }
        }

        if(!found){
            clusters.push({
                title: item.title,
                score: item.score,
                items: [item],
                sources: new Set([item.source])
            });
        }
    }

    // enrichissement
    const output = clusters.map(c=>{
        const top = c.items[0];

        return {
            title: c.title,
            score: c.score,
            count: c.items.length,
            sources: [...c.sources],
            items: c.items,

            // 🔥 résumé simple
            summary: c.items
            .slice(0,2)
            .map(i => i.title)
            .join(" / ")
        };
    });

    fs.mkdirSync("data", { recursive: true });
    fs.writeFileSync("data/clusters.json", JSON.stringify(output, null, 2));

    console.log("✔ clusters S4 mis à jour (filtrage 24h appliqué) :", output.length);
} catch (e) {
    console.error("ERREUR clusterNews:", e.message);
    process.exit(1);
}
