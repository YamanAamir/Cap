import React, { useState, useCallback, useRef, useEffect } from "react";
import { getBaseUrl } from "../services/marketing.api";
import img1 from "../assets/menuCapPics/1.webp";
import img2 from "../assets/menuCapPics/2.webp";
import img3 from "../assets/menuCapPics/3.webp";
import img4 from "../assets/menuCapPics/4.webp";
import img5 from "../assets/menuCapPics/5.webp";
import img6 from "../assets/menuCapPics/6.webp";
import img7 from "../assets/menuCapPics/7.webp";
import img8 from "../assets/menuCapPics/8.webp";
import img9 from "../assets/menuCapPics/9.webp";


import LOGO from "../assets/Student Life.png";
// import img10 from '../assets/logo.jpeg';
import EducationalTape from "../Components/EducationalTape";
import Embroidery from "../Components/Embroidery";
import Cover from "../Components/Cover";
import Shade from "../Components/Shade";
import Foer from "../Components/Foer";
import ExtraCover from "../Components/ExtraCover";
import Accessories from "../Components/Accessories";
import Size from "../Components/Size";
import Bows from "../Components/Bows";
import QuoteModal from "../Components/Modal";
import { useParams, useSearchParams } from "react-router-dom";
import { GraduationCap, ChevronUp, ChevronDown, Box, Loader2, AlertCircle } from "lucide-react";

import HHX from "../Default/HHX";
import HTX from "../Default/HTX";
import STX from "../Default/STX";
import STU from "../Default/STU";
import Landmand from "../Default/Landmand";
import HF from "../Default/HF";
import EUX from "../Default/EUX";
import EUD from "../Default/EUD";
import sosuassistent from "../Default/sosuassistent";
import sosuhjælper from "../Default/sosuhjælper";
import frisør from "../Default/frisør";
import kosmetolog from "../Default/kosmetolog";
import pædagog from "../Default/pædagog";
import pau from "../Default/pau";
import ernæringsassisten from "../Default/ernæringsassisten";
import { getTilbehorForTier, syncTilbehorToIframes } from "../utils/tilbehorDefaults";

