import { initMap } from "./map.js";

/* =======================
   STATE
======================= */
const container = document.getElementById("newsContainer");
const counter = document.getElementById("counter");
const lastupdate = document.getElementById("lastupdate");
const tickerText = document.getElementById("tickerText");

let DATA = [];
let MODE = "NEWS";

/* =======================
   CLASSIFICATION SIMPLE
======================= */
function classify(text){

text = (text || "").toUpperCase();

if(text.includes("MEURTRE") || text.includes("VIOL") || text.includes("ASSASS")){
return "CRIME";
}

if(text.includes("POLICE") || text.includes("GENDARM") || text.includes("PRISON")){
return "SECURITE";
}

if(text.includes("GOUVERN") || text.includes("MINIST") || text.includes("ELECTION")){
return "POLITIQUE";
}

if(text.includes("CRISE") || text.includes("FAILLITE") || text.includes("ECONOM")){
return "ECONOMIE";
}

return "SOCIAL";
}

/* =======================
   SUMMARY (LIGHT AI)
======================= */
function summarize(item){

const t = item.title;

const parts = t.split(" ");

return parts.slice(0,12).join(" ") + "...";
}

/* =======================
   FORMAT TIME
======================= */
function formatTime(iso){
try{
const d = new Date(iso);
return d.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});
}catch(e){
return "--:--";
}
}

/* =======================
   RENDER
======================= */
function render(){

if(window.MAP_MODE) return;

container.innerHTML = "";

DATA.sort((a,b)=>b.score - a.score);

for(const item of DATA){

const type = classify(item.title);
const summary = summarize(item);

const card = document.createElement("div");
card.className = "newsCard";

card.innerHTML = `
<div class="newsTitle">[${type}] ${item.title}</div>
<div class="newsInfos">
<span>${item.source || "RSS"}</span>
<span>⚡ ${item.score}</span>
<span>${formatTime(item.time)}</span>
</div>
<div style="opacity:0.7; margin-top:5px;">
${summary}
</div>
`;

container.appendChild(card);

// 🔥 ALERT CRITIQUE
if(item.score >= 90){
triggerAlert(item);
}
}

counter.textContent = `${DATA.length} Dépêches`;
}

/* =======================
   TICKER
======================= */
function buildTicker(){

if(window.MAP_MODE) return;

tickerText.textContent =
DATA.slice(0,15)
.map(n => `⚠ ${n.title}`)
.join(" | ");
}

/* =======================
   TIME
======================= */
function updateTime(){

if(window.MAP_MODE) return;

const now = new Date();
lastupdate.textContent =
"MAJ : " +
now.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});
}

/* =======================
   LOAD
======================= */
async function load(){

try{

const res = await fetch("data/news.json?cache=" + Date.now());
const json = await res.json();

// filtre bruit
DATA = (json.items || []).filter(i => i.score > 40);

if(!window.MAP_MODE){
render();
buildTicker();
updateTime();
}

}catch(e){
console.log("load error", e);
}
}

/* =======================
   INIT
======================= */
initMap();
load();

setInterval(load, 15000);
