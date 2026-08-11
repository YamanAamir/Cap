import React from 'react';
import { Settings2, Tag, Check, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const ConfigBlueprintCards = ({ selectedOptions, productionFilters }) => {
  if (!selectedOptions || Object.keys(selectedOptions).length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 border border-slate-200 border-dashed rounded text-slate-500">
        <Settings2 className="w-8 h-8 mx-auto mb-2 opacity-20" />
        <p className="text-sm font-bold">No Configuration Data</p>
      </div>
    );
  }

  // Helper to render values
  const renderValue = (value) => {
    if (typeof value === 'string' || typeof value === 'number') {
      return <span className="font-bold text-slate-800 text-sm">{value}</span>;
    }
    
    if (typeof value === 'object' && value !== null) {
      // It might be an object like { name, value, color, img }
      return (
        <div className="flex items-center gap-2 mt-1">
          {value.color && (
            <div 
              className="w-4 h-4 rounded-full border border-slate-200 shadow-sm" 
              style={{ backgroundColor: value.color }}
              title={value.color}
            />
          )}
          {value.img && value.img.startsWith('http') && (
            <img src={value.img} alt={value.name} className="w-6 h-6 object-cover rounded shadow-sm" />
          )}
          <span className="font-bold text-slate-800 text-sm">{value.name || value.value || 'Selected'}</span>
        </div>
      );
    }
    
    if (typeof value === 'boolean') {
      return value ? <Check className="w-4 h-4 text-green-600" /> : <span className="text-slate-400 font-bold text-sm">No</span>;
    }

    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Object.entries(selectedOptions).map(([category, details], idx) => {
        // If production filters are provided, check if the category itself is translated
        let displayCategory = category;
        let isCategoryVisible = true;
        
        if (productionFilters && Array.isArray(productionFilters) && productionFilters.length > 0) {
          const catFilter = productionFilters.find(f => f.danish.toLowerCase() === category.toLowerCase());
          if (catFilter) {
            if (!catFilter.visible) isCategoryVisible = false;
            if (catFilter.english) displayCategory = catFilter.english;
          }
        }
        
        if (!isCategoryVisible) return null;

        return (
          <div key={idx} className="bg-white border border-slate-200 rounded overflow-hidden shadow-sm">
            <div className="bg-[#fafafa] px-4 py-3 border-b border-slate-200 flex items-center gap-2">
              <Tag className="w-4 h-4 text-slate-400" />
              <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wider">{displayCategory}</h4>
            </div>
            
            <div className="p-4 space-y-4">
              {typeof details === 'object' && details !== null ? (
                Object.entries(details).map(([key, value], i) => {
                  // Hide huge base64 strings from text output
                  if (typeof value === 'string' && value.startsWith('data:image')) return null;
                  if (Array.isArray(value) && value[0]?.url) return null; // Hide custom lining arrays
                  
                  let displayKey = key;
                  let displayValue = value;
                  
                  // Apply production filters if they exist
                  if (productionFilters && Array.isArray(productionFilters) && productionFilters.length > 0) {
                    const filter = productionFilters.find(f => f.danish.toLowerCase() === key.toLowerCase());
                    if (filter) {
                      if (!filter.visible) return null; // Hide it completely
                      if (filter.english) displayKey = filter.english; // Translate it
                    } else {
                      // If a filter exists but this key is NOT in it, we hide it by default for production portal
                      return null;
                    }
                    
                    // Also translate the VALUE if it's a string and a translation exists
                    if (typeof displayValue === 'string') {
                      const valFilter = productionFilters.find(f => f.danish.toLowerCase() === displayValue.toLowerCase());
                      if (valFilter && valFilter.english) {
                        displayValue = valFilter.english;
                      }
                    }
                  }
                  
                  return (
                    <div key={i} className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{displayKey}</span>
                      {renderValue(displayValue)}
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
        );
      })}
    </div>
  );
};

export default ConfigBlueprintCards;
