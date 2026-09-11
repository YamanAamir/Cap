import React, { useState, useEffect } from 'react';
import { Settings2, Save, Loader2, AlertCircle, Tag, Check, GripVertical, RotateCcw } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { getSettings, updateSetting } from '../services/admin.service';
import { toast } from 'react-hot-toast';
import ConfirmModal from '../components/common/ConfirmModal';

const MASTER_TEMPLATE = {
  KOKARDE: ['Emblem', 'Kokarde', 'Roset farve', 'Type'],
  'UDDANNELSESBÅND': ['Broderi farve', 'Broderi foran', 'Hagerem', 'Huebånd', 'Knap farve', 'Materiale', 'År'],
  BRODERI: ['Broderifarve', 'Navne broderi', 'Skolebroderi', 'Skolebroderi farve', 'Top broderi'],
  BETRÆK: ['Farve', 'Kantbånd', 'Stjerner', 'Topkant', 'Flagbånd'],
  SKYGGE: ['Materiale', 'Skyggebånd', 'Laserengravering', 'Skyggegravering Line 1', 'Skyggegravering Line 2', 'Skyggegravering Line 3', 'Type'],
  FOER: ['Farve', 'Foer', 'Sløjfe', 'Svederem', 'Silk Type', 'Satin Type', 'Indvendigt foer billede'],
  EKSTRABETRÆK: ['Tilvælg', 'Farve', 'Topkant', 'Kantbånd', 'Stjerner', 'Flagbånd', 'Roset farve', 'Kokarde', 'Emblem', 'Type', 'Extra Top broderi'],
  TILBEHØR: ['Bucketpins', 'Ekstra korkarde', 'Ekstra korkarde Text', 'Flag 1', 'Flag 2', 'Flag 3', 'Fløjte', 'Handsker', 'Huekuglepen', 'Hueæske', 'Luksus champagneglas', 'Lyskugle', 'Premium æske', 'Silkepude', 'Smart Tag', 'Store kuglepen', 'Trompet'],
  STØRRELSE: ['Vælg størrelse', 'Millimeter tilpasningssæt']
};

const generateInitialState = (savedSettings) => {
  const isOldFormat = Array.isArray(savedSettings);
  let categoriesOrder = Object.keys(MASTER_TEMPLATE);

  if (savedSettings && !isOldFormat) {
    if (Array.isArray(savedSettings.categoriesOrder) && savedSettings.categoriesOrder.length > 0) {
      const validSaved = savedSettings.categoriesOrder.filter(c => MASTER_TEMPLATE[c]);
      const missing = Object.keys(MASTER_TEMPLATE).filter(c => !validSaved.includes(c));
      categoriesOrder = [...validSaved, ...missing];
    }
  }

  const initialSettings = {};

  Object.keys(MASTER_TEMPLATE).forEach(category => {
    let catVisible = true;
    let catLabel = category;
    let fieldsOrder = [...MASTER_TEMPLATE[category]];

    if (isOldFormat) {
      const catSetting = savedSettings.find(s => s.danish?.toLowerCase() === category.toLowerCase());
      if (catSetting) {
        if (catSetting.visible === false) catVisible = false;
        if (catSetting.english) catLabel = catSetting.english;
      }
    } else if (savedSettings && savedSettings[category] !== undefined) {
      catVisible = savedSettings[category].visible !== false;
      if (savedSettings[category].label) {
        catLabel = savedSettings[category].label;
      }
      if (Array.isArray(savedSettings[category].fieldsOrder) && savedSettings[category].fieldsOrder.length > 0) {
        const validSavedFields = savedSettings[category].fieldsOrder.filter(f => MASTER_TEMPLATE[category].includes(f));
        const missingFields = MASTER_TEMPLATE[category].filter(f => !validSavedFields.includes(f));
        fieldsOrder = [...validSavedFields, ...missingFields];
      }
    }
    
    const fields = {};
    MASTER_TEMPLATE[category].forEach(field => {
      let fieldVisible = true;
      let fieldLabel = field;

      if (isOldFormat) {
        const fieldSetting = savedSettings.find(s => s.danish?.toLowerCase() === field.toLowerCase());
        if (fieldSetting) {
          if (fieldSetting.visible === false) fieldVisible = false;
          if (fieldSetting.english) fieldLabel = fieldSetting.english;
        }
      } else if (savedSettings && savedSettings[category]?.fields !== undefined) {
        const fieldVal = savedSettings[category].fields[field];
        if (typeof fieldVal === 'boolean') {
          fieldVisible = fieldVal;
        } else if (typeof fieldVal === 'object' && fieldVal !== null) {
          fieldVisible = fieldVal.visible !== false;
          if (fieldVal.label) fieldLabel = fieldVal.label;
        }
      }

      fields[field] = {
        visible: fieldVisible,
        label: fieldLabel
      };
    });

    initialSettings[category] = {
      visible: catVisible,
      label: catLabel,
      fieldsOrder,
      fields
    };
  });

  return {
    categoriesOrder,
    settings: initialSettings
  };
};

