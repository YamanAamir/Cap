import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Save, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ConfiguratorSettingsPage = () => {
  const [config, setConfig] = useState(null);
  const [originalConfigStr, setOriginalConfigStr] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [activeTier, setActiveTier] = useState('standard');

  useEffect(() => {
    fetchSettings();
  }, []);

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

  const handleDeliveryChange = (country, value) => {
    setConfig({
      ...config,
      deliveryCharges: {
        ...config.deliveryCharges,
        [country]: parseFloat(value) || 0
      }
    });
  };

  const handleExpressChange = (field, value) => {
    setConfig({
      ...config,
      expressDelivery: {
        ...config.expressDelivery,
        [field]: field === 'price' ? parseFloat(value) || 0 : value
      }
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

        {/* Delivery Charges */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Delivery Charges (DKK)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.keys(config.deliveryCharges || {}).map(country => (
              <div key={country}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{country} Shipping</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">DKK</span>
                  <input
                    type="number"
                    value={config.deliveryCharges[country]}
                    onChange={(e) => handleDeliveryChange(country, e.target.value)}
                    className="pl-12 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Express Delivery */}
        {config.expressDelivery && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Express Delivery</h3>
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <label className="block text-sm font-medium text-transparent mb-1 hidden sm:block" aria-hidden="true">Status</label>
                <label className="flex items-center space-x-3 cursor-pointer bg-gray-50 px-4 py-2 rounded border border-gray-300 hover:bg-gray-100">
                  <input
                    type="checkbox"
                    checked={config.expressDelivery.active}
                    onChange={(e) => handleExpressChange('active', e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 font-medium">Enable Express Delivery</span>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Express Surcharge</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">DKK</span>
                  <input
                    type="number"
                    value={config.expressDelivery.price}
                    onChange={(e) => handleExpressChange('price', e.target.value)}
                    className="pl-12 w-48 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Pricing Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-200 bg-gray-50">
            {['standard', 'premium', 'luksus'].map(tier => (
              <button
                key={tier}
                onClick={() => setActiveTier(tier)}
                className={`flex-1 py-4 text-center font-bold capitalize transition-colors ${activeTier === tier ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {tier} Pricing
              </button>
            ))}
          </div>
          
          <div className="p-6">
            {config.priceConfig && config.priceConfig[activeTier] && Object.entries(config.priceConfig[activeTier]).map(([category, optionsGroups]) => (
              <div key={category} className="mb-8 last:mb-0">
                <h3 className="text-xl font-bold text-gray-800 mb-4 capitalize bg-gray-100 p-3 rounded-lg">
                  {category.replace(/([A-Z])/g, ' $1').trim()}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(optionsGroups || {}).map(([groupName, items]) => (
                    <div key={groupName} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h4 className="font-semibold text-gray-700 mb-3 capitalize border-b border-gray-200 pb-2">
                        {groupName}
                      </h4>
                      <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                        {Object.entries(items || {}).map(([itemName, price]) => (
                          <div key={itemName} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 w-1/2 truncate pr-2" title={itemName}>{itemName}</span>
                            <div className="w-1/2 flex items-center justify-end">
                              <span className="text-xs text-gray-400 mr-2">DKK</span>
                              <input
                                type="number"
                                value={price}
                                onChange={(e) => handlePriceConfigChange(activeTier, category, groupName, itemName, e.target.value)}
                                className="w-20 p-1 text-sm border border-gray-300 rounded text-right focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
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
    </div>
  );
};

export default ConfiguratorSettingsPage;
