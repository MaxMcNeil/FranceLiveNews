import { analyzeText } from "./aiLight.js";

/* =======================
DOM
======================= */
const container = document.getElementById("newsContainer");
const counter = document.getElementById("counter");
const lastupdate = document.getElementById("lastupdate");
const tickerText = document.getElementById("tickerText");

let DATA = [];
let displayedTitles = new Set(); // Pour suivre l'état de la pile et l'animation d'entrée

/* =======================
FORMAT TIME
======================= */
function formatTime(iso){
    const d = new Date(iso);
    if(isNaN(d)) return "--:--";

    return d.toLocaleTimeString("fr-FR",{
        hour:"2-digit",
        minute:"2-digit"
    });
}

/* =======================
RENDER (Boucle perpétuelle visuelle)
======================= */
function render(){
    DATA.sort((a,b)=>b.score-a.score);

    // On récupère les éléments existants dans le conteneur
    const existingCards = Array.from(container.children);
    const newTitlesSet = new Set(DATA.map(d => d.title));

    // Détection d'un nouveau top pour déclencher l'effet pop en haut
    const currentTopTitle = DATA.length > 0 ? DATA[0].title : "";
    const topCardEl = container.firstElementChild;
    const isNewTop = topCardEl && topCardEl.dataset.title !== currentTopTitle;

    container.innerHTML = "";

    DATA.forEach((item, index)=>{
        const card = document.createElement("div");
        card.dataset.title = item.title;

        // La première dépêche en haut bénéficie de l'effet d'alerte / pop
        if (index === 0) {
            card.className = "tactical-popup" + (isNewTop ? " zoom-anim" : "");
            
            let borderColor = "var(--accent-red)";
            if(item.score < 90 && item.score >= 70) borderColor = "var(--accent-orange)";
            card.style.borderColor = borderColor;

            card.innerHTML = `
                <div class="popup-badge animate-blink">🔴 ALERTE PRIORITAIRE</div>
                <div class="popup-title">${item.title}</div>
                <div class="popup-meta">
                    <span>GRAVITÉ : ${item.score}</span>
                    <span>HEURE : ${formatTime(item.time)}</span>
                </div>
            `;
        } else {
            // Les cartes descendent et s'empilent visuellement en dessous
            card.className = "newsCard";
            if (!displayedTitles.has(item.title)) {
                card.classList.add("new-entry"); // effet d'apparition fluide si l'élément vient d'arriver
            }

            let borderColor = "var(--text-dim)";
            if(item.score >= 90) borderColor = "var(--accent-red)";
            else if(item.score >= 70) borderColor = "var(--accent-orange)";
            card.style.borderLeftColor = borderColor;

            card.innerHTML = `
                <div class="newsTitle">${item.title}</div>
                <div class="newsInfos">
                    <span>${item.source.split('/').pop() || "RSS"}</span>
                    <span>⚡ ${item.score}</span>
                    <span>${formatTime(item.time)}</span>
                </div>
            `;
        }

        container.appendChild(card);
    });

    displayedTitles = newTitlesSet;
    counter.innerHTML = '<span class="live-blink">LIVE</span>';
}

/* =======================
TICKER
======================= */
function buildTicker(){
    tickerText.textContent = DATA
    .slice(0,20)
    .map(n=>"⚠ "+n.title)
    .join(" | ");
}

/* =======================
LOAD NEWS
======================= */
async function load(){
try{
    const url = "data/news.json?v="+Date.now()+"_"+Math.random();
    const res = await fetch(url,{ cache:"no-store" });
    const json = await res.json();

    DATA = json.items || [];
    render();
    buildTicker();

    lastupdate.textContent = "MAJ : "+ new Date().toLocaleTimeString("fr-FR",{
        hour:"2-digit",
        minute:"2-digit"
    });
}
catch(e){
    console.error("NEWS ERROR",e);
    container.innerHTML = "Erreur chargement news.json";
}
}

/* =======================
START
======================= */
load();
setInterval(load, 5000);
