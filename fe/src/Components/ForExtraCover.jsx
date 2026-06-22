import React, { useState, useEffect, useRef } from 'react';
import img1 from '../assets/stars/star.webp';
import img2 from '../assets/stars/2-star.webp';
import img3 from '../assets/stars/3-star.webp';
import img4 from '../assets/stars/4-star.webp';
import img5 from '../assets/stars/5-star.webp';
import img6 from '../assets/stars/6-star.webp';
import coverColorOptionsimg2 from '../assets/cover images/none.webp';
import whiteGlitter from '../assets/button images/white glitter.webp';
import blackGlitter from '../assets/button images/black glitter.webp';

import international from '../assets/flagbandimages/international.webp';
import usakinaden from '../assets/flagbandimages/USAKINADEN.webp';
import europe from '../assets/flagbandimages/europe.webp';

// signature
import Kurdistan from '../assets/Countries/kurdistan.webp';
import Iraq from '../assets/Countries/iraq.webp';
import Iran from '../assets/Countries/iran.webp';
import Somalia from '../assets/Countries/somalia.webp';
import Somaliland from '../assets/Countries/somaliland.webp';
import Palestine from '../assets/Countries/palestine.webp';
import Lebanon from '../assets/Countries/lebanon.webp';
import Afghanistan from '../assets/Countries/afghanistan.webp';
import Albania from '../assets/Countries/albania.webp';
import Serbia from '../assets/Countries/serbia.webp';
import Bosnia from '../assets/Countries/bosnia.webp';
import Denmark from '../assets/Countries/denmark.webp';
import Morocco from '../assets/Countries/morocco.webp';
import Pakistan from '../assets/Countries/pakistan.webp';
import Sweden from '../assets/Countries/sweden.webp';
import Turkey from '../assets/Countries/turkey.webp';
import Greenland from '../assets/Countries/greenland.png';
import StxSilver from '../assets/images/stx silv.webp';
import StxSilverDiamant from '../assets/images/stx silver diamant.webp';
import StxGoldDiamant from '../assets/images/Stx gold diamant.webp';
import StxGold from '../assets/images/stx gold.webp';
import AtomHtxGold from '../assets/images/Atom htx gold.webp';
import HtxGoldDiam from '../assets/images/Htx gold diam.webp';
import HtxGold from '../assets/images/Htx gold.webp';
import AtomHtxSilver from '../assets/images/atom htx silver.webp';
import HtxSilverDiamant from '../assets/images/Htx silver diament.webp';
import HtxSilver from '../assets/images/htx silver.webp';
import HfGoldDiamant from '../assets/images/hf gold diamant.webp';
import HfGold from '../assets/images/hf gold.webp';
import HhxGoldDiamant from '../assets/images/hhx gold diamant.webp';
import HhxGold from '../assets/images/hhx gold.webp';
import HhxSilverDiamant from '../assets/images/hhx silver diamant.webp';
import HhxSilver from '../assets/images/hhx silver.webp';
import HfSilverDiamant from '../assets/images/hf silver diamant.webp';
import HfSilver from '../assets/images/hf silver.webp';
import EuxSilverDiamant from '../assets/images/Eux silver diamant.webp';
import EuxSilver from '../assets/images/EUX silver.webp';
import EuxGoldDiamant from '../assets/images/Eux gold diamant.webp';
import EuxGold from '../assets/images/EUX gold.webp';
import EudSilver from '../assets/images/Eud silver.webp';
import EudGold from '../assets/images/eud gold.webp';
import HalvmoneSilver from '../assets/images/halvmane silv.webp';
import HalvmoneSilverSimli from '../assets/images/halvmane silver simli.webp';
import HalvmoneGoldSimli from '../assets/images/Halvmane gold simli.webp';
import HalvmoneGold from '../assets/images/Halvmane gold.webp';
import MerkurstavSilverDiamant from '../assets/images/merkurstav silv diamant.webp';
import MerkurstavSilver from '../assets/images/merkurstav silver.webp';
import MerkurstavGoldDiamant from '../assets/images/merkurstav gold diamant.webp';
import MerkurstavGold from '../assets/images/merkurstav gold.webp';
import HjerteGuld from '../assets/images/hjerte guld.webp';
import HjerteSilv from '../assets/images/hjerte silv.webp';
import AhornbladGold from '../assets/images/Ahornblad gold.webp';
import AhornbladSilver from '../assets/images/ahornblad silver.webp';
import AnkerGold from '../assets/images/anker gold.webp';
import AnkerSilver from '../assets/images/anker silver.webp';
import AtomGold from '../assets/images/atom gold.webp';
import AtomSilver from '../assets/images/atom silver.webp';
import DnaGold from '../assets/images/dna gold.webp';
import DnaSilver from '../assets/images/dna silver.webp';
import ItSilver from '../assets/images/It silver.webp';
import ItGold from '../assets/images/It gold.webp';
import TeaterSilver from '../assets/images/teater silver.webp';
import TeaterGold from '../assets/images/Teater gold.webp';
import TwinSilver from '../assets/images/twin silver.webp';
import TwinGold from '../assets/images/twin gold.webp';
import NodeSilver from '../assets/images/Node silv.webp';
import NodeGold from '../assets/images/Node gold.webp';
import SportGold from '../assets/images/sport gold.webp';
import SportSilver from '../assets/images/sport silver.webp';
import PiSilver from '../assets/images/pi silver.webp';
import PilGold from '../assets/images/pil gold.webp';
import GlobusGold from '../assets/images/globus gold.webp';
import GlobusSilver from '../assets/images/globus silver.webp';
import LotusGold from '../assets/images/lotus gold.webp';
import LotusSilver from '../assets/images/lotus silver.webp';

