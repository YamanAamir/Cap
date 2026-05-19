// utils/embroideryLetterMeta.js

export function getCharMeta(char) {

    // ===== SPACE =====
    if (char === ' ') {
        return {
            folder: null,
            width: 30,
            height: 0,
            yOffset: 0
        };
    }

    // ===== CUSTOM LETTER SETTINGS =====
    const map = {

        // =========================
        // CAPITAL LETTERS
        // =========================

        A: { folder: 'Capital', width: 90, height: 90, yOffset: 80 },
        B: { folder: 'Capital', width: 95, height: 95, yOffset: 80 },
        C: { folder: 'Capital', width: 85, height: 85, yOffset: 82 },
        D: { folder: 'Capital', width: 100, height: 100, yOffset: 78 },
        E: { folder: 'Capital', width: 88, height: 88, yOffset: 82 },
        F: { folder: 'Capital', width: 85, height: 85, yOffset: 82 },
        G: { folder: 'Capital', width: 95, height: 95, yOffset: 80 },
        H: { folder: 'Capital', width: 95, height: 95, yOffset: 80 },
        I: { folder: 'Capital', width: 50, height: 90, yOffset: 80 },
        J: { folder: 'Capital', width: 70, height: 95, yOffset: 80 },
        K: { folder: 'Capital', width: 95, height: 95, yOffset: 80 },
        L: { folder: 'Capital', width: 80, height: 90, yOffset: 80 },
        M: { folder: 'Capital', width: 120, height: 95, yOffset: 80 },
        N: { folder: 'Capital', width: 105, height: 95, yOffset: 80 },
        O: { folder: 'Capital', width: 95, height: 95, yOffset: 80 },
        P: { folder: 'Capital', width: 90, height: 90, yOffset: 80 },
        Q: { folder: 'Capital', width: 100, height: 100, yOffset: 80 },
        R: { folder: 'Capital', width: 95, height: 95, yOffset: 80 },
        S: { folder: 'Capital', width: 85, height: 85, yOffset: 82 },
        T: { folder: 'Capital', width: 85, height: 90, yOffset: 80 },
        U: { folder: 'Capital', width: 95, height: 95, yOffset: 80 },
        V: { folder: 'Capital', width: 95, height: 95, yOffset: 80 },
        W: { folder: 'Capital', width: 130, height: 95, yOffset: 80 },
        X: { folder: 'Capital', width: 95, height: 95, yOffset: 80 },
        Y: { folder: 'Capital', width: 95, height: 95, yOffset: 80 },
        Z: { folder: 'Capital', width: 90, height: 90, yOffset: 80 },

        // =========================
        // SMALL LETTERS
        // =========================

        a: { folder: 'Small', width: 45, height: 45, yOffset: 125 },
        b: { folder: 'Small', width: 70, height: 70, yOffset: 95 },
        c: { folder: 'Small', width: 45, height: 45, yOffset: 125 },
        d: { folder: 'Small', width: 70, height: 70, yOffset: 95 },
        e: { folder: 'Small', width: 45, height: 45, yOffset: 125 },
        f: { folder: 'Small', width: 70, height: 70, yOffset: 95 },
        g: { folder: 'Small', width: 75, height: 75, yOffset: 125 },
        h: { folder: 'Small', width: 70, height: 70, yOffset: 95 },
        i: { folder: 'Small', width: 30, height: 45, yOffset: 125 },
        j: { folder: 'Small', width: 45, height: 75, yOffset: 125 },
        k: { folder: 'Small', width: 70, height: 70, yOffset: 95 },
        l: { folder: 'Small', width: 35, height: 70, yOffset: 95 },
        m: { folder: 'Small', width: 80, height: 45, yOffset: 125 },
        n: { folder: 'Small', width: 60, height: 45, yOffset: 125 },
        o: { folder: 'Small', width: 45, height: 45, yOffset: 125 },
        p: { folder: 'Small', width: 75, height: 75, yOffset: 125 },
        q: { folder: 'Small', width: 75, height: 75, yOffset: 125 },
        r: { folder: 'Small', width: 45, height: 45, yOffset: 125 },
        s: { folder: 'Small', width: 45, height: 45, yOffset: 125 },
        t: { folder: 'Small', width: 55, height: 70, yOffset: 95 },
        u: { folder: 'Small', width: 60, height: 45, yOffset: 125 },
        v: { folder: 'Small', width: 60, height: 45, yOffset: 125 },
        w: { folder: 'Small', width: 90, height: 45, yOffset: 125 },
        x: { folder: 'Small', width: 60, height: 45, yOffset: 125 },
        y: { folder: 'Small', width: 75, height: 75, yOffset: 125 },
        z: { folder: 'Small', width: 50, height: 45, yOffset: 125 },
    };

    return map[char] || null;
}