const StudentDashboard = () => {
  const [activeMenu, setActiveMenu] = useState("KOKARDE");
  {/* jjjjjjjjjjjj */ }
  const activeMenuRef = useRef(activeMenu);
  useEffect(() => { activeMenuRef.current = activeMenu; }, [activeMenu]);
  const sentGroupKeys = useRef(new Set());

  useEffect(() => {
    const handleClick = (e) => {
      const desktopPanel = document.getElementById('desktop-config-panel');
      const mobilePanel = document.getElementById('mobile-config-panel');

      if ((!desktopPanel || !desktopPanel.contains(e.target)) &&
        (!mobilePanel || !mobilePanel.contains(e.target))) {
        return;
      }

      const btn = e.target.closest('button');
      if (btn) {
        let headingText = "unknown";
        const flexContainer = btn.closest('.flex');
        if (flexContainer) {
          let sibling = flexContainer.previousElementSibling;
          while (sibling && !sibling.innerText) {
            sibling = sibling.previousElementSibling;
          }
          if (sibling) {
            headingText = sibling.innerText.trim().slice(0, 30);
          }
        }

        const groupKey = `${activeMenuRef.current}-${headingText}`;

        if (activeMenuRef.current === "KOKARDE" || activeMenuRef.current === "UDDANNELSESBÅND" || activeMenuRef.current === "BRODERI" || activeMenuRef.current === "BETRÆK" || activeMenuRef.current === "SKYGGE" || activeMenuRef.current === "FOER" || activeMenuRef.current === "EKSTRA BETRÆK" || activeMenuRef.current === "TILBEHØR" || activeMenuRef.current === "STØRRELSE") return;

        const msg = `${activeMenuRef.current} camera`;
        console.log("Sending group camera msg:", msg, "for group:", groupKey);

        ['preview-iframe', 'preview-iframe2'].forEach(id => {
          const iframe = document.getElementById(id);
          if (iframe?.contentWindow) {
            iframe.contentWindow.postMessage(msg, "*");
          }
        });
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  {/* jjjjjjjjjjjj */ }
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const programFixMap = {
    sosuhjaelper: "sosuhjælper",
    frisoer: "frisør",
    ernaeringsassistent: "ernæringsassisten",
    paedagog: "pædagog",
  };

  const rawProgram = searchParams.get("program");
  const program = programFixMap[rawProgram] ?? rawProgram;

  const rawPackageName = searchParams.get("package") || "standard";
  const allowedPremiumPrograms = ["stx", "hhx", "htx", "hf"];
  const packageName = (rawPackageName === "premium" && !allowedPremiumPrograms.includes(program?.toLowerCase()))
    ? "standard"
    : rawPackageName;

  const [isConfigOpen, setIsConfigOpen] = useState(true);
  const [globalEmblem, setGlobalEmblem] = useState({
    name: "Guld",
    value: "Guld",
    color: "#FCD34D",
  });
  const [isAppReady, setIsAppReady] = useState(false);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [showBlurEffect, setShowBlurEffect] = useState(false);
  const [extraCoverReset, setExtraCoverReset] = useState(false);
  const [sizeFlag, setSizeFlag] = useState(false);

  // Custom manual full view capture logic
  const [fullViewImages, setFullViewImages] = useState(null);
  const [isCapturingFullView, setIsCapturingFullView] = useState(false);

  const handleCaptureFullView = async () => {
    setIsCapturingFullView(true);
    console.log('Requesting screenshots from PlayCanvas...');
    
    try {
      const capCapture = await import('../utils/capCapture');
      const images = await capCapture.captureCapViews();
      console.log('Successfully captured full view images from PlayCanvas:', images);
      setFullViewImages(images);
    } catch (err) {
      console.error('Error capturing full view:', err);
    } finally {
      setIsCapturingFullView(false);
    }
  };

  const [errors, setErrors] = useState({});

  // Complete state for all components
  const initialoption = () => {
    switch (program?.toLowerCase()) {
      case "hhx":
        return HHX;
      case "htx":
        return HTX;
      case "stx":
        return STX;
      case "stu":
        return STU;
      case "landmand":
        return Landmand;
      case "hf":
        return HF;
      case "eux":
        return EUX;
      case "eud":
        return EUD;
      case "sosuassistent":
        return sosuassistent;
      case "sosuhjælper":
        return sosuhjælper;
      case "frisør":
        return frisør;
      case "kosmetolog":
        return kosmetolog;
      case "pau":
        return pau;
      case "ernæringsassisten":
        return ernæringsassisten;
      case "pædagog":
        return pædagog;
      default:
        return {};
    }
  };

  const [selectedOptions, setSelectedOptions] = useState(initialoption());

  const [dynamicConfig, setDynamicConfig] = useState(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [installmentPlans, setInstallmentPlans] = useState([]);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch(`${getBaseUrl()}/marketing/configurator-settings`);
        if (res.ok) {
          const data = await res.json();
          setDynamicConfig(data);
        }
      } catch (err) {
        console.error('Failed to load config:', err);
      } finally {
        setConfigLoading(false);
      }
    };
    const fetchInstallmentPlans = async () => {
      try {
        const res = await fetch(`${getBaseUrl()}/marketing/installment-plans`);
        if (res.ok) {
          const data = await res.json();
          setInstallmentPlans(data);
        }
      } catch (err) {
        console.error('Failed to fetch installment plans:', err);
      }
    };
    fetchConfig();
    fetchInstallmentPlans();
  }, []);

  const matchingInstallmentPlan = (packageName === 'standard' || packageName === 'basichue' || searchParams.get("installment") !== 'yes') ? undefined : installmentPlans.find(plan => {
    const progMatch = plan.program === 'all' || (plan.program || '').toLowerCase() === (program || '').toLowerCase();
    const tierMatch = plan.packageTier === 'all' || (plan.packageTier || '').toLowerCase() === (packageName || 'standard').toLowerCase();
    return progMatch && tierMatch;
  });

  const prevPackageKeyRef = useRef(null);

  useEffect(() => {
    if (!isAppReady) return;

    const tier =
      packageName === "luksus" || packageName === "premium"
        ? packageName
        : "standard";
    const packageKey = `${program}-${tier}`;
    if (prevPackageKeyRef.current === packageKey) return;
    prevPackageKeyRef.current = packageKey;

    const baseTilbehor = initialoption().TILBEHØR || {};
    const newTilbehor = getTilbehorForTier(tier, baseTilbehor);

    setSelectedOptions((prev) => ({
      ...prev,
      TILBEHØR: newTilbehor,
    }));

    if (activeMenuRef.current === "TILBEHØR") {
      syncTilbehorToIframes(newTilbehor);
    }
  }, [packageName, isAppReady, program]);

  useEffect(() => {
    if (!isAppReady || activeMenu !== "TILBEHØR") return;
    syncTilbehorToIframes(selectedOptions.TILBEHØR);
  }, [activeMenu, isAppReady]);

  

  // ---------------- LUKSUS ----------------
  

  // ---------------- PREMIUM ----------------
  

  let prices = dynamicConfig?.priceConfig?.[packageName || 'standard'] || {};

  const getDeliveryFee = () => {
    if (!dynamicConfig?.deliveryCharges) return 79;
    const progKey = Object.keys(dynamicConfig.deliveryCharges).find(k => k.toLowerCase() === (program || '').toLowerCase()) || program;
    return dynamicConfig.deliveryCharges[progKey]?.Denmark || dynamicConfig.deliveryCharges['STX']?.Denmark || 79;
  };

  const calculateTotalPrice = () => {
    let total = 0;

    // Helper: calculate price for text-based fields
    const calcTextPrice = (text, pricing) => {
      if (!text || !pricing) return 0;
      const base = pricing.base || 0;
      const perChar = pricing.perChar || 0;
      return base + perChar * text.length;
    };

    const isExtraOptionsSelected =
      selectedOptions.EKSTRABETRÆK?.Tilvælg == "Yes";

    // Track special case for SKYGGE lines
    let skyggeLinesSelected = false;
    let blackBow = false;

    const standardPrices = dynamicConfig?.priceConfig?.['standard'] || {};

    for (const category in selectedOptions) {
      const categoryOptions = selectedOptions[category];
      let categoryPrices = prices[category];

      if (packageName === 'basichue' && !categoryPrices && (category === 'UDDANNELSESBÅND' || category === 'BRODERI')) {
        categoryPrices = standardPrices[category];
      }

      if (!categoryPrices) continue;

      for (const optionKey in categoryOptions) {
        const value = categoryOptions[optionKey];
        let optionPrices = categoryPrices[optionKey];

        if (packageName === 'basichue' && (
          (category === 'UDDANNELSESBÅND' && optionKey === 'Broderi foran') ||
          (category === 'BRODERI' && optionKey === 'Navne broderi') ||
          (category === 'BRODERI' && optionKey === 'Skolebroderi')
        )) {
          optionPrices = standardPrices[category]?.[optionKey];
        }

        if (!optionPrices) continue;

        if (category == "EKSTRABETRÆK" && !isExtraOptionsSelected) {
          continue;
        }

        // Special case: SKYGGE lines (1–3)
        if (
          category === "SKYGGE" &&
          [
            "Skyggegravering Line 1",
            "Skyggegravering Line 2",
            "Skyggegravering Line 3",
          ].includes(optionKey)
        ) {
          if (typeof value === "string" && value.trim() !== "") {
            skyggeLinesSelected = true;
          }
          continue; // Skip normal pricing, we'll handle later
        }

        // Do NOT continue for other colors, let normal pricing handle them

        // Case 1: text-based pricing (base + perChar)
        if (typeof value === "string" && optionPrices.base !== undefined) {
          total += calcTextPrice(value, optionPrices);
        }

        // Case 2: direct match
        else if (
          typeof value === "string" &&
          optionPrices[value] !== undefined
        ) {
          total += optionPrices[value];
        }

        // Case 3: object with .value
        else if (value?.value && optionPrices[value.value] !== undefined) {
          total += optionPrices[value.value];
        }

        // Case 4: number-based (like size)
        else if (typeof value === "number" && optionPrices.base !== undefined) {
          const base = optionPrices.base || 0;
          const perMM = optionPrices.perMM || 0;
          total += base + value * perMM;
        }
      }
    }

    // ✅ Apply only once if any line is selected
    if (skyggeLinesSelected && packageName !== "premium") {
      total += 99;
    }

    // Add dynamic flags cost from TILBEHØR
    if (selectedOptions.TILBEHØR?.selectedFlags) {
      selectedOptions.TILBEHØR.selectedFlags.forEach(flag => {
        if (flag.price) total += flag.price;
      });
    }

    // Add KOKARDE flag price (from Flag section)
    if (selectedOptions.KOKARDE?.Flag?.price) {
      total += selectedOptions.KOKARDE.Flag.price;
    }

    ////////////////////////////////////zee///////////////////////////////////////

    // Package base price
    let iniialPrice = 0;
    
    // Attempt to read from dynamicConfig
    const progKey = program ? (Object.keys(dynamicConfig?.basePrices || {}).find(k => k.toLowerCase() === program.toLowerCase()) || program) : 'STX';
    
    if (dynamicConfig?.basePrices && dynamicConfig.basePrices[progKey] && dynamicConfig.basePrices[progKey][packageName] !== undefined) {
      iniialPrice = dynamicConfig.basePrices[progKey][packageName];
    } else {
      // Fallback if not configured
      const programsWithSurcharge = ["stx", "hf", "hhx", "htx"];
      const hasSurcharge = programsWithSurcharge.includes(program?.toLowerCase());

      if (packageName === "standard") iniialPrice = 449;
      else if (packageName === "basichue") iniialPrice = 179;
      else if (packageName === "luksus") iniialPrice = hasSurcharge ? 1595 : 995;
      else if (packageName === "premium") iniialPrice = hasSurcharge ? 2450 : 1850;
    }

    if (packageName === "basichue") {
      const front = selectedOptions["UDDANNELSESBÅND"]?.['Broderi foran'] || '';
      const name = selectedOptions.BRODERI?.['Navne broderi'] || '';
      const school = selectedOptions.BRODERI?.['Skolebroderi'] || '';
      
      if (front.trim() !== '' && name.trim() !== '' && school.trim() !== '') {
        const standardPrices = dynamicConfig?.priceConfig?.['standard'] || {};
        let frontPrice = 0, namePrice = 0, schoolPrice = 0;
        
        if (standardPrices["UDDANNELSESBÅND"] && standardPrices["UDDANNELSESBÅND"]['Broderi foran']) {
          frontPrice = calcTextPrice(front, standardPrices["UDDANNELSESBÅND"]['Broderi foran']);
        }
        if (standardPrices.BRODERI && standardPrices.BRODERI['Navne broderi']) {
          namePrice = calcTextPrice(name, standardPrices.BRODERI['Navne broderi']);
        }
        if (standardPrices.BRODERI && standardPrices.BRODERI['Skolebroderi']) {
          schoolPrice = calcTextPrice(school, standardPrices.BRODERI['Skolebroderi']);
        }
        
        const bundlePrice = (dynamicConfig?.basichueBundlePrices?.[progKey] !== undefined)
          ? parseFloat(dynamicConfig.basichueBundlePrices[progKey])
          : (parseFloat(dynamicConfig?.basichueBundlePrice) || 220);

        total = total - frontPrice - namePrice - schoolPrice + bundlePrice;
      }
    }

    ////////////////////////////////////zee///////////////////////////////////////

    ///zee///
    const deliveryFee = getDeliveryFee();
    if (packageName === "premium") {
      return iniialPrice + deliveryFee;
    }
    return total + iniialPrice + deliveryFee;
    ///zee///
  };

  const menuItems = [
    { name: "KOKARDE", icon: img1 },
    { name: "UDDANNELSESBÅND", icon: img2 },
    { name: "BRODERI", icon: img3 },
    { name: "BETRÆK", icon: img4 },
    { name: "SKYGGE", icon: img5 },
    { name: "FOER", icon: img6 },
    { name: "EKSTRABETRÆK", icon: img7 },
    { name: "TILBEHØR", icon: img8 },
    { name: "STØRRELSE", icon: img9 },
  ];

  // Generic handler for all option changes
  const handleOptionChange = useCallback((section, keyOrValue, maybeValue) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [section]:
        maybeValue !== undefined
          ? { ...prev[section], [keyOrValue]: maybeValue }
          : keyOrValue,
    }));
  }, []);

  // Function to collect all selected options
  const collectSelectedOptions = useCallback(() => {
    setIsQuoteModalOpen(true);
  }, []);

  useEffect(() => {
    if (isIframeLoaded && isAppReady && program) {
      sendProgramToIframe();
    }
  }, [program, isIframeLoaded, isAppReady, packageName]);

  const sendProgramToIframe = () => {
    // Get iframe by ID
    const iframe = document.getElementById("preview-iframe");
    const iframe2 = document.getElementById("preview-iframe2");
    if (iframe && iframe.contentWindow) {
      const message = "UDDANNELSESBÅNDMateriale:" + program.toLowerCase() + ":bomuld";
      console.log("Sending message to iframe:", message);
      iframe.contentWindow.postMessage(message, "*");
      if (iframe2) iframe2.contentWindow.postMessage(message, "*");

      if (packageName === "standard" || packageName === "basichue") {
        const penMsg = "Accessories Huekuglepen:no";
        console.log("Sending pen message to iframe:", penMsg);
        iframe.contentWindow.postMessage(penMsg, "*");
        if (iframe2) iframe2.contentWindow.postMessage(penMsg, "*");
      }
    } else {
      console.log("Iframe not ready or program not available");
    }

    // setTimeout(() => document.getElementById("preview-iframe")?.contentWindow?.postMessage("UDDANNELSESBÅNDMateriale:sosuhjælper:bomuld", "*"), 10000);


  };

  const handleIframeLoad = () => {
    console.log("Iframe loaded");
    setIsIframeLoaded(true);

    // Inject a console.log proxy into the iframe to intercept
    // "All Models & Assets Loaded Successfully!" and forward it as postMessage.
    // This works when iframe is same-origin or when browser allows it.
    ["preview-iframe", "preview-iframe2"].forEach((id) => {
      try {
        const iframe = document.getElementById(id);
        if (!iframe?.contentWindow) return;
        const iframeConsole = iframe.contentWindow.console;
        const originalLog = iframeConsole.log.bind(iframeConsole);
        iframeConsole.log = function (...args) {
          originalLog(...args);
          const msg = args.join(" ");
          if (msg.includes("All Models & Assets Loaded Successfully!")) {
            window.postMessage("All Models & Assets Loaded Successfully!", "*");
          }
        };
        console.log(`✅ console.log proxy injected into ${id}`);
      } catch (e) {
        // Cross-origin: can't inject — postMessage listener is the fallback
        console.log(`ℹ️ Cross-origin iframe (${id}), proxy not possible — relying on postMessage`);
      }
    });
  };

  // Ref to make sure we only start the loader-hide timer once
  const modelLoadTimerRef = useRef(null);

  // Listen for messages from the iframe
  useEffect(() => {
    const handleMessage = (event) => {
      // Debug: log ALL incoming postMessages
      if (event.data !== null && event.data !== undefined) {
        const preview = typeof event.data === "string"
          ? event.data.slice(0, 120)
          : JSON.stringify(event.data).slice(0, 120);
        console.log("📨 postMessage received:", preview);
      }

      // Check for the model-loaded signal (string or object form)
      const rawStr = typeof event.data === "string"
        ? event.data
        : (event.data ? JSON.stringify(event.data) : "");

      if (rawStr.includes("All Models & Assets Loaded Successfully!")) {
        console.log("✅ Models loaded signal received — hiding loader in 5s");
        if (!modelLoadTimerRef.current) {
          modelLoadTimerRef.current = setTimeout(() => {
            setIsModelLoaded(true);
          }, 5000);
        }
      }

      if (event.data === "app:ready") {
        console.log(
          "Iframe ready → Sab components ke initial messages bhej rahe hain"
        );

        setIsAppReady(true);
        setTimeout(() => setShowBlurEffect(true), 3000);

        // Program bhejo
        if (program) {
          sendProgramToIframe();
        }

        const iframes = ["preview-iframe", "preview-iframe2"]
          .map((id) => document.getElementById(id))
          .filter(Boolean);

        if (iframes.length === 0) return;

        const send = (msg) => {
          iframes.forEach((iframe) => {
            if (iframe?.contentWindow)
              iframe.contentWindow.postMessage(msg, "*");
          });
        };

        // ===== BETRÆK =====
        send(`CoverColor:${selectedOptions.BETRÆK?.Farve || ""}`);
        send(`Topkant:${selectedOptions.BETRÆK?.Topkant || ""}`);
        send(`Kantband:${selectedOptions.BETRÆK?.Kantbånd || ""}`);
        send(`Star:${selectedOptions.BETRÆK?.Stjerner || ""}`);
        send(`Flagband:${selectedOptions.BETRÆK?.Flagbånd || ""}`);

        // ===== EKSTRABETRÆK =====
        send(
          `Tilvælg:${(
            selectedOptions.EKSTRABETRÆK?.Tilvælg || "No"
          ).toLowerCase()}`
        );

        // ===== BRODERI =====
        send(`topEmbroidery:${selectedOptions.BRODERI?.["Top broderi"] || "Ingen"}`);

        // ===== SKYGGE =====
        if (packageName === 'basichue') {
          send("Skygge:Blank");
        }

        // ===== UDDANNELSESBÅND (EducationalTape) =====
        const hb =
          selectedOptions.UDDANNELSESBÅND?.Huebånd?.toLowerCase() ||
          program?.toLowerCase();
        const huebandMap = {
          hhx: "Hueband:HHX",
          htx: "Hueband:HTX",
          stx: "Hueband:STX",
          hf: "Hueband:HF",
          eux: "Hueband:EUX",
          eud: "Hueband:EUD",
          sosuassistent: "Hueband:Sosuassistent",
          sosuhjælper: "Hueband:Sosuhjælper",
          frisør: "Hueband:Frisør",
          kosmetolog: "Hueband:Kosmetolog",
          pædagog: "program:pædagog",
          pau: "Hueband:PAU",
          ernæringsassisten: "Hueband:Ernæringsassisten",
          grøn: "Hueband:Landmand",
          sort: "Hueband:Sort",
        };
        send(huebandMap[hb] || "Hueband:Sort");

        const mat = (
          selectedOptions.UDDANNELSESBÅND?.Materiale || "bomuld"
        ).toLowerCase();
        const progKey = program?.toLowerCase();
        const isProgBand = ["hhx", "htx", "stx", "hf", "eux", "eud"].includes(
          progKey
        );
        send(
          hb === progKey
            ? `UDDANNELSESBÅNDMateriale:${progKey}:${mat}`
            : `UDDANNELSESBÅNDMateriale:black:${mat}`
        );

        const hagerem = (
          selectedOptions.UDDANNELSESBÅND?.Hagerem || "mat"
        ).toLowerCase();
        const hageremMap = {
          mat: "hagerem:mat",
          blank: "hagerem:blank",
          "sort med sorteknuder": "hagerem:sort med sorteknuder",
          "guld hagerem med guld knuder":
            "hagerem:guld hagerem med guld knuder",
          "sort hagerem med guld knuder":
            "hagerem:sort hagerem med guld knuder",
          "sølv hagerem med sølvknuder": "hagerem:sølv hagerem med sølvknuder",
          "sølv hagerem med sort knuder":
            "hagerem:sølv hagerem med sort knuder",
        };
        send(hageremMap[hagerem] || "hagerem:mat");

        const brod = (
          selectedOptions.UDDANNELSESBÅND?.["Broderi farve"] || "guld"
        ).toLowerCase();
        const broderiMap = {
          hhx: "broderiForanfarve:HHX",
          htx: "broderiForanfarve:HTX",
          stx: "broderiForanfarve:STX",
          hf: "broderiForanfarve:HF",
          eux: "broderiForanfarve:EUX",
          eud: "broderiForanfarve:EUD",
          landmand: "broderiForanfarve:Landmand",
          guld: "broderiForanfarve:Guld",
          sølv: "broderiForanfarve:Sølv",
          hvid: "broderiForanfarve:Hvid",
          sort: "broderiForanfarve:Sort",
        };
        send(broderiMap[brod] || "broderiForanfarve:Guld");

        send(
          selectedOptions.UDDANNELSESBÅND?.["Knap farve"] === "Sølv"
            ? "KnapSølv"
            : "KnapGuld"
        );

        const foer = selectedOptions.FOER || {};

        // Svederem
        const svederem = (foer.Svederem || "Læder").toLowerCase();
        send(`Foer Svederem:${svederem}`);

        // Farve
        const farve = (foer.Farve || "Hvid").toLowerCase();
        send(`Foer Farve:${farve}`);

        // Sløjfe
        const slojfe = (foer.Sløjfe || "Hvid").toLowerCase();
        send(`Foer Slojfe:${slojfe}`);

        // Foer (material)
        const foerMaterial = (foer.Foer || "Polyester").toLowerCase();
        send(`Foer Foring:${foerMaterial}`);

        // Satin Type
        const satinType = foer["Satin Type"] || "";
        send(
          satinType
            ? `Foer SatinType:${satinType.toLowerCase()}`
            : `Foer SatinType:`
        );

        // Silk Type
        const silkType = foer["Silk Type"] || "";
        send(
          silkType
            ? `Foer SilkType:${silkType.toLowerCase()}`
            : `Foer SilkType:`
        );

        ////////////zeeeeeeeeeee///////////////////
        // ===== Default Page =====
        send("Page : 1");

        // ===== KOKARDE (Bows) with 2-second delay =====
        setTimeout(() => {
          const kokarde = selectedOptions.KOKARDE || {};

          // Color
          const colors = {
            'Royal blå': 'flowerRoyalBlue',
            'Navy blå': 'flowerNavyBlue',
            'Bordeaux': 'flowerMaroon',
            'Light blå': 'flowerSkyBlue',
            'Rød': 'flowerRed',
            'Purple': 'flowerPurple',
            'Sort': 'flowerBlack',
          };
          const colorName = kokarde["Roset farve"]?.name || kokarde.color?.name;
          if (colorName && colors[colorName]) {
            send(colors[colorName]);
          }

          // Prestige (Kokarde)
          const prestige = kokarde.Kokarde || kokarde.bowType;
          const colorMap = {
            'Signature': 'StandardEmblem',
            'Prestige': 'PrestigeEmblem',
            'Stjernetegn': 'StjernetegnEmblem',
            'Flag': 'FlagEmblem',
          };
          if (prestige && colorMap[prestige]) {
            send(colorMap[prestige]);
          }

          // Emblem
          const emblem = kokarde.Emblem || kokarde.emblem;
          const emblemMap = {
            "Guld": "rosetfarveGold",
            "Sølv": "rosetfarveSilver"
          };
          if (emblem?.value && emblemMap[emblem.value]) {
            send(emblemMap[emblem.value]);
          }

          // Type (Signature / Prestige / Stjernetegn) or country name when Kokarde mode is Flag
          const type = kokarde.Type || kokarde.selectedType;
          const flagCountry = kokarde.Flag?.name;
          if (prestige === 'Flag' && flagCountry) {
            send(flagCountry + " " + (emblem?.value || "Guld"));
          } else if (type) {
            send(type + " " + (emblem?.value || "Guld"));
          }
        }, 1000);
      }

      ////////////zeeeeeeeeeee///////////////////

    };



    window.addEventListener("message", handleMessage);
    
  return () => window.removeEventListener("message", handleMessage);
  }, [program, selectedOptions]);

  // Add this useEffect to debug
  useEffect(() => {
    console.log("Program changed:", program);
    console.log("Iframe loaded status:", isIframeLoaded);
    console.log("App ready status:", isAppReady);
  }, [program, isIframeLoaded, isAppReady]);

  useEffect(() => {
    var iframe_desktop = document.getElementById("preview-iframe");
    var iframe_mobile = document.getElementById("preview-iframe2");
    
    if (!iframe_desktop || !iframe_mobile) return;

    if (window.innerWidth >= 768) {
      ////////DEV Student Life////////
      iframe_desktop.src = "https://playcanv.as/e/b/fa649829/";

      ////////Production Student Life////////
      // iframe_desktop.src = "https://playcanv.as/e/p/QIG7fh8C/";
    } else {
      ////////DEV Student Life////////
      iframe_mobile.src = "https://playcanv.as/e/b/fa649829/";

      ////////Production Student Life////////
      // iframe_mobile.src = "https://playcanv.as/e/p/QIG7fh8C/";
    }
  }, [configLoading]);

  if (configLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (dynamicConfig?.programsVisibility && program && dynamicConfig.programsVisibility[program.toUpperCase()] === false) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white rounded shadow-sm border border-slate-200 p-8 text-center animate-in zoom-in-95 duration-500">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Program Disabled</h2>
          <p className="text-slate-500 mt-2 text-sm font-medium">
            The requested program is currently not available for configuration.
          </p>
        </div>
      </div>
    );
  }

  const progKey = program ? program.toUpperCase() : 'STX';
  const visibilityConfig = dynamicConfig?.programOptionVisibility?.[progKey] || {};

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
      {/* Desktop Layout (md and up) */}
      <div className="hidden md:flex h-screen">
        {/* Sidebar */}
        <aside className="bg-white/70 backdrop-blur-sm border-r border-slate-200 overflow-y-auto">
          <div className="p-6">
            <h2 className="text-sm font-semibold text-center text-slate-600 uppercase tracking-wider mb-4">
              Kasketter
            </h2>
            <nav className="">
              {menuItems.filter(item => visibilityConfig?.[item.name] !== false).map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    // console.log(selectedOptions.BETRÆK);

                    ["preview-iframe", "preview-iframe2"].forEach((id) => {
                      const iframe = document.getElementById(id);
                      if (iframe?.contentWindow) {
                        console.log(
                          "Sending message to iframe:",
                          `Page : ${index + 1}`
                        );
                        iframe.contentWindow.postMessage(
                          `Page : ${index + 1}`,
                          "*"
                        );
                        console.log("Sending message to iframe:", "Tilvælg:no");
                        iframe.contentWindow.postMessage("Tilvælg:no", "*");

                        console.log("Sending menu selection message to iframe:", item.name);
                        iframe.contentWindow.postMessage(item.name, "*");
                        iframe.contentWindow.postMessage(`${item.name} camera`, "*");
                      } else {
                        console.log(
                          "Iframe not ready or program not available"
                        );
                      }
                    });
                    if (errors && Object.keys(errors).length > 0) {
                      return;
                    }
                    setActiveMenu(item.name);

                    if (item.name !== "EKSTRABETRÆK") {
                      ["preview-iframe", "preview-iframe2"].forEach((id) => {
                        const iframe = document.getElementById(id);
                        if (iframe?.contentWindow) {
                          iframe.contentWindow.postMessage(
                            `CoverColor:${selectedOptions.BETRÆK.Farve}`,
                            "*"
                          );
                          iframe.contentWindow.postMessage(
                            `Topkant:${selectedOptions.BETRÆK.Topkant}`,
                            "*"
                          );
                          iframe.contentWindow.postMessage(
                            `Kantband:${selectedOptions.BETRÆK.Kantbånd}`,
                            "*"
                          );
                          iframe.contentWindow.postMessage(
                            `Star:${selectedOptions.BETRÆK.Stjerner}`,
                            "*"
                          );
                          iframe.contentWindow.postMessage(
                            `Flagband:${selectedOptions.BETRÆK.Flagbånd}`,
                            "*"
                          );
                        } else {
                          console.log(
                            "Iframe not ready or program not available"
                          );
                        }
                      });
                    }
                  }}
                  className={`flex items-center px-2 py-3 rounded-xl transition-all duration-200 group ${activeMenu === item.name
                    ? "bg-white shadow-sm"
                    : "hover:bg-slate-50 hover:shadow-sm"
                    }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-transform duration-200 ${activeMenu === item.name
                      ? "scale-110"
                      : "group-hover:scale-105"
                      }`}
                  >
                    <img
                      src={item.icon}
                      alt={item.name}
                      className="w-10 h-10 object-contain"
                    />
                  </div>

                  {activeMenu === item.name && (
                    <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </button>
              ))}
            </nav>

          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Configuration Panel */}
          {/* jjjjjjjjjjjj */}
          <div className="w-[40%] bg-white/50 backdrop-blur-sm flex flex-col h-full border-r border-slate-200" id="desktop-config-panel">
            {/* jjjjjjjjjjjj */}
            <div className="p-6 space-y-8 flex-1 overflow-y-auto">
              {activeMenu === "KOKARDE" && (
                <Bows
                  selectedOptions={selectedOptions.KOKARDE}
                  onOptionChange={(key, value) =>
                    handleOptionChange("KOKARDE", key, value)
                  }
                  program={program} visibilityConfig={visibilityConfig} pakke={packageName}
                  changeCurrentEmblem={setGlobalEmblem}
                />
              )}
              {activeMenu === "UDDANNELSESBÅND" && (
                <EducationalTape
                  selectedOptions={selectedOptions.UDDANNELSESBÅND}
                  onOptionChange={(key, value) =>
                    handleOptionChange("UDDANNELSESBÅND", key, value)
                  }
                  program={program} visibilityConfig={visibilityConfig} pakke={packageName}
                  currentEmblem={globalEmblem}
                />
              )}
              {activeMenu === "BRODERI" && (
                <Embroidery
                  selectedOptions={selectedOptions.BRODERI}
                  onOptionChange={(key, value) =>
                    handleOptionChange("BRODERI", key, value)
                  }
                  program={program} visibilityConfig={visibilityConfig}
                  pakke={packageName}
                />
              )}
              {activeMenu === "BETRÆK" && (
                <Cover
                  selectedOptions={selectedOptions.BETRÆK}
                  onOptionChange={(key, value) =>
                    handleOptionChange("BETRÆK", key, value)
                  }
                  program={program} visibilityConfig={visibilityConfig} pakke={packageName}
                  currentEmblem={globalEmblem}
                />
              )}
              {activeMenu === "SKYGGE" && (
                <Shade
                    selectedOptions={selectedOptions.SKYGGE}
                    onOptionChange={(key, value) =>
                      handleOptionChange("SKYGGE", key, value)
                    }
                    program={program} visibilityConfig={visibilityConfig} pakke={packageName}
                  />
              )}
              {activeMenu === "FOER" && (
                <Foer
                  selectedOptions={selectedOptions.FOER}
                  onOptionChange={(key, value) =>
                    handleOptionChange("FOER", key, value)
                  }
                  currentEmblem={globalEmblem}
                  program={program} visibilityConfig={visibilityConfig} pakke={packageName}
                />
              )}
              {activeMenu === "EKSTRABETRÆK" && (
                <ExtraCover
                  selectedOptions={selectedOptions.EKSTRABETRÆK}
                  onOptionChange={(key, value) =>
                    handleOptionChange("EKSTRABETRÆK", key, value)
                  }
                  currentEmblem={globalEmblem}
                  program={program} visibilityConfig={visibilityConfig} pakke={packageName}
                  priceReset={setExtraCoverReset}
                />
              )}
              {activeMenu === "TILBEHØR" && (
                <Accessories
                  selectedOptions={selectedOptions}
                  onOptionChange={handleOptionChange}
                  errors={errors}
                  setErrors={setErrors}
                  pakke={packageName}
                  visibilityConfig={visibilityConfig}
                  programFlags={dynamicConfig?.programFlags?.[(program || '').toUpperCase()] || []}
                />
              )}
              {activeMenu === "STØRRELSE" && (
                <Size
                  selectedOptions={selectedOptions.STØRRELSE}
                  onOptionChange={(key, value) =>
                    handleOptionChange("STØRRELSE", key, value)
                  }
                  size={setSizeFlag}
                  visibilityConfig={visibilityConfig}
                />
              )}
            </div>

            {/* Desktop Footer (Moved here to be inside Config Panel) */}
            <div className="p-6 bg-white border-t border-slate-200">
              {matchingInstallmentPlan && (
                <div className="mb-3 px-3.5 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                    <span className="text-sm">⚡</span> Afdragsordning tilgængelig
                  </span>
                  <span className="text-sm font-semibold text-emerald-700">
                    Første betaling: {matchingInstallmentPlan.downPaymentAmount || 399} kr.
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
                  Pris
                </span>
                <span className="text-xl font-bold text-slate-900 flex items-center">
                  {calculateTotalPrice().toFixed(2)} DKK
                  {packageName === 'premium' && <span className="text-sm text-green-600 ml-1">(Inclusive)</span>}
                </span>
              </div>
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-semibold text-slate-400">
                  Ekspeditionsgebyr
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  +{getDeliveryFee().toFixed(2)} DKK
                </span>
              </div>
              <button
                onClick={collectSelectedOptions}
                disabled={!sizeFlag}
                className={`w-full py-3.5 rounded text-sm font-bold uppercase tracking-wider transition-colors
                  ${sizeFlag
                    ? "bg-[#16a34a] text-white hover:bg-[#15803d]"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
              >
                Godkend og Betal
              </button>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="flex-1 relative bg-slate-50">
            {/* Iframe Preview Area */}
            <div className="absolute inset-0 w-full h-full overflow-hidden">
                <iframe
                  id="preview-iframe"
                  src=""
                  className="w-full h-full"
                  frameBorder="0"
                  title="3D Student Card Preview"
                  onLoad={handleIframeLoad}
                />

                {/* Model Loading Overlay - Desktop */}
                {!isModelLoaded && (
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    background: showBlurEffect ? "rgba(255, 255, 255, 0.5)" : "#ffffff",
                    backdropFilter: showBlurEffect ? "blur(8px)" : "none",
                    WebkitBackdropFilter: showBlurEffect ? "blur(8px)" : "none",
                    transition: "all 0.5s ease",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 30,
                    gap: 36,
                  }}>

                    {/* Large Student Life Logo — no circle */}
                    <img
                      src={LOGO}
                      alt="Student Life"
                      style={{
                        height: 160,
                        objectFit: "contain",
                        userSelect: "none",
                        filter: "brightness(0)",
                      }}
                    />

                    {/* Premium shimmer loader bar */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, marginTop: -30 }}>
                      <div style={{
                        width: 200,
                        height: 2,
                        borderRadius: 99,
                        background: "#cbd5e1",
                        overflow: "hidden",
                        position: "relative",
                      }}>
                        <div style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          height: "100%",
                          width: "45%",
                          borderRadius: 99,
                          background: "linear-gradient(90deg, transparent, #475569, #0f172a, #475569, transparent)",
                          animation: "sl-shimmer 1.8s ease-in-out infinite",
                        }} />
                      </div>

                      <p style={{
                        margin: 0,
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#0f172a",
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        fontFamily: "'Inter', 'Segoe UI', sans-serif",
                      }}>{showBlurEffect ? "Indlæser standardkonfiguration…" : "Indlæser din model…"}</p>
                    </div>

                    <style>{`
                      @keyframes sl-float {
                        0%, 100% { transform: translateY(0px); opacity: 1; }
                        50% { transform: translateY(-8px); opacity: 0.92; }
                      }
                      @keyframes sl-shimmer {
                        0% { left: -50%; }
                        100% { left: 110%; }
                      }
                    `}</style>
                  </div>
                )}

                {/* Floating AR Button */}
                <button
                  onClick={() => window.open("https://elipsestudio.com/CapAR/", "_blank")}
                  className="absolute top-4 right-4 z-20 group transition-all duration-300 active:scale-95"
                >
                  <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 transition-transform duration-300 group-hover:scale-110 group-hover:bg-white/40 shadow-sm">
                    <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-green-600 drop-shadow-sm">
                      <path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z" fill="white" fillOpacity="0.8" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                      <path d="M12 12L20 7.5M12 12V21M12 12L4 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      {/* moblail */}
      <div className="md:hidden flex flex-col ">
        {/* Mobile Preview Panel - Top */}
        <div className="flex flex-col h-screen">
          {/* Main content area that will scroll */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Preview section (Matches Image 2) - Updated to 300px height */}
            <div className="relative h-[300px] flex-shrink-0">
              <div className="bg-white/70 backdrop-blur-sm border-b border-slate-200 h-full">
                <div className="absolute top-0 left-0 right-0 z-10 flex items-start justify-between p-4 bg-transparent pointer-events-none">
                  <div className="flex items-start space-x-3 pointer-events-auto">
                    <div className="w-10 h-10 bg-[#3b59ff] rounded-2xl flex items-center justify-center shadow-lg">
                      <GraduationCap className="w-5 h-5 text-white" />
                    </div>
                    <div className="pt-1">
                      <h4 className="font-bold text-slate-800 text-base leading-tight">Valgt hue</h4>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{program}</p>
                    </div>
                  </div>

                  <div className="pointer-events-auto">
                    <img src={LOGO} className="h-10 object-contain" alt="Student Life" />
                  </div>
                </div>

                <div className="h-full overflow-hidden relative">
                  <iframe
                    id="preview-iframe2"
                    src=""
                    className="w-full h-full"
                    frameBorder="0"
                    title="3D Student Card Preview"
                    onLoad={handleIframeLoad}
                  />

                  {/* Model Loading Overlay - Mobile */}
                  {!isModelLoaded && (
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      background: showBlurEffect ? "rgba(255, 255, 255, 0.5)" : "#ffffff",
                      backdropFilter: showBlurEffect ? "blur(8px)" : "none",
                      WebkitBackdropFilter: showBlurEffect ? "blur(8px)" : "none",
                      transition: "all 0.5s ease",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 30,
                      gap: 24,
                    }}>

                      {/* Large Student Life Logo — no circle */}
                      <img
                        src={LOGO}
                        alt="Student Life"
                        style={{
                          height: 90,
                          objectFit: "contain",
                          userSelect: "none",
                          filter: "brightness(0)",
                        }}
                      />

                      {/* Shimmer bar */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginTop: -20 }}>
                        <div style={{
                          width: 140,
                          height: 2,
                          borderRadius: 99,
                          background: "#cbd5e1",
                          overflow: "hidden",
                          position: "relative",
                        }}>
                          <div style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            height: "100%",
                            width: "45%",
                            borderRadius: 99,
                            background: "linear-gradient(90deg, transparent, #475569, #0f172a, #475569, transparent)",
                            animation: "sl-shimmer 1.8s ease-in-out infinite",
                          }} />
                        </div>
                        <p style={{
                          margin: 0,
                          fontSize: 10,
                          fontWeight: 600,
                          color: "#0f172a",
                          letterSpacing: "0.15em",
                          textTransform: "uppercase",
                          fontFamily: "'Inter', 'Segoe UI', sans-serif",
                        }}>{showBlurEffect ? "Indlæser standardkonfiguration…" : "Indlæser…"}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Category Navigation (Matches User Image) */}
            <div className="bg-white/70 backdrop-blur-sm border-t border-green-600 flex-shrink-0 z-20">
              <div className="flex overflow-x-auto no-scrollbar py-2 px-4">
                <div className="flex items-end space-x-4">
                  {menuItems.filter(item => visibilityConfig?.[item.name] !== false).map((item, index) => {
                    const isActive = activeMenu === item.name;
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          ["preview-iframe", "preview-iframe2"].forEach((id) => {
                            const iframe = document.getElementById(id);
                            if (iframe?.contentWindow) {
                              iframe.contentWindow.postMessage(`Page : ${index + 1}`, "*");
                              iframe.contentWindow.postMessage("Tilvælg:no", "*");
                              iframe.contentWindow.postMessage(`${item.name} camera`, "*");
                            }
                          });
                          setActiveMenu(item.name);
                        }}
                        className="flex-shrink-0 flex flex-col items-center relative pb-3"
                      >
                        <div className={`w-14 h-14 rounded-full border transition-all duration-300 flex items-center justify-center ${isActive ? "border-green-600 bg-white" : "border-slate-100 bg-slate-50"
                          }`}>
                          <img
                            src={item.icon}
                            alt={item.name}
                            className="w-9 h-9 object-contain"
                          />
                        </div>
                        {isActive && (
                          <div className="absolute bottom-0 left-0 right-0 h-[4.5px] bg-green-600 rounded-full transition-all duration-300"></div>
                        )}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => window.open("https://elipsestudio.com/CapAR/", "_blank")}
                    className="flex-shrink-0 flex flex-col items-center relative pb-3"
                  >
                    <div className="w-14 h-14 rounded-full border border-slate-100 bg-slate-50 transition-all duration-300 flex items-center justify-center hover:border-blue-600 active:scale-95">
                      <svg viewBox="0 0 24 24" fill="none" className="w-9 h-9 text-green-600">
                        <path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                        <path d="M12 12L20 7.5M12 12V21M12 12L4 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>

                  </button>
                </div>
              </div>
            </div>

            {/* jjjjjjjjjjjj */}
            <div className="flex-1 overflow-y-auto" id="mobile-config-panel">
              {/* jjjjjjjjjjjj */}
              {isConfigOpen && (
                <div className="p-4 space-y-6">
                  {/* Keep all components mounted but conditionally show based on activeMenu */}
                  {activeMenu === "KOKARDE" && (
                    <Bows
                      selectedOptions={selectedOptions.KOKARDE}
                      onOptionChange={(key, value) =>
                        handleOptionChange("KOKARDE", key, value)
                      }
                      program={program} visibilityConfig={visibilityConfig} pakke={packageName}
                      changeCurrentEmblem={setGlobalEmblem}
                    />
                  )}
                  {activeMenu === "UDDANNELSESBÅND" && (
                    <EducationalTape
                      selectedOptions={selectedOptions.UDDANNELSESBÅND}
                      onOptionChange={(key, value) =>
                        handleOptionChange("UDDANNELSESBÅND", key, value)
                      }
                      program={program} visibilityConfig={visibilityConfig} pakke={packageName}
                      currentEmblem={globalEmblem}
                    />
                  )}
                  {activeMenu === "BRODERI" && (
                    <Embroidery
                      selectedOptions={selectedOptions.BRODERI}
                      onOptionChange={(key, value) =>
                        handleOptionChange("BRODERI", key, value)
                      }
                      program={program} visibilityConfig={visibilityConfig}
                      pakke={packageName}
                    />
                  )}
                  {activeMenu === "BETRÆK" && (
                    <Cover
                      selectedOptions={selectedOptions.BETRÆK}
                      onOptionChange={(key, value) =>
                        handleOptionChange("BETRÆK", key, value)
                      }
                      program={program} visibilityConfig={visibilityConfig} pakke={packageName}
                      currentEmblem={globalEmblem}
                    />
                  )}
                  {activeMenu === "SKYGGE" && (
                    <Shade
                    selectedOptions={selectedOptions.SKYGGE}
                    onOptionChange={(key, value) =>
                      handleOptionChange("SKYGGE", key, value)
                    }
                    program={program} visibilityConfig={visibilityConfig} pakke={packageName}
                  />
                  )}
                  {activeMenu === "FOER" && (
                    <Foer
                      selectedOptions={selectedOptions.FOER}
                      onOptionChange={(key, value) =>
                        handleOptionChange("FOER", key, value)
                      }
                      currentEmblem={globalEmblem}
                      program={program} visibilityConfig={visibilityConfig} pakke={packageName}
                    />
                  )}
                  {activeMenu === "EKSTRABETRÆK" && (
                    <ExtraCover
                      selectedOptions={selectedOptions.EKSTRABETRÆK}
                      onOptionChange={(key, value) =>
                        handleOptionChange("EKSTRABETRÆK", key, value)
                      }
                      currentEmblem={globalEmblem}
                      program={program} visibilityConfig={visibilityConfig}
                      priceReset={setExtraCoverReset}
                      pakke={packageName}
                    />
                  )}
                  {activeMenu === "TILBEHØR" && (
                    <Accessories
                      selectedOptions={selectedOptions}
                      onOptionChange={handleOptionChange}
                      errors={errors}
                      setErrors={setErrors}
                      pakke={packageName}
                      visibilityConfig={visibilityConfig}
                      programFlags={dynamicConfig?.programFlags?.[(program || '').toUpperCase()] || []}
                    />
                  )}
                  {activeMenu === "STØRRELSE" && (
                    <Size
                      selectedOptions={selectedOptions.STØRRELSE}
                      onOptionChange={(key, value) =>
                        handleOptionChange("STØRRELSE", key, value)
                      }
                      size={setSizeFlag}
                      visibilityConfig={visibilityConfig} pakke={packageName}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Sidebar - Now inside the scrollable area but above footer */}
          </div>

          {/* Fixed Footer - Always visible at bottom */}
          <div className="bg-white/70 backdrop-blur-sm border-t border-green-600 p-4 flex-shrink-0">
            {matchingInstallmentPlan && (
              <div className="mb-2.5 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-800 flex items-center gap-1">
                  <span className="text-sm">⚡</span> Afdragsordning tilgængelig
                </span>
                <span className="font-semibold text-emerald-700">
                  Første betaling: {matchingInstallmentPlan.downPaymentAmount || 399} kr.
                </span>
              </div>
            )}
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-slate-600">
                Samlet pris
              </span>
              <div className="text-right">
                <div className="text-xl font-bold text-slate-900 flex items-center justify-end">
                  {calculateTotalPrice().toFixed(2)} DKK
                  {packageName === 'premium' && <span className="text-sm text-green-600 ml-1">(Inclusive)</span>}
                </div>
                <div className="text-xs text-slate-500">

                  Servicegebyr på {getDeliveryFee()},00 kr. inkl.

                </div>
              </div>
            </div>
            <button
              onClick={collectSelectedOptions}
              disabled={!sizeFlag}
              className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 shadow-md ${sizeFlag
                ? "bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 hover:shadow-lg"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
            >
              Godkend og Betal
            </button>
          </div>
        </div>

        {/* Quote Modal */}
      </div>
      <QuoteModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        selectedOptions={selectedOptions}
        price={calculateTotalPrice().toFixed(2)}
        packageName={packageName}
        program={program} visibilityConfig={visibilityConfig} pakke={packageName}
        installmentPlan={matchingInstallmentPlan}
      />
    </div >
  );
};

export default StudentDashboard;
