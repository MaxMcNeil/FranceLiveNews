import { initMap } from "./map.js";
import { summarize } from "./summary.js";
import { getTags } from "./tags.js";
import { crisisFilter } from "./crisis.js";
import { pulse } from "./effects.js";

/* DOM */
const container = document.getElementById("newsContainer");
const counter = document.getElementById("counter");
const lastupdate = document.getElementById("lastupdate");
const tickerText = document.getElementById("tickerText");

let DATA = [];

/* FORMAT TIME */
function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return "--:--";
  }
}

/* RENDER (VERSION FIXÉE) */
function render() {
  container.innerHTML = "";

  const filtered = crisisFilter(DATA, false);

  filtered.sort((a, b) => b.score - a.score);

  for (const item of filtered) {

    const card = document.createElement("div");
    card.className = "newsCard";

    const tags = getTags(item.title);
    const summary = summarize(item.title);

    card.innerHTML = `
      <div class="newsTitle">${summary}</div>
      <div class="newsInfos">
        <span>${item.source || "RSS"}</span>
        <span>⚡ ${item.score}</span>
        <span>${tags.join(" / ")}</span>
        <span>${formatTime(item.time)}</span>
      </div>
    `;

    pulse(card, item.score);

    container.appendChild(card);
  }

  counter.textContent = `${filtered.length} Dépêches`;
}

/* TICKER */
function buildTicker() {
  tickerText.textContent = DATA
    .slice(0, 15)
    .map(n => `⚠ ${n.title}`)
    .join(" | ");
}

/* LOAD DATA */
async function load() {
  try {
    const res = await fetch("data/news.json?cache=" + Date.now());
    const json = await res.json();

    DATA = json.items || [];

    render();
    buildTicker();

    lastupdate.textContent =
      "MAJ : " +
      new Date().toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit"
      });

  } catch (e) {
    console.log("load error", e);
  }
}

/* INIT MAP */
initMap();

/* START LOOP */
load();
setInterval(load, 15000);
