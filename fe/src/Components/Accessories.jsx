import React, { useEffect, useRef, useState } from 'react';
import { getTilbehorForTier, hueæskeToTier, syncTilbehorToIframes } from '../utils/tilbehorDefaults';

const AccessorySelector = ({ label, currentSelection, onSelectionChange, accessoryOptions }) => (
    <div className="space-y-4">
        <div>
            <label className="text-sm font-semibold text-slate-700">{label}</label>
        </div>
        <div className="flex space-x-3">
            {accessoryOptions.map((option) => (
                <button
                    key={option.value}
                    type="button"
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

const Accessories = ({ selectedOptions = {}, onOptionChange, errors, setErrors, pakke }) => {
    const cameraTriggers = useRef({});
    const tilbehor = selectedOptions?.TILBEHØR || {};

    const [availableFlags, setAvailableFlags] = useState([]);
    const korkardeCanvasRef = useRef(document.createElement('canvas'));

    const accessoryOptions = [
        { name: 'Yes', value: 'Yes', icon: '✔️' },
        { name: 'No', value: 'No', icon: '❌' },
    ];

    const hatBoxTypes = ['Standard', 'Luksus æske', 'Premium æske'];
    const premiumaske = ['Grøn velour', 'Sort velour', 'Kunstlæderæske'];

    const selectedHatBoxType = tilbehor.Hueæske || 'Standard';
    const selectedPremiumæske = tilbehor['Premium æske'] || '';
    const ballpointPenSelection = tilbehor.Huekuglepen || 'No';
    const silkPillowSelection = tilbehor.Silkepude || 'No';
    const badgesSelection = tilbehor['Ekstra korkarde'] || 'No';
    const selectedFlags = tilbehor.selectedFlags || [];
    const glovesSelection = tilbehor.Handsker || 'No';
    const largeBallpointPenSelection = tilbehor['Store kuglepen'] || 'No';
    const smartTagSelection = tilbehor['Smart Tag'] || 'No';
    const lightBallSelection = tilbehor.Lyskugle || 'No';
    const champagneGlassSelection = tilbehor['Luksus champagneglas'] || 'No';
    const whistleSelection = tilbehor.Fløjte || 'No';
    const trumpetSelection = tilbehor.Trompet || 'No';
    const bucketpinsSelection = tilbehor.Bucketpins || 'No';
    const extraKokardeText = tilbehor['Ekstra korkarde Text'] || '';

    useEffect(() => {
        const fetchFlags = async () => {
            try {
                const baseUrl = window.location.hostname === 'localhost'
                    ? 'http://localhost:3000'
                    : 'https://cap-dev-backend-one.vercel.app';
                const response = await fetch(`${baseUrl}/api/flags`);
                if (response.ok) {
                    const data = await response.json();
                    const filteredFlags = data.filter(f => !f.name.toLowerCase().includes('express'));
                    setAvailableFlags(filteredFlags);
                }
            } catch (error) {
                console.error('Error fetching flags:', error);
            }
        };
        fetchFlags();
    }, []);

    const sendMessageToIframes = (msg) => {
        ['preview-iframe', 'preview-iframe2'].forEach((id) => {
            const iframe = document.getElementById(id);
            if (iframe?.contentWindow) {
                iframe.contentWindow.postMessage(msg, '*');
            }
        });
    };

    const sendWithCamera = (msg, cameraKey, cameraMsg) => {
        sendMessageToIframes(msg);
        if (cameraTriggers.current[cameraKey]) {
            sendMessageToIframes(cameraMsg);
        } else {
            cameraTriggers.current[cameraKey] = true;
        }
    };

    const updateTilbehor = (patch) => {
        onOptionChange('TILBEHØR', { ...tilbehor, ...patch });
    };

    const renderTextToCanvas = (text, canvasRef, messagePrefix) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (!text || text.trim() === '') {
            canvas.width = 1;
            canvas.height = 1;
            ctx.clearRect(0, 0, 1, 1);
            sendMessageToIframes(messagePrefix + canvas.toDataURL('image/png'));
            return;
        }

        const fontSize = 150;
        const fontFamily = 'Arial';

        ctx.font = `${fontSize}px ${fontFamily}`;
        const textWidth = ctx.measureText(text).width;

        canvas.width = textWidth + 200;
        canvas.height = 512;

        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.fillText(text, canvas.width / 2, canvas.height / 2);

        sendMessageToIframes(`${messagePrefix}:${canvas.toDataURL('image/png', 10)}`);
    };

    const handleKorkardeTextChange = (text) => {
        updateTilbehor({ 'Ekstra korkarde Text': text });
        if (badgesSelection === 'Yes') {
            renderTextToCanvas(text, korkardeCanvasRef, 'KorkardeImage');
        }
    };

    const handleFlagSelection = (index, flagId) => {
        const newSelected = [...selectedFlags];
        if (flagId === '') {
            newSelected.splice(index);
        } else {
            const flag = availableFlags.find(f => f.id === parseInt(flagId, 10));
            if (flag) {
                newSelected[index] = flag;
            }
        }

        updateTilbehor({
            selectedFlags: newSelected,
            'Flag 1': newSelected[0]?.name || '',
            'Flag 2': newSelected[1]?.name || '',
            'Flag 3': newSelected[2]?.name || '',
        });

        if (newSelected.length > 0) {
            sendMessageToIframes(`Accessories LilleFlagText:${newSelected[0].name}`);
        } else {
            sendMessageToIframes('Accessories LilleFlagText:');
        }
    };

    const handleHatBoxTypeChange = (type) => {
        const tier = hueæskeToTier(type);
        const newTilbehor = getTilbehorForTier(tier, tilbehor);
        onOptionChange('TILBEHØR', newTilbehor);
        syncTilbehorToIframes(newTilbehor);
        sendWithCamera(
            `Accessories Hueæske:${type.toLowerCase()}`,
            'huea',
            'hueæske camera'
        );
    };

    const handlePremiumæskeChange = (type) => {
        updateTilbehor({ 'Premium æske': type });
        sendWithCamera(
            `Accessories Premiumæske:${type.toLowerCase()}`,
            'premium',
            'premiumæske camera'
        );
    };

    const handleAccessoryToggle = (key, value, iframePrefix, cameraKey, cameraMsg) => {
        updateTilbehor({ [key]: value });
        sendWithCamera(
            `Accessories ${iframePrefix}:${value.toLowerCase()}`,
            cameraKey,
            cameraMsg
        );

        if (key === 'Ekstra korkarde') {
            if (value === 'Yes') {
                const newErrors = {};
                if (!extraKokardeText.trim()) {
                    newErrors.extraKokardeText = 'Ekstra korkarde tekst er påkrævet';
                }
                setErrors(newErrors);
                renderTextToCanvas(extraKokardeText, korkardeCanvasRef, 'KorkardeImage');
            } else {
                setErrors(prev => {
                    const { extraKokardeText: _, ...rest } = prev;
                    return rest;
                });
                renderTextToCanvas('', korkardeCanvasRef, 'KorkardeImage');
            }
        }
    };

    return (
        <>
            <div className="space-y-2 mt-8">
                <h3 className="text-2xl font-bold text-slate-900">TILBEHØR</h3>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="text-sm font-semibold text-slate-700">Hueæske</label>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {selectedHatBoxType}
                        </span>
                        {((pakke === 'premium' && (selectedHatBoxType === 'Premium æske' || selectedHatBoxType === 'Luksus æske')) ||
                          (pakke === 'luksus' && selectedHatBoxType === 'Luksus æske')) && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-100 to-yellow-200 text-amber-800">
                                Inkluderet i pakken
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex space-x-3 flex-wrap">
                    {hatBoxTypes.map((type) => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => handleHatBoxTypeChange(type)}
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
                                type="button"
                                onClick={() => handlePremiumæskeChange(type)}
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

            <AccessorySelector
                label="Huekuglepen"
                currentSelection={ballpointPenSelection}
                onSelectionChange={(value) =>
                    handleAccessoryToggle('Huekuglepen', value, 'Huekuglepen', 'pen', 'pen camera')
                }
                accessoryOptions={accessoryOptions}
            />
            <AccessorySelector
                label="Silkepude"
                currentSelection={silkPillowSelection}
                onSelectionChange={(value) =>
                    handleAccessoryToggle('Silkepude', value, 'Silkepude', 'silke', 'silkepude camera')
                }
                accessoryOptions={accessoryOptions}
            />
            <AccessorySelector
                label="Ekstra korkarde"
                currentSelection={badgesSelection}
                onSelectionChange={(value) =>
                    handleAccessoryToggle('Ekstra korkarde', value, 'EkstraKorkarde', 'kork', 'ekstrakorkarde camera')
                }
                accessoryOptions={accessoryOptions}
            />

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
                            <div className={`w-2 h-2 rounded-full animate-pulse ${errors.extraKokardeText ? 'bg-red-500' : 'bg-blue-500'}`} />
                        </div>
                    </div>
                    {errors.extraKokardeText && (
                        <p className="text-sm text-red-600 font-medium">{errors.extraKokardeText}</p>
                    )}
                </div>
            )}

            <div className="space-y-6 pt-6 border-t border-slate-100">
                <div className="space-y-1">
                    <h4 className="text-lg font-bold text-slate-900">Små Flag Add-on</h4>
                    <p className="text-sm text-slate-500 italic">Vælg op til 3 flag</p>
                </div>

                {[0, 1, 2].map((index) => {
                    if (index > 0 && !selectedFlags[index - 1]) return null;

                    return (
                        <div key={index} className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-semibold text-slate-700">Flag {index + 1}</label>
                                {selectedFlags[index]?.price > 0 && (
                                    <span className="text-xs font-bold text-green-600">
                                        +{selectedFlags[index].price} DKK
                                    </span>
                                )}
                            </div>
                            <select
                                value={selectedFlags[index]?.id || ''}
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
                <AccessorySelector
                    label="Handsker"
                    currentSelection={glovesSelection}
                    onSelectionChange={(value) =>
                        handleAccessoryToggle('Handsker', value, 'Handsker', 'hand', 'handsker camera')
                    }
                    accessoryOptions={accessoryOptions}
                />
            </div>
            <AccessorySelector
                label="Store kuglepen"
                currentSelection={largeBallpointPenSelection}
                onSelectionChange={(value) =>
                    handleAccessoryToggle('Store kuglepen', value, 'StoreKuglepen', 'store', 'storekuglepen camera')
                }
                accessoryOptions={accessoryOptions}
            />
            <AccessorySelector
                label="Smart Tag"
                currentSelection={smartTagSelection}
                onSelectionChange={(value) =>
                    handleAccessoryToggle('Smart Tag', value, 'SmartTag', 'smart', 'smarttag camera')
                }
                accessoryOptions={accessoryOptions}
            />
            <AccessorySelector
                label="Lyskugle"
                currentSelection={lightBallSelection}
                onSelectionChange={(value) =>
                    handleAccessoryToggle('Lyskugle', value, 'Lyskugle', 'lys', 'lyskugle camera')
                }
                accessoryOptions={accessoryOptions}
            />
            <AccessorySelector
                label="Luksus champagneglas"
                currentSelection={champagneGlassSelection}
                onSelectionChange={(value) =>
                    handleAccessoryToggle('Luksus champagneglas', value, 'LuksusChampagneglas', 'champ', 'luksuschampagneglas camera')
                }
                accessoryOptions={accessoryOptions}
            />
            <AccessorySelector
                label="Fløjte"
                currentSelection={whistleSelection}
                onSelectionChange={(value) =>
                    handleAccessoryToggle('Fløjte', value, 'Fløjte', 'floj', 'fløjte camera')
                }
                accessoryOptions={accessoryOptions}
            />
            <AccessorySelector
                label="Trompet"
                currentSelection={trumpetSelection}
                onSelectionChange={(value) =>
                    handleAccessoryToggle('Trompet', value, 'Trompet', 'tromp', 'trompet camera')
                }
                accessoryOptions={accessoryOptions}
            />
            <AccessorySelector
                label="Bucketpins"
                currentSelection={bucketpinsSelection}
                onSelectionChange={(value) => {
                    updateTilbehor({ Bucketpins: value });
                    sendMessageToIframes(`Accessories Bucketpins:${value.toLowerCase()}`);
                    sendMessageToIframes('bucketpins camera');
                }}
                accessoryOptions={accessoryOptions}
            />
        </>
    );
};

export default Accessories;
