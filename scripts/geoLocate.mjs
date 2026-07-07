import fs from "fs";

console.log("🚀 GEOLOCATE START // OPTIMIZED");

const clusters = JSON.parse(fs.readFileSync("data/clusters.json", "utf-8"));
const citiesRaw = JSON.parse(fs.readFileSync("data/communes_lat_lon.json", "utf-8"));

// Normalisation pour matching intelligent
function normalize(text) {
  return (text || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Indexation simplifiée
const cityIndex = citiesRaw.map(c => ({
  normName: normalize(c.name),
  data: c
}));

function findCity(title) {
  const t = normalize(title);
  // On cherche les noms de villes les plus longs d'abord pour éviter les faux positifs
  const sortedCities = cityIndex.sort((a, b) => b.normName.length - a.normName.length);

  for (const c of sortedCities) {
    // Évite les noms trop courts (type "LE", "ST") qui créent des faux positifs
    if (c.normName.length < 4) continue; 
    
    const regex = new RegExp(`\\b${c.normName}\\b`, "i");
    if (regex.test(t)) {
      return c.data;
    }
  }
  return null;
}

let geo = [];
for (const c of clusters) {
  const city = findCity(c.title);
  if (city) {
    console.log("MATCH:", city.name);
    geo.push({
      title: c.title,
      score: c.score,
      city: city.name,
      lat: city.lat,
      lon: city.lon
    });
  } else {
    console.log("NO MATCH:", c.title);
  }
}

// On retire le fallback automatique pour respecter votre demande : 
// Si pas de ville, pas de map.
fs.writeFileSync("data/geo.json", JSON.stringify(geo, null, 2));
console.log("✔ FINAL GEO COUNT:", geo.length);
