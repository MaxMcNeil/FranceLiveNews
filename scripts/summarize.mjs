import fs from "fs";

const clusters = JSON.parse(fs.readFileSync("data/clusters.json", "utf-8"));

// Création d'un résumé global des titres les plus importants
const summary = clusters
  .sort((a, b) => b.score - a.score)
  .slice(0, 5)
  .map(c => c.title)
  .join(" | ");

fs.writeFileSync("data/summary.json", JSON.stringify({ summary }, null, 2));
console.log("✔ summary.json généré");
