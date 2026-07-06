import Parser from "rss-parser";
import fs from "fs";

const parser = new Parser();

// 🔌 SOURCES RSS
const RSS_FEEDS = [
"https://www.franceinfo.fr/titres.rss",
"https://www.lefigaro.fr/rss/figaro_actualites.xml",
"https://www.20minutes.fr/feeds/rss-une.xml",
"https://www.leparisien.fr/actualites-a-la-une/rss.xml"
];

// 🧠 KEYWORDS + GRAVITY
const KEYWORDS = [
{ k:"MEURTRE", s:95 },
{ k:"ASSASSIN", s:95 },
{ k:"ASSASSINAT", s:95 },
{ k:"HOMICIDE", s:90 },
{ k:"FUSILLADE", s:90 },
{ k:"ATTENTAT", s:100 },
{ k:"EXPLOSION", s:85 },

{ k:"VIOL", s:85 },
{ k:"AGRESSION", s:70 },
{ k:"ARME", s:75 },
{ k:"COUTEAU", s:80 },

{ k:"DROGUE", s:65 },
{ k:"NARCOTRAFIC", s:75 },
{ k:"COCAÏNE", s:70 },

{ k:"POLICE", s:60 },
{ k:"GENDARMERIE", s:60 },
{ k:"BRAQUAGE", s:80 },

{ k:"SCANDALE", s:65 },
{ k:"CORRUPTION", s:75 },
{ k:"DÉMISSION", s:70 },

{ k:"IMMIGRATION", s:55 },
{ k:"ÉMEUTE", s:75 },

{ k:"CRISE", s:50 },
{ k:"FAILLITE", s:60 }
];

// 🎯 score fonction
function getScore(text){

let score = 0;
let t = text.toUpperCase();

for(const item of KEYWORDS){
if(t.includes(item.k)){
score = Math.max(score, item.s);
}
}

return score;
}

// 🔁 anti doublons
function dedupe(items){
const seen = new Set();
return items.filter(i=>{
if(seen.has(i.title)) return false;
seen.add(i.title);
return true;
});
}

// 📥 fetch RSS
async function fetchRSS(url){

try{
const feed = await parser.parseURL(url);

return feed.items.map(i=>({
title: i.title || "",
source: url,
time: new Date().toISOString(),
link: i.link || "",
score: getScore(i.title || "")
}));

}catch(e){
console.log("RSS error:", url);
return [];
}

}

// 🚀 main
async function run(){

let all = [];

for(const feed of RSS_FEEDS){
const data = await fetchRSS(feed);
all = all.concat(data);
}

// filtrage (on garde uniquement les infos pertinentes)
all = all.filter(n => n.score > 0);

// suppression doublons
all = dedupe(all);

// tri gravité
all.sort((a,b)=>b.score - a.score);

// limite live
all = all.slice(0, 50);

// enrichissement final
const output = {
updated: new Date().toISOString(),
count: all.length,
items: all
};

fs.mkdirSync("data", { recursive:true });
fs.writeFileSync("data/news.json", JSON.stringify(output,null,2));

console.log("✔ news.json généré:", all.length);
}

run();
