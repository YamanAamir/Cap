import React, { useState, useEffect, useRef, useCallback } from 'react';
import { buildLiningExportDataUrl } from '../utils/liningCanvas';
import LiningPhotoEditor from './LiningPhotoEditor';

const LINING_IMAGE_KEY = 'Indvendigt foer billede';
const LINING_LAYOUT_KEY = 'Indvendigt foer billede layout';

const getConfigScrollPanels = () =>
    ['desktop-config-panel', 'mobile-config-panel']
        .map((id) => document.getElementById(id))
        .filter(Boolean);

const preserveConfigPanelScroll = (fn) => {
    const panels = getConfigScrollPanels();
    const scrollTops = panels.map((p) => p.scrollTop);
    fn();
    requestAnimationFrame(() => {
        panels.forEach((p, i) => {
            p.scrollTop = scrollTops[i];
        });
    });
};

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
    const cameraTriggers = useRef({});
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
    const [liningPhotos, setLiningPhotos] = useState(() => {
        const layout = selectedOptions[LINING_LAYOUT_KEY];
        if (Array.isArray(layout) && layout.length > 0) return layout;
        const legacy = selectedOptions[LINING_IMAGE_KEY];
        if (Array.isArray(legacy)) return legacy;
        if (typeof legacy === 'string' && legacy.startsWith('data:image')) {
            return [{ id: Date.now(), url: legacy, x: 0.5, y: 0.5, scale: 1, rotation: 0 }];
        }
        return [];
    });
    const [selectedPhotoId, setSelectedPhotoId] = useState(null);
    const [imageObjects, setImageObjects] = useState({}); // Cache for HTMLImageElements

    const liningPhotosRef = useRef(liningPhotos);
    const imageObjectsRef = useRef(imageObjects);
    const isLiningInteractingRef = useRef(false);
    const liningExportTimerRef = useRef(null);
    const skipAutoExportRef = useRef(false);
    const lastLiningHashRef = useRef(null);
    const liningCameraSentRef = useRef(false);

    liningPhotosRef.current = liningPhotos;
    imageObjectsRef.current = imageObjects;

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

    // ====================== postMessage Effects ======================

    // Svederem
    useEffect(() => {
        onOptionChange('Svederem', selectedKokardeMaterial);
        sendMessage(`Foer Svederem:${selectedKokardeMaterial.toLowerCase()}`);
        if (cameraTriggers.current['svederem1']) {
            sendMessage("svederem camera");
        } else {
            cameraTriggers.current['svederem1'] = true;
        }
    }, [selectedKokardeMaterial]);

    // Farve
    useEffect(() => {
        onOptionChange('Farve', selectedKokardeColor);
        sendMessage(`Foer Farve:${selectedKokardeColor.toLowerCase()}`);
        if (cameraTriggers.current['svederem2']) {
            sendMessage("svederem camera");
        } else {
            cameraTriggers.current['svederem2'] = true;
        }
    }, [selectedKokardeColor]);

    // Sløjfe
    useEffect(() => {
        onOptionChange('Sløjfe', selectedBowColor);
        sendMessage(`Foer Slojfe:${selectedBowColor.toLowerCase()}`);
        if (cameraTriggers.current['slojfe']) {
            sendMessage("slojfe camera");
        } else {
            cameraTriggers.current['slojfe'] = true;
        }
    }, [selectedBowColor]);

    // Foring (Foer Material)
    useEffect(() => {
        onOptionChange('Foer', selectedFoerMaterial);
        sendMessage(`Foer Foring:${selectedFoerMaterial.toLowerCase()}`);
        if (cameraTriggers.current['foer1']) {
            sendMessage("foer camera");
        } else {
            cameraTriggers.current['foer1'] = true;
        }
    }, [selectedFoerMaterial]);

    // Satin Type
    useEffect(() => {
        onOptionChange('Satin Type', selectedbowMaterialType);
        if (selectedbowMaterialType) {
            setSilkeTypes('');
            onOptionChange('Silk Type', '');
            sendMessage(`Foer SatinType:${selectedbowMaterialType.toLowerCase()}`);
            if (cameraTriggers.current['foer2']) {
                sendMessage("foer camera");
            } else {
                cameraTriggers.current['foer2'] = true;
            }
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
            if (cameraTriggers.current['foer3']) {
                sendMessage("foer camera");
            } else {
                cameraTriggers.current['foer3'] = true;
            }
        } else {
            sendMessage(`Foer SilkType:`);
        }
    }, [selectedsilkeTypes]);

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

    const TypeSelector = ({ label, currentSelection, onSelectionChange, options, disabled }) => (
        <div className={`space-y-4 mt-6 ${disabled ? 'pointer-events-none' : ''}`}>
            <div>
                <label className={`text-sm font-semibold transition-colors ${disabled ? 'text-slate-400' : 'text-slate-700'}`}>{label}</label>
                <div className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${disabled ? 'bg-slate-100 text-slate-400' : 'bg-blue-100 text-blue-800'}`}>
                        {currentSelection || 'Ingen'}
                    </span>
                </div>
            </div>

            <div className="flex flex-wrap gap-3">
                {options.map(type => (
                    <button
                        key={type}
                        disabled={disabled}
                        onClick={() => onSelectionChange(type)}
                        className={`px-6 py-3 rounded-xl font-medium transition-all ${currentSelection === type
                            ? (disabled ? 'bg-slate-300 text-white' : 'bg-blue-600 text-white shadow-md')
                            : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
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

    // ====================== Image Composite Logic ======================
    const getLiningHash = (photos) =>
        photos
            .map(
                (p) =>
                    `${p.id}:${p.x.toFixed(3)}:${p.y.toFixed(3)}:${(p.scale || 1).toFixed(3)}:${Math.round(p.rotation || 0)}`
            )
            .join('|');

    const flushLiningExport = useCallback(({ withCamera = false } = {}) => {
        const photos = liningPhotosRef.current;
        const imgs = imageObjectsRef.current;

        // if (photos.length === 0) {
        //     const emptyImageBase64 =
        //         'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
        //     lastLiningHashRef.current = '';
        //     onOptionChange(LINING_LAYOUT_KEY, []);
        //     onOptionChange(LINING_IMAGE_KEY, '');
        //     sendMessage(`Innerlining:${emptyImageBase64}`);
        //     if (withCamera && !liningCameraSentRef.current) {
        //         sendMessage('liningphoto camera');
        //         liningCameraSentRef.current = true;
        //     }
        //     return;
        // }

        if (!photos.every((p) => imgs[p.id])) return;

        const hash = getLiningHash(photos);
        if (hash === lastLiningHashRef.current && !withCamera) return;

        const dataUrl = buildLiningExportDataUrl(photos, imgs);
        lastLiningHashRef.current = hash;
        onOptionChange(LINING_LAYOUT_KEY, photos);
        onOptionChange(LINING_IMAGE_KEY, dataUrl);
        sendMessage(`Innerlining:${dataUrl}`);

        if (withCamera && !liningCameraSentRef.current) {
            sendMessage('liningphoto camera');
            liningCameraSentRef.current = true;
        }
    }, []);

    const scheduleLiningExport = useCallback(
        (delay = 400, options = {}) => {
            if (isLiningInteractingRef.current) return;
            clearTimeout(liningExportTimerRef.current);
            liningExportTimerRef.current = setTimeout(
                () => flushLiningExport(options),
                delay
            );
        },
        [flushLiningExport]
    );

    const beginLiningInteraction = useCallback(() => {
        isLiningInteractingRef.current = true;
        clearTimeout(liningExportTimerRef.current);
    }, []);

    const endLiningInteraction = useCallback(() => {
        if (!isLiningInteractingRef.current) return;
        isLiningInteractingRef.current = false;
        clearTimeout(liningExportTimerRef.current);
        skipAutoExportRef.current = true;
        liningExportTimerRef.current = setTimeout(() => {
            flushLiningExport({ withCamera: false });
            liningExportTimerRef.current = setTimeout(() => {
                skipAutoExportRef.current = false;
            }, 100);
        }, 450);
    }, [flushLiningExport]);

    // Pre-load images when liningPhotos change
    useEffect(() => {
        liningPhotos.forEach(photo => {
            if (!imageObjects[photo.id]) {
                const img = new Image();
                img.onload = () => {
                    setImageObjects(prev => ({ ...prev, [photo.id]: img }));
                };
                img.src = photo.url;
            }
        });
    }, [liningPhotos]);

    useEffect(() => {
        if (isLiningInteractingRef.current || skipAutoExportRef.current) return;

        if (liningPhotos.length === 0) {
            scheduleLiningExport(300, { withCamera: false });
            return;
        }

        const allLoaded = liningPhotos.every((p) => imageObjects[p.id]);
        if (allLoaded) scheduleLiningExport(400, { withCamera: true });
    }, [liningPhotos, imageObjects, scheduleLiningExport]);

    useEffect(
        () => () => clearTimeout(liningExportTimerRef.current),
        []
    );

    const handlePhotoUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        const newPhoto = {
                            id: Date.now() + Math.random(),
                            url: event.target.result,
                            x: 0.5,
                            y: 0.5,
                            scale: 1,
                            rotation: 0,
                            width: img.width,
                            height: img.height
                        };
                        setLiningPhotos(prev => [...prev, newPhoto]);
                        setSelectedPhotoId(newPhoto.id);
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const handleRemovePhoto = (id) => {
        setLiningPhotos((prev) => prev.filter((p) => p.id !== id));
        setImageObjects((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
        if (selectedPhotoId === id) setSelectedPhotoId(null);
        skipAutoExportRef.current = false;
        scheduleLiningExport(100, { withCamera: false });
    };

    const updatePhotoProps = (id, props) => {
        preserveConfigPanelScroll(() => {
            setLiningPhotos((prev) =>
                prev.map((p) => (p.id === id ? { ...p, ...props } : p))
            );
        });
    };




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
                    disabled={false}
                />

                <ColorSelector
                    label="Sløjfe"
                    currentSelection={selectedBowColor}
                    onSelectionChange={setSelectedBowColor}
                    colorOptions={bowColorOptions}
                />

                <LiningPhotoEditor
                    label="Billede til Indvendig Foer"
                    disabled={false}
                    liningPhotos={liningPhotos}
                    imageObjects={imageObjects}
                    selectedPhotoId={selectedPhotoId}
                    onSelectPhoto={setSelectedPhotoId}
                    onUpload={handlePhotoUpload}
                    onRemove={handleRemovePhoto}
                    onUpdatePhoto={updatePhotoProps}
                    onAdjustStart={beginLiningInteraction}
                    onAdjustEnd={endLiningInteraction}
                />
            </div>
        </>
    );
};

export default Foer;
