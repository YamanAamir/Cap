import React, { useState, useEffect } from 'react';
import { Settings2, Save, Loader2, AlertCircle, Tag, Check } from 'lucide-react';
import { getSettings, updateSetting } from '../services/admin.service';
import { toast } from 'react-hot-toast';
import ConfirmModal from '../components/common/ConfirmModal';

const MASTER_TEMPLATE = {
  KOKARDE: ['Emblem', 'Kokarde', 'Roset farve', 'Type'],
  'UDDANNELSESBÅND': ['Broderi farve', 'Broderi foran', 'Hagerem', 'Huebånd', 'Knap farve', 'Materiale', 'År'],
  BRODERI: ['Broderifarve', 'Navne broderi', 'Skolebroderi', 'Skolebroderi farve', 'Top broderi'],
  BETRÆK: ['Farve', 'Kantbånd', 'Stjerner', 'Topkant', 'Flagbånd'],
  SKYGGE: ['Materiale', 'Skyggebånd', 'Skyggegravering Line 1', 'Skyggegravering Line 2', 'Skyggegravering Line 3', 'Type'],
  FOER: ['Farve', 'Foer', 'Sløjfe', 'Svederem', 'Silk Type', 'Satin Type', 'Indvendigt foer billede'],
  EKSTRABETRÆK: ['Tilvælg'],
  TILBEHØR: ['Bucketpins', 'Ekstra korkarde', 'Ekstra korkarde Text', 'Flag 1', 'Flag 2', 'Flag 3', 'Fløjte', 'Handsker', 'Huekuglepen', 'Hueæske', 'Luksus champagneglas', 'Lyskugle', 'Premium æske', 'Silkepude', 'Smart Tag', 'Store kuglepen', 'Trompet'],
  STØRRELSE: ['Vælg størrelse', 'Millimeter tilpasningssæt']
};

const generateInitialState = (savedSettings) => {
  const initialState = {};
  const isOldFormat = Array.isArray(savedSettings);

  Object.keys(MASTER_TEMPLATE).forEach(category => {
    let catVisible = true;
    if (isOldFormat) {
      const catSetting = savedSettings.find(s => s.danish.toLowerCase() === category.toLowerCase());
      if (catSetting && catSetting.visible === false) catVisible = false;
    } else if (savedSettings && savedSettings[category] !== undefined) {
      catVisible = savedSettings[category].visible;
    }
    
    const fields = {};
    MASTER_TEMPLATE[category].forEach(field => {
      let fieldVisible = true;
      if (isOldFormat) {
        const fieldSetting = savedSettings.find(s => s.danish.toLowerCase() === field.toLowerCase());
        if (fieldSetting && fieldSetting.visible === false) fieldVisible = false;
      } else if (savedSettings && savedSettings[category]?.fields !== undefined) {
        if (savedSettings[category].fields[field] !== undefined) {
          fieldVisible = savedSettings[category].fields[field];
        }
      }
      fields[field] = fieldVisible;
    });

    initialState[category] = {
      visible: catVisible,
      fields
    };
  });

  return initialState;
};

export default function ProductionSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({});
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const serverSettings = await getSettings();
      const productionTerms = serverSettings.find(s => s.key === 'PRODUCTION_DISPLAY_TERMS');
      
      if (productionTerms && productionTerms.value) {
        setSettings(generateInitialState(productionTerms.value));
      } else {
        setSettings(generateInitialState(null));
      }
    } catch (error) {
      toast.error('Failed to load settings');
      setSettings(generateInitialState(null));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaveModalOpen(false);
    setSaving(true);
    try {
      await updateSetting('PRODUCTION_DISPLAY_TERMS', settings);
      toast.success('Production display settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleCategoryToggle = (category, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        visible: value
      }
    }));
  };

  const handleFieldToggle = (category, field, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        fields: {
          ...prev[category].fields,
          [field]: value
        }
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <>
      {saving && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/20 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl shadow-xl flex flex-col items-center">
            <Loader2 className="w-10 h-10 animate-spin text-[#1e3a8a] mb-4" />
            <p className="text-slate-800 font-bold">Saving Settings...</p>
            <p className="text-sm text-slate-500 mt-1">Please wait</p>
          </div>
        </div>
      )}
      
      <div className="animate-in fade-in duration-500 max-w-[1200px] mx-auto pb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Production Display Settings</h1>
            <p className="text-xs text-slate-500 font-medium mt-1">Configure which order properties and categories are visible to the factory.</p>
          </div>
          <button
            onClick={() => setIsSaveModalOpen(true)}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#1e3a8a] text-white font-bold rounded-lg hover:bg-blue-800 transition-colors shadow-sm disabled:opacity-70"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-bold mb-1">How this works:</p>
            <p>Use the toggles below to show or hide entire categories, or specific options within a category. What you configure here will exactly mirror the "Production Specifications" on the factory dashboard. Translation to English is handled automatically by the system.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.keys(MASTER_TEMPLATE).map((category, idx) => {
            const catSettings = settings[category] || { visible: true, fields: {} };
            return (
              <div key={idx} className={`bg-white border ${catSettings.visible ? 'border-slate-200 shadow-sm' : 'border-dashed border-slate-300 opacity-60'} rounded-lg overflow-hidden transition-all duration-200`}>
                <div className={`px-4 py-3 border-b ${catSettings.visible ? 'bg-[#fafafa] border-slate-200' : 'bg-slate-50 border-slate-200/50'} flex items-center justify-between gap-2`}>
                  <div className="flex items-center gap-2">
                    <Tag className={`w-4 h-4 ${catSettings.visible ? 'text-slate-400' : 'text-slate-300'}`} />
                    <h4 className={`font-bold text-sm uppercase tracking-wider ${catSettings.visible ? 'text-slate-700' : 'text-slate-400 line-through'}`}>{category}</h4>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer" title={`Toggle ${category}`}>
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={catSettings.visible}
                      onChange={(e) => handleCategoryToggle(category, e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                </div>
                
                <div className="p-4 space-y-3">
                  {MASTER_TEMPLATE[category].map((field, i) => {
                    const isFieldVisible = catSettings.fields[field] !== false;
                    
                    return (
                      <div key={i} className="flex items-center justify-between gap-4 p-2 rounded hover:bg-slate-50 transition-colors">
                        <div className="flex flex-col">
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${isFieldVisible && catSettings.visible ? 'text-slate-400' : 'text-slate-300'}`}>{field}</span>
                          <span className={`font-bold text-sm ${isFieldVisible && catSettings.visible ? 'text-slate-800' : 'text-slate-400 line-through'}`}>Example Value</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer" title={`Toggle ${field}`}>
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={isFieldVisible}
                            disabled={!catSettings.visible}
                            onChange={(e) => handleFieldToggle(category, field, e.target.checked)}
                          />
                          <div className={`w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all ${catSettings.visible ? 'peer-checked:bg-blue-500' : 'peer-checked:bg-slate-300'}`}></div>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        
        <ConfirmModal 
          isOpen={isSaveModalOpen}
          title="Save Display Settings"
          message="Are you sure you want to save these display settings? The production portal will immediately update for the factory team."
          confirmText="Yes, Save"
          cancelText="Cancel"
          isDestructive={false}
          onConfirm={handleSave}
          onCancel={() => setIsSaveModalOpen(false)}
        />
      </div>
    </>
  );
}
