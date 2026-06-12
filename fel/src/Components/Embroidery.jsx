import React, { useState, useEffect, useRef } from 'react';
import noneImg from '../assets/cover images/none.webp';

const Embroidery = ({ selectedOptions = {}, onOptionChange, program, pakke }) => {
    // Default value functions
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

    // Canvas refs
    const nameCanvasRef = useRef(document.createElement('canvas'));
    const schoolCanvasRef = useRef(document.createElement('canvas'));

    // --- COLOR MAPPING ---
    const getNameColorHex = () => {
        const map = {
            'HHX': '#4169e1',
            'HTX': '#000080',
            'STX': '#7F1D1D',
            'HF': '#ADD8E6',
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

    // --- Render text to canvas and send Base64 (including empty case) ---
    const renderTextToCanvas = (text, colorHex, canvasRef, messagePrefix) => {
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
        const fontFamily = "lucidaCalligraphyItalic"; // 🔥 your downloaded font

        // STEP 1 — temporarily set font to measure width
        ctx.font = `italic ${fontSize}px ${fontFamily}`;

        // STEP 2 — dynamic width according to text
        canvas.width = 5200;
        canvas.height = 512; // fixed height

        // STEP 3 — canvas resize resets context → apply font again!
        ctx.font = `italic ${fontSize}px ${fontFamily}`;
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
        const message = messagePrefix + base64Image;

        ["preview-iframe", "preview-iframe2"].forEach((id) => {
            const iframe = document.getElementById(id);
            if (iframe?.contentWindow) {
                iframe.contentWindow.postMessage(message, "*");
            }
        });
    };


    // --- Handlers ---
    const handleNameTextChange = (text) => {
        setNameEmbroideryText(text);
        onOptionChange('Navne broderi', text);
        renderTextToCanvas(text, getNameColorHex(), nameCanvasRef, 'NameBroderiImage');
    };

    const handleSchoolTextChange = (text) => {
        setSchoolEmbroideryText(text);
        onOptionChange('Skolebroderi', text);
        renderTextToCanvas(text, getSchoolColorHex(), schoolCanvasRef, 'SchoolBroderiImage');
    };

    // Re-render on color change
    useEffect(() => {
        renderTextToCanvas(nameEmbroideryText, getNameColorHex(), nameCanvasRef, 'NameBroderiImage');
    }, [selectedNameEmbroideryColor]);

    useEffect(() => {
        if (ingenButton) {
            renderTextToCanvas('', getSchoolColorHex(), schoolCanvasRef, 'SchoolBroderiImage');
        } else {
            renderTextToCanvas(schoolEmbroideryText, getSchoolColorHex(), schoolCanvasRef, 'SchoolBroderiImage');
        }
    }, [selectedSchoolEmbroideryColor, ingenButton]);

    // Initial render on mount
    useEffect(() => {
        renderTextToCanvas(nameEmbroideryText, getNameColorHex(), nameCanvasRef, 'NameBroderiImage');
        renderTextToCanvas(ingenButton ? '' : schoolEmbroideryText, getSchoolColorHex(), schoolCanvasRef, 'SchoolBroderiImage');
    }, []);

    // "Ingen" button handling
    useEffect(() => {
        onOptionChange('Ingen', ingenButton);
        if (ingenButton) {
            setSchoolEmbroideryText('');
            renderTextToCanvas('', getSchoolColorHex(), schoolCanvasRef, 'SchoolBroderiImage');
        }
    }, [ingenButton]);

    // --- Rest of the original postMessage effects (unchanged) ---
    useEffect(() => {
        onOptionChange('Top broderi', topEmbroiderySelection);
        const msg = `topEmbroidery:${topEmbroiderySelection}`;
        ['preview-iframe', 'preview-iframe2'].forEach(id => {
            const iframe = document.getElementById(id);
            if (iframe?.contentWindow) {
                iframe.contentWindow.postMessage(msg, "*");
                iframe.contentWindow.postMessage("top camera", "*");
            }
        });
    }, [topEmbroiderySelection]);

    useEffect(() => { onOptionChange('Broderifarve', selectedNameEmbroideryColor); }, [selectedNameEmbroideryColor]);
    useEffect(() => { onOptionChange('Skolebroderi farve', selectedSchoolEmbroideryColor); }, [selectedSchoolEmbroideryColor]);

    useEffect(() => {
        const colorMap = {
            'hhx': 'broderiNamefarve:HHX', 'htx': 'broderiNamefarve:HTX', 'stx': 'broderiNamefarve:STX',
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
                    iframe.contentWindow.postMessage("name camera", "*");
                }
            });
        }
    }, [selectedNameEmbroideryColor]);

    useEffect(() => {
        const msg = `nameEmbroidery:${nameEmbroideryText}`;
        ['preview-iframe', 'preview-iframe2'].forEach(id => {
            const iframe = document.getElementById(id);
            if (iframe?.contentWindow) {
                iframe.contentWindow.postMessage(msg, "*");
                iframe.contentWindow.postMessage("name camera", "*");
            }
        });
    }, [nameEmbroideryText]);

    useEffect(() => {
        const colorMap = { 'hvid': 'schoolBroderiNamefarve:Hvid', 'guld': 'schoolBroderiNamefarve:Guld', 'sølv': 'schoolBroderiNamefarve:Sølv' };
        const msg = colorMap[selectedSchoolEmbroideryColor.toLowerCase()];
        if (msg) {
            ['preview-iframe', 'preview-iframe2'].forEach(id => {
                const iframe = document.getElementById(id);
                if (iframe?.contentWindow) {
                    iframe.contentWindow.postMessage(msg, "*");
                    iframe.contentWindow.postMessage("school camera", "*");
                }
            });
        }
    }, [selectedSchoolEmbroideryColor]);

    useEffect(() => {
        const msg = `schoolEmbroidery:${schoolEmbroideryText}`;
        ['preview-iframe', 'preview-iframe2'].forEach(id => {
            const iframe = document.getElementById(id);
            if (iframe?.contentWindow) {
                iframe.contentWindow.postMessage(msg, "*");
                iframe.contentWindow.postMessage("school camera", "*");
            }
        });
    }, [schoolEmbroideryText]);

    // --- Color options ---
    const getEmbroideryColor = () => {
        switch (program?.toLowerCase()) {
            case 'hhx': return { name: 'HHX', value: '#4169e1' };
            case 'htx': return { name: 'HTX', value: '#000080' };
            case 'stx': return { name: 'STX', value: '#7F1D1D' };
            case 'hf': return { name: 'HF', value: '#ADD8E6' };
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
            {/* <div className="space-y-4 mt-6">
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
            </div> */}

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