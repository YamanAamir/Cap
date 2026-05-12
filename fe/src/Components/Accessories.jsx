import React, { useState, useEffect, useRef } from 'react';

const Accessories = ({ selectedOptions = {}, onOptionChange, errors, setErrors, pakke }) => {
    const cameraTriggers = useRef({});
    const [hatBoxColor, setHatBoxColor] = useState('#DC2626');
    const [selectedHatBoxType, setSelectedHatBoxType] = useState(selectedOptions.Hueæske || 'Standard');
    const [selectedPremiumæske, setSelectedPremiumæske] = useState(selectedOptions['Premium æske'] || '');

    // Individual accessory selections
    const [ballpointPenSelection, setBallpointPenSelection] = useState(selectedOptions.Huekuglepen || 'No');
    const [silkPillowSelection, setSilkPillowSelection] = useState(selectedOptions.Silkepude || 'No');
    const [badgesSelection, setBadgesSelection] = useState(selectedOptions['Ekstra korkarde'] || 'No');
    
    // Flag selection system
    const [availableFlags, setAvailableFlags] = useState([]);
    const [selectedFlags, setSelectedFlags] = useState(selectedOptions.selectedFlags || []);

    const [glovesSelection, setGlovesSelection] = useState(selectedOptions.Handsker || 'No');
    const [largeBallpointPenSelection, setLargeBallpointPenSelection] = useState(selectedOptions['Store kuglepen'] || 'No');
    const [smartTagSelection, setSmartTagSelection] = useState(selectedOptions['Smart Tag'] || 'No');
    const [lightBallSelection, setLightBallSelection] = useState(selectedOptions.Lyskugle || 'No');
    const [champagneGlassSelection, setChampagneGlassSelection] = useState(selectedOptions['Luksus champagneglas'] || 'No');
    const [whistleSelection, setWhistleSelection] = useState(selectedOptions.Fløjte || 'No');
    const [trumpetSelection, setTrumpetSelection] = useState(selectedOptions.Trompet || 'No');
    const [bucketpinsSelection, setBucketpinsSelection] = useState(selectedOptions.Bucketpins || 'No');
    const [extraKokardeText, setExtraKokardeText] = useState(selectedOptions['Ekstra korkarde Text'] || '');

    // Canvas refs for text images
    const korkardeCanvasRef = useRef(document.createElement('canvas'));

    const accessoryOptions = [
        { name: 'Yes', value: 'Yes', icon: '✔️' },
        { name: 'No', value: 'No', icon: '❌' },
    ];

    const hatBoxTypes = ['Standard', 'Luksus æske', 'Premium æske'];
    const premiumaske = ['Grøn velour', 'Sort velour', 'Kunstlæderæske'];

    // Fetch available flags on mount
    useEffect(() => {
        const fetchFlags = async () => {
            try {
                const baseUrl = window.location.hostname === 'localhost'
                    ? 'http://localhost:3000'
                    : 'https://cap-dev-backend-one.vercel.app';
                const response = await fetch(`${baseUrl}/api/flags`);
                if (response.ok) {
                    const data = await response.json();
                    // Filter out Express Delivery from selectable flags
                    const filteredFlags = data.filter(f => !f.name.toLowerCase().includes('express'));
                    setAvailableFlags(filteredFlags);
                }
            } catch (error) {
                console.error('Error fetching flags:', error);
            }
        };
        fetchFlags();
    }, []);

    const handleFlagSelection = (index, flagId) => {
        const newSelected = [...selectedFlags];
        if (flagId === "") {
            // If selecting empty, remove this flag and subsequent ones
            newSelected.splice(index);
        } else {
            const flag = availableFlags.find(f => f.id === parseInt(flagId));
            if (flag) {
                newSelected[index] = flag;
            }
        }
        setSelectedFlags(newSelected);
        onOptionChange('selectedFlags', newSelected);
        
        // Also update a flat version for easier backend/order processing
        onOptionChange('Flag 1', newSelected[0]?.name || '');
        onOptionChange('Flag 2', newSelected[1]?.name || '');
        onOptionChange('Flag 3', newSelected[2]?.name || '');

        // 3D Preview updates (send first flag to preview for now as standard)
        if (newSelected.length > 0) {
            const message = `Accessories LilleFlagText:${newSelected[0].name}`;
            sendMessageToIframes(message);
        } else {
            sendMessageToIframes("Accessories LilleFlagText:");
        }
    };

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

    const renderTextToCanvas = (text, canvasRef, messagePrefix) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

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

        const fontSize = 150;
        const fontFamily = "Arial";

        ctx.font = `${fontSize}px ${fontFamily}`;
        const textWidth = ctx.measureText(text).width;

        canvas.width = textWidth + 200; 
        canvas.height = 512; 

        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        ctx.fillText(text, canvas.width / 2, canvas.height / 2);

        const base64Image = canvas.toDataURL("image/png", 10);
        sendMessageToIframes(`${messagePrefix}:${base64Image}`);
    };

    const handleKorkardeTextChange = (text) => {
        setExtraKokardeText(text);
        onOptionChange('Ekstra korkarde Text', text);
        if (badgesSelection === 'Yes') {
            renderTextToCanvas(text, korkardeCanvasRef, 'KorkardeImage');
        }
    };

    useEffect(() => {
        if (badgesSelection === 'Yes') {
            renderTextToCanvas(extraKokardeText, korkardeCanvasRef, 'KorkardeImage');
        } else {
            renderTextToCanvas('', korkardeCanvasRef, 'KorkardeImage');
        }
    }, [badgesSelection, extraKokardeText]);

    const validateFields = () => {
        const newErrors = {};
        if (badgesSelection === 'Yes' && !extraKokardeText.trim()) {
            newErrors.extraKokardeText = 'Ekstra korkarde tekst er påkrævet';
        }
        setErrors(newErrors);
        return newErrors;
    };

    // Effects for standard options
    useEffect(() => {
        onOptionChange('Hueæske', selectedHatBoxType);
        sendMessageToIframes(`Accessories Hueæske:${selectedHatBoxType.toLowerCase()}`);
        if (cameraTriggers.current['huea']) { sendMessageToIframes("hueæske camera"); } else { cameraTriggers.current['huea'] = true; }
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
        sendMessageToIframes(`Accessories Premiumæske:${selectedPremiumæske.toLowerCase()}`);
        if (cameraTriggers.current['premium']) { sendMessageToIframes("premiumæske camera"); } else { cameraTriggers.current['premium'] = true; }
    }, [selectedPremiumæske]);

    useEffect(() => {
        onOptionChange('Huekuglepen', ballpointPenSelection);
        sendMessageToIframes(`Accessories Huekuglepen:${ballpointPenSelection.toLowerCase()}`);
        if (cameraTriggers.current['pen']) { sendMessageToIframes("pen camera"); } else { cameraTriggers.current['pen'] = true; }
    }, [ballpointPenSelection]);

    useEffect(() => {
        onOptionChange('Silkepude', silkPillowSelection);
        sendMessageToIframes(`Accessories Silkepude:${silkPillowSelection.toLowerCase()}`);
        if (cameraTriggers.current['silke']) { sendMessageToIframes("silkepude camera"); } else { cameraTriggers.current['silke'] = true; }
    }, [silkPillowSelection]);

    useEffect(() => {
        onOptionChange('Ekstra korkarde', badgesSelection);
        sendMessageToIframes(`Accessories EkstraKorkarde:${badgesSelection.toLowerCase()}`);
        if (cameraTriggers.current['kork']) { sendMessageToIframes("ekstrakorkarde camera"); } else { cameraTriggers.current['kork'] = true; }
        if (badgesSelection === 'Yes') validateFields();
        else setErrors(prev => {
            const { extraKokardeText, ...rest } = prev;
            return rest;
        });
    }, [badgesSelection]);

    useEffect(() => {
        onOptionChange('Handsker', glovesSelection);
        sendMessageToIframes(`Accessories Handsker:${glovesSelection.toLowerCase()}`);
        if (cameraTriggers.current['hand']) { sendMessageToIframes("handsker camera"); } else { cameraTriggers.current['hand'] = true; }
    }, [glovesSelection]);

    useEffect(() => {
        onOptionChange('Store kuglepen', largeBallpointPenSelection);
        sendMessageToIframes(`Accessories StoreKuglepen:${largeBallpointPenSelection.toLowerCase()}`);
        if (cameraTriggers.current['store']) { sendMessageToIframes("storekuglepen camera"); } else { cameraTriggers.current['store'] = true; }
    }, [largeBallpointPenSelection]);

    useEffect(() => {
        onOptionChange('Smart Tag', smartTagSelection);
        sendMessageToIframes(`Accessories SmartTag:${smartTagSelection.toLowerCase()}`);
        if (cameraTriggers.current['smart']) { sendMessageToIframes("smarttag camera"); } else { cameraTriggers.current['smart'] = true; }
    }, [smartTagSelection]);

    useEffect(() => {
        onOptionChange('Lyskugle', lightBallSelection);
        sendMessageToIframes(`Accessories Lyskugle:${lightBallSelection.toLowerCase()}`);
        if (cameraTriggers.current['lys']) { sendMessageToIframes("lyskugle camera"); } else { cameraTriggers.current['lys'] = true; }
    }, [lightBallSelection]);

    useEffect(() => {
        onOptionChange('Luksus champagneglas', champagneGlassSelection);
        sendMessageToIframes(`Accessories LuksusChampagneglas:${champagneGlassSelection.toLowerCase()}`);
        if (cameraTriggers.current['champ']) { sendMessageToIframes("luksuschampagneglas camera"); } else { cameraTriggers.current['champ'] = true; }
    }, [champagneGlassSelection]);

    useEffect(() => {
        onOptionChange('Fløjte', whistleSelection);
        sendMessageToIframes(`Accessories Fløjte:${whistleSelection.toLowerCase()}`);
        if (cameraTriggers.current['floj']) { sendMessageToIframes("fløjte camera"); } else { cameraTriggers.current['floj'] = true; }
    }, [whistleSelection]);

    useEffect(() => {
        onOptionChange('Trompet', trumpetSelection);
        sendMessageToIframes(`Accessories Trompet:${trumpetSelection.toLowerCase()}`);
        if (cameraTriggers.current['tromp']) { sendMessageToIframes("trompet camera"); } else { cameraTriggers.current['tromp'] = true; }
    }, [trumpetSelection]);

    useEffect(() => {
        onOptionChange('Bucketpins', bucketpinsSelection);
        sendMessageToIframes(`Accessories Bucketpins:${bucketpinsSelection.toLowerCase()}`);
        sendMessageToIframes("bucketpins camera");
    }, [bucketpinsSelection]);

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
                        {/* When a package is selected, the accessories included in that package should automatically be selected as well */}
                        {((pakke === 'premium' && (selectedHatBoxType === 'Premium æske' || selectedHatBoxType === 'Luksus æske')) || 
                          (pakke === 'luksus' && selectedHatBoxType === 'Luksus æske')) && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-100 to-yellow-200 text-amber-800">
                                Inkluderet i pakken
                            </span>
                        )}
                        {/* When a package is selected, the accessories included in that package should automatically be selected as well */}
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
                </div>
            )}

            {/* NEW FLAG SYSTEM */}
            <div className="space-y-6 pt-6 border-t border-slate-100">
                <div className="space-y-1">
                    <h4 className="text-lg font-bold text-slate-900">Små Flag Add-on</h4>
                    <p className="text-sm text-slate-500 italic">Vælg op til 3 flag</p>
                </div>

                {[0, 1, 2].map((index) => {
                    // Only show if it's the first or the previous one is selected
                    if (index > 0 && !selectedFlags[index - 1]) return null;

                    return (
                        <div key={index} className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-semibold text-slate-700">Flag {index + 1}</label>
                                {selectedFlags[index]?.price > 0 && (
                                    <span className="text-xs font-bold text-green-600">+{selectedFlags[index].price} DKK</span>
                                )}
                            </div>
                            <select
                                value={selectedFlags[index]?.id || ""}
                                onChange={(e) => handleFlagSelection(index, e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 bg-white text-slate-700"
                            >
                                <option value="">Vælg flag...</option>
                                {availableFlags.map((flag) => (
                                    <option key={flag.id} value={flag.id}>
                                        {flag.name} {flag.price > 0 ? `(+${flag.price} DKK)` : '(Inkluderet)'}
                                    </option>
                                ))}
                            </select>
                        </div>
                    );
                })}
            </div>

            <div className="pt-6">
                <AccessorySelector label="Handsker" currentSelection={glovesSelection} onSelectionChange={setGlovesSelection} />
            </div>
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
