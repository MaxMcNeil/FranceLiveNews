import fs from "fs";
import axios from "axios";

export const TARGET_FILE = "data/news.json";
export const MAX_AGE_MS = 48 * 60 * 60 * 1000;
const LIBRETRANSLATE_URL = "http://localhost:5000/translate";

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

// Fonction de traduction locale illimitée et sans blocage
export async function translateText(text) {
    if (!text) return "";
    try {
        const response = await axios.post(LIBRETRANSLATE_URL, {
            q: text,
            source: "en",
            target: "fr",
            format: "text"
        }, { timeout: 3000 }); // Sécurité : abandonne après 3s si le serveur local ne répond pas
        
        return response.data?.translatedText || text;
    } catch (e) {
        // Si le conteneur local ne tourne pas, on renvoie le texte brut sans tout casser
        return text;
    }
}
