import fs from "fs";

const clusters = JSON.parse(
  fs.readFileSync("data/clusters.json", "utf-8")
);

const cities = JSON.parse(
  fs.readFileSync("data/communes_lat_lon.json", "utf-8")
);

// index normalisé ultra strict
const index = new Map();

for(const c of cities){
  index.set(normalize(c.name), c);
}

function normalize(str){
  return (str || "")
    .toUpperCase()
    .replace(/[^A-ZÀ-Ÿ\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// 🔥 EXTRACTION ULTRA STRICTE
function findCity(text){

  const clean = normalize(text);

  // on teste uniquement contre les vraies communes
  for(const [name, city] of index){

    // match EXACT mot complet
    const regex = new RegExp(`\\b${name}\\b`, "i");

    if(regex.test(clean)){
      return city;
    }

  }

  return null;
}

let geo = [];

for(const c of clusters){

  const city = findCity(c.title);

  if(!city) continue;

  geo.push({
    title: c.title,
    score: c.score,
    city: city.name,
    lat: city.lat,
    lon: city.lon,
    sources: c.sources,
    count: c.count
  });

}

// fallback safe
if(geo.length === 0){
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

console.log("✔ GEO FINAL:", geo.length);
