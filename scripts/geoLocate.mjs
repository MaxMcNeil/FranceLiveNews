import fs from "fs";

const clusters = JSON.parse(fs.readFileSync("data/clusters.json","utf-8"));

// villes FR simplifiées (base MVP)
const cities = [
{ name:"Paris", lat:48.8566, lon:2.3522 },
{ name:"Marseille", lat:43.2965, lon:5.3698 },
{ name:"Lyon", lat:45.7640, lon:4.8357 },
{ name:"Lille", lat:50.6292, lon:3.0573 },
{ name:"Toulouse", lat:43.6047, lon:1.4442 },
{ name:"Bordeaux", lat:44.8378, lon:-0.5792 }
];

function detectCity(text){

text = text.toUpperCase();

for(const city of cities){
if(text.includes(city.name.toUpperCase())){
return city;
}
}

return null;
}

let geo = [];

for(const c of clusters){

const city = detectCity(c.title);

if(city){
geo.push({
title: c.title,
score: c.score,
city
});
}

}

fs.writeFileSync(
"data/geo.json",
JSON.stringify(geo,null,2)
);

console.log("✔ geo events:", geo.length);
