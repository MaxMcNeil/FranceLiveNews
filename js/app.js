import { summarize } from "./summary.js";
import { getTags } from "./tags.js";
import { crisisFilter } from "./crisis.js";
import { pulse } from "./effects.js";
import { initMap } from "./map.js";

/* DOM */
const container = document.getElementById("newsContainer");
const counter = document.getElementById("counter");
const lastupdate = document.getElementById("lastupdate");
const tickerText = document.getElementById("tickerText");

let DATA = [];

/* TIME */
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

/* RENDER */
function render() {
  container.innerHTML = "";

  DATA.sort((a, b) => b.score - a.score);

  for (const item of DATA) {
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

/* TICKER */
function buildTicker() {
  tickerText.textContent = DATA
    .slice(0, 15)
    .map(n => `⚠ ${n.title}`)
    .join(" | ");
}

/* LOAD */
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

/* START */
initMap();

load();
setInterval(load, 15000);
