import fs from "fs";

console.log("🚀 GEOLOCATE START // STRICT & NO FALLBACK");

const clusters = JSON.parse(
  fs.readFileSync("data/clusters.json", "utf-8")
);

// charge vraie base INSEE
const citiesRaw = JSON.parse(
  fs.readFileSync("data/communes_lat_lon.json", "utf-8")
);

// index propre
const cityIndex = citiesRaw.map(c => ({
  name: c.name.toUpperCase(),
  data: c
}));

function normalize(text) {
  return (text || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findCity(title) {
  const t = normalize(title);

  for (const c of cityIndex) {
    const name = normalize(c.name);

    // match mot entier
    const regex = new RegExp(`\\b${name}\\b`, "i");

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

// AUCUN FALLBACK : Si geo.length === 0, le tableau reste vide [] et la map ne s'affichera pas.

fs.writeFileSync(
  "data/geo.json",
  JSON.stringify(geo, null, 2)
);

console.log("✔ FINAL GEO:", geo.length);
