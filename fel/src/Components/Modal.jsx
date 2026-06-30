import React, { useState } from 'react';
import { X, Printer, Download, Mail, CheckCircle, Package, Star, User, CreditCard, ArrowLeft, ArrowRight, Loader2, ShoppingCart, Settings } from 'lucide-react';
import { loadStripe } from "@stripe/stripe-js";
import { useRef } from 'react';
import { useEffect } from 'react';

////////Production Student Life////////
const stripePromise = loadStripe("pk_live_51S0HgIFDBW3pcErGOmI6vsVCXStMih46KJXjrOiFHppAj6h0tHOp4zDYMoLyTQn7Uk99pePatnCFrqLh6AAblGa300Wm8qbiRe");

////////DEV Student Life////////
// const stripePromise = loadStripe("pk_test_51S0HgS2ZnQzLDaK40M9tlj1n72wtQNsUNhG986xbE6bfHxWmFfOMJfWGAbg4QrAlFtnhVCtOajoIqUbRgSBnRnkb00iMo1bD1o");

const QuoteModal = ({ isOpen, onClose, selectedOptions, price, onContinueConfiguring, packageName, program }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [customerDetails, setCustomerDetails] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    Skolenavn: '',
    address: '',
    city: '',
    postalCode: '',
    notes: '',
    deliveryType: "regular"
  });

  // --- outside renderCustomerDetails, in your component ---
  const refs = {
    firstName: useRef(null),
    lastName: useRef(null),
    email: useRef(null),
    phone: useRef(null),
    Skolenavn: useRef(null),
    address: useRef(null),
    city: useRef(null),
    country: useRef(null),
    postalCode: useRef(null),
    notes: useRef(null),
  };

  // Ordered list of refs (for enter + click navigation)
  const refOrder = [
    refs.firstName,
    refs.lastName,
    refs.email,
    refs.phone,
    refs.Skolenavn,
    refs.address,
    refs.city,
    refs.postalCode,
    refs.country,
    refs.notes,
  ];

  const lastFocusedIndex = useRef(-1);

  // Track which field was last focused - ONLY on step 1
  useEffect(() => {
    if (currentStep !== 1) return;
    console.log('first');

    const handleFocus = (index) => {
      lastFocusedIndex.current = index;
      console.log('second');
    };

    // Add focus event listeners to all refs
    refOrder.forEach((ref, index) => {
      if (ref.current) {
        ref.current.addEventListener("focus", () => handleFocus(index));
        console.log('third');
      }
    });

    return () => {
      // Cleanup focus event listeners
      refOrder.forEach((ref) => {
        if (ref.current) {
          ref.current.removeEventListener("focus", () => { });
          console.log('fourth');
        }
      });
    };
  }, [currentStep]); // Re-run when step changes

  // Click outside → focus next field - ONLY on step 1
  useEffect(() => {
    if (currentStep !== 1) return;

    const handleClick = (e) => {
      // Don't trigger if clicking on form elements or buttons
      if (e.target.matches('input, textarea, select')) {
        return;
      }
      // If we have a last focused field and it's not the last one
      if (lastFocusedIndex.current >= 0 && lastFocusedIndex.current < refOrder.length - 1) {
        const nextIndex = lastFocusedIndex.current + 1;
        refOrder[nextIndex].current?.focus();
      } else if (lastFocusedIndex.current === -1) {
        // No field focused yet, focus first field
        refOrder[0].current?.focus();
      }
      // If lastFocusedIndex.current is the last field, do nothing
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [currentStep]); // Re-run when step changes

  const [orderDate, setOrderDate] = useState(`CAP-${Date.now().toString()}`);

  if (!isOpen) return null;

  const steps = orderComplete ? ['Thank You'] : ['Ordre oversigt', 'Leveringsoplysninger', 'Ordrebekræftelse'];

  // Price definitions for each option
  const priceConfig = {
    basePrice: 299,
    bows: {
      color: {
        "Standard": 0,
        "Premium": 50,
        "Luxury": 100
      },
      bowType: {
        "Standard": 0,
        "Premium": 75,
        "Luxury": 150
      },
      emblem: {
        "Standard": 0,
        "Premium": 60,
        "Luxury": 120
      },
      country: {
        "Denmark": 0,
        "Greenland": 0,
        "Sweden": 25,
        "Norway": 25,
        "Germany": 25,
        "Other": 30
      }
    },
    educationalTape: {
      hatbandColor: {
        "Standard": 0,
        "Premium": 40,
        "Luxury": 80
      },
      materialType: {
        "Standard": 0,
        "Premium": 55,
        "Luxury": 110
      },
      chinStrapColor: {
        "Standard": 0,
        "Premium": 30,
        "Luxury": 60
      },
      buttonMaterial: {
        "Standard": 0,
        "Premium": 20,
        "Luxury": 40
      },
      embroideryColor: {
        "Standard": 0,
        "Premium": 35,
        "Luxury": 70
      },
      buttonColor: {
        "Standard": 0,
        "Premium": 15,
        "Luxury": 30
      },
      embroideryText: {
        "Standard": 0,
        "Premium": 25,
        "Luxury": 50
      }
    },
    embroidery: {
      nameEmbroideryColor: {
        "Standard": 0,
        "Premium": 45,
        "Luxury": 90
      },
      nameEmbroideryText: {
        "Standard": 0,
        "Premium": 25,
        "Luxury": 50
      },
      schoolEmbroideryColor: {
        "Standard": 0,
        "Premium": 45,
        "Luxury": 90
      },
      schoolEmbroideryText: {
        "Standard": 0,
        "Premium": 25,
        "Luxury": 50
      }
    },
    cover: {
      coverColor: {
        "Standard": 0,
        "Premium": 70,
        "Luxury": 140
      },
      edgebandColor: {
        "Standard": 0,
        "Premium": 40,
        "Luxury": 80
      },
      starsStyle: {
        "Standard": 0,
        "Premium": 50,
        "Luxury": 100
      }
    },
    shade: {
      shadeType: {
        "Standard": 0,
        "Premium": 85,
        "Luxury": 170
      },
      materialType: {
        "Standard": 0,
        "Premium": 60,
        "Luxury": 120
      },
      shadowTapeColor: {
        "Standard": 0,
        "Premium": 35,
        "Luxury": 70
      },
      engravingLine1: {
        "Standard": 0,
        "Premium": 15,
        "Luxury": 30
      },
      engravingLine2: {
        "Standard": 0,
        "Premium": 15,
        "Luxury": 30
      },
      engravingLine3: {
        "Standard": 0,
        "Premium": 15,
        "Luxury": 30
      }
    },
    foer: {
      kokardeMaterial: {
        "Standard": 0,
        "Premium": 50,
        "Luxury": 100
      },
      kokardeColor: {
        "Standard": 0,
        "Premium": 30,
        "Luxury": 60
      },
      bowColor: {
        "Standard": 0,
        "Premium": 40,
        "Luxury": 80
      },
      foerMaterial: {
        "Standard": 0,
        "Premium": 65,
        "Luxury": 130
      },
      bowMaterialType: {
        "Standard": 0,
        "Premium": 45,
        "Luxury": 90
      }
    },
    extraCover: {
      extraCoverOption: {
        "None": 0,
        "Standard": 50,
        "Premium": 100,
        "Luxury": 200
      }
    },
    accessories: {
      hatBoxColor: {
        "Standard": 0,
        "Premium": 25,
        "Luxury": 50
      },
      hatBoxType: {
        "None": 0,
        "Standard": 50,
        "Premium": 100,
        "Luxury": 200
      },
      ballpointPenSelection: {
        "None": 0,
        "Standard": 20,
        "Premium": 40
      },
      silkPillowSelection: {
        "None": 0,
        "Standard": 30,
        "Premium": 60
      },
      badgesSelection: {
        "None": 0,
        "Standard": 25,
        "Premium": 50
      },
      glovesSelection: {
        "None": 0,
        "Standard": 35,
        "Premium": 70
      },
      largeBallpointPenSelection: {
        "None": 0,
        "Standard": 30,
        "Premium": 60
      },
      smartTagSelection: {
        "None": 0,
        "Standard": 15,
        "Premium": 30
      },
      lightBallSelection: {
        "None": 0,
        "Standard": 40,
        "Premium": 80
      },
      champagneGlassSelection: {
        "None": 0,
        "Standard": 25,
        "Premium": 50
      },
      whistleSelection: {
        "None": 0,
        "Standard": 20,
        "Premium": 40
      },
      trumpetSelection: {
        "None": 0,
        "Standard": 80,
        "Premium": 160
      }
    },
    size: {
      selectedSize: {
        "49.5": 0,
        "50": 0,
        "51": 0,
        "52": 0,
        "53": 0,
        "54": 0,
        "55": 0,
        "56": 0,
        "57": 0,
        "58": 0,
        "59": 0,
        "60": 0,
        "61": 0
      },
      millimeterAdjustment: {
        "0": 0,
        "5": 10,
        "10": 20,
        "15": 30
      }
    }
  };

  // Function to calculate total price


  // Function to format values for display
  const formatValue = (value, section, key) => {
    let displayValue = '';
    let price = 0;

    if (typeof value === 'object' && value.name) {
      displayValue = value.name;
      if (priceConfig[section] && priceConfig[section][key] && priceConfig[section][key][value.name] !== undefined) {
        price = priceConfig[section][key][value.name];
      }
    } else if (typeof value === 'string') {
      if (value.startsWith('data:image')) {
        displayValue = 'Billede uploadet';
      } else {
        displayValue = value;
        if (priceConfig[section] && priceConfig[section][key] && priceConfig[section][key][value] !== undefined) {
          price = priceConfig[section][key][value];
        }
      }
    } else if (typeof value === 'number') {
      displayValue = value.toString();
      if (priceConfig[section] && priceConfig[section][key] && priceConfig[section][key][value.toString()] !== undefined) {
        price = priceConfig[section][key][value.toString()];
      }
    }

    if (displayValue === '' || displayValue === 'Ikke valgt') {
      return 'Ikke valgt';
    }

    if (price > 0) {
      return `${displayValue} (+${price} DKK)`;
    }

    return displayValue;
  };

  // Filter out empty or default values for cleaner display
  //   const filterOptions = (options) => {
  //   // Define relationships between text fields and their color fields
  //   const relatedPairs = {
  //     "Broderi foran": "Broderi farve",
  //     "Navne broderi": "Broderifarve",
  //     "Skolebroderi": "Skolebroderi farve",
  //   };

  //   // First, make a shallow copy so we can safely delete keys
  //   const filtered = { ...options };

  //   // Loop through each related pair
  //   for (const [textKey, colorKey] of Object.entries(relatedPairs)) {
  //     if (filtered[textKey] === "") {
  //       // If the main text field is empty, remove its color field
  //       delete filtered[colorKey];
  //     }
  //   }

  //   // Now remove unwanted keys and empty/null values
  //   return Object.fromEntries(
  //     Object.entries(filtered).filter(([key, value]) => {
  //       if (key === "Ingen") return false;
  //       if (value === null || value === undefined) return false;
  //       if (typeof value === "object" && (!value.name || value.name === "")) return false;
  //       // Keep empty strings for display logic if needed
  //       return true;
  //     })
  //   );
  // };

  const filterOptions = (options) => {
    // Define pairs of text fields and their related color fields
    const relatedPairs = {
      "Broderi foran": "Broderi farve",
      "Navne broderi": "Broderifarve",
      "Skolebroderi": "Skolebroderi farve",
    };

    // Make a shallow copy so we can safely modify it
    const filtered = { ...options };

    // Remove empty text fields and their related color fields
    for (const [textKey, colorKey] of Object.entries(relatedPairs)) {
      if (filtered[textKey] === "") {
        delete filtered[textKey];
        delete filtered[colorKey];
      }
    }

    if (


      selectedOptions.SKYGGE.Type == "Glimmer"
    ) {
      delete selectedOptions.SKYGGE.Materiale;
    }
    if (


      selectedOptions.TILBEHØR['Ekstra korkarde'] == "Fravalgt" || selectedOptions.TILBEHØR['Ekstra korkarde'] == "No"
    ) {
      delete selectedOptions.TILBEHØR['Ekstra korkarde Text'];
    }
    if (


      selectedOptions.TILBEHØR['Lille Flag'] == "Fravalgt" || selectedOptions.TILBEHØR['Lille Flag'] == "No"
    ) {
      delete selectedOptions.TILBEHØR['Lille Flag Text'];
    }

    // Now filter out unwanted keys and handle value translations
    return Object.fromEntries(
      Object.entries(filtered).filter(([key, value]) => {

        if (key === "Ingen") return false;
        if (value === null || value === undefined) return false;
        if (typeof value === "object" && (!value.name || value.name === "")) return false;
        if (value === "") return false; // Remove any other empty strings
        return true;
      }).map(([key, value]) => {
        // 🟢 Convert specific values
        if (typeof value === "string" && !value.startsWith("data:image")) {
          if (value.trim().toLowerCase() === "none") value = "INGEN";
          else if (value.trim().toLowerCase() === "yes") value = "Ja";
          else if (value.trim().toLowerCase() === "no") value = "Fravalgt";
        }
        return [key, value];
      })
    );
  };




  // --- price calculation logic ---
  // --- price calculation logic ---
  const shippingPrices = {
    "Denmark": 79,
    "Greenland": 348,
  };

  // For Greenland, we replace the 79 DKK default fee with the 348 DKK shipping fee.
  const country = customerDetails.country || "Denmark";
  const finalPrice = (parseFloat(price) - 79 + (shippingPrices[country] || 79)).toFixed(2);

  const handleInputChange = (field, value) => {
    setCustomerDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Validate customer details
  const validateCustomerDetails = () => {
    const required = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'postalCode'];
    return required.every(field => customerDetails[field].trim() !== '');
  };

  const buildFilteredOptions = (selectedOptions) => {
    return Object.fromEntries(
      Object.entries(selectedOptions).map(([category, options]) => {
        return [category, filterOptions(options)];
      }).filter(([_, filtered]) => Object.keys(filtered).length > 0) // remove empty categories
    );
  };

  // Handle order submission
  const handleConfirmOrder = async () => {
    setIsLoading(true);

    const orderDate = new Date().toISOString(); // ✅ local definition
    const orderData = {
      customerDetails,
      selectedOptions: buildFilteredOptions(selectedOptions),
      totalPrice: finalPrice,
      currency: "DKK",
      orderDate,
      orderNumber: `CAP-${orderDate}`,
      email: customerDetails.email,
      packageName: packageName,
      //zee//
      program: program,
      liningPhoto: selectedOptions.FOER?.["Indvendigt foer billede"] || null,
      //zee//
    };

    try {
      // 1️⃣ Send order + email
      // const response = await fetch(
      //   // "http://localhost:3000/api/sendEmail/capconfigurator",
      //   "https://new-capbackend.vercel.app/api/sendEmail/capconfigurator",
      //   {
      //     method: "POST",
      //     headers: {
      //       "Content-Type": "application/json",
      //     },
      //     body: JSON.stringify(orderData),
      //   }
      // );

      // if (!response.ok) {
      //   throw new Error("Failed to submit order");
      // }

      // 2️⃣ Create Stripe Checkout session
      // const stripeRes = await fetch("https://new-capbackend.vercel.app/api/sendEmail/create-checkout-session", {
      // const stripeRes = await fetch("https://cap-stripe-webhook-backend.vercel.app/api/sendEmail/create-checkout-session", {
      // const stripeRes = await fetch("https://cap-stripewebhook-backend-production.up.railway.app/api/sendEmail/create-checkout-session", {

      ////////DEV Student Life////////
      // const stripeRes = await fetch("https://cap-dev-backend-one.vercel.app/api/sendEmail/create-checkout-session", {

        ////////Production Student Life////////
        const stripeRes = await fetch("https://capliveapi.studentlife.dk/api/sendEmail/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (!stripeRes.ok) {
        throw new Error("Failed to create Stripe checkout session");
      }

      const { id: sessionId } = await stripeRes.json();
      const stripe = await stripePromise;

      // 3️⃣ Redirect to Stripe Checkout
      await stripe.redirectToCheckout({ sessionId });

    } catch (error) {
      console.error("Error during checkout:", error);
      setIsLoading(false);
      // optional: show error UI
    }
  };

  // Reset modal to initial state
  const handleResetModal = () => {
    setCurrentStep(0);
    setIsLoading(false);
    setOrderComplete(false);
    setCustomerDetails({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      Skolenavn: '',
      address: '',
      city: '',
      postalCode: '',
      country: 'Denmark',
      notes: '',
      shippingPrice: 79
    });
  };

  // Step 1: Quote Review (Original content)
  const renderQuoteReview = () => (
    <div className="overflow-y-auto px-6 py-4">
      <div className="space-y-6">
        {console.log(selectedOptions)
        }
        {Object.entries(selectedOptions).map(([category, options], categoryIndex) => {
          const filteredOptions = filterOptions(options);

          if (Object.keys(filteredOptions).length === 0) return null;

          return (
            <div
              key={category}
              className="group hover:bg-gray-50/50 rounded-xl p-4 transition-all duration-300 border border-transparent hover:border-green-100"
            >
              <div className="flex items-center mb-4">
                <div className="p-2 bg-gradient-to-r from-green-100 to-green-50 rounded-lg mr-3">
                  <Star className="w-4 h-4 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 capitalize">
                  {category.replace(/([A-Z])/g, ' $1').trim()}
                </h3>
                <div className="flex-1 h-px bg-gradient-to-r from-green-200 to-transparent ml-3"></div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {Object.entries(filteredOptions).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-100 hover:border-green-200 hover:shadow-sm transition-all duration-200"
                  >
                    <span className="text-sm text-gray-600 capitalize font-medium">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="text-sm text-gray-900 font-semibold text-right ml-3 bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                      {/*zee*/}
                      {typeof value === "string" && value.startsWith("data:image") ? (
                        <div className="flex flex-col items-end">
                          <img
                            src={value}
                            alt="Uploadet billede"
                            className="w-12 h-12 object-cover rounded-lg border border-green-200"
                          />
                          <span className="text-[10px] text-green-600 mt-1">Billede uploadet</span>
                        </div>
                      ) : (
                        formatValue(value, category, key)
                      )}
                      {/*zee*/}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Step 2: Customer Details Form
  // Step 2: Customer Details Form
  const renderCustomerDetails = () => {
    // Handle Enter key press - follow the refOrder sequence
    const handleKeyPress = (e, currentFieldName) => {
      if (e.key === 'Enter') {
        e.preventDefault();

        // Find current field index
        const currentIndex = refOrder.findIndex(ref => ref.current?.name === currentFieldName);

        // Move to next field if not last
        if (currentIndex >= 0 && currentIndex < refOrder.length - 1) {
          refOrder[currentIndex + 1].current?.focus();
        } else if (currentIndex === refOrder.length - 1) {
          // If on last field (notes), proceed to next step if validation passes
          if (validateCustomerDetails()) {
            setCurrentStep(prev => prev + 1);
          }
        }
      }
    };

    return (
      <div className="overflow-y-auto px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="space-y-3">
              {/* First Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Fornavn *
                </label>
                <input
                  ref={refs.firstName}
                  name="firstName"
                  type="text"
                  value={customerDetails.firstName || ""}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, "firstName")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                  placeholder="Indtast dit fornavn"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  ref={refs.email}
                  name="email"
                  type="email"
                  value={customerDetails.email || ""}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, "email")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                  placeholder="Indtast din mail"
                />
              </div>

              {/* School Name + Deliver to School */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Skole navn *
                </label>
                <input
                  ref={refs.Skolenavn}
                  name="Skolenavn"
                  type="text"
                  value={customerDetails.Skolenavn || ""}
                  onChange={(e) => handleInputChange("Skolenavn", e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, "Skolenavn")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                  placeholder="Indtast dit skolenavn"
                />

                <div className="mt-2 flex items-center">
                  <input
                    type="checkbox"
                    checked={customerDetails.deliverToSchool || false}
                    onChange={(e) =>
                      handleInputChange("deliverToSchool", e.target.checked)
                    }
                    className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    id="deliverToSchool"
                  />
                  <label
                    htmlFor="deliverToSchool"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Levering til skolen
                  </label>
                </div>
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  By *
                </label>
                <input
                  ref={refs.city}
                  name="city"
                  type="text"
                  value={customerDetails.city || ""}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, "city")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                  placeholder="Indtast din by"
                />
              </div>

              {/* Country */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Land
                </label>
                <select
                  ref={refs.country}
                  name="country"
                  value={customerDetails.country || "Denmark"}
                  onChange={(e) => handleInputChange("country", e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, "country")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                >
                  <option value="Denmark">Denmark</option>
                  <option value="Greenland">Greenland</option>
                  <option value="Sweden">Sweden</option>
                  <option value="Norway">Norway</option>
                  <option value="Germany">Germany</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-3">
              {/* Last Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Efternavn *
                </label>
                <input
                  ref={refs.lastName}
                  name="lastName"
                  type="text"
                  value={customerDetails.lastName || ""}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, "lastName")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                  placeholder="Indtast dit efternavn"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Telefonnr. *
                </label>
                <input
                  ref={refs.phone}
                  name="phone"
                  type="tel"
                  value={customerDetails.phone || ""}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, "phone")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                  placeholder="Indtast dit tlf nr."
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Adresse *
                </label>
                <input
                  ref={refs.address}
                  name="address"
                  type="text"
                  value={customerDetails.address || ""}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, "address")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                  placeholder="Indtast dit vejnavn"
                />
              </div>

              {/* Postal Code */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Postnr. *
                </label>
                <input
                  ref={refs.postalCode}
                  name="postalCode"
                  type="text"
                  value={customerDetails.postalCode || ""}
                  onChange={(e) => handleInputChange("postalCode", e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, "postalCode")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                  placeholder="Indtast dit post nr"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="mt-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Bemærkninger til ordren (valgfrit)
            </label>
            <textarea
              ref={refs.notes}
              name="notes"
              value={customerDetails.notes || ""}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, "notes")}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
              placeholder="Har du særlige ønsker eller kommentarer til din ordre..."
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Leveringstype
            </label>

            {/* Regular Delivery */}
            <input
              type="radio"
              name="deliveryType"
              checked={customerDetails.deliveryType === "regular"}
              onChange={() => handleInputChange("deliveryType", "regular")}
              className="h-4 w-4 text-green-600 border-gray-300"
              id="regularDelivery"
            />
            <label htmlFor="regularDelivery" className="ml-2 text-sm text-gray-700">
              Regelmæssig levering – estimeret leveringstid (6 uger)
            </label>

            <br />

            {/* Express Delivery */}
            {/* <input
              type="radio"
              name="deliveryType"
              checked={customerDetails.deliveryType === "express"}
              onChange={() => handleInputChange("deliveryType", "express")}
              className="h-4 w-4 text-green-600 border-gray-300"
              id="expressDelivery"
            />
            <label htmlFor="expressDelivery" className="ml-2 text-sm text-gray-700">
              Ekspres levering – estimeret leveringstid (3 uger)
            </label> */}
          </div>


        </div>
      </div>
    );
  };



  // Step 3: Order Confirmation
  const renderOrderConfirmation = () => (
    <div className="overflow-y-auto px-6 py-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Customer Details Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center mb-3">
            <User className="w-4 h-4 text-blue-600 mr-2" />
            <h3 className="text-lg font-bold text-gray-800">Dine oplysninger</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Left Column */}
            <div className="space-y-1">
              <p className="text-sm">
                <span className="font-medium text-gray-700">Navn:</span>{" "}
                {customerDetails.firstName} {customerDetails.lastName}
              </p>
              <p className="text-sm">
                <span className="font-medium text-gray-700">Email:</span>{" "}
                {customerDetails.email}
              </p>
              <p className="text-sm">
                <span className="font-medium text-gray-700">Telefonnr.:</span>{" "}
                {customerDetails.phone}
              </p>
              {customerDetails.Skolenavn && (
                <p className="text-sm">
                  <span className="font-medium text-gray-700">Skole navn:</span>{" "}
                  {customerDetails.Skolenavn}
                </p>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-1">
              <p className="text-sm">
                <span className="font-medium text-gray-700">Adresse:</span>{" "}
                {customerDetails.address}
              </p>
              <p className="text-sm">
                <span className="font-medium text-gray-700">By:</span>{" "}
                {customerDetails.city}, {customerDetails.postalCode}
              </p>
              <p className="text-sm">
                <span className="font-medium text-gray-700">Land:</span>{" "}
                {customerDetails.country}
              </p>
            </div>
          </div>

          {/* Notes Section */}
          {customerDetails.notes && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <p className="text-sm">
                <span className="font-medium text-gray-700">Bemærkninger til ordren:</span>{" "}
                {customerDetails.notes}
              </p>
            </div>
          )}


        </div>

        {/* Product Configuration Summary */}
        <div className="bg-gradient-to-r from-green-50 to-green-100/50 rounded-xl p-4 border border-green-200">
          <div className="flex items-center mb-3">
            <Package className="w-4 h-4 text-green-600 mr-2" />
            <h3 className="text-lg font-bold text-gray-800">Opsummering af huevalg</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(selectedOptions).map(([category, options]) => {
              const filteredOptions = filterOptions(options);
              if (Object.keys(filteredOptions).length === 0) return null;

              return (
                <div key={category} className="bg-white rounded-lg p-3 border border-green-100">
                  <h4 className="font-bold text-gray-800 text-sm capitalize mb-1">
                    {category.replace(/([A-Z])/g, ' $1').trim()}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {Object.entries(filteredOptions).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-xs">
                        <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                        {/*zee*/}
                        <span className="font-medium text-gray-900">
                          {typeof value === "string" && value.startsWith("data:image") ? (
                            <div className="flex flex-col items-end">
                              <img
                                src={value}
                                alt="Uploadet billede"
                                className="w-10 h-10 object-cover rounded border border-gray-200"
                              />
                              <span className="text-[9px] text-gray-500">Billede uploadet</span>
                            </div>
                          ) : (
                            formatValue(value, category, key)
                          )}
                        </span>
                        {/*zee*/}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
  const renderThankYouPage = () => (
    <div className="overflow-y-auto px-6 py-8">
      <div className="max-w-2xl mx-auto text-center">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-green-100 rounded-full">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You for Your Order!</h2>
        <p className="text-gray-600 mb-6">
          Your custom cap configuration has been received successfully. We'll send a confirmation email to{' '}
          <span className="font-medium text-green-600">{customerDetails.email}</span> shortly.
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600 mb-1">Order Reference</p>
          <p className="font-bold text-gray-900">{orderDate}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => {
              handleResetModal();
              window.location.href = "https://shop.studentlife.dk/homepage-duplicate-95/";
              onClose()

            }}
            className="flex items-center justify-center px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Fortsæt med at handle
          </button>

          <button
            onClick={() => {
              handleResetModal();
              if (onContinueConfiguring) {
                onContinueConfiguring();
              }
            }}
            className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200"
          >
            <Settings className="w-5 h-5 mr-2" />
            Keep Configuring
          </button>
        </div>
      </div>
    </div>
  );
  // Get step content
  // Get step content
  const getStepContent = () => {
    if (orderComplete) {
      return renderThankYouPage();
    }

    switch (currentStep) {
      case 0:
        return renderQuoteReview();
      case 1:
        return renderCustomerDetails();
      case 2:
        return renderOrderConfirmation();
      default:
        return renderQuoteReview();
    }
  };

  // Get step icon
  const getStepIcon = (step) => {
    if (orderComplete) return CheckCircle;

    switch (step) {
      case 0:
        return Package;
      case 1:
        return User;
      case 2:
        return CreditCard;
      default:
        return Package;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 animate-in slide-in-from-bottom duration-500">
        {/* Modal Header with Step Indicator */}
        <div className="relative bg-gradient-to-r from-green-50 via-white to-green-50 border-b border-green-100">
          <div className="absolute inset-0 bg-gradient-to-r from-green-600/5 to-green-700/5"></div>
          <div className="relative p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-green-600 to-green-700 rounded-xl shadow-lg">
                  {React.createElement(getStepIcon(currentStep), { className: "w-5 h-5 text-white" })}
                </div>
                <div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    {orderComplete ? 'Order Complete' : steps[currentStep]}
                  </h2>
                  {!orderComplete && (
                    <p className="text-gray-600 text-sm mt-1 flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                      Step {currentStep + 1} of {steps.length}
                    </p>
                  )}
                </div>
              </div>
              {!orderComplete && (
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-110 group"
                >
                  <X className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                </button>
              )}
            </div>

            {/* Step Progress Indicator - Only show if not on thank you page */}
            {!orderComplete && (
              <div className="w-full overflow-x-hidden">
                <div className="flex items-center space-x-3 flex-wrap md:flex-nowrap gap-y-2 md:gap-y-0">
                  {steps.map((step, index) => (
                    <div key={step} className="flex items-center min-w-0">

                      <div
                        className={`flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all duration-200 flex-shrink-0
              ${index <= currentStep
                            ? 'bg-green-600 border-green-600 text-white'
                            : 'border-gray-300 text-gray-400'
                          }`}
                      >
                        {index < currentStep ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <span className="text-xs font-bold">{index + 1}</span>
                        )}
                      </div>

                      <span
                        className={`ml-1 text-xs font-medium
              truncate max-w-[80px]
              md:truncate-none md:max-w-none
              ${index <= currentStep ? 'text-green-700' : 'text-gray-400'}
            `}
                        title={step}
                      >
                        {step}
                      </span>

                      {index < steps.length - 1 && (
                        <div
                          className={`w-6 h-0.5 mx-2 flex-shrink-0
                ${index < currentStep ? 'bg-green-600' : 'bg-gray-300'}
              `}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-auto">
          {getStepContent()}
        </div>

        {/* Enhanced Footer with Step Navigation - Only show if not on thank you page */}
        {!orderComplete && (
          <div className="bg-gradient-to-r from-gray-50 via-white to-gray-50 border-t border-gray-100 p-6">
            {/* Price Section - Show on all steps */}
            <div className="bg-gradient-to-r from-green-50 to-green-100/50 rounded-xl p-4 mb-4 border border-green-200">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-base font-bold text-gray-900">Din pris</span>
                  <p className="text-gray-600 text-xs mt-1">
                    {country === "Greenland"
                      ? "Inkluderet forsendelse og gebyr (348 DKK)"
                      : "Inkluderet forsendelse og gebyr (79 DKK)"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                    {finalPrice}
                  </span>

                  <span className="text-base font-semibold text-green-600 ml-1">DKK</span>
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex gap-3 flex-1">
                {currentStep > 0 && (
                  <button
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium text-sm hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Tilbage
                  </button>
                )}

                {currentStep === 0 && (
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium text-sm hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
                  >
                    Fortsæt med at designe
                  </button>
                )}
              </div>

              {currentStep < steps.length - 1 ? (
                <button
                  onClick={() => {
                    if (currentStep === 1 && !validateCustomerDetails()) {
                      alert('Please fill in all required fields.');
                      return;
                    }
                    setCurrentStep(prev => prev + 1);
                  }}
                  className="flex-1 bg-gradient-to-r from-green-600 via-green-600 to-green-700 text-white py-2 px-4 rounded-lg font-medium text-sm hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-md hover:shadow-lg relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    Fortsæt
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-green-700 to-green-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              ) : (
                <button
                  onClick={handleConfirmOrder}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-green-600 via-green-600 to-green-700 text-white py-2 px-4 rounded-lg font-medium text-sm hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-md hover:shadow-lg relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Godkend ordre og betal
                      </>
                    )}
                  </span>
                  {!isLoading && (
                    <div className="absolute inset-0 bg-gradient-to-r from-green-700 to-green-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuoteModal;