import fs from "fs";

export const TARGET_FILE = "data/news.json";
export const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function cleanEncoding(str) {
    if (!str) return "";
    return str
        .normalize("NFC")
        .replace(/\uFFFD/g, "é");
}

export function readNewsData() {
    if (!fs.existsSync(TARGET_FILE)) return { items: [] };
    try {
        return JSON.parse(fs.readFileSync(TARGET_FILE, "utf-8"));
    } catch (e) {
        return { items: [] };
    }
}

export function writeNewsData(items) {
    fs.mkdirSync("data", { recursive: true });
    const output = {
        updated: new Date().toISOString(),
        count: items.length,
        items: items
    };
    fs.writeFileSync(TARGET_FILE, JSON.stringify(output, null, 2));
}

export function isCyberItem(item) {
    return (
        item.source === "CERT-FR" ||
        item.source === "Zataz" ||
        item.source === "Le Monde Informatique" ||
        item.source === "Ransomlook.io" ||
        (item.title || "").startsWith("[CYBER]")
    );
}
