export function crisisFilter(data, onlyCrisis = false) {
  if (!onlyCrisis) return data;

  return data.filter(n => n.score >= 80);
}
