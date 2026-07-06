import { initMap, updateMap } from "./map.js";

import { fetchNews } from "./rss.js";
import { sortByScore } from "./cluster.js";
import { buildTicker } from "./ticker.js";
import { renderNews } from "./ui.js";

/* DOM */
const container = document.getElementById("newsContainer");
const counter = document.getElementById("counter");
const lastupdate = document.getElementById("lastupdate");
const tickerText = document.getElementById("tickerText");

let DATA = [];

/* LOAD */
async function load() {
  try {
    const items = await fetchNews();

    DATA = sortByScore(items);

    render();

    tickerText.textContent = buildTicker(DATA);

    updateMap(DATA);

    updateTime();

  } catch (e) {
    console.log(e);
  }
}

/* RENDER */
function render() {
  const crisisOnly = DATA.filter(n => n.score >= 85);
  const list = crisisOnly.length ? crisisOnly : DATA;

  renderNews(container, list);

  counter.textContent = `${list.length} Dépêches`;
}

/* TIME */
function updateTime() {
  const now = new Date();
  lastupdate.textContent =
    "MAJ : " +
    now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

/* INIT */
initMap();

setInterval(load, 15000);
load();
