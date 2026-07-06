export function renderNews(container, items) {
  container.innerHTML = "";

  for (const item of items) {
    const card = document.createElement("div");
    card.className = "newsCard";

    const title = document.createElement("div");
    title.className = "newsTitle";
    title.textContent = item.title;

    const info = document.createElement("div");
    info.className = "newsInfos";

    info.innerHTML = `
      <span>${item.tag || "info"}</span>
      <span>⚡ ${item.score}</span>
      <span>${item.city || "—"}</span>
    `;

    card.appendChild(title);
    card.appendChild(info);
    container.appendChild(card);
  }
}
