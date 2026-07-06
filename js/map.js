let geoData = [];

const mapContainer = document.createElement("div");
mapContainer.id = "mapContainer";

Object.assign(mapContainer.style, {
  position: "fixed",
  top: "0",
  left: "0",
  width: "100%",
  height: "100%",
  background: "#0b0b0b",
  display: "none",
  zIndex: "999"
});

document.body.appendChild(mapContainer);

/* =======================
   CITY MAP (fallback visuel)
======================= */
const cityMap = {
  "PARIS": { x:420, y:220 },
  "LYON": { x:520, y:420 },
  "MARSEILLE": { x:480, y:520 },
  "TOULOUSE": { x:360, y:480 },
  "BORDEAUX": { x:300, y:320 },
  "LILLE": { x:550, y:300 }
};

/* =======================
   LOAD GEO (cache safe)
======================= */
async function loadGeo(){
  try{
    const res = await fetch("data/geo.json?cb=" + Date.now(), { cache: "no-store" });
    geoData = await res.json();
  } catch(e){
    console.log("geo error", e);
    geoData = [];
  }
}

/* =======================
   BEEP
======================= */
function beep(){
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.frequency.value = 220;
  gain.gain.value = 0.08;

  osc.start();
  osc.stop(ctx.currentTime + 0.15);
}

/* =======================
   PULSE DOT
======================= */
function createDot(ev){

  const dot = document.createElement("div");

  const isHot = ev.score >= 80;

  Object.assign(dot.style, {
    position: "absolute",
    width: isHot ? "16px" : "10px",
    height: isHot ? "16px" : "10px",
    borderRadius: "50%",
    background: isHot ? "red" : "orange",
    boxShadow: isHot ? "0 0 20px red" : "0 0 10px orange"
  });

  if(isHot){
    dot.animate([
      { transform: "scale(1)" },
      { transform: "scale(1.6)" },
      { transform: "scale(1)" }
    ], {
      duration: 800,
      iterations: Infinity
    });
  }

  const city = Object.keys(cityMap).find(c =>
    (ev.title || "").toUpperCase().includes(c)
  );

  if(city){
    const pos = cityMap[city];
    dot.style.left = pos.x + "px";
    dot.style.top = pos.y + "px";
  } else {
    dot.style.left = (200 + Math.random()*500) + "px";
    dot.style.top = (150 + Math.random()*300) + "px";
  }

  return dot;
}

/* =======================
   SHOW MAP (CRISIS ONLY)
======================= */
function showMap(){

  const crisis = geoData.filter(ev =>
    ev.score >= 80 && ev.lat && ev.lon
  );

  if(crisis.length === 0){
    return; // rien = pas de map
  }

  beep();

  mapContainer.innerHTML = "";

  const title = document.createElement("div");
  title.textContent = "⚠ CARTE DES ALERTES ⚠";

  Object.assign(title.style, {
    color: "white",
    fontSize: "24px",
    textAlign: "center",
    padding: "15px"
  });

  mapContainer.appendChild(title);

  crisis.forEach(ev => {
    mapContainer.appendChild(createDot(ev));
  });

  mapContainer.style.display = "block";

  setTimeout(()=>{
    mapContainer.style.display = "none";
  }, 10000);
}

/* =======================
   INIT
======================= */
export function initMap(){

  loadGeo();

  setInterval(loadGeo, 20000);
  setInterval(showMap, 15000);

  console.log("MAP INIT OK");
}
