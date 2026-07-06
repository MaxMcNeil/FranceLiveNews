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

if(window.MAP_MODE) return;

container.innerHTML = "";

DATA.sort((a,b)=>b.score - a.score);

for(const item of DATA){

const card = document.createElement("div");
card.className = "newsCard";

card.innerHTML = `
<div class="newsTitle">${item.title}</div>
<div class="newsInfos">
<span>${item.source || "RSS"}</span>
<span>⚡ ${item.score}</span>
<span>${formatTime(item.time)}</span>
</div>
`;

container.appendChild(card);
}

counter.textContent = `${DATA.length} Dépêches`;
}

/* =======================
   TICKER
======================= */
function buildTicker(){

if(window.MAP_MODE) return;

tickerText.textContent =
DATA.slice(0,20)
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
   LOAD NEWS
======================= */
async function load(){

try{

const res = await fetch("data/news.json?cache=" + Date.now());
const json = await res.json();

DATA = json.items || [];

if(!window.MAP_MODE){
render();
buildTicker();
updateTime();
}

}catch(e){
console.log("load error", e);
container.innerHTML = "<div style='color:red'>Erreur chargement news.json</div>";
}

}

/* =======================
   INIT MAP
======================= */
initMap();

/* =======================
   LOOP NEWS
======================= */
setInterval(load, 15000);
load();
