import fs from "fs";

// ===============================
// Chargement des clusters
// ===============================
const clusters = JSON.parse(
  fs.readFileSync("data/clusters.json", "utf-8")
);

// ===============================
// Chargement des communes
// ===============================
const cities = JSON.parse(
  fs.readFileSync("data/communes_lat_lon.json", "utf-8")
);

// Préparation pour recherche rapide
const normalizedCities = cities.map(city => ({
  ...city,
  upper: city.name.toUpperCase()
}));

// ===============================
// Détection ville
// ===============================
function detectCity(text) {

  if (!text) return null;

  const upper = text.toUpperCase();

  for (const city of normalizedCities) {

    if (upper.includes(city.upper)) {
      return city;
    }

  }

  return null;
}

// ===============================
// Construction geo.json
// ===============================
const geo = [];

for (const cluster of clusters) {

  const city = detectCity(cluster.title);

  if (!city) continue;

  geo.push({
    title: cluster.title,
    score: cluster.score,
    city: city.name,
    lat: city.lat,
    lon: city.lon,
    sources: cluster.sources,
    count: cluster.count
  });

}

// ===============================
// Fallback
// ===============================
if (geo.length === 0) {

  geo.push({
    title: "Aucune commune détectée",
    score: 0,
    city: "Paris",
    lat: 48.8566,
    lon: 2.3522,
    sources: [],
    count: 0
  });

}

// ===============================
// Sauvegarde
// ===============================
fs.writeFileSync(
  "data/geo.json",
  JSON.stringify(geo, null, 2)
);

console.log(`✔ Geo : ${geo.length} événement(s) géolocalisé(s)`);
