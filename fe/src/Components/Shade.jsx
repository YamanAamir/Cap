import React, { useState, useEffect, useRef } from 'react';
import img1 from '../assets/shadeimages/glimmer.webp';
import img2 from '../assets/shadeimages/none.webp';
import img3 from '../assets/shadeimages/shade.webp';

const Shade = ({ selectedOptions = {}, onOptionChange }) => {
    const getDefaultShadeType = () => 'Mat';
    const getDefaultMaterialType = () => 'Uden kant';
    const getDefaultShadowTapeColor = () => 'INGEN';
    const cameraTriggers = useRef({});

    const [selectedShadeType, setSelectedShadeType] = useState(selectedOptions.Type || getDefaultShadeType());
    const [selectedMaterialType, setSelectedMaterialType] = useState(selectedOptions.Materiale || getDefaultMaterialType());
    const [selectedShadowTapeColor, setSelectedShadowTapeColor] = useState(selectedOptions.Skyggebånd || getDefaultShadowTapeColor());
    const [engravingLine1, setEngravingLine1] = useState(selectedOptions['Skyggegravering Line 1'] || '');
    const [engravingLine2, setEngravingLine2] = useState(selectedOptions['Skyggegravering Line 2'] || '');
    const [engravingLine3, setEngravingLine3] = useState(selectedOptions['Skyggegravering Line 3'] || '');

    const canvasLine1Ref = useRef(document.createElement('canvas'));
    const canvasLine2Ref = useRef(document.createElement('canvas'));
    const canvasLine3Ref = useRef(document.createElement('canvas'));

    // Updated: Now sends 1×1 transparent image when text is empty
    const renderLineToCanvas = (text, canvasRef, messagePrefix) => {
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
        const fontSize = 120;
        const fontFamily = "Arial";

        ctx.font = `${fontSize}px ${fontFamily}`;

        canvas.width = 2800;
        canvas.height = 512;

        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(-1, 1);

        // styling
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        ctx.fillText(text, 0, 0);


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

    const handleLine1Change = (text) => {
        setEngravingLine1(text);
        onOptionChange('Skyggegravering Line 1', text);
        renderLineToCanvas(text, canvasLine1Ref, 'EngravingLine1Image');
    };

    const handleLine2Change = (text) => {
        setEngravingLine2(text);
        onOptionChange('Skyggegravering Line 2', text);
        renderLineToCanvas(text, canvasLine2Ref, 'EngravingLine2Image');
    };

    const handleLine3Change = (text) => {
        setEngravingLine3(text);
        onOptionChange('Skyggegravering Line 3', text);
        renderLineToCanvas(text, canvasLine3Ref, 'EngravingLine3Image');
    };

    // Initial render
    useEffect(() => {
        renderLineToCanvas(engravingLine1, canvasLine1Ref, 'EngravingLine1Image');
        renderLineToCanvas(engravingLine2, canvasLine2Ref, 'EngravingLine2Image');
        renderLineToCanvas(engravingLine3, canvasLine3Ref, 'EngravingLine3Image');
    }, []);

    // Rest of your original effects (completely unchanged)
    useEffect(() => { onOptionChange('Type', selectedShadeType); }, [selectedShadeType]);
    useEffect(() => { onOptionChange('Materiale', selectedMaterialType); }, [selectedMaterialType]);
    useEffect(() => { onOptionChange('Skyggebånd', selectedShadowTapeColor); }, [selectedShadowTapeColor]);

    useEffect(() => {
        const colorMap = { 'mat': 'Skygge:Shiny', 'shiny': 'Skygge:Blank', 'glimmer': 'Skygge:Shimmer', 'shimmer': 'Skygge:Glimmer' };
        const message = colorMap[selectedShadeType.toLowerCase()];
        if (message) {
            ['preview-iframe', 'preview-iframe2'].forEach(id => {
                const iframe = document.getElementById(id);
                if (iframe?.contentWindow) {
                    iframe.contentWindow.postMessage(message, "*");
                    if (cameraTriggers.current["shade"]) {
                        iframe.contentWindow.postMessage("shade camera", "*");
                    }
                }
            });
            cameraTriggers.current["shade"] = true;
        }
    }, [selectedShadeType]);

    useEffect(() => {
        const colorMap = { 'uden kant': 'SkyggeMateriale:none', 'med kant': 'SkyggeMateriale:Med kant' };
        const message = colorMap[selectedMaterialType.toLowerCase()];

        const sendMessage = (msg) => {
            if (msg) {
                ['preview-iframe', 'preview-iframe2'].forEach(id => {
                    const iframe = document.getElementById(id);
                    if (iframe?.contentWindow) {
                        iframe.contentWindow.postMessage(msg, "*");
                        if (cameraTriggers.current["shade2"]) {
                            iframe.contentWindow.postMessage("shade camera", "*");
                        }
                    }
                });
                cameraTriggers.current["shade2"] = true;
            }
        };
        sendMessage(message);
    }, [selectedMaterialType, selectedShadeType]);

    useEffect(() => {
        const colorMap = { 'ingen': 'skyggeband:none', 'guld': 'skyggeband:guld', 'sølv': 'skyggeband:sølv' };
        const message = colorMap[selectedShadowTapeColor.toLowerCase()];
        if (message) {
            ['preview-iframe', 'preview-iframe2'].forEach(id => {
                const iframe = document.getElementById(id);
                if (iframe?.contentWindow) {
                    iframe.contentWindow.postMessage(message, "*");
                    if (cameraTriggers.current["skygge"]) {
                        iframe.contentWindow.postMessage("skyggeband camera", "*");
                    }
                }
            });
            cameraTriggers.current["skygge"] = true;
        }
    }, [selectedShadowTapeColor]);

    // Backward compatibility text messages
    useEffect(() => {
        ['preview-iframe', 'preview-iframe2'].forEach(id => {
            const iframe = document.getElementById(id);
            if (iframe?.contentWindow) {
                iframe.contentWindow.postMessage(`engravingLine1:${engravingLine1}`, "*");
                if (cameraTriggers.current["sky_grav1"]) {
                    iframe.contentWindow.postMessage("skyggegravering camera", "*");
                }
            }
        });
        cameraTriggers.current["sky_grav1"] = true;
    }, [engravingLine1]);

    useEffect(() => {
        ['preview-iframe', 'preview-iframe2'].forEach(id => {
            const iframe = document.getElementById(id);
            if (iframe?.contentWindow) {
                iframe.contentWindow.postMessage(`engravingLine2:${engravingLine2}`, "*");
                if (cameraTriggers.current["sky_grav2"]) {
                    iframe.contentWindow.postMessage("skyggegravering camera", "*");
                }
            }
        });
        cameraTriggers.current["sky_grav2"] = true;
    }, [engravingLine2]);

    useEffect(() => {
        ['preview-iframe', 'preview-iframe2'].forEach(id => {
            const iframe = document.getElementById(id);
            if (iframe?.contentWindow) {
                iframe.contentWindow.postMessage(`engravingLine3:${engravingLine3}`, "*");
                if (cameraTriggers.current["sky_grav3"]) {
                    iframe.contentWindow.postMessage("skyggegravering camera", "*");
                }
            }
        });
        cameraTriggers.current["sky_grav3"] = true;
    }, [engravingLine3]);

    const getMaterialOptions = () => {
        switch (selectedShadeType) {
            case 'Mat': return ['Uden kant', 'Med kant'];
            case 'Shiny': return ['Uden kant', 'Med kant'];
            case 'Glimmer': return ['Uden kant', 'Med kant'];
            case 'Shimmer': return ['Uden kant', 'Med kant'];
            default: return ['Uden kant', 'Med kant'];
        }
    };

    useEffect(() => {
        const materialOptions = getMaterialOptions();
        if (materialOptions.length > 0 && !materialOptions.includes(selectedMaterialType)) {
            setSelectedMaterialType(materialOptions[0]);
        }
    }, [selectedShadeType]);

    const shadeTypeOptions = [
        { name: 'Mat', value: 'Mat', color: '#2d2d2e' },
        { name: 'Shiny', value: 'Shiny', img: img3 },
        { name: 'Glimmer', value: 'Glimmer', color: '#5d5d5e' },
        { name: 'Shimmer', value: 'Shimmer', img: img1 },
    ];


    const shadowTapeColorOptions = [
        { name: 'INGEN', value: 'INGEN', img: img2 },
        { name: 'Guld', value: 'Guld', color: '#bb9300' },
        { name: 'Sølv', value: 'Sølv', color: '#C0C0C0' }
    ];

    const Selector = ({ label, currentSelection, onSelectionChange, options }) => (
        <div className="space-y-4 mt-6">
            <div className="flex items-center justify-between">
                <div><label className="text-sm font-semibold text-slate-700">{label}</label></div>
            </div>
            <div className="flex space-x-3">
                {options.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => onSelectionChange(option.value)}
                        className={`w-12 h-12 rounded-xl border-2 transition-all duration-200 hover:scale-110 flex items-center justify-center ${currentSelection === option.value
                            ? 'border-slate-800 ring-2 ring-slate-800 ring-offset-2'
                            : 'border-slate-200 hover:border-slate-400'
                            }`}
                        style={option.color ? { backgroundColor: option.color } : {}}
                        title={option.name}
                    >
                        {option.img && <img src={option.img} alt={option.name} className="w-8 h-8 object-contain" />}
                    </button>
                ))}
            </div>
            <p className="text-sm mt-2 text-slate-700">Valgt: {currentSelection}</p>
        </div>
    );

    const TypeSelector = ({ label, currentSelection, onSelectionChange, options }) => (
        <div className="space-y-4 mt-6">
            <div>
                <label className="text-sm font-semibold text-slate-700">{label}</label>
                <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {currentSelection}
                    </span>
                </div>
            </div>
            <div className="flex space-x-3">
                {options.map((type) => (
                    <button
                        key={type}
                        onClick={() => onSelectionChange(type)}
                        className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${currentSelection === type
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:shadow-sm'
                            }`}
                    >
                        {type}
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <>
            <div className="space-y-2 mt-8">
                <h3 className="text-2xl font-bold text-slate-900">SKYGGE</h3>
            </div>

            <Selector label="Type" currentSelection={selectedShadeType} onSelectionChange={setSelectedShadeType} options={shadeTypeOptions} />

            {selectedShadeType !== 'Glimmer' && selectedShadeType !== 'Shimmer' && (
                <TypeSelector label="Materiale" currentSelection={selectedMaterialType} onSelectionChange={setSelectedMaterialType} options={getMaterialOptions()} />
            )}

            <Selector label="Skyggebånd" currentSelection={selectedShadowTapeColor} onSelectionChange={setSelectedShadowTapeColor} options={shadowTapeColorOptions} />

            <div className="bg-white/70 border border-white/50 rounded-2xl mt-6">
                <div className="flex items-center justify-between mb-4">
                    <div><h4 className="font-semibold text-slate-800">Skyggegravering</h4></div>
                </div>
                <div className="space-y-4">
                    <div className="relative">
                        <span className="inline-flex items-center px-3 pt-2 rounded-full text-xs font-bold">Maks. 30 Tegn</span>
                        <input type="text" value={engravingLine1} onChange={(e) => handleLine1Change(e.target.value)} placeholder="Linje 1" maxLength={30}
                            className="w-full my-4 px-4 py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 bg-white/80 backdrop-blur-sm text-slate-700 placeholder-slate-400" />

                        <span className="inline-flex items-center px-3 pt-2 rounded-full text-xs font-bold">Maks. 30 Tegn</span>
                        <input type="text" value={engravingLine2} onChange={(e) => handleLine2Change(e.target.value)} placeholder="Linje 2" maxLength={30}
                            className="w-full px-4 my-4 py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 bg-white/80 backdrop-blur-sm text-slate-700 placeholder-slate-400" />

                        <span className="inline-flex items-center px-3 pt-2 rounded-full text-xs font-bold">Maks. 30 Tegn</span>
                        <input type="text" value={engravingLine3} onChange={(e) => handleLine3Change(e.target.value)} placeholder="Linje 3" maxLength={30}
                            className="w-full px-4 my-4 py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 bg-white/80 backdrop-blur-sm text-slate-700 placeholder-slate-400" />
                    </div>
                </div>
            </div>
        </>
    );
};

export default Shade;