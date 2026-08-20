import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Save, Loader2, AlertCircle, Search, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const LABEL_MAP = {
  "#7F1D1D": "Bordeaux Red",
  "#7F1D1DD": "Dark Bordeaux",
  "#7F1D1DX": "Extra Dark Bordeaux",
  "#1E3A8A": "Royal Blue",
  "#DC2626": "Standard Red",
  "PSort": "Premium Black",
  "SosuSort": "SOSU Black",
  "EuxRed": "EUX Red"
};

const PROGRAM_KEYWORDS = {
  'STX': ['stx'],
  'HHX': ['hhx'],
  'HTX': ['htx'],
  'HF': ['hf '], 
  'EUD': ['eud'],
  'EUX': ['eux'],
  'sosuassistent': ['sosu'],
  'sosuhjælper': ['sosu'],
  'frisør': ['frisør'],
  'kosmetolog': ['kosmetolog'],
  'pædagog': ['pædagog'],
  'pau': ['pau'],
  'ernæringsassisten': ['ernæring'],
  'STU': ['stu'],
  'Landmand': ['landmand']
};

function isRelevantForProgram(item, activeProgram, groupName) {
  if (!activeProgram) return true;
  const itemLower = item.toLowerCase();
  
  let otherKeywords = [];
  const activeKeywords = PROGRAM_KEYWORDS[activeProgram] || [];
  
  for (const [prog, keywords] of Object.entries(PROGRAM_KEYWORDS)) {
    if (prog !== activeProgram) {
      for (const kw of keywords) {
        if (!activeKeywords.includes(kw)) {
          otherKeywords.push(kw);
        }
      }
    }
  }
  
  for (const kw of otherKeywords) {
    if (itemLower.includes(kw)) {
      const regex = new RegExp(`\\b${kw.trim()}\\b`, 'i');
      if (kw === 'eux' || kw === 'sosu' || kw === 'hhx' || kw === 'htx' || kw === 'stx') {
         if (itemLower.includes(kw)) return false;
      } else {
         if (regex.test(itemLower)) return false;
      }
    }
  }

  // Specific restrictions for STU
  if (activeProgram === 'STU') {
    if (['velour', 'shimmer', 'ruskin', 'alcantra'].includes(itemLower)) return false;
    if (groupName === 'Materiale' && itemLower === 'satin') return false;
    if (groupName && (groupName.includes('Kant') || groupName.includes('Stjerner') || groupName.includes('Flag'))) return false;
    if (groupName === 'Kokarde' && itemLower === 'flag') return false;
    if (groupName && groupName.includes('Hueb') && itemLower !== 'stu') return false;
    if (groupName === 'Type' && !itemLower.includes('stu') && itemLower !== 'champagne') return false;
    if (groupName && groupName.includes('Roset') && !['psort', '#dc2626'].includes(itemLower)) return false;
  }
  
  if (activeProgram === 'Landmand') {
    if (['satin', 'velour', 'shimmer', 'ruskin', 'alcantra', 'vegansk'].includes(itemLower)) return false;
    if (groupName && groupName.includes('Hueb') && itemLower !== 'landmand') return false; 
    if (groupName === 'Kokarde' && itemLower === 'flag') return false;
    if (groupName && (groupName.includes('Kant') || groupName.includes('Stjerner') || groupName.includes('Flag') || groupName.includes('Top broderi'))) return false;
  }

  return true;
}

