const container = document.getElementById("newsContainer");
const counter = document.getElementById("counter");
const tickerText = document.getElementById("tickerText");

let ALL_ITEMS = []; // Stocke TOUTES les actus de la timeline
let DATA = [];      // Ce qui est actuellement affiché à l'écran (ex: 5 éléments)
const VISIBLE_COUNT = 5; // Nombre de blocs visibles à l'écran

// Gestion du bip audio sécurisé pour OBS / Navigateur
let audioCtx = null;
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playBip() {
    try {
        initAudio();
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
        // Silencieux si bloqué sans interaction
    }
}

function formatTime(iso) {
    const d = new Date(iso);
    return isNaN(d) ? "--:--" : d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function getCleanSource(source) {
    if (!source) return "RSS";
    if (source.includes("ransomlook")) return "CYBER";
    return source.split('/').pop().replace(".xml", "").replace(".rss", "") || "RSS";
}

function render() {
    container.innerHTML = "";
    DATA.forEach((item, index) => {
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
    
    if (counter) counter.textContent = `[${ALL_ITEMS.length}]`;
    if (tickerText && !tickerText.textContent.startsWith("VEILLE")) buildTicker();
}

function buildTicker() {
    if (tickerText) {
        tickerText.textContent = ALL_ITEMS.slice(0, 20).map(n => "⚠ " + n.title).join(" | ");
    }
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

// Fait tourner la grande liste complète et rafraîchit l'affichage visible
function rotateNews() {
    if (ALL_ITEMS.length > 1) {
        const last = ALL_ITEMS.pop();
        ALL_ITEMS.unshift(last);
        DATA = ALL_ITEMS.slice(0, VISIBLE_COUNT); // Met à jour les 5 visibles depuis la liste globale en rotation
        playBip(); 
        render();
    }
}

async function load() {
    try {
        const res = await fetch("data/news.json?v=" + Date.now(), { cache: "no-store" });
        const json = await res.json();
        ALL_ITEMS = json.items || [];
        DATA = ALL_ITEMS.slice(0, VISIBLE_COUNT); // Extrait les premiers pour l'affichage initial
        render();
        loadSummary(); 
    } catch (e) { console.error("NEWS ERROR", e); }
}
const popupEl = document.getElementById("criticalPopup");
const textEl = document.getElementById("criticalText");

// Déclenche l'affichage du pop-up de l'alerte la plus négative du lot en cours
function triggerCriticalAlert() {
    if (!DATA || DATA.length === 0) return;

    // Trouve l'élément avec le score le plus haut (le plus critique/négatif) dans le lot visible
    const mostNegative = [...DATA].sort((a, b) => b.score - a.score)[0];
    
    if (mostNegative && textEl) {
        textEl.textContent = mostNegative.title;
    }

    // Affiche le pop-up et joue le bip d'alerte
    if (popupEl) popupEl.classList.remove("hidden");
    playBip();

    // Cache le pop-up après 5 secondes
    setTimeout(() => {
        if (popupEl) popupEl.classList.add("hidden");
    }, 5000);
}

// Planifie le déclenchement toutes les 1 minute 30 (90 000 ms)
setInterval(triggerCriticalAlert, 90000);

load();
setInterval(load, 60000); 
setInterval(rotateNews, 5000);
