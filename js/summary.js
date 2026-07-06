export function summarize(title) {
  if (!title) return "";

  // coupe propre
  const clean = title
    .replace(/[:\-–]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = clean.split(" ");

  // résumé simple: 8 à 12 mots max
  return words.slice(0, 10).join(" ") + (words.length > 10 ? "…" : "");
}
