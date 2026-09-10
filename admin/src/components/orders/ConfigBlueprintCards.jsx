import React from 'react';
import { Settings2, Tag, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { translateFactoryValue } from '../../utils/factoryTranslations';

const ConfigBlueprintCards = ({ selectedOptions, productionFilters, isFactoryView }) => {
  if (!selectedOptions || Object.keys(selectedOptions).length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 border border-slate-200 border-dashed rounded text-slate-500">
        <Settings2 className="w-8 h-8 mx-auto mb-2 opacity-20" />
        <p className="text-sm font-bold">No Configuration Data</p>
      </div>
    );
  }

  const isFactoryMode = Boolean(productionFilters || isFactoryView);
  const isOldFormat = Array.isArray(productionFilters);

  // Helper to render values with English translations in factory mode
  const renderValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-slate-400 font-bold text-sm">{isFactoryMode ? 'Not Chosen' : 'Ikke valgt'}</span>;
    }

    if (typeof value === 'boolean') {
      if (isFactoryMode) {
        return <span className="font-bold text-slate-800 text-sm">{value ? 'Yes' : 'No'}</span>;
      }
      return value ? <Check className="w-4 h-4 text-green-600" /> : <span className="text-slate-400 font-bold text-sm">Nej</span>;
    }

    if (typeof value === 'string' || typeof value === 'number') {
      const formatted = isFactoryMode ? translateFactoryValue(value) : value;
      return <span className="font-bold text-slate-800 text-sm break-words">{formatted}</span>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-slate-400 font-bold text-sm">{isFactoryMode ? 'Not Chosen' : 'Ikke valgt'}</span>;
      }
      const formattedArray = value.map(item => {
        if (typeof item === 'object' && item !== null) {
          const raw = item.name || item.value || JSON.stringify(item);
          return isFactoryMode ? translateFactoryValue(raw) : raw;
        }
        return isFactoryMode ? translateFactoryValue(item) : item;
      }).join(', ');
      return <span className="font-bold text-slate-800 text-sm break-words">{formattedArray}</span>;
    }
    
    if (typeof value === 'object' && value !== null) {
      const rawText = value.name || value.value || 'Selected';
      const displayText = isFactoryMode ? translateFactoryValue(rawText) : rawText;

      return (
        <div className="flex items-center gap-2 mt-1">
          {value.color && (
            <div 
              className="w-4 h-4 rounded-full border border-slate-200 shadow-sm shrink-0" 
              style={{ backgroundColor: value.color }}
              title={value.color}
            />
          )}
          {value.img && value.img.startsWith('http') && (
            <img src={value.img} alt={displayText} className="w-6 h-6 object-cover rounded shadow-sm shrink-0" />
          )}
          <span className="font-bold text-slate-800 text-sm break-words">{displayText}</span>
        </div>
      );
    }

    return null;
  };

  // Sort Categories by custom categoriesOrder if available
  const categoryEntries = Object.entries(selectedOptions);
  if (productionFilters) {
    let customCatOrder = [];
    if (Array.isArray(productionFilters.categoriesOrder)) {
      customCatOrder = productionFilters.categoriesOrder;
    } else if (!isOldFormat && typeof productionFilters === 'object') {
      customCatOrder = Object.keys(productionFilters).filter(k => k !== 'categoriesOrder');
    }

    if (customCatOrder.length > 0) {
      categoryEntries.sort(([catA], [catB]) => {
        const idxA = customCatOrder.findIndex(k => k.toLowerCase() === catA.toLowerCase());
        const idxB = customCatOrder.findIndex(k => k.toLowerCase() === catB.toLowerCase());
        const sortA = idxA !== -1 ? idxA : 999;
        const sortB = idxB !== -1 ? idxB : 999;
        return sortA - sortB;
      });
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {categoryEntries.map(([category, details], idx) => {
        let displayCategory = category;
        let isCategoryVisible = true;
        let catConfig = null;
        
        if (productionFilters) {
          if (!isOldFormat && typeof productionFilters === 'object' && Object.keys(productionFilters).length > 0) {
            const catMatch = Object.keys(productionFilters).find(k => k.toLowerCase() === category.toLowerCase());
            if (catMatch) {
              catConfig = productionFilters[catMatch];
              if (catConfig.visible === false) {
                isCategoryVisible = false;
              }
              if (catConfig.label) {
                displayCategory = catConfig.label;
              }
            }
          } else if (isOldFormat && productionFilters.length > 0) {
            const catFilter = productionFilters.find(f => f.danish?.toLowerCase() === category.toLowerCase());
            if (catFilter) {
              if (catFilter.visible === false) isCategoryVisible = false;
              if (catFilter.english || catFilter.label) displayCategory = catFilter.english || catFilter.label;
            }
          }
        }
        
        if (!isCategoryVisible) return null;

        // Sort fields by custom fieldsOrder if available
        let fieldEntries = typeof details === 'object' && details !== null ? Object.entries(details) : [];
        if (catConfig && Array.isArray(catConfig.fieldsOrder) && catConfig.fieldsOrder.length > 0) {
          const customFieldsOrder = catConfig.fieldsOrder;
          fieldEntries.sort(([keyA], [keyB]) => {
            const idxA = customFieldsOrder.findIndex(f => f.toLowerCase() === keyA.toLowerCase());
            const idxB = customFieldsOrder.findIndex(f => f.toLowerCase() === keyB.toLowerCase());
            const sortA = idxA !== -1 ? idxA : 999;
            const sortB = idxB !== -1 ? idxB : 999;
            return sortA - sortB;
          });
        }

        return (
          <div key={idx} className="bg-white border border-slate-200 rounded overflow-hidden shadow-sm flex flex-col justify-between">
            <div>
              <div className="bg-[#fafafa] px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                <Tag className="w-4 h-4 text-slate-400 shrink-0" />
                <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wider">{displayCategory}</h4>
              </div>
              
              <div className="p-4 space-y-4">
                {typeof details === 'object' && details !== null ? (
                  fieldEntries.map(([key, value], i) => {
                    // Hide huge base64 strings and custom lining uploads from text specification list
                    if (typeof value === 'string' && value.startsWith('data:image')) return null;
                    if (Array.isArray(value) && value[0]?.url) return null;
                    
                    let displayKey = key;
                    let isFieldVisible = true;
                    
                    if (productionFilters) {
                      if (!isOldFormat && typeof productionFilters === 'object' && Object.keys(productionFilters).length > 0) {
                        const catMatch = Object.keys(productionFilters).find(k => k.toLowerCase() === category.toLowerCase());
                        if (catMatch && productionFilters[catMatch]?.fields) {
                          const fieldMatch = Object.keys(productionFilters[catMatch].fields).find(k => k.toLowerCase() === key.toLowerCase());
                          if (fieldMatch) {
                            const fieldConfig = productionFilters[catMatch].fields[fieldMatch];
                            if (fieldConfig === false || (typeof fieldConfig === 'object' && fieldConfig.visible === false)) {
                              isFieldVisible = false;
                            }
                            if (typeof fieldConfig === 'object' && fieldConfig.label) {
                              displayKey = fieldConfig.label;
                            }
                          } else {
                            // If field not matched in whitelist/blacklist
                            isFieldVisible = false;
                          }
                        } else {
                          isFieldVisible = false;
                        }
                      } else if (isOldFormat && productionFilters.length > 0) {
                        const filter = productionFilters.find(f => f.danish?.toLowerCase() === key.toLowerCase());
                        if (filter) {
                          if (filter.visible === false) isFieldVisible = false;
                          if (filter.english || filter.label) displayKey = filter.english || filter.label;
                        } else {
                          isFieldVisible = false;
                        }
                      }
                    }
                    
                    if (!isFieldVisible) return null;
                    
                    return (
                      <div key={i} className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{displayKey}</span>
                        {renderValue(value)}
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col">
                    {renderValue(details)}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ConfigBlueprintCards;
