const container = document.getElementById("newsContainer");
const counter = document.getElementById("counter");
const lastupdate = document.getElementById("lastupdate");
const tickerText = document.getElementById("tickerText");

let newsData = [];

function renderNews(data){

container.innerHTML = "";

if(!data || data.length === 0){
container.innerHTML = "<div style='color:#888'>Aucune dépêche</div>";
return;
}

data.forEach(item => {

const card = document.createElement("div");
card.className = "newsCard";

const title = document.createElement("div");
title.className = "newsTitle";
title.textContent = item.title;

const infos = document.createElement("div");
infos.className = "newsInfos";
infos.innerHTML = `<span>${item.source}</span><span>${item.time}</span>`;

card.appendChild(title);
card.appendChild(infos);

container.appendChild(card);

});

counter.textContent = `${data.length} Dépêches`;

}

function updateTicker(data){

let text = data.map(n => `⚠ ${n.title} — ${n.source}`).join("   |   ");

tickerText.textContent = text || "Aucune alerte";

}

function updateLastUpdate(){

const now = new Date();

lastupdate.textContent =
"MAJ : " +
now.getHours().toString().padStart(2,'0') + ":" +
now.getMinutes().toString().padStart(2,'0');

}

async function loadNews(){

try{

const res = await fetch("news.json?cache=" + Date.now());

const data = await res.json();

newsData = data;

renderNews(newsData);

updateTicker(newsData);

updateLastUpdate();

}catch(e){

console.log("Erreur chargement news", e);

}

}

// AUTO REFRESH OBS STYLE (30 sec côté UI, GitHub fera 20 min côté backend)
setInterval(loadNews, 30000);

loadNews();
