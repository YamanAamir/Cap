import React, { useState, useEffect, useRef } from 'react';
import { sendToActiveIframe } from '../utils/iframeMessenger';
import noneImg from '../assets/cover images/none.webp';
import {
    generateAllEmbroideryMaps,
    preloadAlphabetMaps,
    sanitizeEmbroideryLetters,
    sendEmbroideryMapsToIframes,
    isArabicText,
    sendArabicTextToIframes,
} from '../utils/embroideryAlphabet';

import topDesign1Gold from '../assets/topDesignImg/1Gold.webp';
import topDesign2Gold from '../assets/topDesignImg/2Gold.webp';
import topDesign3Gold from '../assets/topDesignImg/3Gold.webp';
import topDesign4Gold from '../assets/topDesignImg/4Gold.webp';
import topDesign1Silver from '../assets/topDesignImg/1Silver.webp';
import topDesign2Silver from '../assets/topDesignImg/2Silver.webp';
import topDesign3Silver from '../assets/topDesignImg/3Silver.webp';
import topDesign4Silver from '../assets/topDesignImg/4Silver.webp';

const Embroidery = ({ selectedOptions = {}, onOptionChange, program, pakke, visibilityConfig = {}, currentEmblem }) => {
    const isGold = (currentEmblem?.name === 'Guld' || currentEmblem?.value === 'Guld' || currentEmblem?.name === 'Gold' || currentEmblem?.value === 'Gold') ?? true;
    const isVisible = (key) => visibilityConfig?.['BRODERI_' + key] !== false;
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
    const [inputNameText, setInputNameText] = useState(
        selectedOptions['Navne broderi'] || ''
    );
    const [selectedSchoolEmbroideryColor, setSelectedSchoolEmbroideryColor] = useState(
        selectedOptions['Skolebroderi farve'] || getDefaultSchoolEmbroideryColor()
    );
    const [schoolEmbroideryText, setSchoolEmbroideryText] = useState(
        selectedOptions.Skolebroderi || ''
    );
    const [inputSchoolText, setInputSchoolText] = useState(
        selectedOptions.Skolebroderi || ''
    );

    useEffect(() => {
        setInputNameText(selectedOptions['Navne broderi'] || '');
    }, [selectedOptions['Navne broderi']]);

    useEffect(() => {
        setInputSchoolText(selectedOptions.Skolebroderi || '');
    }, [selectedOptions.Skolebroderi]);
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

    const [isApplyingName, setIsApplyingName] = useState(false);
    const [isApplyingSchool, setIsApplyingSchool] = useState(false);
    const lastAppliedNameRef = useRef(selectedOptions['Navne broderi'] || '');
    const lastAppliedSchoolRef = useRef(selectedOptions.Skolebroderi || '');

    // --- Handlers ---
    const handleApplyNameText = async () => {
        if (isApplyingName) return;
        const clean = sanitizeEmbroideryLetters(inputNameText, 26);
        if (!clean.trim()) return;
        if (clean === lastAppliedNameRef.current) return;

        setIsApplyingName(true);
        await new Promise(r => setTimeout(r, 10));
        try {
            lastAppliedNameRef.current = clean;
            setNameEmbroideryText(clean);
            onOptionChange('Navne broderi', clean);
            if (isArabicText(clean)) {
                sendArabicTextToIframes(clean);
            } else {
                sendArabicTextToIframes('clear');
                const result = await generateAllEmbroideryMaps(clean);
                sendEmbroideryMapsToIframes('backTop', result);
            }
            sendToActiveIframe(`nameEmbroidery:${clean}`);
            sendToActiveIframe("name camera");
        } catch (err) {
            console.error('Error applying name embroidery:', err);
        } finally {
            setIsApplyingName(false);
        }
    };

    const handleClearNameText = async () => {
        if (isApplyingName) return;
        if (!lastAppliedNameRef.current && !inputNameText) return;

        setIsApplyingName(true);
        await new Promise(r => setTimeout(r, 10));
        try {
            const wasArabic = isArabicText(nameEmbroideryText) || isArabicText(inputNameText);
            setInputNameText('');
            setNameEmbroideryText('');
            onOptionChange('Navne broderi', '');
            if (lastAppliedNameRef.current) {
                lastAppliedNameRef.current = '';
                if (wasArabic) {
                    sendArabicTextToIframes('clear');
                } else {
                    const result = await generateAllEmbroideryMaps('');
                    sendEmbroideryMapsToIframes('backTop', result);
                    sendArabicTextToIframes('clear');
                }
                sendToActiveIframe('nameEmbroidery:');
            }
        } catch (err) {
            console.error('Error clearing name embroidery:', err);
        } finally {
            setIsApplyingName(false);
        }
    };

    const handleApplySchoolText = async () => {
        if (ingenButton || isApplyingSchool) return;
        const clean = sanitizeEmbroideryLetters(inputSchoolText, 35);
        if (!clean.trim()) return;
        if (clean === lastAppliedSchoolRef.current) return;

        setIsApplyingSchool(true);
        await new Promise(r => setTimeout(r, 10));
        try {
            lastAppliedSchoolRef.current = clean;
            setSchoolEmbroideryText(clean);
            onOptionChange('Skolebroderi', clean);
            if (isArabicText(clean)) {
                sendArabicTextToIframes(clean);
            } else {
                sendArabicTextToIframes('clear');
                const result = await generateAllEmbroideryMaps(clean);
                sendEmbroideryMapsToIframes('backBottom', result);
            }
            sendToActiveIframe(`schoolEmbroidery:${clean}`);
            sendToActiveIframe("school camera");
        } catch (err) {
            console.error('Error applying school embroidery:', err);
        } finally {
            setIsApplyingSchool(false);
        }
    };

    const handleClearSchoolText = async () => {
        if (ingenButton || isApplyingSchool) return;
        if (!lastAppliedSchoolRef.current && !inputSchoolText) return;

        setIsApplyingSchool(true);
        await new Promise(r => setTimeout(r, 10));
        try {
            const wasArabic = isArabicText(schoolEmbroideryText) || isArabicText(inputSchoolText);
            setInputSchoolText('');
            setSchoolEmbroideryText('');
            onOptionChange('Skolebroderi', '');
            if (lastAppliedSchoolRef.current) {
                lastAppliedSchoolRef.current = '';
                if (wasArabic) {
                    sendArabicTextToIframes('clear');
                } else {
                    const result = await generateAllEmbroideryMaps('');
                    sendEmbroideryMapsToIframes('backBottom', result);
                    sendArabicTextToIframes('clear');
                }
                sendToActiveIframe('schoolEmbroidery:');
            }
        } catch (err) {
            console.error('Error clearing school embroidery:', err);
        } finally {
            setIsApplyingSchool(false);
        }
    };

    const handleKeyPressName = (e) => {
        if (e.key === 'Enter') {
            handleApplyNameText();
        }
    };

    const handleKeyPressSchool = (e) => {
        if (e.key === 'Enter') {
            handleApplySchoolText();
        }
    };

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
            sendArabicTextToIframes('clear');
            return;
        }

        if (!schoolEmbroideryText || !schoolEmbroideryText.trim()) return;

        if (isArabicText(schoolEmbroideryText)) {
            sendArabicTextToIframes(schoolEmbroideryText);
        } else {
            generateAllEmbroideryMaps(schoolEmbroideryText)
                .then((result) => {
                    sendEmbroideryMapsToIframes(
                        'backBottom',
                        result
                    );
                });
        }

    }, [
        ingenButton
    ]);

    // "Ingen" button handling
    useEffect(() => {
        onOptionChange('Ingen', ingenButton);
        if (ingenButton) {
            lastAppliedSchoolRef.current = '';
            setSchoolEmbroideryText('');
            setInputSchoolText('');
            onOptionChange('Skolebroderi', '');
            sendEmbroideryMapsToIframes('backBottom', {
                text: '',
                basecolor: null,
                normal: null,
                roughness: null,
                height: null,
                ambient: null,
                opacity: null
            });
            sendArabicTextToIframes('clear');
            sendToActiveIframe('schoolEmbroidery:');
        }
    }, [ingenButton]);

    // Initial load effect
    useEffect(() => {

        if (nameEmbroideryText && nameEmbroideryText.trim()) {
            lastAppliedNameRef.current = nameEmbroideryText.trim();
            if (isArabicText(nameEmbroideryText)) {
                sendArabicTextToIframes(nameEmbroideryText);
            } else {
                generateAllEmbroideryMaps(nameEmbroideryText)
                    .then((result) => {
                        sendEmbroideryMapsToIframes(
                            'backTop',
                            result
                        );
                    });
            }
            sendToActiveIframe(`nameEmbroidery:${nameEmbroideryText}`);
        }

        if (!ingenButton && schoolEmbroideryText && schoolEmbroideryText.trim()) {
            lastAppliedSchoolRef.current = schoolEmbroideryText.trim();
            if (isArabicText(schoolEmbroideryText)) {
                sendArabicTextToIframes(schoolEmbroideryText);
            } else {
                generateAllEmbroideryMaps(schoolEmbroideryText)
                    .then((result) => {
                        sendEmbroideryMapsToIframes(
                            'backBottom',
                            result
                        );
                    });
            }
            sendToActiveIframe(`schoolEmbroidery:${schoolEmbroideryText}`);
        }

    }, []);

    // --- Rest of the original postMessage effects (unchanged) ---
    useEffect(() => {
        onOptionChange('Top broderi', topEmbroiderySelection);
        const msg = `topEmbroidery:${topEmbroiderySelection}`;
        sendToActiveIframe(msg);
        if (cameraTriggers.current["top"]) {
            sendToActiveIframe("top camera");
        } else {
            cameraTriggers.current["top"] = true;
        }
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
            sendToActiveIframe(msg);
            if (cameraTriggers.current["name_color"]) {
                sendToActiveIframe("name camera");
            } else {
                cameraTriggers.current["name_color"] = true;
            }
        }
    }, [selectedNameEmbroideryColor]);

    useEffect(() => {
        const colorMap = { 'hvid': 'schoolBroderiNamefarve:Hvid', 'guld': 'schoolBroderiNamefarve:Guld', 'sølv': 'schoolBroderiNamefarve:Sølv' };
        const msg = colorMap[selectedSchoolEmbroideryColor.toLowerCase()];
        if (msg) {
            sendToActiveIframe(msg);
            if (cameraTriggers.current["school_color"]) {
                sendToActiveIframe("school camera");
            } else {
                cameraTriggers.current["school_color"] = true;
            }
        }
    }, [selectedSchoolEmbroideryColor]);

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
    ].filter(Boolean).filter(opt => isVisible(`Navnebroderifarve_${opt.name}`));

    let schoolEmbroideryColorOptions = [
        { name: 'Hvid', value: '#E5E7EB' },
        { name: 'Guld', value: '#ba9200' },
        { name: 'Sølv', value: '#757575' },
    ].filter(Boolean).filter(opt => isVisible(`Skolebroderifarve_${opt.name}`));

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
            {pakke !== 'basichue' && (
            <div className="space-y-4 mt-6">
                <div>
                    <label className="text-sm font-semibold text-slate-700">Top broderi</label>
                    <div className="flex items-center gap-2 mt-1">
                        {pakke?.toLowerCase() === 'luksus' || pakke?.toLowerCase() === 'premium' ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-100 to-yellow-200 text-amber-800">
                                Inkluderet i pakken
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-100 to-yellow-200 text-amber-800">
                                + 149 DKK
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex space-x-3 mt-4">
                    {[
                        { value: 'Ingen', label: 'Ingen', img: noneImg },
                        { value: 'Top broderi 1', label: 'Top broderi 1', img: isGold ? topDesign1Gold : topDesign1Silver },
                        { value: 'Top broderi 2', label: 'Top broderi 2', img: isGold ? topDesign3Gold : topDesign3Silver },
                        { value: 'Top broderi 3', label: 'Top broderi 3', img: isGold ? topDesign2Gold : topDesign2Silver },
                        { value: 'Top broderi 4', label: 'Top broderi 4', img: isGold ? topDesign4Gold : topDesign4Silver },
                    ].filter(opt => isVisible(`Top broderi_${opt.value}`)).map((option) => (
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
                                <img src={option.img} alt={option.label} className="w-full h-full object-contain rounded-lg " />
                            ) : (
                                <span className="text-[10px] text-slate-400 font-medium text-center">Img</span>
                            )}
                        </button>
                    ))}
                </div>
                <p className="text-sm mt-3 text-slate-700 font-medium">Valgt: {topEmbroiderySelection}</p>
            </div>
            )}

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
                            value={inputNameText}
                            onChange={(e) => setInputNameText(sanitizeEmbroideryLetters(e.target.value, 26))}
                            onKeyDown={handleKeyPressName}
                            placeholder="Fri tekst"
                            maxLength={26}
                            className="w-full px-4 py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 bg-white/80 backdrop-blur-sm text-slate-700 placeholder-slate-400"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-4 mt-2 px-1">
                        <button
                            type="button"
                            onClick={handleApplyNameText}
                            disabled={isApplyingName}
                            className={`text-sm font-semibold transition-all duration-200 ${isApplyingName ? 'text-blue-400 cursor-wait' : 'text-blue-600 hover:text-blue-800 hover:underline'}`}
                        >
                            {isApplyingName ? 'Anvender...' : 'Anvend tekst'}
                        </button>
                        <button
                            type="button"
                            onClick={handleClearNameText}
                            disabled={isApplyingName}
                            className={`text-sm font-semibold transition-all duration-200 ${isApplyingName ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 hover:text-red-700 hover:underline'}`}
                        >
                            Ryd tekst
                        </button>
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
                            value={ingenButton ? '' : inputSchoolText}
                            onChange={(e) => setInputSchoolText(sanitizeEmbroideryLetters(e.target.value, 35))}
                            onKeyDown={handleKeyPressSchool}
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
                    <div className="flex justify-end space-x-4 mt-2 px-1">
                        <button
                            type="button"
                            onClick={handleApplySchoolText}
                            disabled={ingenButton || isApplyingSchool}
                            className={`text-sm font-semibold transition-all duration-200 ${ingenButton || isApplyingSchool ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-800 hover:underline'}`}
                        >
                            {isApplyingSchool ? 'Anvender...' : 'Anvend tekst'}
                        </button>
                        <button
                            type="button"
                            onClick={handleClearSchoolText}
                            disabled={ingenButton || isApplyingSchool}
                            className={`text-sm font-semibold transition-all duration-200 ${ingenButton || isApplyingSchool ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 hover:text-red-700 hover:underline'}`}
                        >
                            Ryd tekst
                        </button>
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