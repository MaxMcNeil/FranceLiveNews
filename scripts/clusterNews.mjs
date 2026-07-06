import fs from "fs";

const raw = JSON.parse(fs.readFileSync("data/news.json","utf-8"));
const items = raw.items || [];

// normalisation texte
function normalize(t){
return t
.toUpperCase()
.replace(/[^\w\s]/gi,"")
.trim();
}

// distance simple (similarité brute)
function similar(a,b){

a = normalize(a);
b = normalize(b);

if(a === b) return true;

// si 6 mots identiques minimum
const aWords = a.split(" ");
const bWords = b.split(" ");

let common = 0;

for(const w of aWords){
if(bWords.includes(w)) common++;
}

return common >= 4;
}

// clusters
let clusters = [];

for(const item of items){

let found = false;

for(const c of clusters){

if(similar(c.title, item.title)){
c.items.push(item);
c.sources.add(item.source);
c.score = Math.max(c.score, item.score);
found = true;
break;
}

}

if(!found){
clusters.push({
title: item.title,
score: item.score,
items: [item],
sources: new Set([item.source])
});
}

}

// final format
const output = clusters.map(c=>({

title: c.title,
score: c.score,
sources: [...c.sources],
count: c.items.length,
items: c.items
}));

fs.writeFileSync(
"data/clusters.json",
JSON.stringify(output,null,2)
);

console.log("✔ clusters:", output.length);
