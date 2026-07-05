const container = document.getElementById("newsContainer");
const counter = document.getElementById("counter");
const lastupdate = document.getElementById("lastupdate");
const tickerText = document.getElementById("tickerText");

let oldTitles = new Set();

function getSeverity(title){

title = title.toUpperCase();

// 🔴 CRITIQUE
const critical = ["MEURTRE","ASSASSIN","ATTENTAT","TERRORISME","FUSILLADE","CADAVRE","SANG"];
if(critical.some(k => title.includes(k))) return 3;

// 🟠 IMPORTANT
const important = ["POLICE","SCANDALE","CORRUPTION","BRAQUAGE","VIOL","DROGUE","GANG"];
if(important.some(k => title.includes(k))) return 2;

// 🟡 NORMAL
return 1;

}

function playBeep(type){

const ctx = new (window.AudioContext || window.webkitAudioContext)();
const osc = ctx.createOscillator();
const gain = ctx.createGain();

osc.connect(gain);
gain.connect(ctx.destination);

osc.type = "sine";

if(type === "critical"){
osc.frequency.value = 120;
gain.gain.value = 0.3;
}else{
osc.frequency.value = 400;
gain.gain.value = 0.05;
}

osc.start();
osc.stop(ctx.currentTime + 0.2);

}

function render(data){

container.innerHTML = "";

data.sort((a,b)=> b.severity - a.severity);

data.forEach(n => {

const card = document.createElement("div");
card.className = "newsCard";

if(n.severity === 3){
card.style.borderLeft = "6px solid red";
card.style.animation = "flash 1s infinite";
}

const title = document.createElement("div");
title.className = "newsTitle";
title.textContent = n.title;

const infos = document.createElement("div");
infos.className = "newsInfos";
infos.innerHTML = `<span>${n.source}</span><span>${n.time}</span>`;

card.appendChild(title);
card.appendChild(infos);

container.appendChild(card);

});

counter.textContent = data.length + " Dépêches";

}

function updateTicker(data){

tickerText.textContent =
data.map(n => "⚠ " + n.title).join("   |   ");

}

function updateTime(){

const d = new Date();
lastupdate.textContent =
"MAJ : " + d.toLocaleTimeString("fr-FR").slice(0,5);

}

function detectNew(data){

data.forEach(n => {

if(!oldTitles.has(n.title)){

oldTitles.add(n.title);

// 🔊 son léger
playBeep("normal");

// 🔴 breaking
if(n.severity === 3){
playBeep("critical");
showBreaking(n.title);
}

}

});

}

function showBreaking(title){

const popup = document.createElement("div");
popup.style.position = "fixed";
popup.style.top = "0";
popup.style.left = "0";
popup.style.width = "100%";
popup.style.height = "100%";
popup.style.background = "rgba(255,0,0,0.9)";
popup.style.color = "white";
popup.style.display = "flex";
popup.style.alignItems = "center";
popup.style.justifyContent = "center";
popup.style.fontSize = "40px";
popup.style.fontWeight = "bold";
popup.style.zIndex = "9999";
popup.innerText = "🚨 BREAKING : " + title;

document.body.appendChild(popup);

setTimeout(()=> popup.remove(), 4000);

}

async function load(){

try{

const res = await fetch("news.json?x=" + Date.now());
const data = await res.json();

// enrichissement
const enriched = data.map(n => ({
...n,
severity: getSeverity(n.title)
}));

detectNew(enriched);
render(enriched);
updateTicker(enriched);
updateTime();

}catch(e){
console.log(e);
}

}

setInterval(load, 15000);
load();
