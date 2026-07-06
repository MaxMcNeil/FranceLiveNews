let geoData = [];

const mapContainer = document.createElement("div");
mapContainer.id = "mapContainer";

Object.assign(mapContainer.style, {
  position: "fixed",
  top: "0",
  left: "0",
  width: "100%",
  height: "100%",
  background: "rgba(10,10,10,0.95)",
  display: "none",
  zIndex: "9999"
});

document.body.appendChild(mapContainer);

// beep simple
function beep() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.frequency.value = 220;
  gain.gain.value = 0.05;

  osc.start();
  osc.stop(ctx.currentTime + 0.15);
}

async function loadGeo() {
  try {
    const res = await fetch("data/geo.json?cache=" + Date.now());
    geoData = await res.json();
    console.log("📍 GEO LOADED:", geoData.length);
  } catch (e) {
    console.log("geo error", e);
  }
}

function showMap() {
  if (!geoData.length) return;

  beep();

  mapContainer.innerHTML = "";

  const title = document.createElement("div");
  title.textContent = "⚠ CARTE DES ALERTES ⚠";
  Object.assign(title.style, {
    color: "white",
    fontSize: "26px",
    textAlign: "center",
    padding: "20px"
  });

  mapContainer.appendChild(title);

  for (const ev of geoData) {
    const dot = document.createElement("div");

    Object.assign(dot.style, {
      position: "absolute",
      width: "14px",
      height: "14px",
      borderRadius: "50%",
      background: ev.score >= 90 ? "red" : "orange",
      boxShadow: "0 0 10px red",
      left: (200 + Math.random() * 600) + "px",
      top: (150 + Math.random() * 300) + "px"
    });

    mapContainer.appendChild(dot);
  }

  mapContainer.style.display = "block";

  setTimeout(() => {
    mapContainer.style.display = "none";
  }, 10000);
}

export function initMap() {
  loadGeo();

  // reload data
  setInterval(loadGeo, 120000);

  // popup map
  setInterval(showMap, 120000);

  console.log("🗺 MAP MODULE READY");
}
