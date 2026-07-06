export function buildTicker(items) {
  return items
    .slice(0, 20)
    .map(n => `⚠ ${n.title}`)
    .join(" | ");
}
