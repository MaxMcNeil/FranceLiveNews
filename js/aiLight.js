export function analyzeText(text = "") {

  const t = text.toUpperCase();

  let tag = "GENERAL";
  let summary = text;

  // TAGS
  if (t.match(/MEURTRE|ASSASSINAT|VIOL|AGRESSION|HOMICIDE/)) {
    tag = "CRIME";
  } 
  else if (t.match(/FOOT|COUPE DU MONDE|LIGUE|SPORT/)) {
    tag = "SPORT";
  } 
  else if (t.match(/GOUVERN|POLICE|MINISTRE|ÉLECTION|PARLEMENT/)) {
    tag = "POLITIQUE";
  } 
  else if (t.match(/GUERRE|UKRAINE|RUSSIE|ARMES/)) {
    tag = "CONFLIT";
  }

  // MINI SUMMARY (ultra simple)
  summary = text
    .replace(/["«»]/g, "")
    .split(" ")
    .slice(0, 14)
    .join(" ");

  return {
    tag,
    summary
  };
}
