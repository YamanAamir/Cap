import React, { useState, useEffect, useRef } from 'react';

const Accessories = ({ selectedOptions = {}, onOptionChange, errors, setErrors }) => {
    const [hatBoxColor, setHatBoxColor] = useState('#DC2626');
    const [selectedHatBoxType, setSelectedHatBoxType] = useState(selectedOptions.Hueæske || 'Standard');
    const [selectedPremiumæske, setSelectedPremiumæske] = useState(selectedOptions['Premium æske'] || '');

    // Individual accessory selections
    const [ballpointPenSelection, setBallpointPenSelection] = useState(selectedOptions.Huekuglepen || 'No');
    const [silkPillowSelection, setSilkPillowSelection] = useState(selectedOptions.Silkepude || 'No');
    const [badgesSelection, setBadgesSelection] = useState(selectedOptions['Ekstra korkarde'] || 'No');
    const [lilFlagSelection, setLilFlagSelection] = useState(selectedOptions['Lille Flag'] || 'No');
    const [glovesSelection, setGlovesSelection] = useState(selectedOptions.Handsker || 'No');
    const [largeBallpointPenSelection, setLargeBallpointPenSelection] = useState(selectedOptions['Store kuglepen'] || 'No');
    const [smartTagSelection, setSmartTagSelection] = useState(selectedOptions['Smart Tag'] || 'No');
    const [lightBallSelection, setLightBallSelection] = useState(selectedOptions.Lyskugle || 'No');
    const [champagneGlassSelection, setChampagneGlassSelection] = useState(selectedOptions['Luksus champagneglas'] || 'No');
    const [whistleSelection, setWhistleSelection] = useState(selectedOptions.Fløjte || 'No');
    const [trumpetSelection, setTrumpetSelection] = useState(selectedOptions.Trompet || 'No');
    const [bucketpinsSelection, setBucketpinsSelection] = useState(selectedOptions.Bucketpins || 'No');
    const [extraKokardeText, setExtraKokardeText] = useState(selectedOptions['Ekstra korkarde Text'] || '');
    const [lilFlagText, setLilFlagText] = useState(selectedOptions['Lille Flag Text'] || '');

    // Canvas refs for two separate text images
    const korkardeCanvasRef = useRef(document.createElement('canvas'));
    const flagCanvasRef = useRef(document.createElement('canvas'));

    const colorOptions = [
        { name: 'Burgundy', value: '#7F1D1D' },
        { name: 'Navy', value: '#1E3A8A' },
        { name: 'Red', value: '#DC2626' }
    ];

    const accessoryOptions = [
        { name: 'Yes', value: 'Yes', icon: '✔️' },
        { name: 'No', value: 'No', icon: '❌' },
    ];

    const hatBoxTypes = ['Standard', 'Luksus æske', 'Premium æske'];
    const premiumaske = ['Grøn velour', 'Sort velour', 'Kunstlæderæske'];

    // --------------------------------------------------------------------
    // Helper – send message to both preview iframes
    // --------------------------------------------------------------------
    const sendMessageToIframes = (msg) => {
        ['preview-iframe', 'preview-iframe2'].forEach((id) => {
            const iframe = document.getElementById(id);
            if (iframe?.contentWindow) {
                iframe.contentWindow.postMessage(msg, "*");
            }
        });
    };

    // --- Render single line text to canvas (transparent, normal + cursive) ---
    const renderTextToCanvas = (text, canvasRef, messagePrefix) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        // If empty text
        if (!text || text.trim() === "") {
            canvas.width = 1;
            canvas.height = 1;
            ctx.clearRect(0, 0, 1, 1);
            const emptyBase64 = canvas.toDataURL("image/png");
            const message = messagePrefix + emptyBase64;

            ["preview-iframe", "preview-iframe2"].forEach((id) => {
                const iframe = document.getElementById(id);
                if (iframe?.contentWindow) {
                    iframe.contentWindow.postMessage(message, "*");
                }
            });
            return;
        }

        // --- FIXED FONT SIZE ---
        const fontSize = 150;
        const fontFamily = "Arial"; // 🔥 your downloaded font

        // STEP 1 — temporarily set font to measure width
        ctx.font = `${fontSize}px ${fontFamily}`;
        const textWidth = ctx.measureText(text).width;

        // STEP 2 — dynamic width according to text
        canvas.width = textWidth + 200; // 200px padding
        canvas.height = 512; // fixed height

        // STEP 3 — canvas resize resets context → apply font again!
        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // styling
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // STEP 4 — draw clean centered text
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);

        // STEP 5 — export
        const base64Image = canvas.toDataURL("image/png", 10);

        sendMessageToIframes(`${messagePrefix}:${base64Image}`);
    };

    // --- Handlers for text fields ---
    const handleKorkardeTextChange = (text) => {
        setExtraKokardeText(text);
        onOptionChange('Ekstra korkarde Text', text);
        if (badgesSelection === 'Yes') {
            renderTextToCanvas(text, korkardeCanvasRef, 'KorkardeImage');
        }
    };

    const handleFlagTextChange = (text) => {
        setLilFlagText(text);
        onOptionChange('Lille Flag Text', text);
        if (lilFlagSelection === 'Yes') {
            renderTextToCanvas(text, flagCanvasRef, 'FlagImage');
        }
    };

    // Re-render images when selection changes
    useEffect(() => {
        if (badgesSelection === 'Yes') {
            renderTextToCanvas(extraKokardeText, korkardeCanvasRef, 'KorkardeImage');
        } else {
            renderTextToCanvas('', korkardeCanvasRef, 'KorkardeImage'); // clear
        }
    }, [badgesSelection, extraKokardeText]);

    useEffect(() => {
        if (lilFlagSelection === 'Yes') {
            renderTextToCanvas(lilFlagText, flagCanvasRef, 'FlagImage');
        } else {
            renderTextToCanvas('', flagCanvasRef, 'FlagImage'); // clear
        }
    }, [lilFlagSelection, lilFlagText]);

    // Initialize on mount
    useEffect(() => {
        if (badgesSelection === 'Yes') renderTextToCanvas(extraKokardeText, korkardeCanvasRef, 'KorkardeImage');
        if (lilFlagSelection === 'Yes') renderTextToCanvas(lilFlagText, flagCanvasRef, 'FlagImage');
    }, []);

    // =====================
    // === VALIDATION ===
    // =====================
    const validateFields = () => {
        const newErrors = {};

        if (badgesSelection === 'Yes' && !extraKokardeText.trim()) {
            newErrors.extraKokardeText = 'Ekstra korkarde tekst er påkrævet';
        }

        if (lilFlagSelection === 'Yes' && !lilFlagText.trim()) {
            newErrors.lilFlagText = 'Lille flag tekst er påkrævet';
        }

        setErrors(newErrors);
        return newErrors;
    };

    // =====================
    // === EFFECT HOOKS ===
    // =====================

    // Hueæske
    useEffect(() => {
        onOptionChange('Hueæske', selectedHatBoxType);
        const message = `Accessories Hueæske:${selectedHatBoxType.toLowerCase()}`;
        sendMessageToIframes(message);
        sendMessageToIframes("hueæske camera");
    }, [selectedHatBoxType]);

    useEffect(() => {
        if (selectedHatBoxType !== 'Premium æske') {
            setSelectedPremiumæske('');
        } else if (selectedHatBoxType === 'Premium æske' && !selectedPremiumæske) {
            setSelectedPremiumæske('Grøn velour');
        }
    }, [selectedHatBoxType]);

    useEffect(() => {
        onOptionChange('Premium æske', selectedPremiumæske);
        const message = `Accessories Premiumæske:${selectedPremiumæske.toLowerCase()}`;
        sendMessageToIframes(message);
        sendMessageToIframes("premiumæske camera");
    }, [selectedPremiumæske]);

    // Huekuglepen
    useEffect(() => {
        onOptionChange('Huekuglepen', ballpointPenSelection);
        const message = `Accessories Huekuglepen:${ballpointPenSelection.toLowerCase()}`;
        sendMessageToIframes(message);
        sendMessageToIframes("pen camera");
    }, [ballpointPenSelection]);

    // Silkepude
    useEffect(() => {
        onOptionChange('Silkepude', silkPillowSelection);
        const message = `Accessories Silkepude:${silkPillowSelection.toLowerCase()}`;
        sendMessageToIframes(message);
        sendMessageToIframes("silkepude camera");
    }, [silkPillowSelection]);

    // Ekstra korkarde
    useEffect(() => {
        onOptionChange('Ekstra korkarde', badgesSelection);
        const message = `Accessories EkstraKorkarde:${badgesSelection.toLowerCase()}`;
        sendMessageToIframes(message);
        sendMessageToIframes("ekstrakorkarde camera");

        if (badgesSelection === 'Yes') {
            validateFields();
        } else {
            setErrors(prev => {
                const { extraKokardeText, ...rest } = prev;
                return rest;
            });
        }
    }, [badgesSelection]);

    // Lille Flag
    useEffect(() => {
        onOptionChange('Lille Flag', lilFlagSelection);
        const message = `Accessories LilleFlag:${lilFlagSelection.toLowerCase()}`;
        sendMessageToIframes(message);
        sendMessageToIframes("lilleflag camera");

        if (lilFlagSelection === 'Yes') {
            validateFields();
        } else {
            setErrors(prev => {
                const { lilFlagText, ...rest } = prev;
                return rest;
            });
        }
    }, [lilFlagSelection]);

    // Ekstra korkarde Text (raw text + image)
    useEffect(() => {
        onOptionChange('Ekstra korkarde Text', extraKokardeText);
        const message = `Accessories EkstraKorkardeText:${extraKokardeText}`;
        sendMessageToIframes(message);
        sendMessageToIframes("ekstrakorkardetext camera");
        if (badgesSelection === 'Yes') validateFields();
    }, [extraKokardeText]);

    // Lille Flag Text (raw text + image)
    useEffect(() => {
        onOptionChange('Lille Flag Text', lilFlagText);
        const message = `Accessories LilleFlagText:${lilFlagText}`;
        sendMessageToIframes(message);
        sendMessageToIframes("lilleflagtext camera");
        if (lilFlagSelection === 'Yes') validateFields();
    }, [lilFlagText]);

    // Other accessories
    useEffect(() => {
        onOptionChange('Handsker', glovesSelection);
        const message = `Accessories Handsker:${glovesSelection.toLowerCase()}`;
        sendMessageToIframes(message);
        sendMessageToIframes("handsker camera");
    }, [glovesSelection]);

    useEffect(() => {
        onOptionChange('Store kuglepen', largeBallpointPenSelection);
        const message = `Accessories StoreKuglepen:${largeBallpointPenSelection.toLowerCase()}`;
        sendMessageToIframes(message);
        sendMessageToIframes("storekuglepen camera");
    }, [largeBallpointPenSelection]);

    useEffect(() => {
        onOptionChange('Smart Tag', smartTagSelection);
        const message = `Accessories SmartTag:${smartTagSelection.toLowerCase()}`;
        sendMessageToIframes(message);
        sendMessageToIframes("smarttag camera");
    }, [smartTagSelection]);

    useEffect(() => {
        onOptionChange('Lyskugle', lightBallSelection);
        const message = `Accessories Lyskugle:${lightBallSelection.toLowerCase()}`;
        sendMessageToIframes(message);
        sendMessageToIframes("lyskugle camera");
    }, [lightBallSelection]);

    useEffect(() => {
        onOptionChange('Luksus champagneglas', champagneGlassSelection);
        const message = `Accessories LuksusChampagneglas:${champagneGlassSelection.toLowerCase()}`;
        sendMessageToIframes(message);
        sendMessageToIframes("luksuschampagneglas camera");
    }, [champagneGlassSelection]);

    useEffect(() => {
        onOptionChange('Fløjte', whistleSelection);
        const message = `Accessories Fløjte:${whistleSelection.toLowerCase()}`;
        sendMessageToIframes(message);
        sendMessageToIframes("fløjte camera");
    }, [whistleSelection]);

    useEffect(() => {
        onOptionChange('Trompet', trumpetSelection);
        const message = `Accessories Trompet:${trumpetSelection.toLowerCase()}`;
        sendMessageToIframes(message);
        sendMessageToIframes("trompet camera");
    }, [trumpetSelection]);

    useEffect(() => {
        onOptionChange('Bucketpins', bucketpinsSelection);
        const message = `Accessories Bucketpins:${bucketpinsSelection.toLowerCase()}`;
        sendMessageToIframes(message);
        sendMessageToIframes("bucketpins camera");
    }, [bucketpinsSelection]);

    // Helper component
    const AccessorySelector = ({ label, currentSelection, onSelectionChange }) => (
        <div className="space-y-4">
            <div>
                <label className="text-sm font-semibold text-slate-700">{label}</label>
            </div>
            <div className="flex space-x-3">
                {accessoryOptions.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => onSelectionChange(option.value)}
                        className={`w-12 h-12 rounded-xl border-2 transition-all duration-200 hover:scale-110 ${currentSelection === option.value
                            ? 'border-slate-800 ring-2 ring-slate-800 ring-offset-2'
                            : 'border-slate-200 hover:border-slate-400'
                            }`}
                    >
                        {option.icon}
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <>
            <div className="space-y-2 mt-8">
                <h3 className="text-2xl font-bold text-slate-900">TILBEHØR</h3>
            </div>

            {/* Hat Box Type */}
            <div className="space-y-4">
                <div>
                    <label className="text-sm font-semibold text-slate-700">Hueæske</label>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {selectedHatBoxType}
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-100 to-yellow-200 text-amber-800">
                            {selectedHatBoxType === 'Premium æske' ? 'Inkluderet i pakken' : selectedHatBoxType === 'Luksus æske' ? '+ 249 DKK' : ''}
                        </span>
                    </div>
                </div>
                <div className="flex space-x-3 flex-wrap">
                    {hatBoxTypes.map((type) => (
                        <button
                            key={type}
                            onClick={() => setSelectedHatBoxType(type)}
                            className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 m-1 ${selectedHatBoxType === type
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:shadow-sm'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {selectedHatBoxType === 'Premium æske' && (
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-semibold text-slate-700">Premium æske</label>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {selectedPremiumæske}
                            </span>
                        </div>
                    </div>
                    <div className="flex space-x-3 flex-wrap">
                        {premiumaske.map((type) => (
                            <button
                                key={type}
                                onClick={() => setSelectedPremiumæske(type)}
                                className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 m-1 ${selectedPremiumæske === type
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:shadow-sm'
                                    }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Accessories */}
            <AccessorySelector label="Huekuglepen" currentSelection={ballpointPenSelection} onSelectionChange={setBallpointPenSelection} />
            <AccessorySelector label="Silkepude" currentSelection={silkPillowSelection} onSelectionChange={setSilkPillowSelection} />
            <AccessorySelector label="Ekstra korkarde" currentSelection={badgesSelection} onSelectionChange={setBadgesSelection} />

            {badgesSelection === 'Yes' && (
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-semibold text-slate-700">Ekstra korkarde tekst</label>
                    </div>
                    <div className="relative">
                        <input
                            type="text"
                            value={extraKokardeText}
                            onChange={(e) => handleKorkardeTextChange(e.target.value)}
                            placeholder="Fri tekst"
                            maxLength={26}
                            className={`w-full px-4 py-4 rounded-2xl border-2 transition-all duration-200 bg-white/80 backdrop-blur-sm text-slate-700 placeholder-slate-400 ${errors.extraKokardeText
                                ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                                : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                                }`}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                            <div className={`w-2 h-2 rounded-full animate-pulse ${errors.extraKokardeText ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                        </div>
                    </div>
                    {errors.extraKokardeText && <p className="text-sm text-red-600 font-medium">{errors.extraKokardeText}</p>}
                    <p className="text-sm text-slate-600">Valgt tekst: {extraKokardeText || 'Ingen tekst'}</p>
                </div>
            )}

            <AccessorySelector label="Lille flag" currentSelection={lilFlagSelection} onSelectionChange={setLilFlagSelection} />

            {lilFlagSelection === 'Yes' && (
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-semibold text-slate-700">Lille Flag tekst</label>
                    </div>
                    <div className="relative">
                        <input
                            type="text"
                            value={lilFlagText}
                            onChange={(e) => handleFlagTextChange(e.target.value)}
                            placeholder="Skriv navnet på det, land som du ønsker"
                            maxLength={26}
                            className={`w-full px-4 py-4 rounded-2xl border-2 transition-all duration-200 bg-white/80 backdrop-blur-sm text-slate-700 placeholder-slate-400 ${errors.lilFlagText
                                ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                                : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                                }`}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                            <div className={`w-2 h-2 rounded-full animate-pulse ${errors.lilFlagText ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                        </div>
                    </div>
                    {errors.lilFlagText && <p className="text-sm text-red-600 font-medium">{errors.lilFlagText}</p>}
                    <p className="text-sm text-slate-600">Valgt tekst: {lilFlagText || 'Ingen tekst'}</p>
                </div>
            )}

            <AccessorySelector label="Handsker" currentSelection={glovesSelection} onSelectionChange={setGlovesSelection} />
            <AccessorySelector label="Store kuglepen" currentSelection={largeBallpointPenSelection} onSelectionChange={setLargeBallpointPenSelection} />
            <AccessorySelector label="Smart Tag" currentSelection={smartTagSelection} onSelectionChange={setSmartTagSelection} />
            <AccessorySelector label="Lyskugle" currentSelection={lightBallSelection} onSelectionChange={setLightBallSelection} />
            <AccessorySelector label="Luksus champagneglas" currentSelection={champagneGlassSelection} onSelectionChange={setChampagneGlassSelection} />
            <AccessorySelector label="Fløjte" currentSelection={whistleSelection} onSelectionChange={setWhistleSelection} />
            <AccessorySelector label="Trompet" currentSelection={trumpetSelection} onSelectionChange={setTrumpetSelection} />
            <AccessorySelector label="Bucketpins" currentSelection={bucketpinsSelection} onSelectionChange={setBucketpinsSelection} />
        </>
    );
};

export default Accessories;