function isRelevantForTier(item, activeTier, groupName, category) {
  if (activeTier !== 'basichue') return true;
  const itemLower = item.toLowerCase();
  const groupLower = groupName ? groupName.toLowerCase() : '';
  const catLower = category ? category.toLowerCase() : '';

  if (catLower === 'kokarde') {
    if (groupLower === 'kokarde' && itemLower === 'flag') return false;
    const flagTypes = [
      'kurdistan', 'irak', 'iran', 'somalia', 'somaliland', 'palæstina', 
      'libanon', 'afghanistan', 'albanien', 'serbien', 'bosnien', 
      'danmark', 'grønland', 'marokko', 'pakistan', 'tyrkiet', 'sweden'
    ];
    if (groupLower === 'type' && flagTypes.includes(itemLower)) return false;
    
    if (groupLower === 'roset farve') {
      const allowedColors = ['#7f1d1d', '#1e3a8a', '#dc2626', 'rød', 'euxred'];
      if (!allowedColors.includes(itemLower)) return false;
    }
  }
  if (catLower === 'uddannelsesbånd') {
    if (groupLower === 'huebånd' && ['stu', 'grøn', 'sort'].includes(itemLower)) return false;
    if (groupLower === 'materiale' && itemLower !== 'bomuld') return false;
    if (groupLower === 'hagerem' && !['mat', 'shiny'].includes(itemLower)) return false;
    if (groupLower === 'år' && !['ingen', '2025', '2026'].includes(itemLower)) return false;
  }
  if (catLower === 'tilbehør') {
    if (groupLower === 'hueæske' && itemLower !== 'standard') return false;
  }
  if (catLower === 'broderi') {
    if (groupLower === 'top broderi') return false;
  }
  if (catLower === 'betræk') {
    if (groupLower === 'farve' && itemLower !== 'hvid') return false;
    if (groupLower === 'topkant') return false;
    if (groupLower === 'kantbånd') return false;
    if (groupLower === 'flagbånd') return false;
    if (groupLower === 'stjerner') return false;
  }
  if (catLower === 'skygge') {
    if (groupLower === 'type' && !['shiny', 'blank'].includes(itemLower)) return false;
    if (groupLower === 'materiale' && itemLower !== 'uden kant') return false;
    if (groupLower === 'skyggebånd' && itemLower !== 'ingen') return false;
  }
  if (catLower === 'foer') {
    if (groupLower === 'svederem' && itemLower !== 'kunstlæder') return false;
    if (groupLower === 'foer' && itemLower !== 'polyester') return false;
    if (groupLower === 'sløjfe') return false;
    if (groupLower === 'type') return false;
  }
  if (catLower === 'ekstrabetræk') {
    if (groupLower === 'farve' && itemLower !== 'hvid') return false;
    if (groupLower === 'topkant') return false;
    if (groupLower === 'kantbånd') return false;
    if (groupLower === 'flagbånd') return false;
    if (groupLower === 'stjerner') return false;
    if (['roset farve', 'kokarde', 'emblem', 'type'].includes(groupLower)) return false;
  }
  return true;
}

