import { initMap } from "./map.js";

/* =======================
   DOM
======================= */
const container = document.getElementById("newsContainer");
const counter = document.getElementById("counter");
const lastupdate = document.getElementById("lastupdate");
const tickerText = document.getElementById("tickerText");

let DATA = [];

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
   RENDER NEWS
======================= */
function render(){

container.innerHTML = "";

// tri par gravité
DATA.sort((a,b)=>b.score - a.score);

for(const item of DATA){

const card = document.createElement("div");
card.className = "newsCard";

const title = document.createElement("div");
title.className = "newsTitle";
title.textContent = item.title;

const infos = document.createElement("div");
infos.className = "newsInfos";

infos.innerHTML = `
<span>${item.source || "RSS"}</span>
<span>⚡ ${item.score}</span>
<span>${formatTime(item.time)}</span>
`;

card.appendChild(title);
card.appendChild(infos);

container.appendChild(card);
}

counter.textContent = `${DATA.length} Dépêches`;
}

/* =======================
   TICKER
======================= */
function buildTicker(){

tickerText.textContent =
DATA.slice(0,20)
.map(n => `⚠ ${n.title}`)
.join("   |   ");
}

/* =======================
   UPDATE TIME
======================= */
function updateTime(){

const now = new Date();
lastupdate.textContent =
"MAJ : " +
now.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});
}

/* =======================
   LOAD NEWS
======================= */
async function load(){

try{

const res = await fetch("data/news.json?cache=" + Date.now());
const json = await res.json();

DATA = json.items || [];

render();
buildTicker();
updateTime();

}catch(e){

console.log("load error", e);

container.innerHTML =
"<div style='color:red'>Erreur chargement news.json</div>";

}

}

/* =======================
   INIT MAP MODULE
======================= */
initMap();

/* =======================
   AUTO REFRESH
======================= */
setInterval(load, 15000);
load();
