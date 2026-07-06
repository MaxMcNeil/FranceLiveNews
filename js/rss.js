export async function fetchNews() {
  const res = await fetch("data/news.json?cache=" + Date.now());
  const json = await res.json();
  return json.items || [];
}
