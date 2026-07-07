let geoData = [];

const mapContainer = document.createElement("div");
mapContainer.id = "mapContainer";

Object.assign(mapContainer.style, {
  position: "fixed",
  top: "0",
  left: "0",
  width: "100%",
  height: "100%",
  background: "#030507",
  display: "none",
  zIndex: "999",
  fontFamily: "'Share Tech Mono', monospace"
});

document.body.appendChild(mapContainer);

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
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = 220;
    gain.gain.value = 0.08;

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch(e) {
    // Contexte audio restreint si aucune interaction utilisateur préalable
  }
}

/* =======================
   SHOW MAP (CRISIS ONLY - REAL LAT/LON)
======================= */
function showMap(){

  const crisis = geoData.filter(ev =>
    ev.score >= 80 && ev.lat && ev.lon
  );

  // Si aucune ville/coordonnée détectée, on n'affiche rien
  if(crisis.length === 0) {
    mapContainer.style.display = "none";
    return;
  }

  beep();

  mapContainer.innerHTML = "";

  const title = document.createElement("div");
  title.textContent = "⚠ CRISIS MAP // CIBLAGE ACTIF";

  Object.assign(title.style, {
    color: "#ff3333",
    fontSize: "22px",
    letterSpacing: "3px",
    textAlign: "center",
    padding: "20px",
    background: "rgba(8,14,20,0.9)",
    borderBottom: "1px solid #1a3045",
    fontFamily: "'Orbitron', sans-serif"
  });

  mapContainer.appendChild(title);

  // Zone d'affichage des points tactiques basés sur les coordonnées réelles
  const canvasArea = document.createElement("div");
  Object.assign(canvasArea.style, {
    position: "relative",
    width: "100%",
    height: "calc(100% - 70px)"
  });

  crisis.forEach(ev => {
    const dot = document.createElement("div");
    const hot = ev.score >= 90;

    Object.assign(dot.style, {
      position: "absolute",
      width: hot ? "18px" : "12px",
      height: hot ? "18px" : "12px",
      borderRadius: "50%",
      background: hot ? "#ff3333" : "#ff9900",
      boxShadow: hot ? "0 0 25px #ff3333" : "0 0 10px #ff9900",
      animation: "pulseRed 1s infinite"
    });

    // Conversion ou projection basique des coordonnées lat/lon sur l'écran si nécessaire,
    // ou utilisation directe si vos valeurs de position correspondent au canvas.
    // Note : Si vous gérez une projection géographique exacte, remplacez par votre logique x/y.
    dot.style.left = ((ev.lon - (-5)) * 40) + "px"; // Exemple de mapping proportionnel
    dot.style.top = ((51 - ev.lat) * 45) + "px";   // Exemple de mapping proportionnel

    const label = document.createElement("div");
    label.textContent = `${ev.city} (${ev.score}⚡)`;
    Object.assign(label.style, {
      position: "absolute",
      left: ((ev.lon - (-5)) * 40 + 15) + "px",
      top: ((51 - ev.lat) * 45 - 5) + "px",
      color: "#fff",
      fontSize: "11px",
      whiteSpace: "nowrap",
      textShadow: "0 0 4px red"
    });

    canvasArea.appendChild(dot);
    canvasArea.appendChild(label);
  });

  mapContainer.appendChild(canvasArea);
  mapContainer.style.display = "block";

  // Masquage automatique après 8 secondes
  setTimeout(() => {
    mapContainer.style.display = "none";
  }, 8000);
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
