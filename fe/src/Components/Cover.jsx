import React, { useState, useEffect, useRef } from 'react';
import img1 from '../assets/stars/star.webp';
import img2 from '../assets/stars/2-star.webp';
import img3 from '../assets/stars/3-star.webp';
import img4 from '../assets/stars/4-star.webp';
import img5 from '../assets/stars/5-star.webp';
import img6 from '../assets/stars/6-star.webp';
import whiteGlitter from '../assets/button images/white glitter.webp';
import blackGlitter from '../assets/button images/black glitter.webp';
import coverColorOptionsimg1 from '../assets/cover images/silverahh.webp';
import coverColorOptionsimg2 from '../assets/cover images/none.webp';
import coverColorOptionsimg3 from '../assets/cover images/darkblueahh.webp';


import international from '../assets/flagbandimages/international.webp';
import usakinaden from '../assets/flagbandimages/USAKINADEN.webp';
import europe from '../assets/flagbandimages/europe.webp';

const Cover = ({ selectedOptions = {}, onOptionChange, program, currentEmblem }) => {
    // Default value functions

    const accessoryOptions = [
        { name: 'Yes', value: 'Yes', icon: '✔️' },
        { name: 'No', value: 'No', icon: '❌' },
    ];


    const getDefaultCoverColor = () => {
        switch (program?.toLowerCase()) {
            case 'pædagog': return 'Purple';
            default: return 'Hvid';
        }
    };

    const getDefaultTopkantColor = () => {
        switch (program?.toLowerCase()) {
            case 'pædagog': return 'Guld';
            default: return 'NONE';
        }
    };

    const getDefaultKantbandColor = () => {
        switch (program?.toLowerCase()) {

            default: return 'NONE';
        }
    };

    const getDefaultStarsStyle = () => {
        return 'NONE'; // Default no stars
    };

    // State variables with proper default values
    const cameraTriggers = useRef({});
    const [selectedCoverColor, setSelectedCoverColor] = useState(
        selectedOptions.Farve || getDefaultCoverColor()
    );
    const [selectedTopkantColor, setSelectedTopkantColor] = useState(
        selectedOptions.Topkant || getDefaultTopkantColor()
    );
    const [selectedKantbandColor, setSelectedKantbandColor] = useState(
        selectedOptions.Kantbånd || getDefaultKantbandColor()
    );
    const [selectedStarsStyle, setSelectedStarsStyle] = useState(
        selectedOptions.Stjerner || getDefaultStarsStyle()
    );
    const [selectedFlagbånd, setSelectedFlagbånd] = useState(
        selectedOptions.Flagbånd && selectedOptions.Flagbånd !== 'Nej'
            ? 'Yes'
            : 'No'
    );

    const [selectedFlagbåndOption, setSelectedFlagbåndOption] = useState(
        selectedOptions.Flagbånd === 'Nej' ? '' : selectedOptions.Flagbånd || 'Nej'
    );

    const hideSelectorsPrograms = [
        'sosuassistent',
        'sosuhjælper',
        'frisør',
        'kosmetolog',
        'pædagog',
        'pau',
        'ernæringsassisten'
    ];

    const shouldHideSelectors = hideSelectorsPrograms.includes(program?.toLowerCase());

    const paedagog = () => {
        switch (program?.toLowerCase()) {
            case 'pædagog':
                return { name: 'Purple', value: 'Purple', color: '#522854' };
            default:
                return null;
        }
    };

    const coverColorOptions = [
        { name: 'Hvid', value: 'Hvid', color: '#ffffff' },
        { name: 'Sort', value: 'Sort', color: '#000000' },
        paedagog(),
        { name: 'Hvid med glimmer', value: 'Hvid med glimmer', img: whiteGlitter, color: '#ffffff' },
        { name: 'Sort med glimmer', value: 'Sort med glimmer', img: blackGlitter, color: '#000000' },
    ].filter(Boolean);

    const getCoverColor = () => {
        switch (program?.toLowerCase()) {
            case 'hhx':
                return { name: 'HHX', value: 'HHX', color: '#0f378a' };
            case 'htx':
                return { name: 'HTX', value: 'HTX', color: '#000080' };
            case 'stx':
                return { name: 'STX', value: 'STX', color: '#7F1D1D' };
            case 'hf':
                return { name: 'HF', value: 'HF', color: '#5585b7' };
            case 'eux':
                return { name: 'EUX', value: 'EUX', color: '#7c7f82' };
            case 'eud':
                return { name: 'EUD', value: 'EUD', color: '#522854' };
            case 'pædagog':
                return { name: 'Pædagog', value: 'Pædagog', color: '#522854' };

            default:
                return null;
        }
    };

    const getCurrentEmblem = () => {
        switch (currentEmblem.name) {
            case 'Guld':
                return { name: 'Guld', value: 'Guld', color: '#FFD700' };
            default:
                return { name: 'Sølv', value: 'Sølv', color: '#C0C0C0' };
        }
    };

    const edgebandColorOptions = program?.toLowerCase() === 'pædagog'
        ? [
            { name: 'NONE', value: 'NONE', img: coverColorOptionsimg2 },
            { name: 'Guld', value: 'Gold', color: '#EAB308' },
        ]
        : [
            { name: 'NONE', value: 'NONE', img: coverColorOptionsimg2 },
            { name: 'Hvid', value: 'Hvid', color: '#ffffff' },
            { name: 'Sort', value: 'Sort', color: '#3d3d3d' },
            { name: 'Lilla', value: 'Purple', color: '#A855F7' },
            { name: 'Grøn', value: 'Green', color: '#22C55E' },
            { name: 'Gul', value: 'Yellow', color: '#EAB308' },
            { name: 'Lyserød', value: 'Pink', color: '#EC4899' },
            ...((program?.toLowerCase() === 'eux') ? [
                { name: 'HHX', value: 'Royal Blue', color: '#4169e1' },
                { name: 'Bordeaux', value: 'Bordeaux', color: '#7F1D1D' },
            ] : []),
            ///zee///
            getCoverColor()
        ].filter(Boolean);

    const topKantColorOptions = [
        { name: 'NONE', value: 'NONE', img: coverColorOptionsimg2 },
        getCurrentEmblem(),
    ].filter(Boolean);

    const starsOptions = [
        { name: 'NONE', value: 'NONE', img: coverColorOptionsimg2 },
        { name: 'One Star', value: '1', img: img1 },
        { name: 'Two Stars', value: '2', img: img2 },
        { name: 'Three Stars', value: '3', img: img3 },
        { name: 'Four Stars', value: '4', img: img4 },
        { name: 'Five Stars', value: '5', img: img5 },
        { name: 'Six Stars', value: '6', img: img6 },
    ];

    const flagbandOptions = [
        { name: 'International', value: 'International', img: international },
        { name: 'Frankrig-Spanien-Tyskland-UK-Danmark', value: 'Frankrig-Spanien-Tyskland-UK-Danmark', img: europe },
        { name: 'Usa-Kina-Danmark', value: 'Usa-Kina-Danmark', img: usakinaden },

    ];

    // Effect hooks to propagate changes to parent component
    useEffect(() => {
        onOptionChange('Farve', selectedCoverColor);
    }, [selectedCoverColor]);


    useEffect(() => {
        const colorMap = {
            'purple': 'CoverColor:Purple',
            'hvid med glimmer': 'CoverColor:Hvid med glimmer',
            'sort med glimmer': 'CoverColor:Sort med glimmer',
            'hvid': 'CoverColor:Hvid',
            'sort': 'CoverColor:Sort'
        };

        if (!selectedCoverColor) return;

        // lowercase safety
        const message = colorMap[selectedCoverColor.toLowerCase()];
        if (!message) return;

        const sendMessageToIframes = (msg) => {
            ['preview-iframe', 'preview-iframe2'].forEach((id) => {
                const iframe = document.getElementById(id);
                if (iframe?.contentWindow) {
                    iframe.contentWindow.postMessage(msg, "*");
                    if (cameraTriggers.current["coverfarbe"]) {
                        iframe.contentWindow.postMessage("coverfarbe camera", "*");
                    }
                }
            });
            cameraTriggers.current["coverfarbe"] = true;
        };

        sendMessageToIframes(message);
    }, [selectedCoverColor]);



    useEffect(() => {
        onOptionChange('Topkant', selectedTopkantColor);
    }, [selectedTopkantColor]);
    useEffect(() => {
        const colorMap = {
            'none': 'Topkant:none',
            'guld': 'Topkant:Hvid guld',
            'sølv': 'Topkant:sølv',

        };

        if (!selectedTopkantColor) return;

        // lowercase safety
        const message = colorMap[selectedTopkantColor.toLowerCase()];
        if (!message) return;

        const sendMessageToIframes = (msg) => {
            ['preview-iframe', 'preview-iframe2'].forEach((id) => {
                const iframe = document.getElementById(id);
                if (iframe?.contentWindow) {
                    iframe.contentWindow.postMessage(msg, "*");
                    if (cameraTriggers.current["topkant"]) {
                        iframe.contentWindow.postMessage("topkant camera", "*");
                    }
                }
            });
            cameraTriggers.current["topkant"] = true;
        };

        sendMessageToIframes(message);
    }, [selectedTopkantColor]);








    useEffect(() => {
        onOptionChange('Kantbånd', selectedKantbandColor);
    }, [selectedKantbandColor]);
    useEffect(() => {
        const colorMap = {
            'hhx': 'Kantband:HHX',
            'htx': 'Kantband:HTX',
            'stx': 'Kantband:STX',
            'hf': 'Kantband:HF',
            'eux': 'Kantband:EUX',
            'eud': 'Kantband:EUD',
            'purple': 'Kantband:Purple',
            'none': 'Kantband:NONE',
            'hvid': 'Kantband:Hvid',
            ///zee///
            'sort': 'Kantband:Sort',
            'hhx': 'Kantband:Royal Blue',
            'bordeaux': 'Kantband:Bordeaux',
            'green': 'Kantband:Green',
            'yellow': 'Kantband:Yellow',
            'pink': 'Kantband:Pink',
            'gold': 'Kantband:Yellow',
            ///zee///
        };

        if (!selectedKantbandColor) return;

        // lowercase safety
        let message = colorMap[selectedKantbandColor.toLowerCase()];
        if (program?.toLowerCase() === 'pædagog' && selectedKantbandColor.toLowerCase() === 'gold') {
            message = 'Kantband:Gold';
        }
        if (!message) return;

        const sendMessageToIframes = (msg) => {
            ['preview-iframe', 'preview-iframe2'].forEach((id) => {
                const iframe = document.getElementById(id);
                if (iframe?.contentWindow) {
                    iframe.contentWindow.postMessage(msg, "*");
                    if (cameraTriggers.current["kantband"]) {
                        iframe.contentWindow.postMessage("kantband camera", "*");
                    }
                }
            });
            cameraTriggers.current["kantband"] = true;
        };

        sendMessageToIframes(message);

    }, [selectedKantbandColor]);









    useEffect(() => {
        onOptionChange('Stjerner', selectedStarsStyle);
    }, [selectedStarsStyle]);
    useEffect(() => {
        const colorMap = {
            'none': 'Star:0',
            '1': 'Star:1',
            '2': 'Star:2',
            '3': 'Star:3',
            '4': 'Star:4',
            '5': 'Star:5',
            '6': 'Star:6'
        };

        if (!selectedStarsStyle) return;

        // lowercase safety
        const message = colorMap[selectedStarsStyle.toLowerCase()];
        if (!message) return;

        const sendMessageToIframes = (msg) => {
            ['preview-iframe', 'preview-iframe2'].forEach((id) => {
                const iframe = document.getElementById(id);
                if (iframe?.contentWindow) {
                    iframe.contentWindow.postMessage(msg, "*");
                    if (cameraTriggers.current["stars"]) {
                        iframe.contentWindow.postMessage("stars camera", "*");
                    }
                }
            });
            cameraTriggers.current["stars"] = true;
        };

        sendMessageToIframes(message);

        if (selectedKantbandColor == "NONE") {

            ['preview-iframe', 'preview-iframe2'].forEach((id) => {
                const iframe = document.getElementById(id);
                if (iframe?.contentWindow) {
                    iframe.contentWindow.postMessage('Star:0', "*");
                }
            });

        }



    }, [selectedStarsStyle, selectedKantbandColor]);











    useEffect(() => {
        if (selectedFlagbånd === 'Yes') {
            // If user already has a choice, keep it
            if (selectedFlagbåndOption && selectedFlagbåndOption !== 'Nej') {
                onOptionChange('Flagbånd', selectedFlagbåndOption);
                ['preview-iframe', 'preview-iframe2'].forEach((id) => {
                    const iframe = document.getElementById(id);
                    if (iframe?.contentWindow) {
                        iframe.contentWindow.postMessage(`Flagband:${selectedFlagbåndOption}`, "*");
                        if (cameraTriggers.current["flagband"]) {
                            iframe.contentWindow.postMessage("flagband camera", "*");
                        }
                    }
                });
                cameraTriggers.current["flagband"] = true;
            }
            // If no prior selection, default to International
            else {
                setSelectedFlagbåndOption('International');
                onOptionChange('Flagbånd', 'International');
            }
        } else if (selectedFlagbånd === 'No') {
            onOptionChange('Flagbånd', 'Nej');
            ['preview-iframe', 'preview-iframe2'].forEach((id) => {
                const iframe = document.getElementById(id);
                if (iframe?.contentWindow) {
                    iframe.contentWindow.postMessage('Flagband:none', "*");
                    if (cameraTriggers.current["flagband_no"]) {
                        iframe.contentWindow.postMessage("flagband camera", "*");
                    }
                }
            });
            cameraTriggers.current["flagband_no"] = true;
        }
    }, [selectedFlagbånd]);



    useEffect(() => {


        onOptionChange('Flagbånd', selectedFlagbåndOption);

    }, [selectedFlagbåndOption]);
    useEffect(() => {

        const colorMap = {
            'international': 'Flagband:International',
            'frankrig-spanien-tyskland-uk-danmark': 'Flagband:Frankrig-Spanien-Tyskland-UK-Danmark',
            'usa-kina-danmark': 'Flagband:Usa-Kina-Danmark'
        }

        if (!selectedFlagbåndOption) return;

        // lowercase safety
        const message = colorMap[selectedFlagbåndOption.toLowerCase()];
        if (!message) return;

        const sendMessageToIframes = (msg) => {
            ['preview-iframe', 'preview-iframe2'].forEach((id) => {
                const iframe = document.getElementById(id);
                if (iframe?.contentWindow) {
                    iframe.contentWindow.postMessage(msg, "*");
                    if (cameraTriggers.current["flagband_opt"]) {
                        iframe.contentWindow.postMessage("flagband camera", "*");
                    }
                }
            });
            cameraTriggers.current["flagband_opt"] = true;
        };

        sendMessageToIframes(message);


    }, [selectedFlagbåndOption]);


    const AccessorySelector = ({
        label,
        currentSelection,
        onSelectionChange
    }) => (
        <div className="space-y-4">
            <div>
                <label className="text-sm font-semibold text-slate-700">{label}</label>
            </div>
            <div className="flex space-x-3">
                {accessoryOptions.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => onSelectionChange(option.value)}
                        className={`w-12 h-12 rounded-xl border-2 transition-all duration-200 hover:scale-110 ${currentSelection === option.value
                            ? 'border-slate-800 ring-2 ring-slate-800 ring-offset-2'
                            : 'border-slate-200 hover:border-slate-400'
                            }`}
                    >
                        {option.icon}
                    </button>
                ))}
            </div>
        </div>
    );
    // Reusable selector component for both colors and images
    const Selector = ({
        label,
        currentSelection,
        onSelectionChange,
        options,
        type = 'color'
    }) => (
        <div className="space-y-4 mt-6">
            <div className="flex items-center justify-between flex-wrap">
                <div>
                    <label className="text-sm font-semibold text-slate-700">{label}</label>
                </div>
            </div>
            <div className="flex space-x-3 flex-wrap">
                {options.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => onSelectionChange(option.value)}
                        className={`w-12 h-12 rounded-xl border-2 mb-2 transition-all duration-200 overflow-hidden hover:scale-110 flex items-center justify-center ${currentSelection === option.value
                            ? 'border-slate-800 ring-2 ring-slate-800 ring-offset-2'
                            : 'border-slate-200 hover:border-slate-400'
                            }`}
                        style={option.color ? { backgroundColor: option.color || option.value } : {}}
                        title={option.name}
                    >
                        {option.img && (
                            <img
                                src={option.img}
                                alt={option.name}
                                className="w-14 h-14 object-contain"
                            />
                        )}
                    </button>
                ))}
            </div>
            <p className="text-sm mt-2 text-slate-700">Valgt: {currentSelection}</p>
        </div>
    );



    const flagBandSelector = ({
        label,
        currentSelection,
        onSelectionChange,
        options,
        type = 'color'
    }) => (
        <div className="space-y-4 mt-6">
            <div className="flex items-center justify-between flex-wrap">
                <div>
                    <label className="text-sm font-semibold text-slate-700">{label}</label>
                </div>
            </div>
            <div className="flex space-x-3 flex-wrap">
                {options.map((option) => (
                    <div
                        key={option.value}
                        onClick={() => onSelectionChange(option.value)}
                        className={`w-12 h-12 rounded-xl border-2 mb-2 transition-all duration-200 overflow-hidden hover:scale-110 flex items-center justify-center ${currentSelection === option.value
                            ? 'border-slate-800 ring-2 ring-slate-800 ring-offset-2'
                            : 'border-slate-200 hover:border-slate-400'
                            }`}
                        style={option.color ? { backgroundColor: option.color || option.value } : {}}
                        title={option.name}
                    >
                        {option.img && (
                            <img
                                src={option.img}
                                alt={option.name}
                                className="w-14 h-14 object-contain"
                            />
                        )}
                    </div>
                ))}
            </div>
            <p className="text-sm mt-2 text-slate-700">Valgt: {currentSelection}</p>
        </div>
    );

    return (
        <>
            <div className="space-y-2 mt-8">
                <h3 className="text-2xl font-bold text-slate-900">BETRÆK</h3>
            </div>

            {/* Cover Color Selection */}
            <Selector
                label="Farve"
                currentSelection={selectedCoverColor}
                onSelectionChange={setSelectedCoverColor}
                options={coverColorOptions}
                type="color"
            />

            {/* Edgeband Color Selection */}
            <Selector
                label="Topkant"
                currentSelection={selectedTopkantColor}
                onSelectionChange={setSelectedTopkantColor}
                options={topKantColorOptions}
                type="color"
            />

            {(!shouldHideSelectors || program?.toLowerCase() === 'pædagog') && (
                <>
                    <Selector
                        label="Kantbånd"
                        currentSelection={selectedKantbandColor}
                        onSelectionChange={setSelectedKantbandColor}
                        options={edgebandColorOptions}
                        type="color"
                    />


                </>
            )}

            {!shouldHideSelectors && (
                <>
                    <AccessorySelector
                        label="Flagbånd"
                        currentSelection={selectedFlagbånd}
                        onSelectionChange={setSelectedFlagbånd}
                    />

                    {selectedFlagbånd === 'Yes' && (

                        <div className="space-y-4 mt-6">
                            <div className="flex items-center justify-between flex-wrap">
                                <div>
                                    <label className="text-sm font-semibold text-slate-700">Flagbånd</label>
                                </div>
                            </div>
                            <div className=" space-x-3 ">
                                {flagbandOptions.map((option) => (
                                    <div
                                        key={option.value}
                                        onClick={() => setSelectedFlagbåndOption(option.value)}
                                        className={`w-65 h-12 rounded-xl border-2 mb-2 transition-all duration-200 overflow-hidden hover:scale-110 flex items-center justify-center ${selectedFlagbåndOption === option.value
                                            ? 'border-slate-800 ring-2 ring-slate-800 ring-offset-2'
                                            : 'border-slate-200 hover:border-slate-400'
                                            }`}
                                        style={option.color ? { backgroundColor: option.color || option.value } : {}}
                                        title={option.name}
                                    >
                                        {option.img && (
                                            <img
                                                src={option.img}
                                                alt={option.name}
                                                className="w-70 h-50 object-contain"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                            <p className="text-sm mt-2 text-slate-700">Valgt: {selectedFlagbåndOption}</p>
                        </div>
                    )}
                </>
            )}


            {!shouldHideSelectors && (
                <>
                    {selectedKantbandColor != 'NONE' ?
                        <Selector
                            label="Stjerner"
                            currentSelection={selectedStarsStyle}
                            onSelectionChange={setSelectedStarsStyle}
                            options={starsOptions}
                            type="image"
                        /> : null
                    }


                </>
            )}
        </>
    );
}

export default Cover;