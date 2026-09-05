import React, { useState, useEffect, useRef } from 'react';

const Size = ({ selectedOptions = {}, onOptionChange, size, visibilityConfig = {} }) => {
    const isVisible = (key) => visibilityConfig?.['STORRELSE_' + key] !== false;
    const [selectedSize, setSelectedSize] = useState(selectedOptions['Vælg størrelse'] || 'No');
    const [selectedMillimeterAdjustment, setSelectedMillimeterAdjustment] = useState(selectedOptions['Millimeter tilpasningssæt'] || 'No');

    const cameraTriggers = useRef({});

    const sizeOptions = [
        49.5, 50, 50.5, 51, 51.5, 52, 52.5, 53, 53.5, 54, 54.5,
        55, 55.5, 56, 56.5, 57, 57.5, 58, 58.5, 59, 59.5, 60, 60.5,
        61, 61.5, 62, 62.5, 63, 63.5, 64, 64.5, 65
    ].filter(opt => isVisible(`Vælg størrelse_${opt}`));

    const millimeterAdjustmentOptions = [
        { name: 'Yes', value: 'Yes', icon: '✔️' },
        { name: 'No', value: 'No', icon: '❌' },
    ].filter(opt => isVisible(`Millimeter tilpasningssæt_${opt.value}`));

    const sendSizeMessage = (sizeValue) => {
        const val = (sizeValue === null || sizeValue === 'No') ? 'No' : sizeValue.toString();
        const message = `Size:${val}`;
        ['preview-iframe', 'preview-iframe2'].forEach(id => {
            const iframe = document.getElementById(id);
            if (iframe?.contentWindow) {
                iframe.contentWindow.postMessage(message, "*");
                if (val !== 'No') {
                    iframe.contentWindow.postMessage("size camera", "*");
                }
            }
        });
    };

    useEffect(() => {
        onOptionChange('Vælg størrelse', selectedSize);
        sendSizeMessage(selectedSize);
        if (size) size(selectedSize !== null && selectedSize !== 'No' && selectedMillimeterAdjustment !== null);
    }, [selectedSize, selectedMillimeterAdjustment]);

    useEffect(() => {
        if (selectedMillimeterAdjustment !== null) {
            onOptionChange('Millimeter tilpasningssæt', selectedMillimeterAdjustment);
            const value = selectedMillimeterAdjustment === 'Yes' ? 'yes' : 'no';
            ['preview-iframe', 'preview-iframe2'].forEach(id => {
                const iframe = document.getElementById(id);
                if (iframe?.contentWindow) {
                    iframe.contentWindow.postMessage(`Millimeter:${value}`, "*");
                    iframe.contentWindow.postMessage("size camera", "*");
                }
            });
        }
    }, [selectedMillimeterAdjustment]);

    const SizeSelector = ({ label, currentSelection, onSelectionChange, sizeOptions }) => {
        const optionsWithNo = ['No', ...sizeOptions];
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <label className="text-sm font-semibold text-slate-700">{label}</label>
                        <p className="text-xs text-slate-500">{currentSelection === 'No' ? 'Ingen størrelse valgt' : currentSelection}</p>
                    </div>
                </div>
                <div className="flex space-x-3 flex-wrap">
                    {optionsWithNo.map((sz) => (
                        <button
                            key={sz}
                            onClick={() => onSelectionChange(sz)}
                            className={`w-12 h-12 rounded-xl border-2 transition-all duration-200 hover:scale-110 my-3 flex items-center justify-center ${currentSelection === sz
                                ? 'border-slate-800 ring-2 ring-slate-800 ring-offset-2 bg-blue-100'
                                : 'border-slate-200 hover:border-slate-400 bg-white'
                                }`}
                        >
                            {sz === 'No' ? '❌' : sz}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    const OptionSelector = ({ label, currentSelection, onSelectionChange, options }) => (
        <div className="space-y-4">
            <div><label className="text-sm font-semibold text-slate-700">{label}</label></div>
            <div className="flex space-x-3">
                {options.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => onSelectionChange(option.value)}
                        className={`w-12 h-12 rounded-xl border-2 transition-all duration-200 hover:scale-110 flex items-center justify-center text-2xl ${currentSelection === option.value
                            ? 'border-slate-800 ring-2 ring-slate-800 ring-offset-2 bg-blue-100'
                            : 'border-slate-200 hover:border-slate-400 bg-white'
                            }`}
                        title={option.name}
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
                <h3 className="text-2xl font-bold text-slate-900">STØRRELSE</h3>
            </div>

            <SizeSelector
                label="Vælg størrelse"
                currentSelection={selectedSize}
                onSelectionChange={setSelectedSize}
                sizeOptions={sizeOptions}
            />

            <OptionSelector
                label="Millimeter tilpasningssæt"
                currentSelection={selectedMillimeterAdjustment}
                onSelectionChange={setSelectedMillimeterAdjustment}
                options={millimeterAdjustmentOptions}
            />
        </>
    );
};

export default Size;