export default function ProductionSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categoriesOrder, setCategoriesOrder] = useState(Object.keys(MASTER_TEMPLATE));
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
        const raw = typeof productionTerms.value === 'string' ? JSON.parse(productionTerms.value) : productionTerms.value;
        const initial = generateInitialState(raw);
        setCategoriesOrder(initial.categoriesOrder);
        setSettings(initial.settings);
      } else {
        const initial = generateInitialState(null);
        setCategoriesOrder(initial.categoriesOrder);
        setSettings(initial.settings);
      }
    } catch (error) {
      toast.error('Failed to load settings');
      const initial = generateInitialState(null);
      setCategoriesOrder(initial.categoriesOrder);
      setSettings(initial.settings);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaveModalOpen(false);
    setSaving(true);
    try {
      const payload = {
        categoriesOrder,
        ...settings
      };
      await updateSetting('PRODUCTION_DISPLAY_TERMS', payload);
      toast.success('Production display settings and sort order saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDragEnd = (result) => {
    const { destination, source, type } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // 1. Reordering Categories Cards
    if (type === 'CATEGORY') {
      const newOrder = Array.from(categoriesOrder);
      const [movedCategory] = newOrder.splice(source.index, 1);
      newOrder.splice(destination.index, 0, movedCategory);
      setCategoriesOrder(newOrder);
      return;
    }

    // 2. Reordering Fields inside a Card
    if (type === 'FIELD') {
      const sourceCategory = source.droppableId.replace('fields-', '');
      const destCategory = destination.droppableId.replace('fields-', '');

      if (sourceCategory === destCategory) {
        const catConfig = settings[sourceCategory];
        const currentFields = Array.from(catConfig?.fieldsOrder || MASTER_TEMPLATE[sourceCategory] || []);
        const [movedField] = currentFields.splice(source.index, 1);
        currentFields.splice(destination.index, 0, movedField);

        setSettings(prev => ({
          ...prev,
          [sourceCategory]: {
            ...prev[sourceCategory],
            fieldsOrder: currentFields
          }
        }));
      }
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

  const handleCategoryLabelChange = (category, label) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        label
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
          [field]: {
            ...prev[category].fields[field],
            visible: value
          }
        }
      }
    }));
  };

  const handleFieldLabelChange = (category, field, label) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        fields: {
          ...prev[category].fields,
          [field]: {
            ...prev[category].fields[field],
            label
          }
        }
      }
    }));
  };

  const resetCategoryToDefault = (category) => {
    setSettings(prev => {
      const defaultFields = {};
      MASTER_TEMPLATE[category].forEach(f => {
        defaultFields[f] = {
          visible: true,
          label: f
        };
      });
      return {
        ...prev,
        [category]: {
          visible: true,
          label: category,
          fieldsOrder: [...MASTER_TEMPLATE[category]],
          fields: defaultFields
        }
      };
    });
    toast.success(`Reset ${category} labels & order to default`);
  };

  const resetAllToDefault = () => {
    const initial = generateInitialState(null);
    setCategoriesOrder(initial.categoriesOrder);
    setSettings(initial.settings);
    toast.success('Reset all categories, names & sort order to default');
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
            <p className="text-slate-800 font-bold">Saving Settings & Sort Order...</p>
            <p className="text-sm text-slate-500 mt-1">Please wait</p>
          </div>
        </div>
      )}
      
      <div className="animate-in fade-in duration-500 max-w-[1200px] mx-auto pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Production Display Settings</h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Drag and drop cards and fields to set the exact display order for the factory dashboard.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={resetAllToDefault}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
              title="Reset all categories and fields to default order and labels"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset All</span>
            </button>
            <button
              onClick={() => setIsSaveModalOpen(true)}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#1e3a8a] text-white font-bold rounded-lg hover:bg-blue-800 transition-colors shadow-sm disabled:opacity-70 cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-bold mb-1">Drag & Drop Sorting & Custom Names:</p>
            <p>
              • <strong>Reorder Cards:</strong> Use the drag handle (<GripVertical className="w-3.5 h-3.5 inline text-blue-600" />) on any card header to rearrange categories.<br />
              • <strong>Reorder Fields:</strong> Use the drag handle on individual rows inside each card to rearrange fields.<br />
              • <strong>Edit Names:</strong> Click on category titles or field names to edit them. Whatever order and names you configure here will be mirrored on the factory order details page.
            </p>
          </div>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="categories-grid" type="CATEGORY">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {categoriesOrder.map((category, idx) => {
                  const catSettings = settings[category] || { 
                    visible: true, 
                    label: category, 
                    fieldsOrder: MASTER_TEMPLATE[category] || [], 
                    fields: {} 
                  };
                  const fieldsOrder = catSettings.fieldsOrder || MASTER_TEMPLATE[category] || [];

                  return (
                    <Draggable key={category} draggableId={`cat-${category}`} index={idx}>
                      {(dragProvided, snapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          className={`bg-white border rounded-lg overflow-hidden transition-shadow duration-200 flex flex-col justify-between ${
                            snapshot.isDragging 
                              ? 'shadow-2xl ring-2 ring-blue-500 z-50 border-blue-400 bg-blue-50/20' 
                              : catSettings.visible 
                                ? 'border-slate-200 shadow-sm' 
                                : 'border-dashed border-slate-300 opacity-60'
                          }`}
                        >
                          <div>
                            {/* Card Header with Drag Handle & Editable Category Label */}
                            <div className={`px-4 py-3 border-b ${catSettings.visible ? 'bg-[#fafafa] border-slate-200' : 'bg-slate-50 border-slate-200/50'} flex items-center justify-between gap-2`}>
                              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                <div
                                  {...dragProvided.dragHandleProps}
                                  className="p-1 text-slate-400 hover:text-blue-600 cursor-grab active:cursor-grabbing rounded hover:bg-slate-200/60 transition-colors shrink-0"
                                  title="Drag to reorder category card"
                                >
                                  <GripVertical className="w-4 h-4" />
                                </div>
                                <Tag className={`w-3.5 h-3.5 shrink-0 ${catSettings.visible ? 'text-slate-400' : 'text-slate-300'}`} />
                                <input
                                  type="text"
                                  value={catSettings.label !== undefined ? catSettings.label : category}
                                  onChange={(e) => handleCategoryLabelChange(category, e.target.value)}
                                  placeholder={category}
                                  disabled={!catSettings.visible}
                                  title="Click to edit category display name"
                                  className={`font-bold text-sm uppercase tracking-wider bg-transparent border-b border-dashed border-slate-300 hover:border-slate-500 focus:border-blue-600 focus:outline-none px-1 py-0.5 w-full text-slate-800 transition-colors ${
                                    !catSettings.visible ? 'line-through text-slate-400 cursor-not-allowed' : ''
                                  }`}
                                />
                              </div>
                              
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => resetCategoryToDefault(category)}
                                  title="Reset this category names & field order to default"
                                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded transition-colors"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>

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
                            </div>
                            
                            {/* Inner Fields Droppable with Drag & Drop Sorting */}
                            <Droppable droppableId={`fields-${category}`} type="FIELD">
                              {(fieldProvided) => (
                                <div
                                  ref={fieldProvided.innerRef}
                                  {...fieldProvided.droppableProps}
                                  className="p-3 space-y-2 min-h-[60px]"
                                >
                                  {fieldsOrder.map((field, fIdx) => {
                                    const fieldData = catSettings.fields?.[field] || { visible: true, label: field };
                                    const isFieldVisible = fieldData.visible !== false;
                                    const fieldLabel = fieldData.label !== undefined ? fieldData.label : field;
                                    
                                    return (
                                      <Draggable key={field} draggableId={`field-${category}-${field}`} index={fIdx}>
                                        {(fDragProvided, fSnapshot) => (
                                          <div
                                            ref={fDragProvided.innerRef}
                                            {...fDragProvided.draggableProps}
                                            className={`flex items-center justify-between gap-2.5 p-2 rounded transition-all border ${
                                              fSnapshot.isDragging 
                                                ? 'bg-blue-50 border-blue-400 shadow-md ring-1 ring-blue-300 z-40' 
                                                : 'border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50/70'
                                            }`}
                                          >
                                            <div
                                              {...fDragProvided.dragHandleProps}
                                              className="p-1 text-slate-300 hover:text-blue-600 cursor-grab active:cursor-grabbing rounded shrink-0"
                                              title="Drag to reorder field"
                                            >
                                              <GripVertical className="w-3.5 h-3.5" />
                                            </div>

                                            <div className="flex flex-col flex-1 min-w-0">
                                              <input
                                                type="text"
                                                value={fieldLabel}
                                                onChange={(e) => handleFieldLabelChange(category, field, e.target.value)}
                                                placeholder={field}
                                                disabled={!catSettings.visible || !isFieldVisible}
                                                title="Click to edit field display name"
                                                className={`text-[11px] font-bold uppercase tracking-wider bg-transparent border-b border-dashed border-slate-300 hover:border-slate-500 focus:border-blue-600 focus:outline-none px-1 py-0.5 w-full transition-colors ${
                                                  isFieldVisible && catSettings.visible ? 'text-slate-700' : 'text-slate-300 line-through cursor-not-allowed'
                                                }`}
                                              />
                                              <span className={`font-medium text-[11px] mt-0.5 px-1 ${isFieldVisible && catSettings.visible ? 'text-slate-400' : 'text-slate-300 line-through'}`}>
                                                Example Value
                                              </span>
                                            </div>

                                            <label className="relative inline-flex items-center cursor-pointer shrink-0" title={`Toggle ${field}`}>
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
                                        )}
                                      </Draggable>
                                    );
                                  })}
                                  {fieldProvided.placeholder}
                                </div>
                              )}
                            </Droppable>

                          </div>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        
        <ConfirmModal 
          isOpen={isSaveModalOpen}
          title="Save Display Settings & Sort Order"
          message="Are you sure you want to save these display settings and sorting order? The factory production portal will immediately reflect the exact order and names."
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
