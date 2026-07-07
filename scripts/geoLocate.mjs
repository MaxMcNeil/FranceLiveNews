import fs from "fs";

console.log("🚀 GEOLOCATE START // STRICT & ORDERED FILTER");

const clusters = JSON.parse(fs.readFileSync("data/clusters.json", "utf-8"));
const citiesRaw = JSON.parse(fs.readFileSync("data/communes_lat_lon.json", "utf-8"));

// Normalisation robuste pour éviter les confusions d'accents et de casse
function normalize(text) {
  return (text || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Pré-filtrage et tri des communes par longueur de nom décroignante (les plus précis/longs en premier)
const sortedCities = citiesRaw
  .map(c => ({
    norm: normalize(c.name),
    data: c
  }))
  .filter(c => c.norm.length >= 4) // Ignore les noms < 4 caractères
  .sort((a, b) => b.norm.length - a.norm.length);

function findCity(title) {
  const normalizedTitle = normalize(title);

  // Teste d'abord les noms les plus longs / composés
  for (const c of sortedCities) {
    const regex = new RegExp(`\\b${c.norm}\\b`, "i");
    if (regex.test(normalizedTitle)) {
      return c.data;
    }
  }

  return null;
}

let geo = [];

for (const c of clusters) {
  const city = findCity(c.title);

  if (city) {
    console.log(`MATCH VILLE: ${city.name} pour la dépêche: "${c.title}"`);
    geo.push({
      title: c.title,
      score: c.score,
      city: city.name,
      lat: city.lat,
      lon: city.lon
    });
  } else {
    console.log(`NO MATCH (Aucune ville): ${c.title}`);
  }
}

// Aucun fallback par défaut : si aucun match n'est trouvé, le fichier geo.json sera un tableau vide []
fs.writeFileSync(
  "data/geo.json",
  JSON.stringify(geo, null, 2)
);

console.log("✔ FINAL GEO VALIDATED:", geo.length);
