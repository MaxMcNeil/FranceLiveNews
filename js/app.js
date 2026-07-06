import { initMap } from "./map.js";
import { analyzeText } from "./aiLight.js";

/* =======================
DOM
======================= */

const container = document.getElementById("newsContainer");
const counter = document.getElementById("counter");
const lastupdate = document.getElementById("lastupdate");
const tickerText = document.getElementById("tickerText");

let DATA = [];


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

    container.innerHTML="";


    DATA.sort((a,b)=>b.score-a.score);


    DATA.forEach(item=>{

        const ai = analyzeText(item.title);


        const card=document.createElement("div");
        card.className="newsCard";


        const title=document.createElement("div");
        title.className="newsTitle";
        title.textContent=item.title;


        const infos=document.createElement("div");
        infos.className="newsInfos";


        infos.innerHTML=`

        <span>${ai.tag || "INFO"}</span>
        <span>${item.source || "RSS"}</span>
        <span>⚡ ${item.score}</span>
        <span>${formatTime(item.time)}</span>

        `;


        card.appendChild(title);
        card.appendChild(infos);

        container.appendChild(card);

    });


    counter.textContent =
    DATA.length+" Dépêches";

}



/* =======================
TICKER
======================= */

function buildTicker(){

    tickerText.textContent =
    DATA
    .slice(0,20)
    .map(n=>"⚠ "+n.title)
    .join(" | ");

}



/* =======================
LOAD NEWS
======================= */

async function load(){

try{


const url =
"data/news.json?v="+Date.now()+"_"+Math.random();


const res =
await fetch(url,{
cache:"no-store"
});


const json =
await res.json();


console.log("NEWS LOAD OK",json);


DATA=json.items || [];


render();

buildTicker();


lastupdate.textContent =
"MAJ : "+
new Date()
.toLocaleTimeString("fr-FR",{
hour:"2-digit",
minute:"2-digit"
});


}
catch(e){

console.error("NEWS ERROR",e);

container.innerHTML=
"Erreur chargement news.json";

}

}



/* =======================
START
======================= */


initMap();


load();


setInterval(load,15000);
