const container = document.getElementById("newsContainer");
const counter = document.getElementById("counter");
const tickerText = document.getElementById("tickerText");

let DATA = [];

function formatTime(iso) {
    const d = new Date(iso);
    return isNaN(d) ? "--:--" : d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function getCleanSource(source) {
    if (!source) return "RSS";
    if (source.includes("ransomlook") || source.includes("ransomware")) return "CYBER";
    return source.split('/').pop().replace(".xml", "").replace(".rss", "") || "RSS";
}

function render() {
    if (!container) return;
    container.innerHTML = "";
    
    // Pour un OBS vertical, on limite l'affichage aux 12 actus les plus chaudes pour ne pas surcharger l'écran
    const visibleData = DATA.slice(0, 12);
    
    visibleData.forEach((item, index) => {
        const card = document.createElement("div");
        if (index === 0) {
            card.className = "tactical-popup";
            card.style.borderColor = item.score >= 90 ? "var(--accent-red)" : (item.score >= 70 ? "var(--accent-orange)" : "var(--border-color)");
            card.innerHTML = `<div class="popup-title">${item.title}</div><div class="popup-meta"><span>⚡ ${item.score}</span><span>HEURE : ${formatTime(item.time)}</span></div>`;
        } else {
            card.className = "newsCard";
            card.style.borderLeftColor = item.score >= 90 ? "var(--accent-red)" : (item.score >= 70 ? "var(--accent-orange)" : "var(--text-dim)");
            card.innerHTML = `<div class="newsTitle">${item.title}</div><div class="newsInfos"><span>${getCleanSource(item.source)}</span><span>⚡ ${item.score}</span><span>${formatTime(item.time)}</span></div>`;
        }
        container.appendChild(card);
    });
    
    if (counter) counter.innerHTML = `<span class="live-blink">LIVE [${DATA.length}]</span>`;
    if (tickerText && !tickerText.textContent.startsWith("VEILLE")) buildTicker();
}

function buildTicker() {
    if (!tickerText) return;
    tickerText.textContent = DATA.slice(0, 15).map(n => "⚠ " + n.title).join(" | ");
}

async function loadSummary() {
    try {
        const res = await fetch("data/summary.json?v=" + Date.now(), { cache: "no-store" });
        const json = await res.json();
        if (json.summary && tickerText) {
            tickerText.textContent = json.summary; 
        }
    } catch (e) {
        buildTicker(); 
    }
}

function rotateNews() {
    if (DATA.length > 1) {
        const last = DATA.pop();
        DATA.unshift(last);
        render();
    }
}

async function load() {
    try {
        const res = await fetch("data/news.json?v=" + Date.now(), { cache: "no-store" });
        const json = await res.json();
        DATA = json.items || [];
        render();
        loadSummary(); 
    } catch (e) { console.error("NEWS ERROR", e); }
}

load();
setInterval(load, 60000); // Recharge news.json toutes les minutes
setInterval(rotateNews, 7000); // Fait tourner les actus à l'écran toutes les 7 secondes
