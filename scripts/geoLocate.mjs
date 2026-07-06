import fs from "fs";

const clusters = JSON.parse(
  fs.readFileSync("data/clusters.json", "utf-8")
);

const cities = JSON.parse(
  fs.readFileSync("data/communes_lat_lon.json", "utf-8")
);

// normalisation forte
function normalize(str){
  return (str || "")
    .toUpperCase()
    .replace(/[^A-ZÀ-Ÿ\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// recherche plus stricte (mot complet)
function detectCity(text){

  if(!text) return null;

  const clean = normalize(text);

  for(const city of cities){

    const name = normalize(city.name);

    // 🔥 match MOT COMPLET uniquement
    const regex = new RegExp(`\\b${name}\\b`, "i");

    if(regex.test(clean)){
      return city;
    }

  }

  return null;
}

let geo = [];

for(const c of clusters){

  const city = detectCity(c.title);

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

// fallback propre
if(geo.length === 0){
  geo.push({
    title: "Aucune commune détectée",
    score: 0,
    city: "Paris",
    lat: 48.8566,
    lon: 2.3522
  });
}

fs.writeFileSync(
  "data/geo.json",
  JSON.stringify(geo, null, 2)
);

console.log("✔ GEO FIXED:", geo.length);
