// utils/embroideryAlphabet.js

// 1. sanitize input text (limit + safe chars)
export function sanitizeEmbroideryLetters(text, max = 20) {
    if (!text) return '';
    return text
        .toUpperCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "") // strip diacritics (æ→A, ø→O, å→A)
        .replace(/[^A-Z0-9\s]/g, '')
        .slice(0, max);
}

// 2. preload (optional caching hook)
export function preloadAlphabetMaps() {
    console.log("Embroidery maps preloaded");
}

async function toBase64(url) {
    try {
        const res = await fetch(url);
        if (!res.ok) { console.warn(`❌ fetch failed: ${url}`); return null; }
        const blob = await res.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.warn(`❌ error fetching ${url}:`, e);
        return null;
    }
}

// 3. generate embroidery maps — fetches and returns base64 per letter
export async function generateAllEmbroideryMaps(text) {
    if (!text) return { text: '', maps: [] };

    const maps = await Promise.all(
        text.split('').map(async (char, index) => {
            const letter = char.toUpperCase();
            const base = `http://localhost:5173/devstudentlife/alphabets/${letter}`;
            const [basecolor, normal, roughness, height, ambient] = await Promise.all([
                toBase64(`${base}/basecolor.png`),
                toBase64(`${base}/normal.png`),
                toBase64(`${base}/roughness.png`),
                toBase64(`${base}/height.png`),
                toBase64(`${base}/ambient.png`),
            ]);
            return { char: letter, index, src: { basecolor, normal, roughness, height, ambient } };
        })
    );

    return { text, maps };
}

// 4. send base64 maps — one postMessage per map type per letter
// format: "<char>:<mapType>:<base64data>"
// e.g. "A:basecolor:data:image/png;base64,..."
// receiver: parts[0]=char, parts[1]=type, parts.slice(2).join(":") = base64
export function sendEmbroideryMapsToIframes(payload) {
    const ids = ['preview-iframe', 'preview-iframe2'];

    const send = (msg) => {
        ids.forEach((id) => {
            const iframe = document.getElementById(id);
            if (!iframe?.contentWindow) { console.warn(`❌ iframe not found: ${id}`); return; }
            iframe.contentWindow.postMessage(msg, "*");
        });
    };

    payload.maps.forEach(({ char, src }) => {
        if (src.basecolor) send(`${char}:basecolor:${src.basecolor}`);
        if (src.normal)    send(`${char}:normal:${src.normal}`);
        if (src.roughness) send(`${char}:roughness:${src.roughness}`);
        if (src.height)    send(`${char}:height:${src.height}`);
        if (src.ambient)   send(`${char}:ambient:${src.ambient}`);
    });
}
