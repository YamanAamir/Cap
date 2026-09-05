import React, { useState, useEffect, useRef } from 'react';
import { sendToActiveIframe } from '../utils/iframeMessenger';
import img1 from '../assets/shadeimages/glimmer.webp';
import img2 from '../assets/shadeimages/none.webp';
import img3 from '../assets/shadeimages/shade.webp';

const Shade = ({ selectedOptions = {}, onOptionChange, program, visibilityConfig = {}, pakke }) => {
    const isVisible = (key) => visibilityConfig?.['SKYGGE_' + key] !== false;
    const getDefaultShadeType = () => pakke === 'basichue' ? 'Shiny' : 'Mat';
    const getDefaultMaterialType = () => 'Uden kant';
    const getDefaultShadowTapeColor = () => 'INGEN';
    const cameraTriggers = useRef({});

    const [selectedShadeType, setSelectedShadeType] = useState(
        pakke === 'basichue' ? 'Shiny' : (selectedOptions.Type || getDefaultShadeType())
    );
    const [selectedMaterialType, setSelectedMaterialType] = useState(selectedOptions.Materiale || getDefaultMaterialType());
    const [selectedShadowTapeColor, setSelectedShadowTapeColor] = useState(selectedOptions.Skyggebånd || getDefaultShadowTapeColor());
    const [engravingLine1, setEngravingLine1] = useState(selectedOptions['Skyggegravering Line 1'] || '');
    const [inputLine1, setInputLine1] = useState(selectedOptions['Skyggegravering Line 1'] || '');

    const [engravingLine2, setEngravingLine2] = useState(selectedOptions['Skyggegravering Line 2'] || '');
    const [inputLine2, setInputLine2] = useState(selectedOptions['Skyggegravering Line 2'] || '');

    const [engravingLine3, setEngravingLine3] = useState(selectedOptions['Skyggegravering Line 3'] || '');
    const [inputLine3, setInputLine3] = useState(selectedOptions['Skyggegravering Line 3'] || '');

    useEffect(() => { setInputLine1(selectedOptions['Skyggegravering Line 1'] || ''); }, [selectedOptions['Skyggegravering Line 1']]);
    useEffect(() => { setInputLine2(selectedOptions['Skyggegravering Line 2'] || ''); }, [selectedOptions['Skyggegravering Line 2']]);
    useEffect(() => { setInputLine3(selectedOptions['Skyggegravering Line 3'] || ''); }, [selectedOptions['Skyggegravering Line 3']]);

    useEffect(() => {
        const allowed = (pakke === 'basichue') ? ['Shiny', 'Blank'] : null;
        if (allowed && !allowed.includes(selectedShadeType)) {
            setSelectedShadeType('Shiny');
        }
    }, [selectedShadeType, pakke]);

    const canvasLine1Ref = useRef(document.createElement('canvas'));
    const canvasLine2Ref = useRef(document.createElement('canvas'));
    const canvasLine3Ref = useRef(document.createElement('canvas'));

    const lastAppliedLine1Ref = useRef(selectedOptions['Skyggegravering Line 1'] || '');
    const lastAppliedLine2Ref = useRef(selectedOptions['Skyggegravering Line 2'] || '');
    const lastAppliedLine3Ref = useRef(selectedOptions['Skyggegravering Line 3'] || '');

    // Updated: Now sends 1×1 transparent image when text is empty and frees memory immediately
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
            sendToActiveIframe(message);
            return;
        }

        const isMobile = typeof window !== 'undefined' && (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768);
        const w = isMobile ? 1400 : 2800;
        const h = isMobile ? 256 : 512;
        const fontSize = isMobile ? 60 : 120;
        const fontFamily = "Arial";

        canvas.width = w;
        canvas.height = h;

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

        // STEP 5 — export & immediately free canvas buffer
        const base64Image = canvas.toDataURL("image/png");
        canvas.width = 1;
        canvas.height = 1;

        const message = messagePrefix + base64Image;
        sendToActiveIframe(message);
    };

    const handleApplyLine1 = () => {
        const clean = inputLine1.trim();
        if (!clean) return;
        if (clean === lastAppliedLine1Ref.current) return;

        lastAppliedLine1Ref.current = clean;
        setEngravingLine1(inputLine1);
        onOptionChange('Skyggegravering Line 1', inputLine1);
        renderLineToCanvas(inputLine1, canvasLine1Ref, 'EngravingLine1Image');
        sendToActiveIframe(`engravingLine1:${inputLine1}`);
        sendToActiveIframe("skyggegravering camera");
    };

    const handleClearLine1 = () => {
        if (!lastAppliedLine1Ref.current && !inputLine1) return;
        setInputLine1('');
        setEngravingLine1('');
        onOptionChange('Skyggegravering Line 1', '');
        if (lastAppliedLine1Ref.current) {
            lastAppliedLine1Ref.current = '';
            renderLineToCanvas('', canvasLine1Ref, 'EngravingLine1Image');
            sendToActiveIframe('engravingLine1:');
        }
    };

    const handleApplyLine2 = () => {
        const clean = inputLine2.trim();
        if (!clean) return;
        if (clean === lastAppliedLine2Ref.current) return;

        lastAppliedLine2Ref.current = clean;
        setEngravingLine2(inputLine2);
        onOptionChange('Skyggegravering Line 2', inputLine2);
        renderLineToCanvas(inputLine2, canvasLine2Ref, 'EngravingLine2Image');
        sendToActiveIframe(`engravingLine2:${inputLine2}`);
        sendToActiveIframe("skyggegravering camera");
    };

    const handleClearLine2 = () => {
        if (!lastAppliedLine2Ref.current && !inputLine2) return;
        setInputLine2('');
        setEngravingLine2('');
        onOptionChange('Skyggegravering Line 2', '');
        if (lastAppliedLine2Ref.current) {
            lastAppliedLine2Ref.current = '';
            renderLineToCanvas('', canvasLine2Ref, 'EngravingLine2Image');
            sendToActiveIframe('engravingLine2:');
        }
    };

    const handleApplyLine3 = () => {
        const clean = inputLine3.trim();
        if (!clean) return;
        if (clean === lastAppliedLine3Ref.current) return;

        lastAppliedLine3Ref.current = clean;
        setEngravingLine3(inputLine3);
        onOptionChange('Skyggegravering Line 3', inputLine3);
        renderLineToCanvas(inputLine3, canvasLine3Ref, 'EngravingLine3Image');
        sendToActiveIframe(`engravingLine3:${inputLine3}`);
        sendToActiveIframe("skyggegravering camera");
    };

    const handleClearLine3 = () => {
        if (!lastAppliedLine3Ref.current && !inputLine3) return;
        setInputLine2('');
        setEngravingLine3('');
        onOptionChange('Skyggegravering Line 3', '');
        if (lastAppliedLine3Ref.current) {
            lastAppliedLine3Ref.current = '';
            renderLineToCanvas('', canvasLine3Ref, 'EngravingLine3Image');
            sendToActiveIframe('engravingLine3:');
        }
    };

    const handleKeyPressLine1 = (e) => {
        if (e.key === 'Enter') {
            handleApplyLine1();
        }
    };

    const handleKeyPressLine2 = (e) => {
        if (e.key === 'Enter') {
            handleApplyLine2();
        }
    };

    const handleKeyPressLine3 = (e) => {
        if (e.key === 'Enter') {
            handleApplyLine3();
        }
    };

    // Initial render - only if text is non-empty
    useEffect(() => {
        if (engravingLine1 && engravingLine1.trim()) {
            lastAppliedLine1Ref.current = engravingLine1.trim();
            renderLineToCanvas(engravingLine1, canvasLine1Ref, 'EngravingLine1Image');
            sendToActiveIframe(`engravingLine1:${engravingLine1}`);
        }
        if (engravingLine2 && engravingLine2.trim()) {
            lastAppliedLine2Ref.current = engravingLine2.trim();
            renderLineToCanvas(engravingLine2, canvasLine2Ref, 'EngravingLine2Image');
            sendToActiveIframe(`engravingLine2:${engravingLine2}`);
        }
        if (engravingLine3 && engravingLine3.trim()) {
            lastAppliedLine3Ref.current = engravingLine3.trim();
            renderLineToCanvas(engravingLine3, canvasLine3Ref, 'EngravingLine3Image');
            sendToActiveIframe(`engravingLine3:${engravingLine3}`);
        }
    }, []);

    // Rest of your original effects (completely unchanged)
    useEffect(() => { onOptionChange('Type', selectedShadeType); }, [selectedShadeType]);
    useEffect(() => { onOptionChange('Materiale', selectedMaterialType); }, [selectedMaterialType]);
    useEffect(() => { onOptionChange('Skyggebånd', selectedShadowTapeColor); }, [selectedShadowTapeColor]);

    useEffect(() => {
        const colorMap = {
            'mat': 'Skygge:Shiny',
            'shiny': 'Skygge:Blank',
            'glimmer': 'Skygge:Shimmer',
            'shimmer': 'Skygge:Glimmer'
        };

        const message = colorMap[selectedShadeType.toLowerCase()];

        if (message) {

            // NEW: shimmer/glimmer pe material auto none
            if (
                selectedShadeType.toLowerCase() === 'glimmer' ||
                selectedShadeType.toLowerCase() === 'shimmer'
            ) {
                setSelectedMaterialType('Uden kant');
            }

            // Existing shade message
            sendToActiveIframe(message);

            // NEW: send material none message
            if (
                selectedShadeType.toLowerCase() === 'glimmer' ||
                selectedShadeType.toLowerCase() === 'shimmer'
            ) {
                sendToActiveIframe('SkyggeMateriale:none');
            }

            if (cameraTriggers.current["shade"]) {
                sendToActiveIframe("shade camera");
            } else {
                cameraTriggers.current["shade"] = true;
            }
        }
    }, [selectedShadeType]);

    useEffect(() => {

        // ALWAYS NONE for Glimmer/Shimmer
        if (
            selectedShadeType === 'Glimmer' ||
            selectedShadeType === 'Shimmer'
        ) {
            sendToActiveIframe('SkyggeMateriale:none');
            return;
        }

        const colorMap = {
            'uden kant': 'SkyggeMateriale:none',
            'med kant': 'SkyggeMateriale:Med kant'
        };

        const message = colorMap[selectedMaterialType.toLowerCase()];

        if (message) {
            sendToActiveIframe(message);

            if (cameraTriggers.current["shade2"]) {
                sendToActiveIframe("shade camera");
            } else {
                cameraTriggers.current["shade2"] = true;
            }
        }

    }, [selectedMaterialType, selectedShadeType]);

    useEffect(() => {
        const colorMap = { 'ingen': 'skyggeband:none', 'guld': 'skyggeband:guld', 'sølv': 'skyggeband:sølv' };
        const message = colorMap[selectedShadowTapeColor.toLowerCase()];
        if (message) {
            sendToActiveIframe(message);
            if (cameraTriggers.current["skygge"]) {
                sendToActiveIframe("skyggeband camera");
            } else {
                cameraTriggers.current["skygge"] = true;
            }
        }
    }, [selectedShadowTapeColor]);

    const getMaterialOptions = () => {
        let options = [];
        switch (selectedShadeType) {
            case 'Mat': options = ['Uden kant', 'Med kant']; break;
            case 'Shiny': options = ['Uden kant', 'Med kant']; break;
            case 'Glimmer': options = ['Uden kant', 'Med kant']; break;
            case 'Shimmer': options = ['Uden kant', 'Med kant']; break;
            default: options = ['Uden kant', 'Med kant']; break;
        }
        return options.filter(opt => isVisible(`Materiale_${opt}`));
    };

    useEffect(() => {

        // FORCE none on Glimmer/Shimmer
        if (
            selectedShadeType === 'Glimmer' ||
            selectedShadeType === 'Shimmer'
        ) {
            setSelectedMaterialType('Uden kant');
            onOptionChange('Materiale', 'Uden kant');
            return;
        }

        const materialOptions = getMaterialOptions();

        if (
            materialOptions.length > 0 &&
            !materialOptions.includes(selectedMaterialType)
        ) {
            setSelectedMaterialType(materialOptions[0]);
        }

    }, [selectedShadeType]);

    let shadeTypeOptions = [
        { name: 'Mat', value: 'Mat', color: '#2d2d2e' },
        { name: 'Shiny', value: 'Shiny', img: img3 },
        { name: 'Glimmer', value: 'Glimmer', color: '#5d5d5e' },
        { name: 'Shimmer', value: 'Shimmer', img: img1 },
    ].filter(opt => isVisible(`Type_${opt.name}`));
    const isSTU = program?.toLowerCase() === 'stu';
    const isLandmand = program?.toLowerCase() === 'landmand';
    if (isSTU) {
        const allowedSTUShade = ['Mat', 'Shiny', 'Glimmer', 'Blank']; // Including 'Mat' and 'Blank' for safety
        shadeTypeOptions = shadeTypeOptions.filter(opt => allowedSTUShade.includes(opt.name));
    }
    
    if (pakke === 'basichue') {
        const allowedBudgetShade = ['Shiny', 'Blank'];
        shadeTypeOptions = shadeTypeOptions.filter(opt => allowedBudgetShade.includes(opt.name));
    }
    if (isLandmand) {
        const allowedShade = ['Mat', 'Shiny', 'Glimmer', 'Blank'];
        shadeTypeOptions = shadeTypeOptions.filter(opt => allowedShade.includes(opt.name));
    }


    const shadowTapeColorOptions = [
        { name: 'INGEN', value: 'INGEN', img: img2 },
        { name: 'Guld', value: 'Guld', color: '#bb9300' },
        { name: 'Sølv', value: 'Sølv', color: '#C0C0C0' }
    ].filter(opt => isVisible(`Skyggebånd_${opt.name}`));

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

            {pakke !== 'basichue' && (
                <>
                    {selectedShadeType !== 'Glimmer' && selectedShadeType !== 'Shimmer' && (
                        <TypeSelector label="Materiale" currentSelection={selectedMaterialType} onSelectionChange={setSelectedMaterialType} options={getMaterialOptions()} />
                    )}
                    <Selector label="Skyggebånd" currentSelection={selectedShadowTapeColor} onSelectionChange={setSelectedShadowTapeColor} options={shadowTapeColorOptions} />
                </>
            )}

            <div className="bg-white/70 border border-white/50 rounded-2xl mt-6">
                <div className="flex items-center justify-between mb-4">
                    <div><h4 className="font-semibold text-slate-800">Skyggegravering</h4></div>
                </div>
                <div className="space-y-4">
                    <div className="relative">
                        <span className="inline-flex items-center px-3 pt-2 rounded-full text-xs font-bold">Maks. 30 Tegn</span>
                        <input type="text" value={inputLine1} onChange={(e) => setInputLine1(e.target.value)} onKeyDown={handleKeyPressLine1} placeholder="Linje 1" maxLength={30}
                            className="w-full mt-2 mb-1 px-4 py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 bg-white/80 backdrop-blur-sm text-slate-700 placeholder-slate-400" />
                        <div className="flex justify-end space-x-4 mb-4 px-1">
                            <button
                                type="button"
                                onClick={handleApplyLine1}
                                className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-all duration-200"
                            >
                                Anvend tekst
                            </button>
                            <button
                                type="button"
                                onClick={handleClearLine1}
                                className="text-sm font-semibold text-red-500 hover:text-red-700 hover:underline transition-all duration-200"
                            >
                                Ryd tekst
                            </button>
                        </div>

                        <span className="inline-flex items-center px-3 pt-2 rounded-full text-xs font-bold">Maks. 30 Tegn</span>
                        <input type="text" value={inputLine2} onChange={(e) => setInputLine2(e.target.value)} onKeyDown={handleKeyPressLine2} placeholder="Linje 2" maxLength={30}
                            className="w-full mt-2 mb-1 px-4 py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 bg-white/80 backdrop-blur-sm text-slate-700 placeholder-slate-400" />
                        <div className="flex justify-end space-x-4 mb-4 px-1">
                            <button
                                type="button"
                                onClick={handleApplyLine2}
                                className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-all duration-200"
                            >
                                Anvend tekst
                            </button>
                            <button
                                type="button"
                                onClick={handleClearLine2}
                                className="text-sm font-semibold text-red-500 hover:text-red-700 hover:underline transition-all duration-200"
                            >
                                Ryd tekst
                            </button>
                        </div>

                        <span className="inline-flex items-center px-3 pt-2 rounded-full text-xs font-bold">Maks. 30 Tegn</span>
                        <input type="text" value={inputLine3} onChange={(e) => setInputLine3(e.target.value)} onKeyDown={handleKeyPressLine3} placeholder="Linje 3" maxLength={30}
                            className="w-full mt-2 mb-1 px-4 py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 bg-white/80 backdrop-blur-sm text-slate-700 placeholder-slate-400" />
                        <div className="flex justify-end space-x-4 mb-2 px-1">
                            <button
                                type="button"
                                onClick={handleApplyLine3}
                                className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-all duration-200"
                            >
                                Anvend tekst
                            </button>
                            <button
                                type="button"
                                onClick={handleClearLine3}
                                className="text-sm font-semibold text-red-500 hover:text-red-700 hover:underline transition-all duration-200"
                            >
                                Ryd tekst
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Shade;