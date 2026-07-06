let geoData = [];
window.MAP_MODE = false;

const mapContainer = document.createElement("div");
mapContainer.id = "mapContainer";

Object.assign(mapContainer.style,{
position:"fixed",
top:"0",
left:"0",
width:"100%",
height:"100%",
background:"#0b0b0b",
display:"none",
zIndex:"999",
opacity:"0"
});

document.body.appendChild(mapContainer);

const cityMap = {
"PARIS": { x:420, y:220 },
"LYON": { x:520, y:420 },
"MARSEILLE": { x:480, y:520 },
"TOULOUSE": { x:360, y:480 },
"BORDEAUX": { x:300, y:320 },
"LILLE": { x:550, y:300 }
};

/* =======================
   LOAD GEO
======================= */
async function loadGeo(){
try{
const res = await fetch("data/geo.json?x=" + Date.now());
geoData = await res.json();
}catch(e){
geoData = [];
}
}

/* =======================
   BEEP
======================= */
function beep(){
try{
const ctx = new AudioContext();
const osc = ctx.createOscillator();
osc.connect(ctx.destination);
osc.frequency.value = 180;
osc.start();
osc.stop(ctx.currentTime + 0.2);
}catch(e){}
}

/* =======================
   SHOW MAP
======================= */
function showMap(){

if(!geoData.length) return;

window.MAP_MODE = true;

beep();

mapContainer.innerHTML = "<div style='color:white;text-align:center;font-size:24px;padding:20px'>⚠ CARTE CRISE ⚠</div>";

geoData.forEach(ev=>{

const dot = document.createElement("div");

Object.assign(dot.style,{
position:"absolute",
width:"10px",
height:"10px",
borderRadius:"50%",
background: ev.score > 80 ? "red" : "orange",
boxShadow:"0 0 10px red"
});

const city = Object.keys(cityMap).find(c =>
(ev.title || "").toUpperCase().includes(c)
);

const pos = cityMap[city] || {
x:200 + Math.random()*500,
y:150 + Math.random()*300
};

dot.style.left = pos.x + "px";
dot.style.top = pos.y + "px";

mapContainer.appendChild(dot);
});

mapContainer.style.display = "block";

setTimeout(()=>{
mapContainer.style.opacity = "1";
},50);

setTimeout(()=>{
mapContainer.style.opacity = "0";

setTimeout(()=>{
mapContainer.style.display = "none";
window.MAP_MODE = false;
},500);

},8000);
}

/* =======================
   INIT
======================= */
export function initMap(){

loadGeo().then(showMap);

setInterval(loadGeo, 60000);

setInterval(showMap, 30000);

}