import sosuassistentGold from '../assets/images/sosuassistent gold.webp';
import sosuassistentSilver from '../assets/images/sosuassistent silver.webp';
import sosuhjælperGold from '../assets/images/sosuhjalper gold.webp';
import sosuhjælperSilver from '../assets/images/sosuhjalper silver.webp';
import frisørGold from '../assets/images/frisor gold.webp';
import frisørSilver from '../assets/images/frisor silver.webp';
import KosmetologGuld from '../assets/images/Kosmetolog Guld.webp';
import KosmetologSølv from '../assets/images/Kosmetolog Sølv.webp';
import pædagogGold from '../assets/images/padagog gold.webp';
import pædagogSilver from '../assets/images/padagog silver.webp';
import pauGold from '../assets/images/pau gold.webp';
import pauSilver from '../assets/images/pau silver.webp';
import ernæringsassistenGold from '../assets/images/ernaringsassisten gold.webp';
import ernæringsassistenSilver from '../assets/images/ernaringsassisten silver.webp';

// prestige
import JupiterGold from '../assets/images/Jupiter gold.webp';
import JupiterSilver from '../assets/images/Jupiter silv.webp';
import SaturnGold from '../assets/images/Saturn gold.webp';
import SaturnSilver from '../assets/images/saturn solv.webp';
import VenusGold from '../assets/images/venus gold.webp';
import VenusSilver from '../assets/images/venus silv.webp';
import MerkurGold from '../assets/images/merkur gold.webp';
import MerkurSilver from '../assets/images/merkur silv.webp';
import NeptunGold from '../assets/images/neptun gold.webp';
import NeptunSilver from '../assets/images/neptun silv.webp';

// Stjernetegn
import BullGold from '../assets/images/bull gold.webp';
import BullSilver from '../assets/images/bull silver.webp';
import IbSilver from '../assets/images/ib silver.webp';
import IbGold from '../assets/images/Ib gold.webp';
import IbGuldSimli from '../assets/images/IB Guld Simli.webp';
import IbSølvSimli from '../assets/images/IB Sølv Simli.webp';
import FKeyGold from '../assets/images/f key gold.webp';
import FKeySilver from '../assets/images/f key silver.webp';
import FiskenGold from '../assets/images/fisken gold.webp';
import FiskenSilver from '../assets/images/fisken silver.webp';
import JomfruenGold from '../assets/images/jomfruen gold.webp';
import JomfruenSilver from '../assets/images/jomfruen silver.webp';
import KrebsenGuld from '../assets/images/krebsen guld.webp';
import KrebsenSilver from '../assets/images/krebsen silver.webp';
import LionSilver from '../assets/images/lion silver.webp';
import LionGold from '../assets/images/lion gold.webp';
import ScorpioGold from '../assets/images/scorpio gold.webp';
import ScorpioSilver from '../assets/images/scorpio silver.webp';
import SkyttenSilver from '../assets/images/skytten silver.webp';
import SkyttenGold from '../assets/images/skytten gold.webp';
import VandmandGold from '../assets/images/vandmand gold.webp';
import VandmandSilv from '../assets/images/vandmand silv.webp';
import VadderenGold from '../assets/images/vadderen gold.webp';
import VagtenGold from '../assets/images/vagten gold.webp';
import StenbukGold from '../assets/images/stenbuk gold.webp';
import StenbukSilver from '../assets/images/stenbuk silver.webp';
import VadderenSilv from '../assets/images/vadderen silv.webp';
import VagtenSilver from '../assets/images/vagten silver.webp';