const ConfiguratorSettingsPage = () => {
  const [config, setConfig] = useState(null);
  const [originalConfigStr, setOriginalConfigStr] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [activeTier, setActiveTier] = useState('standard');
  const [activeProgram, setActiveProgram] = useState('STX');
  const [searchTerm, setSearchTerm] = useState('');
  const [addFlagModal, setAddFlagModal] = useState({ isOpen: false, program: '', name: '' });
  const [deleteFlagModal, setDeleteFlagModal] = useState({ isOpen: false, program: '', id: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    const allowedPrograms = ['STX', 'HHX', 'HTX', 'HF', 'EUD', 'EUX'];
    if (activeTier === 'basichue' && !allowedPrograms.includes(activeProgram)) {
      setActiveTier('standard');
    }
  }, [activeProgram, activeTier]);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/admin/settings/configurator');
      setConfig(response.data);
      setOriginalConfigStr(JSON.stringify(response.data));
      setError(null);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/admin/settings/configurator', config);
      setOriginalConfigStr(JSON.stringify(config));
      setShowConfirmModal(false);
      toast.success('Settings saved successfully');
    } catch (err) {
      console.error('Error saving settings:', err);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleVisibilityChange = (program, value) => {
    setConfig({
      ...config,
      programsVisibility: {
        ...config.programsVisibility,
        [program]: value
      }
    });
  };

  const handleDeliveryChange = (program, country, value) => {
    setConfig({
      ...config,
      deliveryCharges: {
        ...config.deliveryCharges,
        [program]: {
          ...config.deliveryCharges?.[program],
          [country]: parseFloat(value) || 0
        }
      }
    });
  };

  const handleExpressChange = (program, field, value) => {
    setConfig(prevConfig => {
      const newConfig = { ...prevConfig };
      
      if (!newConfig.expressDelivery) newConfig.expressDelivery = {};
      if (!newConfig.expressDelivery[program]) newConfig.expressDelivery[program] = { active: false, price: 0 };
      
      newConfig.expressDelivery[program][field] = field === 'price' ? parseFloat(value) || 0 : value;
      return newConfig;
    });
  };

  const handleAddFlag = (program) => {
    setAddFlagModal({ isOpen: true, program, name: '' });
  };

  const confirmAddFlag = () => {
    const { program, name } = addFlagModal;
    if (!name.trim()) return;
    
    setConfig(prev => {
      const newConfig = { ...prev };
      const newProgramFlags = { ...(newConfig.programFlags || {}) };
      const currentProgramFlags = [...(newProgramFlags[program] || [])];
      
      currentProgramFlags.push({
        id: Date.now().toString() + Math.random().toString(36).substring(7),
        name: name.trim(),
        price: 0
      });
      
      newProgramFlags[program] = currentProgramFlags;
      newConfig.programFlags = newProgramFlags;
      
      return newConfig;
    });
    setAddFlagModal({ isOpen: false, program: '', name: '' });
  };

  const handleUpdateFlagPrice = (program, id, newPrice) => {
    setConfig(prev => {
      const newConfig = { ...prev };
      if (newConfig.programFlags && newConfig.programFlags[program]) {
        const newProgramFlags = { ...newConfig.programFlags };
        const currentFlags = [...newProgramFlags[program]];
        const flagIndex = currentFlags.findIndex(f => f.id === id);
        
        if (flagIndex > -1) {
          currentFlags[flagIndex] = { ...currentFlags[flagIndex], price: parseFloat(newPrice) || 0 };
          newProgramFlags[program] = currentFlags;
          newConfig.programFlags = newProgramFlags;
        }
      }
      return newConfig;
    });
  };

  const handleDeleteFlag = (program, id) => {
    setDeleteFlagModal({ isOpen: true, program, id });
  };

  const confirmDeleteFlag = () => {
    const { program, id } = deleteFlagModal;
    setConfig(prev => {
      const newConfig = { ...prev };
      if (newConfig.programFlags && newConfig.programFlags[program]) {
        const newProgramFlags = { ...newConfig.programFlags };
        newProgramFlags[program] = newProgramFlags[program].filter(f => f.id !== id);
        newConfig.programFlags = newProgramFlags;
      }
      return newConfig;
    });
    setDeleteFlagModal({ isOpen: false, program: '', id: '' });
  };

  const handleBasePriceChange = (program, tier, value) => {
    setConfig(prev => {
      const newConfig = { ...prev };
      if (!newConfig.basePrices) newConfig.basePrices = {};
      if (!newConfig.basePrices[program]) newConfig.basePrices[program] = {};
      
      newConfig.basePrices = {
        ...newConfig.basePrices,
        [program]: {
          ...newConfig.basePrices[program],
          [tier]: parseFloat(value) || 0
        }
      };
      return newConfig;
    });
  };

  const handleOptionVisibilityChange = (program, key, isVisible) => {
    setConfig(prevConfig => {
      const newConfig = { ...prevConfig };
      if (!newConfig.programOptionVisibility) newConfig.programOptionVisibility = {};
      if (!newConfig.programOptionVisibility[program]) newConfig.programOptionVisibility[program] = {};
      
      newConfig.programOptionVisibility[program][key] = isVisible;
      return newConfig;
    });
  };

  const handlePriceConfigChange = (tier, category, optionGroup, item, value) => {
    setConfig(prevConfig => {
      const newConfig = { ...prevConfig };
      const val = parseFloat(value) || 0;
      
      if (!newConfig.priceConfig[tier][category]) return newConfig;
      if (!newConfig.priceConfig[tier][category][optionGroup]) return newConfig;
      
      newConfig.priceConfig = {
        ...newConfig.priceConfig,
        [tier]: {
          ...newConfig.priceConfig[tier],
          [category]: {
            ...newConfig.priceConfig[tier][category],
            [optionGroup]: {
              ...newConfig.priceConfig[tier][category][optionGroup],
              [item]: val
            }
          }
        }
      };
      return newConfig;
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded flex items-center">
        <AlertCircle className="mr-2" />
        {error}
      </div>
    );
  }

  const isDirty = originalConfigStr ? JSON.stringify(config) !== originalConfigStr : false;

  if (!config) return null;

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Configurator Settings</h2>
          <p className="text-sm text-gray-500">Manage prices and program availability for the frontend configurator.</p>
        </div>
        <button
          onClick={() => setShowConfirmModal(true)}
          disabled={saving || !isDirty}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
          Save Changes
        </button>
      </div>

      <div className="space-y-8">
        
        {/* Programs Visibility */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Program Visibility</h3>
          <div className="flex flex-wrap gap-4">
            {Object.keys(config.programsVisibility || {}).map(program => (
              <label key={program} className="flex items-center space-x-3 cursor-pointer bg-gray-50 p-2 rounded-lg border border-gray-200 hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={config.programsVisibility[program]}
                  onChange={(e) => handleVisibilityChange(program, e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-gray-700 font-medium uppercase">{program}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Dynamic Pricing Tabs */}
        <div className="flex flex-col md:flex-row gap-6">
          
          {/* Programs Sidebar */}
          <div className="w-full md:w-64 shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h3 className="font-bold text-gray-800">Select Program</h3>
                <p className="text-xs text-gray-500 mt-1">Pricing applies globally, but view is filtered.</p>
              </div>
              <div className="flex flex-col max-h-[70vh] overflow-y-auto">
                {Object.keys(config.programsVisibility || {}).map(prog => (
                  <button
                    key={prog}
                    onClick={() => setActiveProgram(prog)}
                    className={`text-left px-4 py-3 font-semibold uppercase transition-colors ${activeProgram === prog ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50 border-l-4 border-transparent'}`}
                  >
                    {prog}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing Config Area */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex border-b border-gray-200 bg-gray-50 flex-wrap">
              {Object.keys(config.priceConfig || {})
                .filter(tier => {
                  if (tier === 'basichue') {
                    const allowedPrograms = ['STX', 'HHX', 'HTX', 'HF', 'EUD', 'EUX'];
                    return allowedPrograms.includes(activeProgram);
                  }
                  return true;
                })
                .map(tier => (
                  <button
                    key={tier}
                    onClick={() => setActiveTier(tier)}
                    className={`flex-1 py-4 text-center font-bold capitalize transition-colors min-w-[100px] ${activeTier === tier ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {tier} Package
                  </button>
                ))
              }
            </div>
            
            <div className="p-6">
              <div className="mb-6 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search options..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-8 p-5 bg-blue-50 rounded-lg border border-blue-100">
                <h3 className="text-xl font-bold text-gray-800 mb-4 capitalize">
                  {activeProgram} Settings ({activeTier} package)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Base Package Price */}
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-3 capitalize border-b border-gray-200 pb-2">
                      Base Package Price
                    </h4>
                    <div className="flex justify-between items-center bg-white p-2 rounded border border-gray-100">
                      <span className="text-sm font-medium text-gray-700">Price (DKK)</span>
                      <div className="flex items-center">
                        <span className="text-xs text-gray-400 mr-2 font-semibold">DKK</span>
                        <input
                          type="number"
                          value={config.basePrices?.[activeProgram]?.[activeTier] ?? 0}
                          onChange={(e) => handleBasePriceChange(activeProgram, activeTier, e.target.value)}
                          className="w-20 p-1.5 text-right border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Delivery Charges */}
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-3 capitalize border-b border-gray-200 pb-2">
                      Standard Delivery (DKK)
                    </h4>
                    <div className="space-y-3">
                      {config.deliveryCharges && config.deliveryCharges[activeProgram] && Object.keys(config.deliveryCharges[activeProgram]).map(country => (
                        <div key={country} className="flex justify-between items-center bg-white p-2 rounded border border-gray-100">
                          <span className="text-sm font-medium text-gray-700">{country}</span>
                          <div className="flex items-center">
                            <span className="text-xs text-gray-400 mr-2 font-semibold">DKK</span>
                            <input
                              type="number"
                              value={config.deliveryCharges[activeProgram][country]}
                              onChange={(e) => handleDeliveryChange(activeProgram, country, e.target.value)}
                              className="w-24 p-1.5 text-sm border border-gray-300 rounded-md text-right focus:ring-2 focus:ring-blue-500 font-medium"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Express Delivery */}
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-3 capitalize border-b border-gray-200 pb-2">
                      Express Delivery
                    </h4>
                    {config.expressDelivery && config.expressDelivery[activeProgram] && (
                      <div className="space-y-3">
                        <label className="flex items-center space-x-3 cursor-pointer bg-white p-2 rounded border border-gray-100">
                          <input
                            type="checkbox"
                            checked={config.expressDelivery[activeProgram].active}
                            onChange={(e) => handleExpressChange(activeProgram, 'active', e.target.checked)}
                            className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700">Enable Express Delivery</span>
                        </label>
                        <div className="flex justify-between items-center bg-white p-2 rounded border border-gray-100">
                          <span className="text-sm font-medium text-gray-700">Express Surcharge</span>
                          <div className="flex items-center">
                            <span className="text-xs text-gray-400 mr-2 font-semibold">DKK</span>
                            <input
                              type="number"
                              value={config.expressDelivery[activeProgram].price}
                              onChange={(e) => handleExpressChange(activeProgram, 'price', e.target.value)}
                              className="w-24 p-1.5 text-sm border border-gray-300 rounded-md text-right focus:ring-2 focus:ring-blue-500 font-medium"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Program Specific Flags */}
                <div className="mb-8 p-5 bg-indigo-50 rounded-lg border border-indigo-100">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800 capitalize">
                      {activeProgram} Custom Flags
                    </h3>
                    <button
                      onClick={() => handleAddFlag(activeProgram)}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded font-medium text-sm hover:bg-indigo-700 transition"
                    >
                      + Add Flag
                    </button>
                  </div>
                  
                  <div className="bg-white rounded border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flag Name</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price (DKK)</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {(config.programFlags?.[activeProgram] || []).length === 0 ? (
                          <tr>
                            <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">
                              No custom flags defined for {activeProgram}.
                            </td>
                          </tr>
                        ) : (
                          config.programFlags[activeProgram].map(flag => (
                            <tr key={flag.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {flag.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <div className="flex items-center justify-end">
                                  <input
                                    type="number"
                                    value={flag.price}
                                    onChange={(e) => handleUpdateFlagPrice(activeProgram, flag.id, e.target.value)}
                                    className="w-24 p-1.5 text-sm border border-gray-300 rounded-md text-right focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => handleDeleteFlag(activeProgram, flag.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {config.priceConfig && config.priceConfig[activeTier] && Object.entries(config.priceConfig[activeTier]).map(([category, optionsGroups]) => {
                // Filter the groups and items
                let hasVisibleItems = false;
                const filteredGroups = Object.entries(optionsGroups || {}).map(([groupName, items]) => {
                  const filteredItems = Object.entries(items || {}).filter(([itemName]) => {
                    if (!isRelevantForProgram(itemName, activeProgram, groupName)) return false;
                    if (!isRelevantForTier(itemName, activeTier, groupName, category)) return false;
                    const displayLabel = LABEL_MAP[itemName] || itemName;
                    if (searchTerm && !displayLabel.toLowerCase().includes(searchTerm.toLowerCase())) return false;
                    return true;
                  });
                  if (filteredItems.length > 0) hasVisibleItems = true;
                  return { groupName, items: Object.fromEntries(filteredItems) };
                }).filter(g => Object.keys(g.items).length > 0);

                if (!hasVisibleItems) return null;

                return (
                  <div key={category} className="mb-8 last:mb-0">
                    <div className="flex items-center justify-between bg-gray-100 p-3 rounded-lg mb-4">
                      <h3 className="text-xl font-bold text-gray-800 capitalize">
                        {category.replace(/([A-Z])/g, ' $1').trim()}
                      </h3>
                      {/*
                      <button
                        title={`Toggle visibility for all ${category}`}
                        onClick={() => {
                          const current = config.programOptionVisibility?.[activeProgram]?.[category] ?? true;
                          handleOptionVisibilityChange(activeProgram, category, !current);
                        }}
                        className="text-gray-500 hover:text-blue-600 transition"
                      >
                        {config.programOptionVisibility?.[activeProgram]?.[category] !== false ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5 text-red-500" />}
                      </button>
                      */}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                      {filteredGroups.map(({ groupName, items }) => (
                        <div key={groupName} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-3">
                            <h4 className="font-semibold text-gray-700 capitalize">
                              {groupName}
                            </h4>
                            {/*
                            <button
                              title={`Toggle visibility for ${groupName}`}
                              onClick={() => {
                                const key = `${category}_${groupName}`;
                                const current = config.programOptionVisibility?.[activeProgram]?.[key] ?? true;
                                handleOptionVisibilityChange(activeProgram, key, !current);
                              }}
                              className="text-gray-400 hover:text-blue-600 transition"
                            >
                              {config.programOptionVisibility?.[activeProgram]?.[`${category}_${groupName}`] !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-red-500" />}
                            </button>
                            */}
                          </div>
                          <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                            {Object.entries(items).map(([itemName, price]) => {
                              const displayLabel = LABEL_MAP[itemName] || itemName;
                              const itemKey = `${category}_${itemName}`;
                              const isHidden = config.programOptionVisibility?.[activeProgram]?.[itemKey] === false;
                              return (
                                <div key={itemName} className={`flex justify-between items-center p-2 rounded border ${isHidden ? 'bg-gray-100 border-gray-200 opacity-60' : 'bg-white border-gray-100'}`}>
                                  <div className="flex items-center w-1/2 truncate pr-2">
                                    {/*
                                    <button
                                      title={`Toggle visibility for ${displayLabel}`}
                                      onClick={() => {
                                        handleOptionVisibilityChange(activeProgram, itemKey, isHidden);
                                      }}
                                      className="mr-2 text-gray-400 hover:text-blue-600 transition flex-shrink-0"
                                    >
                                      {isHidden ? <EyeOff className="w-4 h-4 text-red-500" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                    */}
                                    <span className={`text-sm font-medium truncate ${isHidden ? 'text-gray-400 line-through' : 'text-gray-700'}`} title={displayLabel}>
                                      {displayLabel}
                                    </span>
                                  </div>
                                  <div className="w-1/2 flex items-center justify-end">
                                    <span className="text-xs text-gray-400 mr-2 font-semibold">DKK</span>
                                    <input
                                      type="number"
                                      value={price}
                                      onChange={(e) => handlePriceConfigChange(activeTier, category, groupName, itemName, e.target.value)}
                                      className="w-24 p-1.5 text-sm border border-gray-300 rounded-md text-right focus:ring-2 focus:ring-blue-500 font-medium"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
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

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 overflow-hidden">
            <div className="flex items-center mb-4 text-orange-500">
              <AlertCircle className="w-8 h-8 mr-3" />
              <h3 className="text-xl font-bold text-gray-900">Confirm Changes</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to save these changes? This will instantly update the live configurator for all users.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center transition disabled:opacity-50"
                disabled={saving}
              >
                {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
                Confirm Save
              </button>
            </div>
          </div>
        </div>
      )}

      {addFlagModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 overflow-hidden">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add Flag</h3>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Flag (Country) Name</label>
              <input
                type="text"
                autoFocus
                value={addFlagModal.name}
                onChange={(e) => setAddFlagModal({ ...addFlagModal, name: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter') confirmAddFlag(); }}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Denmark"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setAddFlagModal({ isOpen: false, program: '', name: '' })}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmAddFlag}
                disabled={!addFlagModal.name.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                Add Flag
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteFlagModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 overflow-hidden">
            <div className="flex items-center mb-4 text-red-500">
              <AlertCircle className="w-8 h-8 mr-3" />
              <h3 className="text-xl font-bold text-gray-900">Delete Flag</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove this flag? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteFlagModal({ isOpen: false, program: '', id: '' })}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteFlag}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ConfiguratorSettingsPage;
