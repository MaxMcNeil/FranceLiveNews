import fs from "fs";

const clusters = JSON.parse(fs.readFileSync("data/clusters.json","utf-8"));

const cities = [
{ name:"PARIS", lat:48.8566, lon:2.3522 },
{ name:"MARSEILLE", lat:43.2965, lon:5.3698 },
{ name:"LYON", lat:45.7640, lon:4.8357 },
{ name:"LILLE", lat:50.6292, lon:3.0573 },
{ name:"TOULOUSE", lat:43.6047, lon:1.4442 },
{ name:"BORDEAUX", lat:44.8378, lon:-0.5792 }
];

function detect(text){

if(!text) return null;

text = text.toUpperCase();

return cities.find(c => text.includes(c.name)) || null;
}

let geo = [];

for(const c of clusters){

const city = detect(c.title);

if(city){

geo.push({
title: c.title,
score: c.score,
city: city.name,
lat: city.lat,
lon: city.lon
});

}

}

if(geo.length === 0){
geo.push({
title:"Fallback PARIS",
score:50,
city:"PARIS",
lat:48.8566,
lon:2.3522
});
}

fs.writeFileSync("data/geo.json", JSON.stringify(geo,null,2));

console.log("✔ geo S4:", geo.length);
