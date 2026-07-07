import { analyzeText } from "./aiLight.js";

/* =======================
DOM
======================= */
const container = document.getElementById("newsContainer");
const counter = document.getElementById("counter");
const lastupdate = document.getElementById("lastupdate");
const tickerText = document.getElementById("tickerText");

// Bloc d'alerte principal du haut
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

    if (DATA.length > 0) {
        const topItem = DATA[0];
        const topAi = analyzeText(topItem.title);
        
        const isNewTop = topItem.title !== lastTopTitle;
        if (isNewTop) {
            lastTopTitle = topItem.title;
            activePopup.classList.remove("zoom-anim");
            void activePopup.offsetWidth; 
            activePopup.classList.add("zoom-anim");
        }

        // Affichage épuré sans répéter le titre en bas dans la bio
        activePopup.innerHTML = `
            <div class="popup-badge">⚠ DERNIÈRE ALERTE // LIVE</div>
            <div class="popup-title">${topItem.title}</div>
            <div class="popup-meta">
                <span>GRAVITÉ : ${topItem.score}</span>
                <span>HEURE : ${formatTime(topItem.time)}</span>
            </div>
        `;
    }

    container.innerHTML = "";
    container.appendChild(activePopup);

    // Affichage des cartes de la liste en dessous (sans les tags)
    DATA.forEach((item, index)=>{
        if (index === 0) return; // On saute la première puisqu'elle est dans le bloc du haut

        const card = document.createElement("div");
        card.className = "newsCard new-entry";
        card.style.animationDelay = (index * 0.03) + "s";

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
