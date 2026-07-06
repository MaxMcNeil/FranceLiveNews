import fs from "fs";

const clusters = JSON.parse(fs.readFileSync("data/clusters.json","utf-8"));

let timeline = [];

for(const c of clusters){

const latest = c.items
.sort((a,b)=> new Date(b.time) - new Date(a.time))[0];

timeline.push({
title: c.title,
score: c.score,
time: latest?.time || new Date().toISOString(),
count: c.count
});

}

// tri chronologique
timeline.sort((a,b)=> new Date(b.time) - new Date(a.time));

fs.writeFileSync(
"data/timeline.json",
JSON.stringify(timeline,null,2)
);

console.log("✔ timeline:", timeline.length);
