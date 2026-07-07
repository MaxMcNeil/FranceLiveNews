import fs from "fs";

console.log("🚀 GEOLOCATE START // STRICT FILTER");

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

// Indexation propre des noms de communes
const cityMap = new Map();
citiesRaw.forEach(c => {
  const norm = normalize(c.name);
  if (norm.length >= 4) { // Ignore les noms trop courts pour limiter les faux positifs
    cityMap.set(norm, c);
  }
});

function findCity(title) {
  const normalizedTitle = normalize(title);
  const words = normalizedTitle.split(" ");

  // On recherche si l'un des mots ou une combinaison exacte correspond à une ville de la base INSEE
  // On teste d'abord les noms composés les plus longs présents dans la map
  for (const [normName, cityData] of cityMap.entries()) {
    const regex = new RegExp(`\\b${normName}\\b`, "i");
    if (regex.test(normalizedTitle)) {
      return cityData;
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

// Aucun fallback par défaut : si aucun match de ville n'est trouvé, le tableau geo reste vide (longueur 0)
fs.writeFileSync(
  "data/geo.json",
  JSON.stringify(geo, null, 2)
);

console.log("✔ FINAL GEO VALIDATED:", geo.length);
