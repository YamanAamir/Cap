import React, { useState, useEffect, useRef } from 'react';

const Foer = ({ selectedOptions = {}, onOptionChange, currentEmblem, program }) => {
    // ====================== Default Values ======================
    const getDefaultKokardeMaterial = () => 'LÃ¦der';
    const getDefaultKokardeColor = () => 'Hvid';
    const getDefaultBowColor = () => 'Hvid';
    const getDefaultFoerMaterial = () => 'Polyester';

    const getDefaultSatinType = () => {
        switch (program?.toLowerCase()) {
            case 'hhx': return 'Royal blÃ¥';
            case 'htx': return 'Navy blÃ¥';
            case 'stx': return 'Bordeaux';
            case 'hf': return 'Light blÃ¥';
            case 'eux': return 'GrÃ¥';
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
        selectedOptions.SlÃjfe || getDefaultBowColor()
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
        'Sosuassistent', 'SosuhjÃ¦lper', 'FrisÃ¸r', 'Kosmetolog',
        'PÃ¦dagog', 'PAU', 'ErnÃ¦ringsassisten'
    ];
    const isRestricted = restrictedPrograms.some(
        p => p.toLowerCase() === program?.toLowerCase()
    );

    const kokardeMaterialTypes = isRestricted
        ? ['LÃ¦der']
        : ['LÃ¦der', 'KunstlÃ¦der', 'Ruskin', 'Alcantra'];

    // ====================== Emblem & Colors ======================
    const getCurrentEmblem = () => {
        return currentEmblem.name === 'Guld'
            ? { name: 'Guld', value: 'Guld', color: '#FFD700' }
            : { name: 'SÃ¸lv', value: 'SÃ¸lv', color: '#C0C0C0' };
    };

    const getSatinColor = () => {
        switch (program?.toLowerCase()) {
            case 'hhx': return { name: 'Royal blÃ¥', value: 'Royal blÃ¥', color: '#4169e1' };
            case 'htx': return { name: 'Navy blÃ¥', value: 'Navy blÃ¥', color: '#000080' };
            case 'stx': return { name: 'Bordeaux', value: 'Bordeaux', color: '#800020' };
            case 'hf': return { name: 'Light blÃ¥', value: 'Light blÃ¥', color: '#ADD8E6' };
            case 'eux': return { name: 'GrÃ¥', value: 'GrÃ¥', color: '#5d5d66' };
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

    // ====================== postMessage Effects (à¤¸à¤­à¥€ à¤¹à¤®à¥‡à¤¶à¤¾ à¤­à¥‡à¤œà¥‡à¤‚à¤—à¥‡) ======================

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

    // SlÃ¸jfe
    useEffect(() => {
        onOptionChange('SlÃ¸jfe', selectedBowColor);
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

    // à¤œà¤¬ Foer Material à¤¬à¤¦à¤²à¤¤à¤¾ à¤¹à¥ˆ â†’ Satin/Silk à¤•à¥‹ à¤¹à¥ˆà¤‚à¤¡à¤² à¤•à¤°à¥‡à¤‚ + à¤®à¥ˆà¤¸à¥‡à¤œ à¤­à¥‡à¤œà¥‡à¤‚
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
            case 'LÃ¦der': return [{ name: 'Hvid', value: 'Hvid', color: '#ffffff' }, { name: 'Sort', value: 'Sort', color: '#000000' }];
            case 'KunstlÃ¦der': return [{ name: 'Vegansk', value: 'Vegansk', color: '#006644' }];
            case 'Ruskin': return [{ name: 'Cognac', value: 'Cognac', color: '#a66f5a' }];
            case 'Alcantra': return [{ name: 'Sort', value: 'Sort', color: '#000000' }];
            default: return [{ name: 'Hvid', value: 'Hvid', color: '#ffffff' }];
        }
    };

    const kokardeColorOptions = getKokardeColorOptions(selectedKokardeMaterial);

    // à¤…à¤—à¤° material à¤¬à¤¦à¤²à¤¨à¥‡ à¤¸à¥‡ color invalid à¤¹à¥‹ à¤œà¤¾à¤ à¤¤à¥‹ à¤ªà¤¹à¤²à¤¾ valid color à¤šà¥à¤¨ à¤²à¥‡à¤‚
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
        const canvasRef = useRef(null);
        const dragState = useRef({ active: false, mode: null, startX: 0, startY: 0, startVal: 0 });
        const [, forceUpdate] = useState(0); // trigger re-render for controls panel

        // â”€â”€ Canvas dimensions (logical) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        const CW = 500, CH = 455;

        // â”€â”€ Snap â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        const SNAP = 0.04;
        const snap = (v) => Math.abs(v - 0.5) < SNAP ? 0.5 : v;

        // â”€â”€ Hit-test helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        const HANDLE_R = 14;

        const getHandlePositions = (photo) => {
            const cx = photo.x * CW;
            const cy = photo.y * CH;
            const img = imageObjects[photo.id];
            const w = img ? img.width * photo.scale : 80 * photo.scale;
            const h = img ? img.height * photo.scale : 80 * photo.scale;
            const rad = (photo.rotation || 0) * Math.PI / 180;
            const rotOffset = h / 2 + 30;
            const rotX = cx + Math.sin(rad) * (-rotOffset);
            const rotY = cy - Math.cos(rad) * rotOffset;
            const scX = cx + Math.cos(rad) * (w / 2) - Math.sin(rad) * (h / 2);
            const scY = cy + Math.sin(rad) * (w / 2) + Math.cos(rad) * (h / 2);
            const delX = cx + Math.cos(rad) * (w / 2) + Math.sin(rad) * (h / 2);
            const delY = cy + Math.sin(rad) * (w / 2) - Math.cos(rad) * (h / 2);
            return { rotX, rotY, scX, scY, delX, delY, cx, cy, w, h };
        };

        const hitHandle = (px, py, hx, hy) => Math.hypot(px - hx, py - hy) <= HANDLE_R + 4;

        const hitImage = (px, py, photo) => {
            const img = imageObjects[photo.id];
            const w = img ? img.width * photo.scale : 80 * photo.scale;
            const h = img ? img.height * photo.scale : 80 * photo.scale;
            const cx = photo.x * CW;
            const cy = photo.y * CH;
            const rad = -(photo.rotation || 0) * Math.PI / 180;
            const dx = px - cx, dy = py - cy;
            const lx = dx * Math.cos(rad) - dy * Math.sin(rad);
            const ly = dx * Math.sin(rad) + dy * Math.cos(rad);
            return Math.abs(lx) <= w / 2 && Math.abs(ly) <= h / 2;
        };


        // ── Draw canvas ───────────────────────────────────────────────
        useEffect(() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, CW, CH);

            // Oval clip
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(CW / 2, CH / 2, CW / 2 - 2, CH / 2 - 2, 0, 0, Math.PI * 2);
            ctx.clip();

            // Background gradient
            const grad = ctx.createRadialGradient(CW / 2, CH / 2, 0, CW / 2, CH / 2, CW / 2);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(1, '#e9ecef');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, CW, CH);

            // Draw images
            liningPhotos.forEach(photo => {
                const img = imageObjects[photo.id];
                if (!img) return;
                ctx.save();
                ctx.translate(photo.x * CW, photo.y * CH);
                ctx.rotate((photo.rotation || 0) * Math.PI / 180);
                const w = img.width * photo.scale;
                const h = img.height * photo.scale;
                ctx.drawImage(img, -w / 2, -h / 2, w, h);
                ctx.restore();
            });

            // Depth shading overlay
            const shade = ctx.createRadialGradient(CW / 2, CH / 2, CW * 0.3, CW / 2, CH / 2, CW / 2);
            shade.addColorStop(0, 'rgba(0,0,0,0)');
            shade.addColorStop(1, 'rgba(0,0,0,0.07)');
            ctx.fillStyle = shade;
            ctx.fillRect(0, 0, CW, CH);
            ctx.restore();

            // Snap guides (visible when a photo is selected)
            const selPhoto = liningPhotos.find(p => p.id === selectedPhotoId);
            if (selPhoto) {
                const nearX = Math.abs(selPhoto.x - 0.5) < SNAP;
                const nearY = Math.abs(selPhoto.y - 0.5) < SNAP;
                ctx.save();
                ctx.setLineDash([4, 4]);
                ctx.lineWidth = 1;
                ctx.strokeStyle = nearX ? 'rgba(59,130,246,0.85)' : 'rgba(59,130,246,0.22)';
                ctx.beginPath(); ctx.moveTo(CW / 2, 0); ctx.lineTo(CW / 2, CH); ctx.stroke();
                ctx.strokeStyle = nearY ? 'rgba(59,130,246,0.85)' : 'rgba(59,130,246,0.22)';
                ctx.beginPath(); ctx.moveTo(0, CH / 2); ctx.lineTo(CW, CH / 2); ctx.stroke();
                ctx.setLineDash([]);
                ctx.beginPath();
                ctx.arc(CW / 2, CH / 2, nearX && nearY ? 5 : 3, 0, Math.PI * 2);
                ctx.fillStyle = nearX && nearY ? 'rgba(59,130,246,0.9)' : 'rgba(59,130,246,0.4)';
                ctx.fill();
                ctx.restore();
            }

            // Selection outline + handles
            if (selPhoto) {
                const img = imageObjects[selPhoto.id];
                const w = img ? img.width * selPhoto.scale : 80 * selPhoto.scale;
                const h = img ? img.height * selPhoto.scale : 80 * selPhoto.scale;
                const cx = selPhoto.x * CW;
                const cy = selPhoto.y * CH;
                const rad = (selPhoto.rotation || 0) * Math.PI / 180;

                // Dashed bounding box
                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(rad);
                ctx.strokeStyle = 'rgba(59,130,246,0.9)';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([5, 3]);
                ctx.strokeRect(-w / 2 - 4, -h / 2 - 4, w + 8, h + 8);
                ctx.setLineDash([]);
                ctx.restore();

                const { rotX, rotY, scX, scY, delX, delY } = getHandlePositions(selPhoto);

                // Delete handle only
                ctx.save();
                ctx.beginPath();
                ctx.arc(delX, delY, HANDLE_R, 0, Math.PI * 2);
                ctx.fillStyle = '#ef4444';
                ctx.shadowColor = 'rgba(0,0,0,0.2)';
                ctx.shadowBlur = 7;
                ctx.fill();
                ctx.shadowBlur = 0;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.restore();
                ctx.save();
                ctx.font = `bold ${HANDLE_R + 1}px sans-serif`;
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('\u00D7', delX, delY + 1);
                ctx.restore();
            }

            // Empty state hint
            if (liningPhotos.length === 0) {
                ctx.save();
                ctx.fillStyle = '#94a3b8';
                ctx.font = '600 13px system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('Upload Design', CW / 2, CH / 2 + 22);
                ctx.restore();
            }
        }, [liningPhotos, imageObjects, selectedPhotoId]);

        // ── Canvas coordinate helper ──────────────────────────────────
        const getCanvasPos = (clientX, clientY) => {
            const canvas = canvasRef.current;
            if (!canvas) return { x: 0, y: 0 };
            const rect = canvas.getBoundingClientRect();
            return {
                x: (clientX - rect.left) * (CW / rect.width),
                y: (clientY - rect.top) * (CH / rect.height),
            };
        };

        const getCursor = (px, py) => {
            if (disabled) return 'default';
            for (let i = liningPhotos.length - 1; i >= 0; i--) {
                const photo = liningPhotos[i];
                if (!imageObjects[photo.id]) continue;
                if (photo.id === selectedPhotoId) {
                    const h = getHandlePositions(photo);
                    if (hitHandle(px, py, h.delX, h.delY)) return 'pointer';
                }
                if (hitImage(px, py, photo)) return 'grab';
            }
            return 'default';
        };

        // ── Unified pointer down ──────────────────────────────────────
        const onPointerDown = (clientX, clientY) => {
            if (disabled) return;
            const { x: px, y: py } = getCanvasPos(clientX, clientY);

            // Check handles on selected photo first
            if (selectedPhotoId) {
                const selPhoto = liningPhotos.find(p => p.id === selectedPhotoId);
                if (selPhoto && imageObjects[selPhoto.id]) {
                    const h = getHandlePositions(selPhoto);
                    if (hitHandle(px, py, h.delX, h.delY)) {
                        handleRemovePhoto(selPhoto.id);
                        return;
                    }
                }
            }

            // Hit-test images top-most first
            for (let i = liningPhotos.length - 1; i >= 0; i--) {
                const photo = liningPhotos[i];
                if (!imageObjects[photo.id]) continue;
                if (hitImage(px, py, photo)) {
                    setSelectedPhotoId(photo.id);
                    setLiningPhotos(prev => {
                        const item = prev.find(p => p.id === photo.id);
                        if (!item) return prev;
                        return [...prev.filter(p => p.id !== photo.id), item];
                    });
                    dragState.current = { active: true, mode: 'move', startX: px, startY: py, startVal: 0 };
                    forceUpdate(n => n + 1);
                    return;
                }
            }

            // Click on empty canvas -> deselect
            setSelectedPhotoId(null);
            forceUpdate(n => n + 1);
        };

        // ── Unified pointer move ──────────────────────────────────────
        const onPointerMove = (clientX, clientY) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const { x: px, y: py } = getCanvasPos(clientX, clientY);

            canvas.style.cursor = dragState.current.active
                ? 'grabbing'
                : getCursor(px, py);

            if (!dragState.current.active || !selectedPhotoId) return;
            const photo = liningPhotos.find(p => p.id === selectedPhotoId);
            if (!photo) return;

            const { mode, startX, startY, startVal } = dragState.current;

            if (mode === 'move') {
                const newX = snap(Math.max(0, Math.min(1, photo.x + (px - startX) / CW)));
                const newY = snap(Math.max(0, Math.min(1, photo.y + (py - startY) / CH)));
                updatePhotoProps(selectedPhotoId, { x: newX, y: newY });
                dragState.current.startX = px;
                dragState.current.startY = py;
            } else if (mode === 'rotate') {
                const cx = photo.x * CW;
                const cy = photo.y * CH;
                const angle = Math.atan2(py - cy, px - cx) * 180 / Math.PI + 90;
                updatePhotoProps(selectedPhotoId, { rotation: angle });
            } else if (mode === 'scale') {
                const dx = px - startX;
                const dy = py - startY;
                const dist = Math.sqrt(dx * dx + dy * dy) / 150;
                const newScale = px > startX ? startVal + dist : startVal - dist;
                updatePhotoProps(selectedPhotoId, { scale: Math.max(0.05, Math.min(5, newScale)) });
            }
        };

        const onPointerUp = () => { dragState.current.active = false; };

        // ── Event handlers ────────────────────────────────────────────
        const handleMouseDown = (e) => { e.preventDefault(); onPointerDown(e.clientX, e.clientY); };
        const handleMouseMove = (e) => onPointerMove(e.clientX, e.clientY);
        const handleMouseUp = () => onPointerUp();
        const handleTouchStart = (e) => { e.preventDefault(); const t = e.touches[0]; onPointerDown(t.clientX, t.clientY); };
        const handleTouchMove = (e) => { e.preventDefault(); const t = e.touches[0]; onPointerMove(t.clientX, t.clientY); };
        const handleTouchEnd = () => onPointerUp();

        const selectedPhoto = liningPhotos.find(p => p.id === selectedPhotoId);

        return (
            <div className={`space-y-4 mt-8 ${disabled ? 'pointer-events-none opacity-50' : ''}`}>
                <label className="text-sm font-semibold text-slate-700">{label}</label>

                {/* Canvas Preview - oval clipped */}
                <div
                    className="relative max-w-md mx-auto"
                    style={{
                        borderRadius: '50%',
                        overflow: 'hidden',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.13), 0 1.5px 4px rgba(0,0,0,0.08)',
                    }}
                >
                    <canvas
                        ref={canvasRef}
                        width={CW}
                        height={CH}
                        className="w-full h-auto block"
                        style={{ display: 'block', touchAction: 'none' }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    />
                </div>

                {/* Upload Button */}
                <div className="flex justify-center pt-1">
                    <label className="w-full max-w-sm flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white text-blue-600 border-2 border-blue-100 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all shadow-sm">
                        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M16.88 9.1A4 4 0 0 1 16 17H5a5 5 0 0 1-1-9.9V7a3 3 0 0 1 4.52-2.59A4.98 4.98 0 0 1 17 8c0 .38-.04.74-.12 1.1zM11 11h3l-4-4-4 4h3v3h2v-3z" />
                        </svg>
                        <span className="text-sm font-bold">Tilf&#248;j flere billeder</span>
                        <input type="file" className="hidden" accept="image/*" multiple onChange={handlePhotoUpload} />
                    </label>
                </div>

                {/* Controls Panel - shown when a photo is selected */}
                {selectedPhoto && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                            <span className="text-sm font-bold text-slate-800">Justering</span>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleRemovePhoto(selectedPhotoId)}
                                    className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors"
                                >
                                    Fjern
                                </button>
                                <button
                                    onClick={() => { setSelectedPhotoId(null); forceUpdate(n => n + 1); }}
                                    className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    F&#230;rdig
                                </button>
                            </div>
                        </div>

                        <div className="px-5 py-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">St&#248;rrelse</label>
                                        <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded tabular-nums">
                                            {Math.round((selectedPhoto.scale || 1) * 100)}%
                                        </span>
                                    </div>
                                    <input
                                        type="range" min="0.05" max="5" step="0.01"
                                        value={selectedPhoto.scale || 0.5}
                                        onChange={(e) => updatePhotoProps(selectedPhotoId, { scale: parseFloat(e.target.value) })}
                                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rotation</label>
                                        <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded tabular-nums">
                                            {Math.round(((selectedPhoto.rotation || 0) % 360 + 360) % 360)}&#176;
                                        </span>
                                    </div>
                                    <input
                                        type="range" min="0" max="360" step="1"
                                        value={((selectedPhoto.rotation || 0) % 360 + 360) % 360}
                                        onChange={(e) => updatePhotoProps(selectedPhotoId, { rotation: parseInt(e.target.value) })}
                                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Centrer</span>
                                <button
                                    onClick={() => updatePhotoProps(selectedPhotoId, { x: 0.5 })}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 transition-colors"
                                >
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                        <line x1="12" y1="3" x2="12" y2="21" />
                                        <line x1="3" y1="12" x2="21" y2="12" strokeOpacity="0.3" />
                                    </svg>
                                    Vandret
                                </button>
                                <button
                                    onClick={() => updatePhotoProps(selectedPhotoId, { y: 0.5 })}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 transition-colors"
                                >
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                        <line x1="3" y1="12" x2="21" y2="12" />
                                        <line x1="12" y1="3" x2="12" y2="21" strokeOpacity="0.3" />
                                    </svg>
                                    Lodret
                                </button>
                                <button
                                    onClick={() => updatePhotoProps(selectedPhotoId, { x: 0.5, y: 0.5 })}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 transition-colors"
                                >
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                        <circle cx="12" cy="12" r="3" />
                                        <line x1="12" y1="3" x2="12" y2="9" />
                                        <line x1="12" y1="15" x2="12" y2="21" />
                                        <line x1="3" y1="12" x2="9" y2="12" />
                                        <line x1="15" y1="12" x2="21" y2="12" />
                                    </svg>
                                    Begge
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <p className="text-xs text-center text-slate-400 px-4 leading-relaxed">
                    Klik for at v&#230;lge &middot; Tr&#230;k for at flytte &middot; &#8635; roter &middot; &#10561; skaler &middot; &times; fjern
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
                    label="SlÃ¸jfe"
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
