import fs from "fs";

console.log("🚀 GEOLOCATE START");

const clusters = JSON.parse(
  fs.readFileSync("data/clusters.json", "utf-8")
);

const cities = JSON.parse(
  fs.readFileSync("data/communes_lat_lon.json", "utf-8")
);

console.log("clusters:", clusters.length);
console.log("cities:", cities.length);

// index rapide des communes
const cityIndex = new Map();

for (const c of cities) {
  cityIndex.set(c.name.toUpperCase(), c);
}

// normalisation texte
function normalize(text) {
  return (text || "")
    .toUpperCase()
    .replace(/[^A-ZÀ-Ÿ\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// 🔥 DETECTION STRICTE VRAIE COMMUNE
function findCity(title) {
  const t = normalize(title);

  for (const [name, city] of cityIndex) {
    const cityName = name.toUpperCase();

    // match mot complet uniquement
    const regex = new RegExp(`\\b${cityName}\\b`, "i");

    if (regex.test(t)) {
      return city;
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
      lon: city.lon,
      sources: c.sources,
      count: c.count
    });
  } else {
    console.log("NO MATCH:", c.title);
  }
}

// fallback propre (jamais de fake mots)
if (geo.length === 0) {
  geo.push({
    title: "Aucune commune détectée",
    score: 0,
    city: "PARIS",
    lat: 48.8566,
    lon: 2.3522
  });
}

fs.writeFileSync(
  "data/geo.json",
  JSON.stringify(geo, null, 2)
);

console.log("✔ FINAL GEO:", geo.length);
