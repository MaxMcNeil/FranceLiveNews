import { analyzeText } from "./aiLight.js";

/* =======================
DOM
======================= */
const container = document.getElementById("newsContainer");
const counter = document.getElementById("counter");
const lastupdate = document.getElementById("lastupdate");
const tickerText = document.getElementById("tickerText");

// Création d'une zone Popup / Zoom tactique en haut du conteneur ou dédiée
let activePopup = document.createElement("div");
activePopup.id = "tacticalPopup";
activePopup.className = "tactical-popup";

let DATA = [];
let lastTopTitle = "";

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
RENDER
======================= */
function render(){
    DATA.sort((a,b)=>b.score-a.score);

    // Si on a des données, la première (plus haute gravité) alimente le popup zoom
    if (DATA.length > 0) {
        const topItem = DATA[0];
        const topAi = analyzeText(topItem.title);
        
        // Déclenche l'effet de zoom/pulse si une nouvelle dépêche prend la tête
        const isNewTop = topItem.title !== lastTopTitle;
        if (isNewTop) {
            lastTopTitle = topItem.title;
            activePopup.classList.remove("zoom-anim");
            void activePopup.offsetWidth; // reset reflow
            activePopup.classList.add("zoom-anim");
        }

        activePopup.innerHTML = `
            <div class="popup-badge">⚠ FOCUS TACTIQUE // PRIORITÉ MAXIMALE</div>
            <div class="popup-title">${topItem.title}</div>
            <div class="popup-bio">${topAi.summary}</div>
            <div class="popup-meta">
                <span>TAG : ${topAi.tag}</span>
                <span>GRAVITÉ : ${topItem.score}</span>
                <span>HEURE : ${formatTime(topItem.time)}</span>
            </div>
        `;
    }

    container.innerHTML = "";
    // On insère le popup tactique en haut du flux
    container.appendChild(activePopup);

    // Affichage des cartes de la liste (les suivantes)
    DATA.forEach((item, index)=>{
        const ai = analyzeText(item.title);
        const card = document.createElement("div");
        card.className = "newsCard new-entry";
        card.style.animationDelay = (index * 0.05) + "s";

        // Couleur de la bordure selon le score
        let borderColor = "var(--text-dim)";
        if(item.score >= 90) borderColor = "var(--accent-red)";
        else if(item.score >= 70) borderColor = "var(--accent-orange)";
        card.style.borderLeftColor = borderColor;

        card.innerHTML = `
            <div class="newsTitle">${item.title}</div>
            <div class="newsInfos">
                <span>${ai.tag || "INFO"}</span>
                <span>${item.source.split('/').pop() || "RSS"}</span>
                <span>⚡ ${item.score}</span>
                <span>${formatTime(item.time)}</span>
            </div>
        `;

        container.appendChild(card);
    });

    counter.textContent = DATA.length + " Dépêches";
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

    console.log("NEWS LOAD OK",json);
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
// Boucle agressive toutes les 5 secondes pour capter le live
setInterval(load, 5000);
