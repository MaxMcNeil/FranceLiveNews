import Parser from "rss-parser";
import fs from "fs";

const parser = new Parser();

// 🔌 SOURCES RSS
const RSS_FEEDS = [
  "https://www.franceinfo.fr/titres.rss",
  "https://www.lefigaro.fr/rss/figaro_actualites.xml",
  "https://www.20minutes.fr/feeds/rss-une.xml",
  "https://www.leparisien.fr/actualites-a-la-une/rss.xml"
];

// 🧠 KEYWORDS + GRAVITY
const KEYWORDS = [
  { k:"MEURTRE", s:95 }, { k:"ASSASSIN", s:95 }, { k:"ASSASSINAT", s:95 },
  { k:"HOMICIDE", s:90 }, { k:"FUSILLADE", s:90 }, { k:"ATTENTAT", s:100 },
  { k:"EXPLOSION", s:85 }, { k:"VIOL", s:85 }, { k:"AGRESSION", s:70 },
  { k:"ARME", s:75 }, { k:"COUTEAU", s:80 }, { k:"DROGUE", s:65 },
  { k:"NARCOTRAFIC", s:75 }, { k:"COCAÏNE", s:70 }, { k:"POLICE", s:60 },
  { k:"GENDARMERIE", s:60 }, { k:"BRAQUAGE", s:80 }, { k:"SCANDALE", s:65 },
  { k:"CORRUPTION", s:75 }, { k:"DÉMISSION", s:70 }, { k:"IMMIGRATION", s:55 },
  { k:"ÉMEUTE", s:75 }, { k:"CRISE", s:50 }, { k:"FAILLITE", s:60 },
  { k:"DÉCÈS", s:60 }, { k:"INCENDIE", s:70 }, { k:"ACCIDENT", s:60 },
  { k:"GRÈVE", s:65 }, { k:"JUSTICE", s:55 }, { k:"PRIX", s:40 },
  { k:"CLIMAT", s:50 }, { k:"SANTÉ", s:50 }
];

function getScore(text){
  let score = 0;
  let t = text.toUpperCase();
  for(const item of KEYWORDS){
    if(t.includes(item.k)) score = Math.max(score, item.s);
  }
  return score;
}

function dedupe(items){
  const seen = new Set();
  return items.filter(i=>{
    if(seen.has(i.title)) return false;
    seen.add(i.title);
    return true;
  });
}

async function fetchRSS(url){
  try{
    const feed = await parser.parseURL(url);
    return feed.items.map(i=>({
      title: i.title || "",
      source: url,
      time: new Date().toISOString(),
      link: i.link || "",
      score: getScore(i.title || "")
    }));
  }catch(e){
    console.log("RSS error:", url);
    return [];
  }
}

async function run(){
  let all = [];
  for(const feed of RSS_FEEDS){
    const data = await fetchRSS(feed);
    all = all.concat(data);
  }

  all = dedupe(all);

  // On garde tout, mais on booste les scores
  all = all.map(n => ({ ...n, score: n.score > 0 ? n.score : 10 }));

  all.sort((a,b)=>b.score - a.score);
  all = all.slice(0, 100); 

  const output = {
    updated: new Date().toISOString(),
    count: all.length,
    items: all
  };

  fs.mkdirSync("data", { recursive:true });
  fs.writeFileSync("data/news.json", JSON.stringify(output,null,2));
  console.log("✔ news.json généré avec", all.length, "dépêches.");
}

run();
