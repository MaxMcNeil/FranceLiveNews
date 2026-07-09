import fs from "fs";
import axios from "axios";

export const TARGET_FILE = "data/news.json";
export const MAX_AGE_MS = 48 * 60 * 60 * 1000;

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

// Fonction de traduction via une API publique libre (MyMemory / Lingva ou équivalent sans clé)
export async function translateText(text) {
    if (!text) return "";
    try {
        // Utilisation de l'API MyMemory (gratuite, sans inscription, idéale pour de petits volumes)
        const encodedText = encodeURIComponent(text);
        const url = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=en|fr`;
        
        const response = await axios.get(url, { timeout: 4000 });
        const translated = response.data?.responseData?.translatedText;
        
        // Si la traduction est valide et ne renvoie pas d'erreur de quota
        if (translated && !translated.startsWith("MYMEMORY WARNING")) {
            return cleanEncoding(translated);
        }
        return text;
    } catch (e) {
        // En cas de coupure réseau ou de blocage, on renvoie le texte d'origine
        return text;
    }
}
