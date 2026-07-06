export function isCrisis(item) {

  if (!item) return false;

  const score = item.score || 0;

  const hasGeo = !!(item.lat && item.lon);

  const isHot = score >= 80;

  return isHot && hasGeo;
}
