import fs from "fs";

const clusters = JSON.parse(fs.readFileSync("data/clusters.json","utf-8"));

const timeline = clusters
.sort((a,b)=>b.score - a.score)
.map((c,i)=>({

id: i,
title: c.title,
score: c.score,
summary: c.summary,
count: c.count,
time: new Date().toISOString()
}));

fs.writeFileSync("data/timeline.json", JSON.stringify(timeline,null,2));

console.log("✔ timeline:", timeline.length);
