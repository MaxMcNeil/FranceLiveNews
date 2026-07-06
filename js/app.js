import { initMap, updateMap } from "./map.js";
import { analyzeNews } from "./breaking.js";

/* ================= DOM ================= */
const container = document.getElementById("newsContainer");
const counter = document.getElementById("counter");
const lastupdate = document.getElementById("lastupdate");
const tickerText = document.getElementById("tickerText");

let DATA = [];

/* ================= LOAD ================= */
async function load() {
  try {
    const res = await fetch("data/geo.json?x=" + Date.now());
    const json = await res.json();

    DATA = analyzeNews(json);

    render();
    buildTicker();
    updateTime();

    updateMap(DATA); // 👈 envoie vers la map

  } catch (e) {
    console.log(e);
    container.innerHTML = "<div style='color:red'>Erreur data</div>";
  }
}

/* ================= RENDER ================= */
function render() {
  container.innerHTML = "";

  const crisisOnly = DATA.filter(n => n.crisis);

  const list = crisisOnly.length ? crisisOnly : DATA;

  list.sort((a, b) => b.score - a.score);

  for (const item of list) {
    const card = document.createElement("div");
    card.className = "newsCard " + (item.crisis ? "crisis" : "");

    const title = document.createElement("div");
    title.className = "newsTitle";
    title.textContent = item.title;

    const infos = document.createElement("div");
    infos.className = "newsInfos";

    infos.innerHTML = `
      <span>${item.tag}</span>
      <span>⚡ ${item.score}</span>
      <span>${item.city || "—"}</span>
    `;

    card.appendChild(title);
    card.appendChild(infos);
    container.appendChild(card);
  }

  counter.textContent = `${list.length} Dépêches`;
}

/* ================= TICKER ================= */
function buildTicker() {
  tickerText.textContent = DATA
    .filter(n => n.crisis)
    .slice(0, 15)
    .map(n => `⚠ ${n.title}`)
    .join(" | ");
}

/* ================= TIME ================= */
function updateTime() {
  const now = new Date();
  lastupdate.textContent =
    "MAJ : " +
    now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

/* ================= LOOP ================= */
initMap();
setInterval(load, 15000);
load();