// rosent
import blackGold from '../assets/rosent/black gold.webp';
import blueGold from '../assets/rosent/gold blue.webp';
import redGold from '../assets/rosent/red gold.webp';
import blackSilv from '../assets/rosent/black silv.webp';
import blueSilv from '../assets/rosent/blue silv.webp';
import redSilve from '../assets/rosent/red silv.webp';
import kaalagold from '../assets/rosent/kaalagold.webp';
import laalgold from '../assets/rosent/laalgold.webp';
import kaalasilver from '../assets/rosent/kaalasilver.webp';
import laalsilver from '../assets/rosent/laalsilver.webp';
import lightbluesilver from '../assets/rosent/lightbluesilver.webp';
import lightbluegold from '../assets/rosent/lightbluegold.webp';
import purplegold from '../assets/rosent/purplegold.webp';
import purplesilver from '../assets/rosent/purplesilver.webp';


const ForExtraCover = ({ programNew, current, forOptionChange, selectedOptions, pakke }) => {


    const accessoryOptions = [
        { name: 'Yes', value: 'Yes', icon: '✔️' },
        { name: 'No', value: 'No', icon: '❌' },
    ];
    // Default value functions
    const getDefaultCoverColor = () => {
        return 'Hvid'; // Default extra cover color
    };

    const getDefaultTopkantColor = () => {
        return 'NONE'; // Default no topkant
    };

    const getDefaultKantbandColor = () => {
        switch (programNew?.toLowerCase()) {

            default: return 'NONE';
        }
    };

    const getDefaultStarsStyle = () => {
        return 'NONE'; // Default no stars
    };

    const cameraTriggers = useRef({
        Farve: false,
        Topkant: false,
        Kantband: false,
        Star: false,
        flagband_opt: false,
        flower: false,
        coverfarbe: false,
        topkant: false,
        kantband: false,
        stars: false,
        emblem: false,
        rosetfarve: false,
        type: false
    });
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
    // ✅ Initialize cleanly
    const [selectedFlagbånd, setSelectedFlagbånd] = useState(
        selectedOptions.Flagbånd && selectedOptions.Flagbånd !== 'Nej' ? 'Yes' : 'No'
    );

    const [selectedFlagbåndOption, setSelectedFlagbåndOption] = useState(
        selectedOptions.Flagbånd === 'Nej' ? '' : selectedOptions.Flagbånd || 'Nej'
    );

    const [topEmbroiderySelection, setTopEmbroiderySelection] = useState(
        selectedOptions['Extra Top broderi'] || 'Ingen'
    );

    // Initial value functions for Rosette and Emblem
    const getInitialRosetteColor = () => {
        return { name: 'Rød', value: '#DC2626', img: laalgold };
    };

    const getInitialEmblem = () => {
        return { name: 'Guld', value: 'Guld', color: '#FCD34D' };
    };

    const getInitialType = () => {
        return 'Hjerte Guld';
    };

    const [selectedRosetteColor, setSelectedRosetteColor] = useState(
        selectedOptions['Roset farve'] || getInitialRosetteColor()
    );
    const [selectedPrestige, setSelectedPrestige] = useState(
        selectedOptions.Kokarde || 'Signature'
    );
    const [selectedEmblem, setSelectedEmblem] = useState(
        selectedOptions.Emblem || getInitialEmblem()
    );
    const [selectedType, setSelectedType] = useState(
        selectedOptions.Type || getInitialType()
    );

    const getFirstGoldColor = () => {
        return [
            { name: 'Royal blå', value: '#7F1D1D', img: blueGold },
            { name: 'Rød', value: '#DC2626', img: laalgold },
            { name: 'Sort', value: '#1E3A8A', img: kaalagold },
            { name: 'Navy blå', value: '#7F1D1D', img: blackGold },
            { name: 'Light blå', value: '#7F1D1D', img: lightbluegold },
            { name: 'Bordeaux', value: '#7F1D1DX', img: redGold },
            { name: 'Purple', value: '#DC26266', img: purplegold },
        ];
    };

    const getFirstSilverColor = () => {
        return [
            { name: 'Royal blå', value: '#7F1D1D', img: blueSilv },
            { name: 'Rød', value: '#DC2626', img: laalsilver },
            { name: 'Sort', value: '#1E3A8A', img: kaalasilver },
            { name: 'Navy blå', value: '#7F1D1D', img: blackSilv },
            { name: 'Light blå', value: '#7F1D1D', img: lightbluesilver },
            { name: 'Bordeaux', value: '#7F1D1DX', img: redSilve },
            { name: 'Purple', value: '#DC26266', img: purplesilver },
        ];
    };

    const guldcolors = getFirstGoldColor();
    const sulvcolors = getFirstSilverColor();

    const emblemOptions = [
        { name: 'Guld', value: 'Guld', color: '#FCD34D' },
        { name: 'Sølv', value: 'Sølv', color: '#E5E7EB' }
    ];

    const getGoldEmblem = () => {
        return [
            { name: 'HHX Guld Simli', icon: HhxGoldDiamant },
            { name: 'HHX Guld', icon: HhxGold },
            { name: 'HTX Guld Simli', icon: HtxGoldDiam },
            { name: 'HTX Guld', icon: HtxGold },
            { name: 'STX Guld Simli', icon: StxGoldDiamant },
            { name: 'STX Guld', icon: StxGold },
            { name: 'HF Guld Simli', icon: HfGoldDiamant },
            { name: 'HF Guld', icon: HfGold },
            { name: 'EUD Guld', icon: EudGold },
            { name: 'EUX Guld Simli', icon: EuxGoldDiamant },
            { name: 'EUX Guld', icon: EuxGold },
            { name: 'sosuassistent Guld', icon: sosuassistentGold },
            { name: 'sosuhjælper Guld', icon: sosuhjælperGold },
            { name: 'frisør Guld', icon: frisørGold },
            { name: 'Kosmetolog Guld', icon: KosmetologGuld },
            { name: 'pædagog Guld', icon: pædagogGold },
            { name: 'pau Guld', icon: pauGold },
            { name: 'ernæringsassisten Guld', icon: ernæringsassistenGold }
        ];
    };

    const getSilverEmblem = () => {
        return [
            { name: 'HHX Sølv Simli', icon: HhxSilverDiamant },
            { name: 'HHX Sølv', icon: HhxSilver },
            { name: 'HTX Sølv Simli', icon: HtxSilverDiamant },
            { name: 'HTX Sølv', icon: HtxSilver },
            { name: 'STX Sølv Simli', icon: StxSilverDiamant },
            { name: 'STX Sølv', icon: StxSilver },
            { name: 'HF Sølv Simli', icon: HfSilverDiamant },
            { name: 'HF Sølv', icon: HfSilver },
            { name: 'EUD Sølv', icon: EudSilver },
            { name: 'EUX Sølv Simli', icon: EuxSilverDiamant },
            { name: 'EUX Sølv', icon: EuxSilver },
            { name: 'sosuassistent Sølv', icon: sosuassistentSilver },
            { name: 'sosuhjælper Sølv', icon: sosuhjælperSilver },
            { name: 'frisør Sølv', icon: frisørSilver },
            { name: 'Kosmetolog Sølv', icon: KosmetologSølv },
            { name: 'pædagog Sølv', icon: pædagogSilver },
            { name: 'pau Sølv', icon: pauSilver },
            { name: 'ernæringsassisten Sølv', icon: ernæringsassistenSilver }
        ];
    };

    const allTypeOptions = {
        Signature: {
            Guld: [
                { name: 'Danmark', icon: Denmark },
                { name: 'Sweden', icon: Sweden },
                { name: 'Palæstina', icon: Palestine },
                { name: 'Tyrkiet', icon: Turkey },
                { name: 'Pakistan', icon: Pakistan },
                { name: 'Kurdistan', icon: Kurdistan },
                { name: 'Irak', icon: Iraq },
                { name: 'Iran', icon: Iran },
                { name: 'Somalia', icon: Somalia },
                { name: 'Somaliland', icon: Somaliland },
                { name: 'Libanon', icon: Lebanon },
                { name: 'Afghanistan', icon: Afghanistan },
                { name: 'Albanien', icon: Albania },
                { name: 'Serbien', icon: Serbia },
                { name: 'Bosnien', icon: Bosnia },
                { name: 'Marokko', icon: Morocco },
                { name: 'Grønland', icon: Greenland },
                ...getGoldEmblem(),
                { name: 'F Key Guld', icon: FKeyGold },
                { name: 'DNA Guld', icon: DnaGold },
                { name: 'Pi Guld', icon: PilGold },
                { name: 'IT Guld', icon: ItGold },
                { name: 'Halvmåne Guld', icon: HalvmoneGold },
                { name: 'Halvmåne Guld Simli', icon: HalvmoneGoldSimli },
                { name: 'Merkurstav Guld', icon: MerkurstavGold },
                { name: 'Merkurstav Guld Simli', icon: MerkurstavGoldDiamant },
                { name: 'Hjerte Guld', icon: HjerteGuld },
                { name: 'Atom Guld', icon: AtomGold },
                { name: 'Ahornblad Guld', icon: AhornbladGold },
                { name: 'Anker Guld', icon: AnkerGold },
                { name: 'Globus Guld', icon: GlobusGold },
                { name: 'Lotus Guld', icon: LotusGold },
                { name: 'Node Guld', icon: NodeGold },
                { name: 'Sport Guld', icon: SportGold },
                { name: 'Teater Guld', icon: TeaterGold },
            ],
            Sølv: [
                { name: 'Danmark', icon: Denmark },
                { name: 'Sweden', icon: Sweden },
                { name: 'Palæstina', icon: Palestine },
                { name: 'Tyrkiet', icon: Turkey },
                { name: 'Pakistan', icon: Pakistan },
                { name: 'Kurdistan', icon: Kurdistan },
                { name: 'Irak', icon: Iraq },
                { name: 'Iran', icon: Iran },
                { name: 'Somalia', icon: Somalia },
                { name: 'Somaliland', icon: Somaliland },
                { name: 'Libanon', icon: Lebanon },
                { name: 'Afghanistan', icon: Afghanistan },
                { name: 'Albanien', icon: Albania },
                { name: 'Serbien', icon: Serbia },
                { name: 'Bosnien', icon: Bosnia },
                { name: 'Marokko', icon: Morocco },
                { name: 'Grønland', icon: Greenland },
                ...getSilverEmblem(),
                { name: 'F Key Sølv', icon: FKeySilver },
                { name: 'DNA Sølv', icon: DnaSilver },
                { name: 'Pi Sølv', icon: PiSilver },
                { name: 'IT Sølv', icon: ItSilver },
                { name: 'Halvmåne Sølv', icon: HalvmoneSilver },
                { name: 'Halvmåne Sølv Simli', icon: HalvmoneSilverSimli },
                { name: 'Merkurstav Sølv', icon: MerkurstavSilver },
                { name: 'Merkurstav Sølv Simli', icon: MerkurstavSilverDiamant },
                { name: 'Hjerte Sølv', icon: HjerteSilv },
                { name: 'Atom Sølv', icon: AtomSilver },
                { name: 'Ahornblad Sølv', icon: AhornbladSilver },
                { name: 'Anker Sølv', icon: AnkerSilver },
                { name: 'Globus Sølv', icon: GlobusSilver },
                { name: 'Lotus Sølv', icon: LotusSilver },
                { name: 'Node Sølv', icon: NodeSilver },
                { name: 'Sport Sølv', icon: SportSilver },
                { name: 'Teater Sølv', icon: TeaterSilver },
            ]
        },
        Prestige: {
            Guld: [
                { name: 'Diamant', icon: JupiterGold },
                { name: 'Onyx', icon: SaturnGold },
                { name: 'Perle', icon: VenusGold },
                { name: 'Nova', icon: MerkurGold },
                { name: 'Safir', icon: NeptunGold },
            ],
            Sølv: [
                { name: 'Diamant', icon: JupiterSilver },
                { name: 'Onyx', icon: SaturnSilver },
                { name: 'Perle', icon: VenusSilver },
                { name: 'Nova', icon: MerkurSilver },
                { name: 'Safir', icon: NeptunSilver },
            ],
        },
        Stjernetegn: {
            Guld: [
                { name: 'Tyr Guld', icon: BullGold },
                { name: 'Fisk Guld', icon: FiskenGold },
                { name: 'Jomfru Guld', icon: JomfruenGold },
                { name: 'Krebs Guld', icon: KrebsenGuld },
                { name: 'Løve Guld', icon: LionGold },
                { name: 'Skorpion Guld', icon: ScorpioGold },
                { name: 'Skytte Guld', icon: SkyttenGold },
                { name: 'Stenbuk Guld', icon: StenbukGold },
                { name: 'Tvilling Guld', icon: TwinGold },
                { name: 'Vandmand Guld', icon: VandmandGold },
                { name: 'Vædder Guld', icon: VadderenGold },
                { name: 'Vægt Guld', icon: VagtenGold },
            ],
            Sølv: [
                { name: 'Tyr Sølv', icon: BullSilver },
                { name: 'Fisk Sølv', icon: FiskenSilver },
                { name: 'Jomfru Sølv', icon: JomfruenSilver },
                { name: 'Krebs Sølv', icon: KrebsenSilver },
                { name: 'Løve Sølv', icon: LionSilver },
                { name: 'Skorpion Sølv', icon: ScorpioSilver },
                { name: 'Skytte Sølv', icon: SkyttenSilver },
                { name: 'Stenbuk Sølv', icon: StenbukSilver },
                { name: 'Tvilling Sølv', icon: TwinSilver },
                { name: 'Vandmand Sølv', icon: VandmandSilv },
                { name: 'Vædder Sølv', icon: VadderenSilv },
                { name: 'Vægt Sølv', icon: VagtenSilver },
            ],
        }
    };

    const currentTypeOptions = allTypeOptions[selectedPrestige]?.[selectedEmblem.name] || [];

    const getBaseName = (name) => {
        return name.replace(/\s*(Guld|Sølv|Solv)\s*$/i, '').trim();
    };

    const handlePrestigeChange = (type) => {
        const currentBaseName = getBaseName(selectedType);
        setSelectedPrestige(type);
        const newOptions = allTypeOptions[type]?.[selectedEmblem.name] || [];

        if (newOptions.length > 0) {
            const matchingOption = newOptions.find(option =>
                getBaseName(option.name) === currentBaseName
            );
            setSelectedType(matchingOption ? matchingOption.name : newOptions[0].name);
        }
    };

    const handleEmblemChange = (emblem) => {
        const currentBaseName = getBaseName(selectedType);
        setSelectedEmblem(emblem);

        const newOptions = allTypeOptions[selectedPrestige]?.[emblem.name] || [];
        if (newOptions.length > 0) {
            const matchingOption = newOptions.find(option =>
                getBaseName(option.name) === currentBaseName
            );
            setSelectedType(matchingOption ? matchingOption.name : newOptions[0].name);
        }
    };


    const coverColorOptions = [
        { name: 'Hvid', value: 'Hvid', color: '#ffffff' },
        { name: 'Sort', value: 'Sort', color: '#000000' },
        { name: 'Hvid med glimmer', value: 'Hvid med glimmer', img: whiteGlitter, color: '#ffffff' },
        { name: 'Sort med glimmer', value: 'Sort med glimmer', img: blackGlitter, color: '#000000' }
    ];

    const restrictedPrograms = [
        "sosuassistent",
        "sosuhjælper",
        "frisør",
        "kosmetolog",
        "pau",
        "ernæringsassistent"
    ];

    const isRestricted = restrictedPrograms.includes(programNew?.toLowerCase());

    const getCoverColor = () => {
        switch (programNew?.toLowerCase()) {
            case 'hhx': return { name: 'HHX', value: 'HHX', color: '#0f378a' };
            case 'htx': return { name: 'HTX', value: 'HTX', color: '#000080' };
            case 'stx': return { name: 'STX', value: 'STX', color: '#7F1D1D' };
            case 'hf': return { name: 'HF', value: 'HF', color: '#5585b7' };
            default: return null;
        }
    };

    const getCurrentEmblem = () => {
        return current.name === 'Guld'
            ? { name: 'Guld', value: 'Guld', color: '#FFD700' }
            : { name: 'Sølv', value: 'Sølv', color: '#C0C0C0' };
    };

    const edgebandColorOptions = [
        { name: 'NONE', value: 'NONE', img: coverColorOptionsimg2 },
        { name: 'Hvid', value: 'Hvid', color: '#ffffff' },
        { name: 'Sort', value: 'Sort', color: '#3d3d3d' },
        { name: 'Lilla', value: 'Purple', color: '#A855F7' },
        { name: 'Grøn', value: 'Green', color: '#22C55E' },
        { name: 'Gul', value: 'Yellow', color: '#EAB308' },
        { name: 'Lyserød', value: 'Pink', color: '#EC4899' },
        ...((programNew?.toLowerCase() === 'eux' || programNew?.toLowerCase() === 'pædagog') ? [
            { name: 'HHX', value: 'Royal Blue', color: '#4169e1' },
            { name: 'Bordeaux', value: 'Bordeaux', color: '#7F1D1D' },
        ] : []),
        getCoverColor()
    ].filter(Boolean);

    const topKantColorOptions = [
        { name: 'NONE', value: 'NONE', img: coverColorOptionsimg2 },
        getCurrentEmblem()
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


    // Propagate changes to parent
    useEffect(() => { forOptionChange('Farve', selectedCoverColor); }, [selectedCoverColor]);
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




    useEffect(() => { forOptionChange('Topkant', selectedTopkantColor); }, [selectedTopkantColor]);

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



    useEffect(() => { forOptionChange('Kantbånd', selectedKantbandColor); }, [selectedKantbandColor]);

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
            'sort': 'Kantband:Sort',
            'hhx': 'Kantband:Royal Blue',
            'bordeaux': 'Kantband:Bordeaux',
            'green': 'Kantband:Green',
            'yellow': 'Kantband:Yellow',
            'pink': 'Kantband:Pink',

        };

        if (!selectedKantbandColor) return;

        // lowercase safety
        const message = colorMap[selectedKantbandColor.toLowerCase()];
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


    useEffect(() => { forOptionChange('Stjerner', selectedStarsStyle); }, [selectedStarsStyle]);

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
            // If user already has a valid selection, keep it
            if (selectedFlagbåndOption && selectedFlagbåndOption !== 'Nej') {
                forOptionChange('Flagbånd', selectedFlagbåndOption);
                ['preview-iframe', 'preview-iframe2'].forEach((id) => {
                    const iframe = document.getElementById(id);
                    if (iframe?.contentWindow) {
                        console.log("Sending message to iframe:", `Flagband:${selectedFlagbåndOption}`);
                        iframe.contentWindow.postMessage(`Flagband:${selectedFlagbåndOption}`, "*");
                    } else {
                        console.log("Iframe not ready or program not available");
                    }
                });
            }
            // Otherwise, set default to International
            else {
                setSelectedFlagbåndOption('International');
                forOptionChange('Flagbånd', 'International');
            }
        } else if (selectedFlagbånd === 'No') {
            forOptionChange('Flagbånd', 'Nej');
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
        if (selectedFlagbånd === 'Yes' && selectedFlagbåndOption) {
            forOptionChange('Flagbånd', selectedFlagbåndOption);
        }
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

    // Effects for Rosette and Emblem
    useEffect(() => { forOptionChange('Roset farve', selectedRosetteColor); }, [selectedRosetteColor]);
    useEffect(() => {
        if (!selectedRosetteColor?.name) return;
        const colorMap = {
            'royal blå': 'flowerRoyalBlue',
            'navy blå': 'flowerNavyBlue',
            'bordeaux': 'flowerMaroon',
            'light blå': 'flowerSkyBlue',
            'rød': 'flowerRed',
            'purple': 'flowerPurple',
            'sort': 'flowerBlack',
        };
        const message = colorMap[selectedRosetteColor.name.toLowerCase()];
        if (!message) return;

        ['preview-iframe', 'preview-iframe2'].forEach((id) => {
            const iframe = document.getElementById(id);
            if (iframe?.contentWindow) {
                iframe.contentWindow.postMessage(message, "*");
                if (cameraTriggers.current["flower"]) {
                    iframe.contentWindow.postMessage("flower camera", "*");
                }
            }
        });
        cameraTriggers.current["flower"] = true;
    }, [selectedRosetteColor]);

    useEffect(() => { forOptionChange('Kokarde', selectedPrestige); }, [selectedPrestige]);
    useEffect(() => {
        const colorMap = {
            'Signature': 'StandardEmblem',
            'Prestige': 'PrestigeEmblem',
            'Stjernetegn': 'StjernetegnEmblem',
        };
        const message = colorMap[selectedPrestige];
        if (!message) return;

        ['preview-iframe', 'preview-iframe2'].forEach((id) => {
            const iframe = document.getElementById(id);
            if (iframe?.contentWindow) {
                iframe.contentWindow.postMessage(message, "*");
                if (cameraTriggers.current["emblem"]) {
                    iframe.contentWindow.postMessage("emblem camera", "*");
                }
            }
        });
        cameraTriggers.current["emblem"] = true;
    }, [selectedPrestige]);

    useEffect(() => { forOptionChange('Emblem', selectedEmblem); }, [selectedEmblem]);
    useEffect(() => {
        const colorMap = { "Guld": "rosetfarveGold", "Sølv": "rosetfarveSilver" };
        const message = colorMap[selectedEmblem.value];
        if (!message) return;

        ['preview-iframe', 'preview-iframe2'].forEach((id) => {
            const iframe = document.getElementById(id);
            if (iframe?.contentWindow) {
                iframe.contentWindow.postMessage(message, "*");
                if (cameraTriggers.current["rosetfarve"]) {
                    iframe.contentWindow.postMessage("rosetfarve camera", "*");
                }
            }
        });
        cameraTriggers.current["rosetfarve"] = true;
    }, [selectedEmblem]);

    useEffect(() => { forOptionChange('Type', selectedType); }, [selectedType]);
    useEffect(() => {
        const message = selectedType + " " + selectedEmblem.value;
        ['preview-iframe', 'preview-iframe2'].forEach((id) => {
            const iframe = document.getElementById(id);
            if (iframe?.contentWindow) {
                iframe.contentWindow.postMessage(message, "*");
                if (cameraTriggers.current["type"]) {
                    iframe.contentWindow.postMessage("type camera", "*");
                }
            }
        });
        cameraTriggers.current["type"] = true;
    }, [selectedType, selectedEmblem]);

    useEffect(() => {
        forOptionChange('Extra Top broderi', topEmbroiderySelection);
        const msg = `topEmbroidery:${topEmbroiderySelection}`;
        ['preview-iframe', 'preview-iframe2'].forEach(id => {
            const iframe = document.getElementById(id);
            if (iframe?.contentWindow) {
                iframe.contentWindow.postMessage(msg, "*");
            }
        });
    }, [topEmbroiderySelection]);

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


    const Selector = ({ label, currentSelection, onSelectionChange, options, type = 'color' }) => (
        <div className="space-y-4 mt-6">
            <div className="flex items-center justify-between flex-wrap">
                <div>
                    <label className="text-sm font-semibold text-slate-700">{label}</label>
                </div>
            </div>
            <div className="flex space-x-3 flex-wrap">
                {options.map(option => (
                    <button
                        key={option.value}
                        onClick={() => onSelectionChange(option.value)}
                        className={`w-12 h-12 rounded-xl border-2 mb-2 transition-all duration-200 overflow-hidden hover:scale-110 flex items-center justify-center ${currentSelection === option.value
                            ? 'border-slate-800 ring-2 ring-slate-800 ring-offset-2'
                            : 'border-slate-200 hover:border-slate-400'
                            }`}
                        style={option.color ? { backgroundColor: option.color } : {}}
                        title={option.name}
                    >
                        {option.img && <img src={option.img} alt={option.name} className="w-14 h-14 object-contain" />}
                    </button>
                ))}
            </div>
            <p className="text-sm mt-2 text-slate-700">Valgt: {currentSelection}</p>
        </div>
    );

    return (
        <>
            <Selector
                label="Farve"
                currentSelection={selectedCoverColor}
                onSelectionChange={setSelectedCoverColor}
                options={coverColorOptions}
            />
            <Selector
                label="Topkant"
                currentSelection={selectedTopkantColor}
                onSelectionChange={setSelectedTopkantColor}
                options={topKantColorOptions}
            />
            {!isRestricted && (
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

            {!isRestricted && (
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


            {!isRestricted && (
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

            {/* Top Embroidery */}
            <div className="space-y-4 mt-8">
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
                        { value: 'Ingen', label: 'Ingen', img: coverColorOptionsimg2 },
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
            </div>

            <div className="mt-8">
                <h3 className="text-xl font-bold text-slate-900">ROSET & EMBLEM</h3>
            </div>

            <div className="space-y-4 mt-6">
                <label className="text-sm font-semibold text-slate-700">Roset farve</label>
                <div className="flex space-x-3 flex-wrap">
                    {(selectedEmblem.name === 'Guld' ? guldcolors : sulvcolors).map((color) => (
                        <button
                            key={color.name}
                            onClick={() => setSelectedRosetteColor(color)}
                            className={`w-12 h-12 rounded-xl border-2 flex justify-center items-center mb-2 transition-all duration-200 hover:scale-110 ${selectedRosetteColor.name === color.name
                                ? 'border-slate-800 ring-2 ring-slate-800 ring-offset-2'
                                : 'border-slate-200 hover:border-slate-400'
                                }`}
                        >
                            {color.img && <img src={color.img} alt={color.name} className="w-8 h-8 object-contain" />}
                        </button>
                    ))}
                </div>
                <p className="text-sm text-slate-700">Valgt: {selectedRosetteColor.name}</p>
            </div>

            <div className="space-y-4 mt-6">
                <label className="text-sm font-semibold text-slate-700">Emblem Farve</label>
                <div className="flex space-x-3">
                    {emblemOptions.map((emblem) => (
                        <button
                            key={emblem.value}
                            onClick={() => handleEmblemChange(emblem)}
                            className={`w-12 h-12 rounded-xl border-2 transition-all duration-200 hover:scale-110 ${selectedEmblem.value === emblem.value
                                ? 'border-slate-800 ring-2 ring-slate-800 ring-offset-2'
                                : 'border-slate-200 hover:border-slate-400'
                                }`}
                            style={{ backgroundColor: emblem.color }}
                            title={emblem.name}
                        />
                    ))}
                </div>
                <p className="text-sm text-slate-700">Valgt: {selectedEmblem.name}</p>
            </div>

            <div className="space-y-4 mt-6">
                <label className="text-sm font-semibold text-slate-700">Kategori</label>
                <div className="flex space-x-3 flex-wrap">
                    {['Signature', 'Prestige', 'Stjernetegn'].map((type) => (
                        <button
                            key={type}
                            onClick={() => handlePrestigeChange(type)}
                            className={`px-6 py-3 rounded-xl text-sm font-medium m-1 transition-all duration-200 ${selectedPrestige === type
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:shadow-sm'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4 mt-6">
                <label className="text-sm font-semibold text-slate-700">Emblem Type</label>
                <div className="flex flex-wrap gap-3">
                    {currentTypeOptions.map((type, index) => (
                        <button
                            key={index}
                            onClick={() => setSelectedType(type.name)}
                            className={`w-14 h-14 border-2 rounded-xl overflow-hidden hover:shadow-md transition-all duration-200 flex items-center justify-center ${selectedType === type.name
                                ? 'border-blue-500 ring-2 ring-blue-200 ring-offset-2'
                                : 'border-slate-200 hover:border-blue-300'
                                }`}
                        >
                            <img src={type.icon} alt={type.name} className="w-10 h-10 object-contain" />
                        </button>
                    ))}
                </div>
                <p className="text-sm text-slate-700">Valgt: {selectedType}</p>
            </div>
        </>
    );
};

export default ForExtraCover;