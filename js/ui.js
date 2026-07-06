export function renderNews(container, items) {
  container.innerHTML = "";

  for (const item of items) {
    const card = document.createElement("div");
    card.className = "newsCard";

    // Application dynamique de la couleur de bordure/indicateur selon le score
    const score = item.score || 0;
    if (score >= 90) {
      card.style.setProperty('--text-dim', 'var(--accent-red)');
      card.style.borderColor = 'rgba(255, 51, 51, 0.4)';
    } else if (score >= 80) {
      card.style.setProperty('--text-dim', 'var(--accent-orange)');
      card.style.borderColor = 'rgba(255, 153, 0, 0.4)';
    }

    const title = document.createElement("div");
    title.className = "newsTitle";
    title.textContent = item.title;

    const info = document.createElement("div");
    info.className = "newsInfos";

    info.innerHTML = `
      <span>[${item.tag || "INFO"}]</span>
      <span>⚡ ${item.score}</span>
      <span>LOC: ${item.city || "FRANCE"}</span>
    `;

    card.appendChild(title);
    card.appendChild(info);
    container.appendChild(card);
  }
}
