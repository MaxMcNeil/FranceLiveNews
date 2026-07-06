let geoData = [];

window.MAP_MODE = false;

const mapContainer = document.createElement("div");
mapContainer.id = "mapContainer";

mapContainer.style.position = "fixed";
mapContainer.style.top = "0";
mapContainer.style.left = "0";
mapContainer.style.width = "100%";
mapContainer.style.height = "100%";
mapContainer.style.background = "#0b0b0b";
mapContainer.style.display = "none";
mapContainer.style.zIndex = "999";

document.body.appendChild(mapContainer);

const cityMap = {
"PARIS": { x:420, y:220 },
"LYON": { x:520, y:420 },
"MARSEILLE": { x:480, y:520 },
"TOULOUSE": { x:360, y:480 },
"BORDEAUX": { x:300, y:320 },
"LILLE": { x:550, y:300 }
};

async function loadGeo(){
try{
const res = await fetch("data/geo.json?x=" + Date.now());
geoData = await res.json();
console.log("GEO LOADED:", geoData.length);
}catch(e){
console.log("geo error", e);
geoData = [];
}
}

function beep(){
try{
const ctx = new (window.AudioContext || window.webkitAudioContext)();
const osc = ctx.createOscillator();
const gain = ctx.createGain();

osc.connect(gain);
gain.connect(ctx.destination);

osc.frequency.value = 180;
gain.gain.value = 0.08;

osc.start();
osc.stop(ctx.currentTime + 0.2);
}catch(e){}
}

function showMap(){

if(!geoData || geoData.length === 0) return;

console.log("SHOW MAP:", geoData.length);

window.MAP_MODE = true;

beep();

mapContainer.innerHTML = "";

const title = document.createElement("div");
title.innerText = "⚠ CARTE DES ALERTES ⚠";
title.style.color = "white";
title.style.fontSize = "28px";
title.style.textAlign = "center";
title.style.padding = "20px";

mapContainer.appendChild(title);

geoData.forEach(ev => {

const dot = document.createElement("div");

dot.style.position = "absolute";
dot.style.width = "12px";
dot.style.height = "12px";
dot.style.borderRadius = "50%";
dot.style.background = ev.score > 80 ? "red" : "orange";
dot.style.boxShadow = "0 0 12px red";

const city = Object.keys(cityMap).find(c =>
(ev.title || "").toUpperCase().includes(c)
);

if(city){
const pos = cityMap[city];
dot.style.left = pos.x + "px";
dot.style.top = pos.y + "px";
}else{
dot.style.left = (200 + Math.random()*600) + "px";
dot.style.top = (150 + Math.random()*400) + "px";
}

mapContainer.appendChild(dot);

});

mapContainer.style.display = "block";

setTimeout(()=>{
mapContainer.style.display = "none";
window.MAP_MODE = false;
}, 10000);
}

export function initMap(){

console.log("MAP INIT OK");

loadGeo().then(()=>{
showMap();
});

setInterval(loadGeo, 60000);

// cycle map stable
setInterval(()=>{
showMap();
}, 30000);

}
