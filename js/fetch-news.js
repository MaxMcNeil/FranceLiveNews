const RSS_FEEDS = [
"https://www.franceinfo.fr/titres.rss",
"https://www.bfmtv.com/rss/info/flux-rss/flux-toutes-les-actualites/",
"https://www.lefigaro.fr/rss/figaro_actualites.xml",
"https://www.leparisien.fr/actualites-a-la-une/rss.xml",
"https://www.20minutes.fr/feeds/rss-une.xml",
"https://www.europe1.fr/rss.xml"
];

const KEYWORDS = [
"MORT","TUÉ","TUER","MEURTRE","ASSASSIN","ASSASSINAT",
"HOMICIDE","CADAVRE","CORPS","SANG","VICTIME",

"AGRESSION","VIOL","VIOLENCE","COUTEAU","ARME",
"FUSILLADE","BALLE","TIR","EXPLOSION","INCENDIE",

"POLICE","GENDARMERIE","GIGN","RAID","BAC",
"COMMISSARIAT","INTERPELLATION","GARDE À VUE",

"BRAQUAGE","VOL","CAMBRIOLAGE","EXTORSION","ARNAQUE",
"ESCROQUERIE","FRAUDE","DROGUE","NARCOTRAFIC",
"STUPÉFIANTS","COCAÏNE","CANNABIS",

"IMMIGRATION","EXPULSION","CLANDESTIN",

"SCANDALE","CORRUPTION","DÉTOURNEMENT","BLANCHIMENT",
"JUSTICE","PROCUREUR","JUGE","TRIBUNAL","PRISON",

"TERRORISME","ATTENTAT","RADICALISATION",

"CRISE","ÉMEUTE","MANIFESTATION","CHAOS",
"ALERTE","URGENCE","CYBERATTAQUE","BLACKOUT",

"MACRON","GOUVERNEMENT","MINISTRE","ASSEMBLÉE","SÉNAT"
];

function isRelevant(text){

text = text.toUpperCase();

return KEYWORDS.some(k => text.includes(k));

}

async function fetchRSS(url){

try{

const res = await fetch("https://api.allorigins.win/raw?url=" + encodeURIComponent(url));
const text = await res.text();

const parser = new DOMParser();
const xml = parser.parseFromString(text, "text/xml");

const items = [...xml.querySelectorAll("item")];

return items.map(i => ({

title: i.querySelector("title")?.textContent || "",
source: new URL(url).hostname,
time: new Date().toLocaleTimeString("fr-FR").slice(0,5),
link: i.querySelector("link")?.textContent || ""

}));

}catch(e){

console.log("RSS error", url, e);
return [];

}

}

async function buildNews(){

let all = [];

for(const feed of RSS_FEEDS){

const data = await fetchRSS(feed);

all = all.concat(data);

}

// filtrage
let filtered = all.filter(n => isRelevant(n.title));

// tri simple (les plus récents en haut)
filtered = filtered.slice(0, 30);

return filtered;

}

async function save(){

const news = await buildNews();

console.log("News collected:", news);

}

save();
