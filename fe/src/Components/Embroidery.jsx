import React, { useState, useEffect, useRef } from 'react';
import noneImg from '../assets/cover images/none.webp';
import {
    generateAllEmbroideryMaps,
    preloadAlphabetMaps,
    sanitizeEmbroideryLetters,
    sendEmbroideryMapsToIframes,
} from '../utils/embroideryAlphabet';

const Embroidery = ({ selectedOptions = {}, onOptionChange, program, pakke }) => {
    // Default value functions
    const cameraTriggers = useRef({});
    const nameTimeoutRef = useRef(null);
    const schoolTimeoutRef = useRef(null);
    const getDefaultNameEmbroideryColor = () => {
        switch (program?.toLowerCase()) {
            case 'hhx': return 'HHX';
            case 'htx': return 'HTX';
            case 'stx': return 'STX';
            case 'hf': return 'HF';
            case 'eux': return 'EUX';
            case 'eud': return 'EUD';
            default: return 'Guld';
        }
    };

    const getDefaultSchoolEmbroideryColor = () => {
        return 'Hvid';
    };

    // State
    const [selectedNameEmbroideryColor, setSelectedNameEmbroideryColor] = useState(
        selectedOptions['Broderifarve'] || getDefaultNameEmbroideryColor()
    );
    const [nameEmbroideryText, setNameEmbroideryText] = useState(
        selectedOptions['Navne broderi'] || ''
    );
    const [selectedSchoolEmbroideryColor, setSelectedSchoolEmbroideryColor] = useState(
        selectedOptions['Skolebroderi farve'] || getDefaultSchoolEmbroideryColor()
    );
    const [schoolEmbroideryText, setSchoolEmbroideryText] = useState(
        selectedOptions.Skolebroderi || ''
    );
    const [ingenButton, setIngenButton] = useState(
        selectedOptions.Ingen || false
    );
    const [topEmbroiderySelection, setTopEmbroiderySelection] = useState(
        selectedOptions['Top broderi'] || 'Ingen'
    );

    useEffect(() => {
        preloadAlphabetMaps();
    }, []);

    // --- COLOR MAPPING ---
    const getNameColorHex = () => {
        const map = {
            'HHX': '#0f378a',
            'HTX': '#000080',
            'STX': '#7F1D1D',
            'HF': '#5585b7',
            'EUX': '#7c7f82',
            'EUD': '#522854',
            'Guld': '#ba9200',
            'Sølv': '#757575',
            'Hvid': '#ffffff',
            'Sort': '#000000'
        };
        return map[selectedNameEmbroideryColor] || '#000000';
    };

    const getSchoolColorHex = () => {
        const map = {
            'Hvid': '#ffffff',
            'Guld': '#ba9200',
            'Sølv': '#757575'
        };
        return map[selectedSchoolEmbroideryColor] || '#ffffff';
    };




    // --- Handlers ---
    const handleNameTextChange = (text) => {
        const clean = sanitizeEmbroideryLetters(text, 26);

        setNameEmbroideryText(clean);
        onOptionChange('Navne broderi', clean);

        clearTimeout(nameTimeoutRef.current);

        nameTimeoutRef.current = setTimeout(async () => {
            const result = await generateAllEmbroideryMaps(clean);

            sendEmbroideryMapsToIframes(
                'backTop',
                result
            );
        }, 300);
    };

    const handleSchoolTextChange = (text) => {
        const clean = sanitizeEmbroideryLetters(text, 35);

        setSchoolEmbroideryText(clean);
        onOptionChange('Skolebroderi', clean);

        clearTimeout(schoolTimeoutRef.current);

        schoolTimeoutRef.current = setTimeout(async () => {
            const result = await generateAllEmbroideryMaps(clean);

            sendEmbroideryMapsToIframes(
                'backBottom',
                result
            );
        }, 300);
    };

    // Re-render on color change
    useEffect(() => {
        if (!nameEmbroideryText) return;

        generateAllEmbroideryMaps(nameEmbroideryText)
            .then((result) => {
                sendEmbroideryMapsToIframes(
                    'backTop',
                    result
                );
            });

    }, [selectedNameEmbroideryColor]);

    useEffect(() => {

        if (ingenButton) {
            sendEmbroideryMapsToIframes('backBottom', {
                text: '',
                basecolor: null,
                normal: null,
                roughness: null,
                height: null,
                ambient: null,
                opacity: null
            });

            return;
        }

        if (!schoolEmbroideryText) return;

        generateAllEmbroideryMaps(schoolEmbroideryText)
            .then((result) => {
                sendEmbroideryMapsToIframes(
                    'backBottom',
                    result
                );
            });

    }, [
        selectedSchoolEmbroideryColor,
        ingenButton
    ]);

    // "Ingen" button handling
    useEffect(() => {
        onOptionChange('Ingen', ingenButton);
        if (ingenButton) {
            setSchoolEmbroideryText('');
            sendEmbroideryMapsToIframes('backBottom', {
                text: '',
                basecolor: null,
                normal: null,
                roughness: null,
                height: null,
                ambient: null,
                opacity: null
            });
        }
    }, [ingenButton]);

    // Initial load effect
    useEffect(() => {

        if (nameEmbroideryText) {
            generateAllEmbroideryMaps(nameEmbroideryText)
                .then((result) => {
                    sendEmbroideryMapsToIframes(
                        'backTop',
                        result
                    );
                });
        }

        if (!ingenButton && schoolEmbroideryText) {
            generateAllEmbroideryMaps(schoolEmbroideryText)
                .then((result) => {
                    sendEmbroideryMapsToIframes(
                        'backBottom',
                        result
                    );
                });
        }

    }, []);

    // --- Rest of the original postMessage effects (unchanged) ---
    useEffect(() => {
        onOptionChange('Top broderi', topEmbroiderySelection);
        const msg = `topEmbroidery:${topEmbroiderySelection}`;
        ['preview-iframe', 'preview-iframe2'].forEach(id => {
            const iframe = document.getElementById(id);
            if (iframe?.contentWindow) {
                iframe.contentWindow.postMessage(msg, "*");
                if (cameraTriggers.current["top"]) {
                    iframe.contentWindow.postMessage("top camera", "*");
                }
            }
        });
        cameraTriggers.current["top"] = true;
    }, [topEmbroiderySelection]);

    useEffect(() => { onOptionChange('Broderifarve', selectedNameEmbroideryColor); }, [selectedNameEmbroideryColor]);
    useEffect(() => { onOptionChange('Skolebroderi farve', selectedSchoolEmbroideryColor); }, [selectedSchoolEmbroideryColor]);

    useEffect(() => {
        const colorMap = {
            'hhx': 'broderiNamefarve:HHX',
            'htx': 'broderiNamefarve:HTX', 'stx': 'broderiNamefarve:STX',
            'hf': 'broderiNamefarve:HF', 'eux': 'broderiNamefarve:EUX', 'eud': 'broderiNamefarve:EUD',
            'hvid': 'broderiNamefarve:Hvid', 'sort': 'broderiNamefarve:Sort',
            'guld': 'broderiNamefarve:Guld', 'sølv': 'broderiNamefarve:Sølv'
        };
        const msg = colorMap[selectedNameEmbroideryColor.toLowerCase()];
        if (msg) {
            ['preview-iframe', 'preview-iframe2'].forEach(id => {
                const iframe = document.getElementById(id);
                if (iframe?.contentWindow) {
                    iframe.contentWindow.postMessage(msg, "*");
                    if (cameraTriggers.current["name_color"]) {
                        iframe.contentWindow.postMessage("name camera", "*");
                    }
                }
            });
        }
        cameraTriggers.current["name_color"] = true;
    }, [selectedNameEmbroideryColor]);

    useEffect(() => {
        const msg = `nameEmbroidery:${nameEmbroideryText}`;
        ['preview-iframe', 'preview-iframe2'].forEach(id => {
            const iframe = document.getElementById(id);
            if (iframe?.contentWindow) {
                iframe.contentWindow.postMessage(msg, "*");
                if (cameraTriggers.current["name_text"]) {
                    iframe.contentWindow.postMessage("name camera", "*");
                }
            }
        });
        cameraTriggers.current["name_text"] = true;
    }, [nameEmbroideryText]);

    useEffect(() => {
        const colorMap = { 'hvid': 'schoolBroderiNamefarve:Hvid', 'guld': 'schoolBroderiNamefarve:Guld', 'sølv': 'schoolBroderiNamefarve:Sølv' };
        const msg = colorMap[selectedSchoolEmbroideryColor.toLowerCase()];
        if (msg) {
            ['preview-iframe', 'preview-iframe2'].forEach(id => {
                const iframe = document.getElementById(id);
                if (iframe?.contentWindow) {
                    iframe.contentWindow.postMessage(msg, "*");
                    if (cameraTriggers.current["school_color"]) {
                        iframe.contentWindow.postMessage("school camera", "*");
                    }
                }
            });
        }
        cameraTriggers.current["school_color"] = true;
    }, [selectedSchoolEmbroideryColor]);

    useEffect(() => {
        const msg = `schoolEmbroidery:${schoolEmbroideryText}`;
        ['preview-iframe', 'preview-iframe2'].forEach(id => {
            const iframe = document.getElementById(id);
            if (iframe?.contentWindow) {
                iframe.contentWindow.postMessage(msg, "*");
                if (cameraTriggers.current["school_text"]) {
                    iframe.contentWindow.postMessage("school camera", "*");
                }
            }
        });
        cameraTriggers.current["school_text"] = true;
    }, [schoolEmbroideryText]);

    // --- Color options ---
    const getEmbroideryColor = () => {
        switch (program?.toLowerCase()) {
            case 'hhx': return { name: 'HHX', value: '#0f378a' };
            case 'htx': return { name: 'HTX', value: '#000080' };
            case 'stx': return { name: 'STX', value: '#7F1D1D' };
            case 'hf': return { name: 'HF', value: '#5585b7' };
            case 'eux': return { name: 'EUX', value: '#7c7f82' };
            case 'eud': return { name: 'EUD', value: '#522854' };
            default: return null;
        }
    };

    const nameEmbroideryColorOptions = [
        { name: 'Guld', value: '#ba9200' },
        { name: 'Sølv', value: '#757575' },
        getEmbroideryColor(),
        { name: 'Hvid', value: '#E5E7EB' },
        { name: 'Sort', value: '#000000' },
    ].filter(Boolean);

    const schoolEmbroideryColorOptions = [
        { name: 'Hvid', value: '#E5E7EB' },
        { name: 'Guld', value: '#ba9200' },
        { name: 'Sølv', value: '#757575' },
    ];

    // Reusable ColorSelector
    const ColorSelector = ({ label, currentSelection, onSelectionChange, colorOptions }) => (
        <div className="space-y-4 mt-6">
            <div className="flex items-center justify-between">
                <div>
                    <label className="text-sm font-semibold text-slate-700">{label}</label>
                </div>
            </div>
            <div className="flex space-x-3">
                {colorOptions.map((colorOption) => (
                    <button
                        key={colorOption.value}
                        onClick={() => onSelectionChange(colorOption.name)}
                        className={`w-12 h-12 rounded-xl border-2 transition-all duration-200 hover:scale-110 ${currentSelection === colorOption.name
                            ? 'border-slate-800 ring-2 ring-slate-800 ring-offset-2'
                            : 'border-slate-200 hover:border-slate-400'
                            }`}
                        style={{ backgroundColor: colorOption.value }}
                        title={colorOption.name}
                    />
                ))}
            </div>
            <p className="text-sm mt-2 text-slate-700">Valgt: {currentSelection}</p>
        </div>
    );

    return (
        <>
            <div className="mt-6">
                <h3 className="text-2xl font-bold text-slate-900">BRODERI</h3>
            </div>

            {/* Top Embroidery */}
            <div className="space-y-4 mt-6">
                <div>
                    <label className="text-sm font-semibold text-slate-700">Top broderi</label>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-100 to-yellow-200 text-amber-800">
                            + 149 DKK
                        </span>

                    </div>
                </div>
                <div className="flex space-x-3 mt-4">
                    {[
                        { value: 'Ingen', label: 'Ingen', img: noneImg },
                        { value: 'Top broderi 1', label: 'Top broderi 1', img: null },
                        { value: 'Top broderi 2', label: 'Top broderi 2', img: null },
                        { value: 'Top broderi 3', label: 'Top broderi 3', img: null },
                        { value: 'Top broderi 4', label: 'Top broderi 4', img: null },
                    ].map((option) => (
                        <button
                            key={option.value}
                            onClick={() => setTopEmbroiderySelection(option.value)}
                            className={`w-14 h-14 rounded-xl border-2 transition-all duration-200 hover:scale-110 flex items-center justify-center bg-white ${topEmbroiderySelection === option.value
                                ? 'border-slate-800 ring-2 ring-slate-800 ring-offset-2'
                                : 'border-slate-200 hover:border-slate-400'
                                }`}
                            title={option.label}
                        >
                            {option.img ? (
                                <img src={option.img} alt={option.label} className="w-full h-full object-contain p-2" />
                            ) : (
                                <span className="text-[10px] text-slate-400 font-medium text-center">Img</span>
                            )}
                        </button>
                    ))}
                </div>
                <p className="text-sm mt-3 text-slate-700 font-medium">Valgt: {topEmbroiderySelection}</p>
            </div>

            {/* Name Embroidery */}
            <div className="bg-white/70 border border-white/50 rounded-2xl mt-6">
                <div className="flex items-center justify-between mb-4 mt-6">
                    <div>
                        <h4 className="font-semibold text-slate-800">Navne broderi</h4>
                        {pakke?.toLowerCase() === 'luksus' || pakke?.toLowerCase() === 'premium' ? (
                            <div className="flex items-center gap-2 mt-1">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-100 to-yellow-200 text-amber-800">
                                    Inkluderet i pakken
                                </span>
                            </div>
                        ) : null}
                        <span className="inline-flex items-center px-3 pt-2 rounded-full text-xs font-bold">
                            Maks. 26 Tegn
                        </span>
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="relative">
                        <input
                            type="text"
                            value={nameEmbroideryText}
                            onChange={(e) => handleNameTextChange(e.target.value)}
                            placeholder="Fri tekst"
                            maxLength={26}
                            className="w-full px-4 py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 bg-white/80 backdrop-blur-sm text-slate-700 placeholder-slate-400"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </div>

            <ColorSelector
                label="Broderifarve"
                currentSelection={selectedNameEmbroideryColor}
                onSelectionChange={setSelectedNameEmbroideryColor}
                colorOptions={nameEmbroideryColorOptions}
            />

            {/* School Embroidery */}
            <div className="bg-white/70 border border-white/50 rounded-2xl mt-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h4 className="font-semibold text-slate-800">Skolebroderi</h4>
                        {pakke?.toLowerCase() === 'luksus' || pakke?.toLowerCase() === 'premium' ? (
                            <div className="flex items-center gap-2 mt-1">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-100 to-yellow-200 text-amber-800">
                                    Inkluderet i pakken
                                </span>
                            </div>
                        ) : null}
                        <span className="inline-flex items-center px-3 pt-2 rounded-full text-xs font-bold">
                            Maks. 35 Tegn
                        </span>
                    </div>
                </div>
                <div className="flex space-x-3 flex-wrap">
                    <button
                        onClick={() => setIngenButton(!ingenButton)}
                        className={`px-6 py-3 rounded-xl my-3 text-sm font-medium transition-all duration-200 ${ingenButton
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:shadow-sm'
                            }`}
                    >
                        Ingen
                    </button>
                </div>
                <div className="space-y-4">
                    <div className="relative">
                        <input
                            type="text"
                            value={ingenButton ? '' : schoolEmbroideryText}
                            onChange={(e) => handleSchoolTextChange(e.target.value)}
                            placeholder="Fri tekst"
                            maxLength={35}
                            disabled={ingenButton}
                            className={`w-full px-4 py-4 rounded-2xl border-2 
                                ${ingenButton ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white/80 backdrop-blur-sm text-slate-700'} 
                                focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 placeholder-slate-400`}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </div>

            <ColorSelector
                label="Skolebroderi farve"
                currentSelection={selectedSchoolEmbroideryColor}
                onSelectionChange={setSelectedSchoolEmbroideryColor}
                colorOptions={schoolEmbroideryColorOptions}
            />
        </>
    );
};

export default Embroidery;