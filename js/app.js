const container = document.getElementById("newsContainer");
const counter = document.getElementById("counter");
const tickerText = document.getElementById("tickerText");

let DATA = [];

const beep = new AudioContext();
function playBip() {
    const osc = beep.createOscillator();
    osc.connect(beep.destination);
    osc.frequency.value = 880;
    osc.start();
    osc.stop(beep.currentTime + 0.1);
}

function formatTime(iso) {
    const d = new Date(iso);
    return isNaN(d) ? "--:--" : d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function render() {
    container.innerHTML = "";
    DATA.forEach((item, index) => {
        const card = document.createElement("div");
        if (index === 0) {
            card.className = "tactical-popup";
            card.style.borderColor = item.score >= 90 ? "var(--accent-red)" : (item.score >= 70 ? "var(--accent-orange)" : "var(--border-color)");
            card.innerHTML = `
                <div class="popup-title">${item.title}</div>
                <div class="popup-meta">
                    <span>⚡ ${item.score}</span>
                    <span>HEURE : ${formatTime(item.time)}</span>
                </div>
            `;
        } else {
            card.className = "newsCard";
            card.style.borderLeftColor = item.score >= 90 ? "var(--accent-red)" : (item.score >= 70 ? "var(--accent-orange)" : "var(--text-dim)");
            card.innerHTML = `
                <div class="newsTitle">${item.title}</div>
                <div class="newsInfos">
                    <span>${item.source?.split('/').pop() || "RSS"}</span>
                    <span>⚡ ${item.score}</span>
                    <span>${formatTime(item.time)}</span>
                </div>
            `;
        }
        container.appendChild(card);
    });
    counter.innerHTML = '<span class="live-blink">LIVE</span>';
    buildTicker();
}

function buildTicker() {
    tickerText.textContent = DATA.slice(0, 20).map(n => "⚠ " + n.title).join(" | ");
}

function rotateNews() {
    if (DATA.length > 1) {
        const last = DATA.pop();
        DATA.unshift(last);
        playBip();
        render();
    }
}

async function load() {
    try {
        const url = "data/news.json?v=" + Date.now();
        const res = await fetch(url, { cache: "no-store" });
        const json = await res.json();
        DATA = json.items || [];
        render();
    } catch (e) { console.error("NEWS ERROR", e); }
}

load();
setInterval(load, 60000);
setInterval(rotateNews, 5000);
