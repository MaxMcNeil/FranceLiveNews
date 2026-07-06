import { initMap } from "./map.js";
import { analyzeText } from "./aiLight.js";
import { isCrisis } from "./crisis.js";
/* ======================= */
const container = document.getElementById("newsContainer");
const counter = document.getElementById("counter");
const lastupdate = document.getElementById("lastupdate");
const tickerText = document.getElementById("tickerText");

let DATA = [];

/* ======================= */
function formatTime(iso){
  try {
    return new Date(iso).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});
  } catch {
    return "--:--";
  }
}

/* ======================= */
function render(){

  container.innerHTML = "";

  DATA.sort((a,b)=>b.score - a.score);

  for(const item of DATA){

    const ai = analyzeText(item.title);

    const card = document.createElement("div");
    card.className = "newsCard";

    const title = document.createElement("div");
    title.className = "newsTitle";
    title.textContent = item.title;

    const infos = document.createElement("div");
    infos.className = "newsInfos";

    infos.innerHTML = `
      <span>${ai.tag}</span>
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

/* ======================= */
function buildTicker(){

  tickerText.textContent =
    DATA.slice(0,20)
      .map(n => `⚠ ${n.title}`)
      .join(" | ");
}

/* ======================= */
function updateTime(){
  const now = new Date();
  lastupdate.textContent =
    "MAJ : " + now.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});
}

/* ======================= */
async function load(){

  const res = await fetch("data/news.json?cb=" + Date.now(), { cache: "no-store" });
  const json = await res.json();

  DATA = json.items || [];

  render();
  buildTicker();
  updateTime();
}

/* ======================= */
initMap();

/* ======================= */
setInterval(load, 15000);
load();
