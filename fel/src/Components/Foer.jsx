import React, { useState, useEffect } from 'react';

const Foer = ({ selectedOptions = {}, onOptionChange, currentEmblem, program }) => {
    // ====================== Default Values ======================
    const getDefaultKokardeMaterial = () => 'Læder';
    const getDefaultKokardeColor = () => 'Hvid';
    const getDefaultBowColor = () => 'Hvid';
    const getDefaultFoerMaterial = () => 'Polyester';

    const getDefaultSatinType = () => {
        switch (program?.toLowerCase()) {
            case 'hhx': return 'Royal blå';
            case 'htx': return 'Navy blå';
            case 'stx': return 'Bordeaux';
            case 'hf': return 'Light blå';
            case 'eux': return 'Grå';
            case 'eud': return 'Purple';
            default: return 'Bordeaux';
        }
    };

    const getDefaultSilkeType = () => 'Hvid';

    // ====================== State ======================
    const [selectedKokardeMaterial, setSelectedKokardeMaterial] = useState(
        selectedOptions.Svederem || getDefaultKokardeMaterial()
    );
    const [selectedKokardeColor, setSelectedKokardeColor] = useState(
        selectedOptions.Farve || getDefaultKokardeColor()
    );
    const [selectedBowColor, setSelectedBowColor] = useState(
        selectedOptions.Sløjfe || getDefaultBowColor()
    );
    const [selectedFoerMaterial, setSelectedFoerMaterial] = useState(
        selectedOptions.Foer || getDefaultFoerMaterial()
    );
    const [selectedbowMaterialType, setBowMaterialTypes] = useState(
        selectedOptions['Satin Type'] || ''
    );
    const [selectedsilkeTypes, setSilkeTypes] = useState(
        selectedOptions['Silk Type'] || ''
    );
    const [liningPhoto, setLiningPhoto] = useState(
        selectedOptions['Indvendigt foer billede'] || null
    );

    // ====================== Restricted Programs ======================
    const restrictedPrograms = [
        'Sosuassistent', 'Sosuhjælper', 'Frisør', 'Kosmetolog',
        'Pædagog', 'PAU', 'Ernæringsassisten'
    ];
    const isRestricted = restrictedPrograms.some(
        p => p.toLowerCase() === program?.toLowerCase()
    );

    const kokardeMaterialTypes = isRestricted
        ? ['Læder']
        : ['Læder', 'Kunstlæder', 'Ruskin', 'Alcantra'];

    // ====================== Emblem & Colors ======================
    const getCurrentEmblem = () => {
        return currentEmblem.name === 'Guld'
            ? { name: 'Guld', value: 'Guld', color: '#FFD700' }
            : { name: 'Sølv', value: 'Sølv', color: '#C0C0C0' };
    };

    const getSatinColor = () => {
        switch (program?.toLowerCase()) {
            case 'hhx': return { name: 'Royal blå', value: 'Royal blå', color: '#4169e1' };
            case 'htx': return { name: 'Navy blå', value: 'Navy blå', color: '#000080' };
            case 'stx': return { name: 'Bordeaux', value: 'Bordeaux', color: '#800020' };
            case 'hf': return { name: 'Light blå', value: 'Light blå', color: '#ADD8E6' };
            case 'eux': return { name: 'Grå', value: 'Grå', color: '#5d5d66' };
            case 'eud': return { name: 'Purple', value: 'Purple', color: '#522854' };
            default: return { name: 'Bordeaux', value: 'Bordeaux', color: '#800020' };
        }
    };

    const bowColorOptions = [
        { name: 'Hvid', value: 'Hvid', color: '#FFFFFF' },
        { name: 'Sort', value: 'Sort', color: '#000000' },
        getCurrentEmblem()
    ];

    const bowMaterialTypes = [
        { name: 'Hvid', value: 'Hvid', color: '#fafcfd' },
        { name: 'Brun', value: 'Brun', color: '#a66f5a' },
        getSatinColor(),
        { name: 'Champagne', value: 'Champagne', color: '#F7E7CE' },
    ];

    const silkeTypes = [
        { name: 'Hvid', value: 'Hvid', color: '#ffffff' },
        { name: 'Sort', value: 'Sort', color: '#000000' },
        { name: 'Rosa', value: 'Rosa', color: '#FFC0CB' },
    ];

    const foerMaterialTypes = ['Viskose', 'Polyester', 'Satin', 'Silk'];

    // ====================== Helper: Always send message ======================
    const sendMessage = (message) => {
        ['preview-iframe', 'preview-iframe2'].forEach(id => {
            const iframe = document.getElementById(id);
            if (iframe?.contentWindow) {
                iframe.contentWindow.postMessage(message, "*");
            }
        });
    };

    // ====================== postMessage Effects (सभी हमेशा भेजेंगे) ======================

    // Svederem
    useEffect(() => {
        onOptionChange('Svederem', selectedKokardeMaterial);
        sendMessage(`Foer Svederem:${selectedKokardeMaterial.toLowerCase()}`);
        sendMessage("svederem camera");
    }, [selectedKokardeMaterial]);

    // Farve
    useEffect(() => {
        onOptionChange('Farve', selectedKokardeColor);
        sendMessage(`Foer Farve:${selectedKokardeColor.toLowerCase()}`);
        sendMessage("svederem camera");
    }, [selectedKokardeColor]);

    // Sløjfe
    useEffect(() => {
        onOptionChange('Sløjfe', selectedBowColor);
        sendMessage(`Foer Slojfe:${selectedBowColor.toLowerCase()}`);
        sendMessage("slojfe camera");
    }, [selectedBowColor]);

    // Foring (Foer Material)
    useEffect(() => {
        onOptionChange('Foer', selectedFoerMaterial);
        sendMessage(`Foer Foring:${selectedFoerMaterial.toLowerCase()}`);
        sendMessage("foer camera");
    }, [selectedFoerMaterial]);

    // Satin Type
    useEffect(() => {
        onOptionChange('Satin Type', selectedbowMaterialType);
        if (selectedbowMaterialType) {
            setSilkeTypes('');
            onOptionChange('Silk Type', '');
            sendMessage(`Foer SatinType:${selectedbowMaterialType.toLowerCase()}`);
            sendMessage("foer camera");
        } else {
            sendMessage(`Foer SatinType:`);
        }
    }, [selectedbowMaterialType]);

    // Silk Type
    useEffect(() => {
        onOptionChange('Silk Type', selectedsilkeTypes);
        if (selectedsilkeTypes) {
            setBowMaterialTypes('');
            onOptionChange('Satin Type', '');
            sendMessage(`Foer SilkType:${selectedsilkeTypes.toLowerCase()}`);
            sendMessage("foer camera");
        } else {
            sendMessage(`Foer SilkType:`);
        }
    }, [selectedsilkeTypes]);

    // जब Foer Material बदलता है → Satin/Silk को हैंडल करें + मैसेज भेजें
    useEffect(() => {
        if (selectedFoerMaterial === 'Satin') {
            if (!selectedbowMaterialType && bowMaterialTypes.length > 0) {
                setBowMaterialTypes(bowMaterialTypes[0].value);
            }
            setSilkeTypes('');
            onOptionChange('Silk Type', '');
        } else if (selectedFoerMaterial === 'Silk') {
            if (!selectedsilkeTypes && silkeTypes.length > 0) {
                setSilkeTypes(silkeTypes[0].value);
            }
            setBowMaterialTypes('');
            onOptionChange('Satin Type', '');
        } else if (selectedFoerMaterial === 'Viskose' || selectedFoerMaterial === 'Polyester') {
            setBowMaterialTypes('');
            setSilkeTypes('');
            onOptionChange('Satin Type', '');
            onOptionChange('Silk Type', '');
            sendMessage(`Foer SatinType:`);
            sendMessage(`Foer SilkType:`);
        }
    }, [selectedFoerMaterial]);

    // Kokarde Color options according to material
    const getKokardeColorOptions = (material) => {
        switch (material) {
            case 'Læder': return [{ name: 'Hvid', value: 'Hvid', color: '#ffffff' }, { name: 'Sort', value: 'Sort', color: '#000000' }];
            case 'Kunstlæder': return [{ name: 'Vegansk', value: 'Vegansk', color: '#006644' }];
            case 'Ruskin': return [{ name: 'Cognac', value: 'Cognac', color: '#a66f5a' }];
            case 'Alcantra': return [{ name: 'Sort', value: 'Sort', color: '#000000' }];
            default: return [{ name: 'Hvid', value: 'Hvid', color: '#ffffff' }];
        }
    };

    const kokardeColorOptions = getKokardeColorOptions(selectedKokardeMaterial);

    // अगर material बदलने से color invalid हो जाए तो पहला valid color चुन लें
    useEffect(() => {
        if (kokardeColorOptions.length > 0 &&
            !kokardeColorOptions.some(opt => opt.value === selectedKokardeColor)) {
            setSelectedKokardeColor(kokardeColorOptions[0].value);
        }
    }, [selectedKokardeMaterial]);

    // ====================== Reusable Components ======================
    const ColorSelector = ({ label, currentSelection, onSelectionChange, colorOptions }) => (
        <div className="space-y-4 mt-6">
            <label className="text-sm font-semibold text-slate-700">{label}</label>
            <div className="flex space-x-3">
                {colorOptions.map(opt => (
                    <button
                        key={opt.value}
                        onClick={() => onSelectionChange(opt.value)}
                        className={`w-12 h-12 rounded-xl border-2 transition-all hover:scale-110 flex items-center justify-center ${currentSelection === opt.value
                            ? 'border-slate-800 ring-2 ring-slate-800 ring-offset-2'
                            : 'border-slate-200 hover:border-slate-400'
                            }`}
                        style={{ backgroundColor: opt.color }}
                        title={opt.name}
                    />
                ))}
            </div>
            <p className="text-sm mt-2 text-slate-600">Valgt: {currentSelection || 'Ingen'}</p>
        </div>
    );

    const TypeSelector = ({ label, currentSelection, onSelectionChange, options }) => (
        <div className="space-y-4 mt-6">
            <div>
                <label className="text-sm font-semibold text-slate-700">{label}</label>
                <div className="mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {currentSelection || 'Ingen'}
                    </span>
                </div>
            </div>

            <div className="flex flex-wrap gap-3">
                {options.map(type => (
                    <button
                        key={type}
                        onClick={() => onSelectionChange(type)}
                        className={`px-6 py-3 rounded-xl font-medium transition-all ${currentSelection === type
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                            }`}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {currentSelection === 'Satin' && (
                <ColorSelector
                    label="Satin Type"
                    currentSelection={selectedbowMaterialType}
                    onSelectionChange={setBowMaterialTypes}
                    colorOptions={bowMaterialTypes}
                />
            )}

            {currentSelection === 'Silk' && (
                <ColorSelector
                    label="Silk Type"
                    currentSelection={selectedsilkeTypes}
                    onSelectionChange={setSilkeTypes}
                    colorOptions={silkeTypes}
                />
            )}
        </div>
    );

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    const dataUrl = canvas.toDataURL('image/png', 0.8);

                    setLiningPhoto(dataUrl);
                    onOptionChange('Indvendigt foer billede', dataUrl);

                    // Send the raw base64 data to the iframe via postMessage as requested
                    // sendMessage(dataUrl);
                    sendMessage(`Innerlining:${dataUrl}`);
                    sendMessage("liningphoto camera");
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemovePhoto = () => {
        setLiningPhoto(null);
        onOptionChange('Indvendigt foer billede', '');

        // You might want to remove the image from the 3D view if the user clicks remove
        sendMessage('');
    };

    // const PhotoSelector = ({ label }) => (
    //     <div className="space-y-4 mt-8">
    //         <label className="text-sm font-semibold text-slate-700">{label}</label>
    //         <div className="flex flex-col space-y-3 mt-1">
    //             {liningPhoto ? (
    //                 <div className="relative w-full max-w-sm h-48 rounded-xl border-2 border-slate-200 overflow-hidden group">
    //                     <img src={liningPhoto} alt="Indvendig foer" className="w-full h-full object-cover" />
    //                     <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
    //                         <button
    //                             onClick={handleRemovePhoto}
    //                             className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition"
    //                         >
    //                             Fjern billede
    //                         </button>
    //                     </div>
    //                 </div>
    //             ) : (
    //                 <label className="w-full max-w-sm flex flex-col items-center px-4 py-6 bg-white text-blue-500 rounded-xl shadow-sm tracking-wide uppercase border border-blue-500 cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition-all">
    //                     <svg className="w-8 h-8" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
    //                         <path d="M16.88 9.1A4 4 0 0 1 16 17H5a5 5 0 0 1-1-9.9V7a3 3 0 0 1 4.52-2.59A4.98 4.98 0 0 1 17 8c0 .38-.04.74-.12 1.1zM11 11h3l-4-4-4 4h3v3h2v-3z" />
    //                     </svg>
    //                     <span className="mt-2 text-sm leading-normal">Upload billede til foer</span>
    //                     <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
    //                 </label>
    //             )}
    //             <p className="text-xs text-slate-500 max-w-sm">
    //                 Upload et foto (JPG, PNG). Dette billede vil blive brugt til indersiden af ​​huen.
    //             </p>
    //         </div>
    //     </div>
    // );

    // ====================== Render ======================
    return (
        <>
            <div className="space-y-8 mt-8">
                <h3 className="text-2xl font-bold text-slate-900">FOER</h3>

                <TypeSelector
                    label="Svederem"
                    currentSelection={selectedKokardeMaterial}
                    onSelectionChange={setSelectedKokardeMaterial}
                    options={kokardeMaterialTypes}
                />

                <ColorSelector
                    label="Farve"
                    currentSelection={selectedKokardeColor}
                    onSelectionChange={setSelectedKokardeColor}
                    colorOptions={kokardeColorOptions}
                />

                <TypeSelector
                    label="Foring"
                    currentSelection={selectedFoerMaterial}
                    onSelectionChange={setSelectedFoerMaterial}
                    options={foerMaterialTypes}
                />

                <ColorSelector
                    label="Sløjfe"
                    currentSelection={selectedBowColor}
                    onSelectionChange={setSelectedBowColor}
                    colorOptions={bowColorOptions}
                />

                {/* <PhotoSelector label="Billede til Indvendig Foer" /> */}
            </div>
        </>
    );
};

export default Foer;