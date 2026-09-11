import React, { useState, useEffect, useMemo } from 'react';
import { getExcelColumns, createExcelColumn, updateExcelColumn, updateExcelColumns, deleteExcelColumn } from '../services/admin.service';
import api from '../services/api';
import { Loader2, Save, FileSpreadsheet, Plus, Trash2, X, GripVertical, Pencil, CheckCircle2, Layers } from 'lucide-react';
import ConfirmModal from '../components/common/ConfirmModal';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

// Master list of categorized fields ordered by Configurator Workflow Pages
const STATIC_FIELD_GROUPS = [
  {
    name: 'Order & Customer Information',
    categoryKey: 'GENERAL',
    fields: [
      { label: 'Order ID (Internal DB ID)', value: 'orderId', defaultHeader: 'Order ID' },
      { label: 'Order Number (#1001)', value: 'orderNumber', defaultHeader: 'Order Number' },
      { label: 'Order Date (YYYY-MM-DD)', value: 'orderDate', defaultHeader: 'Order Date' },
      { label: 'Created At (Full Date & Time)', value: 'createdAt', defaultHeader: 'Created At' },
      { label: 'Updated At (Full Date & Time)', value: 'updatedAt', defaultHeader: 'Updated At' },
      { label: 'Customer ID', value: 'customerId', defaultHeader: 'Customer ID' },
      { label: 'Customer Full Name', value: 'customerName', defaultHeader: 'Customer Name' },
      { label: 'Customer Email', value: 'customerEmail', defaultHeader: 'Email' },
      { label: 'Customer Phone', value: 'customerPhone', defaultHeader: 'Phone' },
      { label: 'Customer Address', value: 'customerAddress', defaultHeader: 'Address' },
      { label: 'Customer City', value: 'customerCity', defaultHeader: 'City' },
      { label: 'Customer Zip / Postal Code', value: 'customerPostalCode', defaultHeader: 'Postal Code' },
      { label: 'Customer Country', value: 'customerDeliveryCountry', defaultHeader: 'Country' },
      { label: 'School Name (Skolenavn)', value: 'schoolName', defaultHeader: 'School' },
      { label: 'Delivery Type (Standard / Express)', value: 'deliveryType', defaultHeader: 'Delivery Type' },
      { label: 'Total Price', value: 'totalPrice', defaultHeader: 'Total Price' },
      { label: 'Currency (DKK)', value: 'currency', defaultHeader: 'Currency' },
      { label: 'Package Name (Standard, Luksus, Premium)', value: 'packageName', defaultHeader: 'Package' },
      { label: 'Program (STX, HHX, HTX, etc.)', value: 'program', defaultHeader: 'Program' },
      { label: 'Order Status', value: 'status', defaultHeader: 'Status' },
      { label: 'Payment Status', value: 'paymentStatus', defaultHeader: 'Payment Status' },
      { label: 'Payment ID (Stripe Intent ID)', value: 'paymentIntentId', defaultHeader: 'Payment ID' },
      { label: 'Discount Code', value: 'discountCode', defaultHeader: 'Discount Code' },
      { label: 'Discount Amount', value: 'discountAmount', defaultHeader: 'Discount Amount' },
    ]
  },
  {
    name: '1. UDDANNELSESBÅND (Tape & Front)',
    categoryKey: 'UDDANNELSESBÅND',
    fields: [
      { label: 'Huebånd (Band / Program Color)', value: 'options.UDDANNELSESBÅND.Huebånd', defaultHeader: 'Huebånd' },
      { label: 'Materiale (Material: Bomuld, Satin, Velour, etc.)', value: 'options.UDDANNELSESBÅND.Materiale', defaultHeader: 'Band Materiale' },
      { label: 'Hagerem (Chin Strap & Knots Finish)', value: 'options.UDDANNELSESBÅND.Hagerem', defaultHeader: 'Hagerem' },
      { label: 'Broderi foran (Front Embroidery Text)', value: 'options.UDDANNELSESBÅND.Broderi foran', defaultHeader: 'Broderi foran' },
      { label: 'Broderi farve (Front Embroidery Color)', value: 'options.UDDANNELSESBÅND.Broderi farve', defaultHeader: 'Broderi foran farve' },
      { label: 'Knap farve (Side Button Color: Guld / Sølv)', value: 'options.UDDANNELSESBÅND.Knap farve', defaultHeader: 'Knap farve' },
      { label: 'År (Graduation Year)', value: 'options.UDDANNELSESBÅND.år', defaultHeader: 'År' },
    ]
  },
  {
    name: '2. KOKARDE (Rosette & Emblem)',
    categoryKey: 'KOKARDE',
    fields: [
      { label: 'Kokarde (Collection: Signature, Prestige, Zodiac, Flag)', value: 'options.KOKARDE.Kokarde', defaultHeader: 'Kokarde Style' },
      { label: 'Roset farve (Rosette Flower Color)', value: 'options.KOKARDE.Roset farve', defaultHeader: 'Roset farve' },
      { label: 'Emblem (Emblem Metal: Guld / Sølv)', value: 'options.KOKARDE.Emblem', defaultHeader: 'Emblem farve' },
      { label: 'Type (Emblem Symbol / Insignia Design)', value: 'options.KOKARDE.Type', defaultHeader: 'Emblem Type' },
      { label: 'Flag (Country Flag on Bow)', value: 'options.KOKARDE.Flag', defaultHeader: 'Kokarde Flag' },
    ]
  },
  {
    name: '3. BETRÆK (Cap Cover)',
    categoryKey: 'BETRÆK',
    fields: [
      { label: 'Farve (Cover Color: Hvid, Sort, Purple, etc.)', value: 'options.BETRÆK.Farve', defaultHeader: 'Betræk Farve' },
      { label: 'Topkant (Top Cord / Piping: Guld, Sølv, etc.)', value: 'options.BETRÆK.Topkant', defaultHeader: 'Topkant' },
      { label: 'Kantbånd (Edge Ribbon Color)', value: 'options.BETRÆK.Kantbånd', defaultHeader: 'Kantbånd' },
      { label: 'Stjerner (Stars Count: 1-6 Stars)', value: 'options.BETRÆK.Stjerner', defaultHeader: 'Stjerner' },
      { label: 'Stjerner farve (Stars Color: Guld / Sølv)', value: 'options.BETRÆK.Stjerner farve', defaultHeader: 'Stjerner farve' },
      { label: 'Flagbånd (Flag Ribbon Band: International, Europe, etc.)', value: 'options.BETRÆK.Flagbånd', defaultHeader: 'Flagbånd' },
    ]
  },
  {
    name: '4. FOER (Inside Lining)',
    categoryKey: 'FOER',
    fields: [
      { label: 'Svederem (Sweatband Material: Læder, Ruskin, etc.)', value: 'options.FOER.Svederem', defaultHeader: 'Svederem' },
      { label: 'Farve (Sweatband Color: Hvid, Sort, Cognac)', value: 'options.FOER.Farve', defaultHeader: 'Svederem Farve' },
      { label: 'Sløjfe (Inner Bow Color: Hvid, Sort, Guld, Sølv)', value: 'options.FOER.Sløjfe', defaultHeader: 'Sløjfe Farve' },
      { label: 'Foer (Lining Fabric: Viskose, Polyester, Satin, Silke)', value: 'options.FOER.Foer', defaultHeader: 'Foer Materiale' },
      { label: 'Satin Type (Satin Lining Color)', value: 'options.FOER.Satin Type', defaultHeader: 'Satin Farve' },
      { label: 'Silk Type (Silk Lining Color)', value: 'options.FOER.Silk Type', defaultHeader: 'Silke Farve' },
      { label: 'Indvendigt foer billede (Custom Lining Photo URL)', value: 'options.FOER.Indvendigt foer billede', defaultHeader: 'Foer Billede' },
    ]
  },
  {
    name: '5. SKYGGE (Brim & Engraving)',
    categoryKey: 'SKYGGE',
    fields: [
      { label: 'Type (Shade Finish: Mat, Shiny, Glimmer, Shimmer)', value: 'options.SKYGGE.Type', defaultHeader: 'Skygge Type' },
      { label: 'Materiale (Shade Edge: Uden kant / Med kant)', value: 'options.SKYGGE.Materiale', defaultHeader: 'Skygge Kant' },
      { label: 'Skyggebånd (Brim Ribbon: Guld / Sølv)', value: 'options.SKYGGE.Skyggebånd', defaultHeader: 'Skyggebånd' },
      { label: 'Laserengravering (Laser Engraving: Yes / No)', value: 'options.SKYGGE.Laserengravering', defaultHeader: 'Laserengravering' },
      { label: 'Skyggegravering Line 1 (Engraving Line 1 Text)', value: 'options.SKYGGE.Skyggegravering Line 1', defaultHeader: 'Skyggegravering 1' },
      { label: 'Skyggegravering Line 2 (Engraving Line 2 Text)', value: 'options.SKYGGE.Skyggegravering Line 2', defaultHeader: 'Skyggegravering 2' },
      { label: 'Skyggegravering Line 3 (Engraving Line 3 Text)', value: 'options.SKYGGE.Skyggegravering Line 3', defaultHeader: 'Skyggegravering 3' },
    ]
  },
  {
    name: '6. BRODERI (Back & Top Embroidery)',
    categoryKey: 'BRODERI',
    fields: [
      { label: 'Top broderi (Top Cap Embroidery Design 1-4)', value: 'options.BRODERI.Top broderi', defaultHeader: 'Top broderi' },
      { label: 'Navne broderi (Back Student Name Text)', value: 'options.BRODERI.Navne broderi', defaultHeader: 'Navne broderi' },
      { label: 'Broderifarve (Back Name Color)', value: 'options.BRODERI.Broderifarve', defaultHeader: 'Navne broderifarve' },
      { label: 'Skolebroderi (School Name Embroidery Text)', value: 'options.BRODERI.Skolebroderi', defaultHeader: 'Skolebroderi' },
      { label: 'Skolebroderi farve (School Name Color)', value: 'options.BRODERI.Skolebroderi farve', defaultHeader: 'Skolebroderi farve' },
      { label: 'Ingen (Ingen Skolebroderi Flag)', value: 'options.BRODERI.Ingen', defaultHeader: 'Ingen Skolebroderi' },
    ]
  },
  {
    name: '7. TILBEHØR (Accessories & Packaging)',
    categoryKey: 'TILBEHØR',
    fields: [
      { label: 'Hueæske (Hat Box: Standard, Luksus, Premium)', value: 'options.TILBEHØR.Hueæske', defaultHeader: 'Hueæske' },
      { label: 'Premium æske (Premium Box Finish)', value: 'options.TILBEHØR.Premium æske', defaultHeader: 'Premium æske' },
      { label: 'Huekuglepen (Cap Pen)', value: 'options.TILBEHØR.Huekuglepen', defaultHeader: 'Huekuglepen' },
      { label: 'Store kuglepen (Large Pen)', value: 'options.TILBEHØR.Store kuglepen', defaultHeader: 'Store kuglepen' },
      { label: 'Silkepude (Silk Cushion)', value: 'options.TILBEHØR.Silkepude', defaultHeader: 'Silkepude' },
      { label: 'Ekstra korkarde (Extra Cockade Selected)', value: 'options.TILBEHØR.Ekstra korkarde', defaultHeader: 'Ekstra korkarde' },
      { label: 'Ekstra korkarde Text (Extra Cockade Text)', value: 'options.TILBEHØR.Ekstra korkarde Text', defaultHeader: 'Ekstra korkarde Text' },
      { label: 'Handsker (White Graduation Gloves)', value: 'options.TILBEHØR.Handsker', defaultHeader: 'Handsker' },
      { label: 'Smart Tag (GPS Tag Tracker)', value: 'options.TILBEHØR.Smart Tag', defaultHeader: 'Smart Tag' },
      { label: 'Lyskugle (Party Light Ball)', value: 'options.TILBEHØR.Lyskugle', defaultHeader: 'Lyskugle' },
      { label: 'Luksus champagneglas (Champagne Glass)', value: 'options.TILBEHØR.Luksus champagneglas', defaultHeader: 'Champagneglas' },
      { label: 'Fløjte (Graduation Whistle)', value: 'options.TILBEHØR.Fløjte', defaultHeader: 'Fløjte' },
      { label: 'Trompet (Graduation Trumpet)', value: 'options.TILBEHØR.Trompet', defaultHeader: 'Trompet' },
      { label: 'Bucketpins (Bucket Pins)', value: 'options.TILBEHØR.Bucketpins', defaultHeader: 'Bucketpins' },
      { label: 'Selected Flags (Country Flag Badges List)', value: 'options.TILBEHØR.selectedFlags', defaultHeader: 'Selected Flags' },
    ]
  },
  {
    name: '8. STØRRELSE (Size & Adjustments)',
    categoryKey: 'STØRRELSE',
    fields: [
      { label: 'Vælg størrelse (Cap Head Size e.g. 56 cm)', value: 'options.STØRRELSE.Vælg størrelse', defaultHeader: 'Størrelse' },
      { label: 'Millimeter tilpasningssæt (Fitting Set)', value: 'options.STØRRELSE.Millimeter tilpasningssæt', defaultHeader: 'Tilpasningssæt' },
    ]
  },
  {
    name: '9. EKSTRABETRÆK (Extra Cover Addon)',
    categoryKey: 'EKSTRABETRÆK',
    fields: [
      { label: 'Tilvælg (Include Extra Cover)', value: 'options.EKSTRABETRÆK.Tilvælg', defaultHeader: 'Ekstrabetræk Valgt' },
      { label: 'Farve (Extra Cover Color)', value: 'options.EKSTRABETRÆK.Farve', defaultHeader: 'Ekstrabetræk Farve' },
      { label: 'Topkant (Extra Cover Top Cord)', value: 'options.EKSTRABETRÆK.Topkant', defaultHeader: 'Ekstrabetræk Topkant' },
      { label: 'Kantbånd (Extra Cover Edge Ribbon)', value: 'options.EKSTRABETRÆK.Kantbånd', defaultHeader: 'Ekstrabetræk Kantbånd' },
      { label: 'Stjerner (Extra Cover Stars Count)', value: 'options.EKSTRABETRÆK.Stjerner', defaultHeader: 'Ekstrabetræk Stjerner' },
      { label: 'Flagbånd (Extra Cover Flag Ribbon)', value: 'options.EKSTRABETRÆK.Flagbånd', defaultHeader: 'Ekstrabetræk Flagbånd' },
      { label: 'Kokarde (Extra Cover Cockade Style)', value: 'options.EKSTRABETRÆK.Kokarde', defaultHeader: 'Ekstrabetræk Kokarde' },
      { label: 'Roset farve (Extra Cover Rosette Color)', value: 'options.EKSTRABETRÆK.Roset farve', defaultHeader: 'Ekstrabetræk Roset Farve' },
      { label: 'Emblem (Extra Cover Emblem Color)', value: 'options.EKSTRABETRÆK.Emblem', defaultHeader: 'Ekstrabetræk Emblem' },
      { label: 'Type (Extra Cover Emblem Design)', value: 'options.EKSTRABETRÆK.Type', defaultHeader: 'Ekstrabetræk Emblem Type' },
      { label: 'Flag (Extra Cover Flag)', value: 'options.EKSTRABETRÆK.Flag', defaultHeader: 'Ekstrabetræk Flag' },
    ]
  },
  {
    name: '10. Static / Fixed Value Columns',
    categoryKey: 'STATIC',
    fields: [
      { label: 'Static Value "1"', value: 'static:1', defaultHeader: 'Qty' },
      { label: 'Static Value "0"', value: 'static:0', defaultHeader: 'Zero' },
      { label: 'Static Value "DK"', value: 'static:DK', defaultHeader: 'Country Code' },
      { label: 'Static Value "YES"', value: 'static:YES', defaultHeader: 'Yes' },
      { label: 'Static Value "NO"', value: 'static:NO', defaultHeader: 'No' },
    ]
  }
];

