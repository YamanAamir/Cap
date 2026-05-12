import React, { useState, useEffect, useRef } from 'react';

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
        const initial = selectedOptions['Indvendigt foer billede'];
        if (Array.isArray(initial)) return initial;
        if (typeof initial === 'string' && initial) {
            return [{ id: Date.now(), url: initial, x: 0.5, y: 0.5, scale: 1, rotation: 0 }];
        }
        return [];
    });
    const [selectedPhotoId, setSelectedPhotoId] = useState(null);
    const [imageObjects, setImageObjects] = useState({}); // Cache for HTMLImageElements

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
    const renderComposite = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1000;
        canvas.height = 1000;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Apply Oval Clipping Mask
        ctx.beginPath();
        ctx.ellipse(500, 500, 480, 380, 0, 0, Math.PI * 2);
        ctx.clip();

        // Draw all images using cached objects
        liningPhotos.forEach(photo => {
            const img = imageObjects[photo.id];
            if (!img) return;

            ctx.save();
            const centerX = canvas.width * photo.x;
            const centerY = canvas.height * photo.y;
            
            ctx.translate(centerX, centerY);
            ctx.rotate((photo.rotation || 0) * Math.PI / 180);
            
            const drawWidth = img.width * photo.scale;
            const drawHeight = img.height * photo.scale;
            
            ctx.drawImage(
                img, 
                -drawWidth / 2, 
                -drawHeight / 2, 
                drawWidth, 
                drawHeight
            );
            ctx.restore();
        });

        const dataUrl = canvas.toDataURL('image/png', 0.8);
        onOptionChange('Indvendigt foer billede', liningPhotos);
        
        // Use a timeout to avoid flooding the iframe with messages during fast dragging
        if (window.renderTimeout) clearTimeout(window.renderTimeout);
        window.renderTimeout = setTimeout(() => {
            sendMessage(`Innerlining:${dataUrl}`);
            sendMessage("liningphoto camera");
        }, 50); 
    };

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

    // Render when cache or photos change
    useEffect(() => {
        if (liningPhotos.length > 0) {
            const allLoaded = liningPhotos.every(p => imageObjects[p.id]);
            if (allLoaded) renderComposite();
        } else {
            const emptyImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
            sendMessage(`Innerlining:${emptyImageBase64}`);
            sendMessage("liningphoto camera");
        }
    }, [liningPhotos, imageObjects]);

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
                            scale: 0.5,
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
        setLiningPhotos(prev => prev.filter(p => p.id !== id));
        if (selectedPhotoId === id) setSelectedPhotoId(null);
    };

    const updatePhotoProps = (id, props) => {
        setLiningPhotos(prev => prev.map(p => p.id === id ? { ...p, ...props } : p));
    };


    const PhotoSelector = ({ label, disabled }) => {
        const previewRef = useRef(null);
        const [dragMode, setDragMode] = useState(null); // 'move', 'rotate', 'scale'
        const [startPos, setStartPos] = useState({ x: 0, y: 0, val: 0 });

        const handleTouchStart = (e, id, mode = 'move') => {
            if (disabled) return;
            e.stopPropagation();
            const touch = e.touches[0];
            setSelectedPhotoId(id);
            setDragMode(mode);
            
            const photo = liningPhotos.find(p => p.id === id);
            if (mode === 'move') {
                setStartPos({ x: touch.clientX, y: touch.clientY });
            } else if (mode === 'rotate') {
                setStartPos({ x: touch.clientX, y: touch.clientY, val: photo.rotation || 0 });
            } else if (mode === 'scale') {
                setStartPos({ x: touch.clientX, y: touch.clientY, val: photo.scale || 0.5 });
            }

            setLiningPhotos(prev => {
                const item = prev.find(p => p.id === id);
                return [...prev.filter(p => p.id !== id), item];
            });
        };

        const handleTouchMove = (e) => {
            if (!dragMode || !selectedPhotoId || !previewRef.current) return;
            const touch = e.touches[0];
            const rect = previewRef.current.getBoundingClientRect();
            const photo = liningPhotos.find(p => p.id === selectedPhotoId);
            
            if (dragMode === 'move') {
                const dx = (touch.clientX - startPos.x) / rect.width;
                const dy = (touch.clientY - startPos.y) / rect.height;
                updatePhotoProps(selectedPhotoId, { 
                    x: Math.max(0, Math.min(1, photo.x + dx)), 
                    y: Math.max(0, Math.min(1, photo.y + dy)) 
                });
                setStartPos({ x: touch.clientX, y: touch.clientY });
            } else if (dragMode === 'rotate') {
                const centerX = rect.left + rect.width * photo.x;
                const centerY = rect.top + rect.height * photo.y;
                const angle = Math.atan2(touch.clientY - centerY, touch.clientX - centerX) * 180 / Math.PI;
                updatePhotoProps(selectedPhotoId, { rotation: angle + 90 });
            } else if (dragMode === 'scale') {
                const dx = touch.clientX - startPos.x;
                const dy = touch.clientY - startPos.y;
                const dist = Math.sqrt(dx * dx + dy * dy) / 200;
                const newVal = touch.clientX > startPos.x ? startPos.val + dist : startPos.val - dist;
                updatePhotoProps(selectedPhotoId, { scale: Math.max(0.1, Math.min(3, newVal)) });
            }
        };

        const handleMouseDown = (e, id, mode = 'move') => {
            if (disabled) return;
            e.stopPropagation();
            setSelectedPhotoId(id);
            setDragMode(mode);
            
            const photo = liningPhotos.find(p => p.id === id);
            if (mode === 'move') {
                setStartPos({ x: e.clientX, y: e.clientY });
            } else if (mode === 'rotate') {
                setStartPos({ x: e.clientX, y: e.clientY, val: photo.rotation || 0 });
            } else if (mode === 'scale') {
                setStartPos({ x: e.clientX, y: e.clientY, val: photo.scale || 0.5 });
            }

            // Bring to front
            setLiningPhotos(prev => {
                const item = prev.find(p => p.id === id);
                return [...prev.filter(p => p.id !== id), item];
            });
        };

        const handleMouseMove = (e) => {
            if (!dragMode || !selectedPhotoId || !previewRef.current) return;
            
            const rect = previewRef.current.getBoundingClientRect();
            const photo = liningPhotos.find(p => p.id === selectedPhotoId);
            
            if (dragMode === 'move') {
                const dx = (e.clientX - startPos.x) / rect.width;
                const dy = (e.clientY - startPos.y) / rect.height;
                updatePhotoProps(selectedPhotoId, { 
                    x: Math.max(0, Math.min(1, photo.x + dx)), 
                    y: Math.max(0, Math.min(1, photo.y + dy)) 
                });
                setStartPos({ x: e.clientX, y: e.clientY });
            } else if (dragMode === 'rotate') {
                const centerX = rect.left + rect.width * photo.x;
                const centerY = rect.top + rect.height * photo.y;
                const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180 / Math.PI;
                updatePhotoProps(selectedPhotoId, { rotation: angle + 90 });
            } else if (dragMode === 'scale') {
                const dx = e.clientX - startPos.x;
                const dy = e.clientY - startPos.y;
                const dist = Math.sqrt(dx * dx + dy * dy) / 200;
                const newVal = e.clientX > startPos.x ? startPos.val + dist : startPos.val - dist;
                updatePhotoProps(selectedPhotoId, { scale: Math.max(0.1, Math.min(3, newVal)) });
            }
        };

        const handleMouseUp = () => {
            setDragMode(null);
        };

        return (
            <div className={`space-y-6 mt-8 ${disabled ? 'pointer-events-none opacity-50' : ''}`}
                 onMouseMove={handleMouseMove}
                 onMouseUp={handleMouseUp}
                 onMouseLeave={handleMouseUp}
                 onTouchMove={handleTouchMove}
                 onTouchEnd={handleMouseUp}>
                <label className="text-sm font-semibold text-slate-700">{label}</label>
                
                {/* Oval Preview Area */}
                <div 
                    ref={previewRef}
                    className="relative w-full aspect-[4/3] max-w-md mx-auto bg-[#f8f9fa] border-2 border-slate-200 overflow-hidden shadow-2xl"
                    style={{ 
                        borderRadius: '50% 50% 45% 45% / 60% 60% 40% 40%',
                        background: 'radial-gradient(circle at 50% 50%, #ffffff 0%, #e9ecef 100%)'
                    }}
                >
                    {liningPhotos.length === 0 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                            <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-xs font-medium uppercase tracking-wider">Upload Design</span>
                        </div>
                    )}
                    
                    {liningPhotos.map(photo => (
                        <div
                            key={photo.id}
                            onMouseDown={(e) => handleMouseDown(e, photo.id)}
                            onTouchStart={(e) => handleTouchStart(e, photo.id)}
                            className={`absolute select-none ${selectedPhotoId === photo.id ? 'z-10' : 'z-0'}`}
                            style={{
                                left: `${photo.x * 100}%`,
                                top: `${photo.y * 100}%`,
                                transform: `translate(-50%, -50%) rotate(${photo.rotation || 0}deg) scale(${photo.scale})`,
                                width: photo.width ? `${photo.width / 4}px` : '100px',
                                height: 'auto',
                            }}
                        >
                            <div className={`relative group ${selectedPhotoId === photo.id ? 'ring-2 ring-blue-500 rounded-sm' : ''}`}>
                                <img src={photo.url} alt="Lining" className="w-full h-auto pointer-events-none select-none drop-shadow-md" />
                                
                                {selectedPhotoId === photo.id && (
                                    <>
                                        {/* Rotate Handle */}
                                        <div 
                                            className="absolute -top-10 left-1/2 -translate-x-1/2 w-8 h-8 bg-white border-2 border-blue-500 rounded-full cursor-alias flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform z-20"
                                            onMouseDown={(e) => handleMouseDown(e, photo.id, 'rotate')}
                                            onTouchStart={(e) => handleTouchStart(e, photo.id, 'rotate')}
                                        >
                                            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                        </div>
                                        
                                        {/* Scale Handle */}
                                        <div 
                                            className="absolute -bottom-3 -right-3 w-6 h-6 bg-white border-2 border-blue-500 rounded-full cursor-nwse-resize shadow-lg hover:scale-110 active:scale-95 transition-transform z-20 flex items-center justify-center"
                                            onMouseDown={(e) => handleMouseDown(e, photo.id, 'scale')}
                                            onTouchStart={(e) => handleTouchStart(e, photo.id, 'scale')}
                                        >
                                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                    
                    {/* Realistic Depth/Shading Overlay */}
                    <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.1)]" 
                         style={{ borderRadius: 'inherit' }} />
                    
                    {/* Inner highlight for curvature */}
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/5 to-transparent opacity-30" 
                         style={{ borderRadius: 'inherit' }} />
                </div>

                {/* Upload Button */}
                <div className="flex flex-col items-center">
                    <label className="w-full max-w-sm flex flex-col items-center px-4 py-4 rounded-2xl bg-white text-blue-600 border-2 border-blue-100 cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-all shadow-sm">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M16.88 9.1A4 4 0 0 1 16 17H5a5 5 0 0 1-1-9.9V7a3 3 0 0 1 4.52-2.59A4.98 4.98 0 0 1 17 8c0 .38-.04.74-.12 1.1zM11 11h3l-4-4-4 4h3v3h2v-3z" />
                            </svg>
                            <span className="text-sm font-bold">Tilføj flere billeder</span>
                        </div>
                        <input type="file" className="hidden" accept="image/*" multiple onChange={handlePhotoUpload} />
                    </label>
                </div>

                {/* Selected Image Controls */}
                {selectedPhotoId && (
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-800">Justering</span>
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => handleRemovePhoto(selectedPhotoId)}
                                    className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors"
                                >
                                    Fjern
                                </button>
                                <button 
                                    onClick={() => setSelectedPhotoId(null)}
                                    className="text-xs font-bold text-slate-400 hover:text-slate-600"
                                >
                                    Færdig
                                </button>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Størrelse</label>
                                    <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded">{Math.round((liningPhotos.find(p => p.id === selectedPhotoId)?.scale || 1) * 100)}%</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0.1" 
                                    max="3" 
                                    step="0.01"
                                    value={liningPhotos.find(p => p.id === selectedPhotoId)?.scale || 0.5}
                                    onChange={(e) => updatePhotoProps(selectedPhotoId, { scale: parseFloat(e.target.value) })}
                                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rotation</label>
                                    <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded">{Math.round(liningPhotos.find(p => p.id === selectedPhotoId)?.rotation || 0)}°</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="360" 
                                    step="1"
                                    value={liningPhotos.find(p => p.id === selectedPhotoId)?.rotation || 0}
                                    onChange={(e) => updatePhotoProps(selectedPhotoId, { rotation: parseInt(e.target.value) })}
                                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                            </div>
                        </div>
                    </div>
                )}
                
                <p className="text-xs text-center text-slate-500 px-4">
                    Træk billederne for at placere dem. Brug slideren til at ændre størrelse. 
                    Den hvide ovale viser det område, der vil være synligt på huen.
                </p>
            </div>
        );
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

                <PhotoSelector
                    label="Billede til Indvendig Foer"
                    disabled={false}
                />
            </div>
        </>
    );
};

export default Foer;