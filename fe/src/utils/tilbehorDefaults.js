const ALL_NO = {
    Hueæske: 'Standard',
    'Premium æske': '',
    Huekuglepen: 'No',
    Silkepude: 'No',
    'Ekstra korkarde': 'No',
    Handsker: 'No',
    'Store kuglepen': 'No',
    'Smart Tag': 'No',
    Lyskugle: 'No',
    'Luksus champagneglas': 'No',
    Fløjte: 'No',
    Trompet: 'No',
    Bucketpins: 'No',
};

const LUKSUS_YES = {
    Hueæske: 'Luksus æske',
    Huekuglepen: 'Yes',
    Silkepude: 'Yes',
    'Ekstra korkarde': 'Yes',
    Handsker: 'Yes',
    'Luksus champagneglas': 'Yes',
    Fløjte: 'Yes',
};

const PREMIUM_YES = {
    Hueæske: 'Premium æske',
    'Premium æske': 'Grøn velour',
    Huekuglepen: 'Yes',
    Silkepude: 'Yes',
    'Ekstra korkarde': 'Yes',
    Handsker: 'Yes',
    'Store kuglepen': 'Yes',
    'Smart Tag': 'Yes',
    Lyskugle: 'Yes',
    'Luksus champagneglas': 'Yes',
    Fløjte: 'Yes',
    Trompet: 'Yes',
    Bucketpins: 'Yes',
};

export const hueæskeToTier = (hueæske) => {
    if (hueæske === 'Luksus æske') return 'luksus';
    if (hueæske === 'Premium æske') return 'premium';
    return 'standard';
};

export const getTilbehorForTier = (tier, baseTilbehor = {}) => {
    const result = {
        ...baseTilbehor,
        ...ALL_NO,
        'Ekstra korkarde Text': tier === 'standard' ? '' : (baseTilbehor['Ekstra korkarde Text'] || ''),
        selectedFlags: tier === 'standard' ? [] : (baseTilbehor.selectedFlags || []),
        'Flag 1': tier === 'standard' ? '' : (baseTilbehor['Flag 1'] || ''),
        'Flag 2': tier === 'standard' ? '' : (baseTilbehor['Flag 2'] || ''),
        'Flag 3': tier === 'standard' ? '' : (baseTilbehor['Flag 3'] || ''),
    };

    if (tier === 'luksus') {
        Object.assign(result, LUKSUS_YES);
    } else if (tier === 'premium') {
        Object.assign(result, PREMIUM_YES);
    }

    return result;
};

const sendMessageToIframes = (msg) => {
    ['preview-iframe', 'preview-iframe2'].forEach((id) => {
        const iframe = document.getElementById(id);
        if (iframe?.contentWindow) {
            iframe.contentWindow.postMessage(msg, '*');
        }
    });
};

export const syncTilbehorToIframes = (tilbehor) => {
    if (!tilbehor) return;

    const yesNoKeys = [
        ['Huekuglepen', 'Huekuglepen'],
        ['Silkepude', 'Silkepude'],
        ['Ekstra korkarde', 'EkstraKorkarde'],
        ['Handsker', 'Handsker'],
        ['Store kuglepen', 'StoreKuglepen'],
        ['Smart Tag', 'SmartTag'],
        ['Lyskugle', 'Lyskugle'],
        ['Luksus champagneglas', 'LuksusChampagneglas'],
        ['Fløjte', 'Fløjte'],
        ['Trompet', 'Trompet'],
        ['Bucketpins', 'Bucketpins'],
    ];

    if (tilbehor.Hueæske) {
        sendMessageToIframes(`Accessories Hueæske:${tilbehor.Hueæske.toLowerCase()}`);
    }

    if (tilbehor['Premium æske']) {
        sendMessageToIframes(`Accessories Premiumæske:${tilbehor['Premium æske'].toLowerCase()}`);
    }

    yesNoKeys.forEach(([key, iframeKey]) => {
        const value = tilbehor[key];
        if (value) {
            sendMessageToIframes(`Accessories ${iframeKey}:${value.toLowerCase()}`);
        }
    });

    if (tilbehor['Ekstra korkarde'] === 'No') {
        sendMessageToIframes('KorkardeImage:');
    }
};