const ExcelTemplatesPage = () => {
  const [columns, setColumns] = useState([]);
  const [dynamicOptions, setDynamicOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ headerLabel: '', fieldKey: '' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });
  const [editModal, setEditModal] = useState({ isOpen: false, column: null, headerLabel: '', fieldKey: '' });
  const [isUpdating, setIsUpdating] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [cols, settingsRes] = await Promise.all([
        getExcelColumns(),
        api.get('/admin/settings/configurator').catch(() => ({ data: {} }))
      ]);
      setColumns(cols);

      // Extract any extra dynamic options from configurator settings
      const standard = settingsRes.data?.priceConfig?.standard || {};
      const dynamicFields = [];
      Object.keys(standard).forEach(category => {
        Object.keys(standard[category]).forEach(field => {
          dynamicFields.push({
            category,
            field,
            label: `${category} - ${field}`,
            value: `options.${category}.${field}`
          });
        });
      });
      setDynamicOptions(dynamicFields);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Build unified organized field groups
  const allFieldGroups = useMemo(() => {
    const knownValues = new Set();
    STATIC_FIELD_GROUPS.forEach(g => g.fields.forEach(f => knownValues.add(f.value)));

    // Clone static groups
    const groups = STATIC_FIELD_GROUPS.map(g => ({
      ...g,
      fields: [...g.fields]
    }));

    // Check if there are dynamic fields not covered in static list
    const unassignedFields = [];
    dynamicOptions.forEach(opt => {
      if (!knownValues.has(opt.value)) {
        // Try to match by category name
        const targetGroup = groups.find(g => g.categoryKey && opt.category && g.categoryKey.toLowerCase() === opt.category.toLowerCase());
        if (targetGroup) {
          targetGroup.fields.push({
            label: `${opt.field} (${opt.category})`,
            value: opt.value,
            defaultHeader: opt.field
          });
        } else {
          unassignedFields.push({
            label: opt.label,
            value: opt.value,
            defaultHeader: opt.field
          });
        }
      }
    });

    if (unassignedFields.length > 0) {
      groups.push({
        name: 'Additional Configurator Options',
        categoryKey: 'OTHER',
        fields: unassignedFields
      });
    }

    return groups;
  }, [dynamicOptions]);

  const getLabelForFieldKey = (key) => {
    if (!key) return '';
    for (const group of allFieldGroups) {
      const match = group.fields.find(f => f.value === key);
      if (match) {
        return (
          <span className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              {group.name.split(' (')[0]}
            </span>
            <span className="text-slate-800 font-medium">{match.label}</span>
          </span>
        );
      }
    }
    
    if (key.startsWith('options.')) {
      const parts = key.replace('options.', '').split('.');
      if (parts.length === 2) {
        return (
          <span className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              {parts[0]}
            </span>
            <span className="text-slate-800 font-medium">{parts[1]}</span>
          </span>
        );
      }
    }
    
    if (key.startsWith('static:')) {
      const val = key.replace('static:', '').split('::')[0];
      return (
        <span className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
            Static
          </span>
          <span className="text-slate-800 font-medium">"{val}"</span>
        </span>
      );
    }
    
    return <span className="text-slate-700 font-medium">{key}</span>;
  };

  const handleFieldSelectChange = (fieldValue, isEdit = false) => {
    let suggestedHeader = '';
    for (const group of allFieldGroups) {
      const match = group.fields.find(f => f.value === fieldValue);
      if (match && match.defaultHeader) {
        suggestedHeader = match.defaultHeader;
        break;
      }
    }

    if (isEdit) {
      setEditModal(prev => ({
        ...prev,
        fieldKey: fieldValue,
        headerLabel: prev.headerLabel || suggestedHeader
      }));
    } else {
      setForm(prev => ({
        ...prev,
        fieldKey: fieldValue,
        headerLabel: prev.headerLabel || suggestedHeader
      }));
    }
  };

  const handleSaveOrder = async () => {
    setSaving(true);
    try {
      const updatedColumns = columns.map((col, idx) => ({ ...col, sortOrder: idx + 1 }));
      await updateExcelColumns(updatedColumns);
      toast.success('Column order saved!');
      load();
    } catch (e) { 
      toast.error('Failed to save changes'); 
    } finally { 
      setSaving(false); 
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createExcelColumn({
        ...form,
        sortOrder: columns.length + 1
      });
      setForm({ headerLabel: '', fieldKey: '' });
      setShowForm(false);
      toast.success('Column added!');
      load();
    } catch (e) {
      toast.error('Failed to add column');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEdit = (col) => {
    setEditModal({
      isOpen: true,
      column: col,
      headerLabel: col.headerLabel || '',
      fieldKey: col.fieldKey || ''
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editModal.column) return;
    setIsUpdating(true);
    try {
      await updateExcelColumn(editModal.column.id, {
        headerLabel: editModal.headerLabel,
        fieldKey: editModal.fieldKey
      });
      toast.success('Column updated successfully!');
      setEditModal({ isOpen: false, column: null, headerLabel: '', fieldKey: '' });
      load();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update column';
      toast.error(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const executeDelete = async () => {
    if (!confirmModal.id) return;
    try {
      await deleteExcelColumn(confirmModal.id);
      toast.success('Column deleted!');
      load();
    } catch (e) {
      toast.error('Deletion failed');
    } finally {
      setConfirmModal({ isOpen: false, id: null });
    }
  };

  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;
    
    const newColumns = [...columns];
    const draggedCol = newColumns[draggedItem];
    newColumns.splice(draggedItem, 1);
    newColumns.splice(index, 0, draggedCol);
    
    setDraggedItem(index);
    setColumns(newColumns);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const updateColumnLocally = (index, field, value) => {
    const newColumns = [...columns];
    newColumns[index][field] = value;
    setColumns(newColumns);
  };

  if (loading && !columns.length) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-[1050px] mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            Production Excel Template
          </h2>
          <p className="text-sm text-slate-500">Configure the columns and mapped data fields exported for factory production</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleSaveOrder} 
            disabled={saving}
            className="flex items-center gap-2 text-white bg-green-600 hover:bg-green-700 text-xs font-bold px-4 py-2.5 rounded shadow-sm transition-colors"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} 
            SAVE ORDER
          </button>
          <button 
            onClick={() => setShowForm(!showForm)} 
            className={cn(
              "flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded shadow-sm transition-colors",
              showForm ? "bg-slate-200 text-slate-700 hover:bg-slate-300" : "bg-[#1e3a8a] text-white hover:bg-blue-800"
            )}
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />} 
            {showForm ? 'CANCEL' : 'ADD COLUMN'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="mb-6 p-6 bg-white border border-slate-200 rounded shadow-sm animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
              <Plus className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Add New Excel Column</h3>
          </div>

          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                Data Path / Value (Categorized by Configurator Step)
              </label>
              <select
                value={form.fieldKey}
                onChange={e => handleFieldSelectChange(e.target.value, false)}
                required
                className="w-full px-3 py-2.5 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 font-medium text-slate-700 bg-white shadow-xs"
              >
                <option value="" disabled>Select a data path...</option>
                {allFieldGroups.map(group => (
                  <optgroup key={group.name} label={`📁 ${group.name}`}>
                    {group.fields.map(f => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                Column Header (Title in Excel)
              </label>
              <input 
                type="text" 
                placeholder="e.g. Cap Color, Chin Strap, Size..." 
                value={form.headerLabel} 
                onChange={e => setForm({ ...form, headerLabel: e.target.value })} 
                required 
                className="w-full px-3 py-2.5 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 font-bold text-slate-700 bg-white shadow-xs" 
              />
            </div>

            <div className="md:col-span-2 pt-2 flex justify-end">
              <button 
                type="submit" 
                disabled={saving}
                className="bg-[#1e3a8a] text-white text-xs font-bold px-6 py-2.5 rounded shadow-sm hover:bg-blue-800 transition-colors flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                ADD COLUMN TO TEMPLATE
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded overflow-hidden shadow-sm">
        <div className="flex bg-[#fafafa] border-b border-slate-200 p-3 items-center">
          <div className="w-10"></div>
          <div className="w-1/3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Excel Header Title</div>
          <div className="flex-1 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Mapped Data Field (Category & Field)</div>
          <div className="w-20 text-center text-[11px] font-bold text-slate-500 uppercase tracking-widest">Actions</div>
        </div>
        
        <ul className="divide-y divide-slate-100">
          {columns.map((col, idx) => (
            <li 
              key={col.id} 
              className={cn(
                "flex items-center p-3 transition-colors bg-white hover:bg-slate-50",
                draggedItem === idx && "opacity-50 bg-blue-50"
              )}
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
            >
              <div className="w-10 flex justify-center cursor-move text-slate-300 hover:text-slate-500 shrink-0" title="Drag to reorder">
                <GripVertical className="w-5 h-5" />
              </div>
              <div className="w-1/3 pr-4">
                <input
                  type="text"
                  value={col.headerLabel}
                  onChange={(e) => updateColumnLocally(idx, 'headerLabel', e.target.value)}
                  className="w-full bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:ring-0 px-0 py-1 text-sm font-bold text-slate-800 outline-none transition-colors"
                />
              </div>
              <div className="flex-1 pr-4">
                <div className="w-full text-sm">
                  {getLabelForFieldKey(col.fieldKey)}
                </div>
              </div>
              <div className="w-20 flex items-center justify-center gap-1 shrink-0">
                <button 
                  onClick={() => handleOpenEdit(col)} 
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Edit Column"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => setConfirmModal({ isOpen: true, id: col.id })} 
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  title="Remove Column"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
          {columns.length === 0 && (
            <div className="p-12 text-center text-slate-500">
              <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-bold text-slate-700">No Excel columns configured.</p>
              <p className="text-xs text-slate-400 mt-1">Click "ADD COLUMN" above to build your production export template.</p>
            </div>
          )}
        </ul>
      </div>

      {/* Edit Column Modal */}
      {editModal.isOpen && editModal.column && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#fafafa]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Edit Excel Column</h3>
                  <p className="text-xs text-slate-500">Configure header title and mapped order data</p>
                </div>
              </div>
              <button 
                onClick={() => setEditModal({ isOpen: false, column: null, headerLabel: '', fieldKey: '' })}
                className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                    Data Path / Mapped Value (Categorized by Configurator Step)
                  </label>
                  <select
                    value={editModal.fieldKey}
                    onChange={e => handleFieldSelectChange(e.target.value, true)}
                    required
                    className="w-full px-3 py-2.5 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 font-medium text-slate-700 bg-white"
                  >
                    <option value="" disabled>Select a data path...</option>
                    {allFieldGroups.map(group => (
                      <optgroup key={group.name} label={`📁 ${group.name}`}>
                        {group.fields.map(f => (
                          <option key={f.value} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                    Column Header (Title in Excel)
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Size, Customer Name, Color..."
                    value={editModal.headerLabel} 
                    onChange={e => setEditModal({ ...editModal, headerLabel: e.target.value })} 
                    required 
                    className="w-full px-3 py-2.5 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 font-bold text-slate-700 bg-white" 
                  />
                </div>

                <div className="p-3 rounded bg-slate-50 border border-slate-100 flex flex-col gap-1 text-xs">
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Current Selected Field:</span>
                  <div>{getLabelForFieldKey(editModal.fieldKey)}</div>
                </div>
              </div>

              <div className="px-6 py-4 bg-[#fafafa] border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditModal({ isOpen: false, column: null, headerLabel: '', fieldKey: '' })}
                  className="px-4 py-2 rounded text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 rounded text-sm font-bold text-white bg-[#1e3a8a] hover:bg-blue-800 transition-colors flex items-center gap-2 shadow-sm"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Delete Column"
        message="Are you sure you want to remove this column from the Excel export template?"
        confirmText="Delete"
        isDestructive={true}
        onConfirm={executeDelete}
        onCancel={() => setConfirmModal({ isOpen: false, id: null })}
      />
    </div>
  );
};

export default ExcelTemplatesPage;
