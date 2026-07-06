let geoData = [];

const mapContainer = document.createElement("div");
mapContainer.id = "mapContainer";

Object.assign(mapContainer.style, {
  position: "fixed",
  top: "0",
  left: "0",
  width: "100%",
  height: "100%",
  background: "#050505",
  display: "none",
  zIndex: "999"
});

document.body.appendChild(mapContainer);

function beep() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.frequency.value = 200;
  gain.gain.value = 0.05;

  osc.start();
  osc.stop(ctx.currentTime + 0.2);
}

/* ================= LOAD GEO ================= */
async function loadGeo() {
  try {
    const res = await fetch("data/geo.json?x=" + Date.now());
    geoData = await res.json();
  } catch (e) {
    console.log("geo error", e);
  }
}

/* ================= UPDATE MAP ================= */
export function updateMap(data) {
  geoData = data;
}

/* ================= SHOW MAP ================= */
function showMap() {
  const crisis = geoData.filter(ev =>
    ev.score >= 80 && ev.lat && ev.lon
  );

  if (!crisis.length) return;

  beep();

  mapContainer.innerHTML = "";

  const title = document.createElement("div");
  title.innerText = "⚠ CRISIS MAP ⚠";
  title.style.color = "white";
  title.style.fontSize = "26px";
  title.style.textAlign = "center";
  title.style.padding = "10px";

  mapContainer.appendChild(title);

  crisis.forEach(ev => {
    const dot = document.createElement("div");

    const x = (ev.lon + 5) * 60;
    const y = (50 - ev.lat) * 40;

    Object.assign(dot.style, {
      position: "absolute",
      width: "14px",
      height: "14px",
      borderRadius: "50%",
      background: "red",
      left: x + "px",
      top: y + "px",
      boxShadow: "0 0 20px red",
      animation: "pulse 1s infinite"
    });

    mapContainer.appendChild(dot);
  });

  mapContainer.style.display = "block";

  setTimeout(() => {
    mapContainer.style.display = "none";
  }, 8000);
}

/* ================= INIT ================= */
export function initMap() {
  loadGeo();

  setInterval(loadGeo, 120000);
  setInterval(showMap, 120000);
}

/* ================= ANIMATION CSS ================= */
const style = document.createElement("style");
style.textContent = `
@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.6); opacity: 0.5; }
  100% { transform: scale(1); opacity: 1; }
}
`;
document.head.appendChild(style);
