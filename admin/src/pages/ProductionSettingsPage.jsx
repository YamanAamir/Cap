import React, { useState, useEffect } from 'react';
import { Settings2, Plus, Trash2, Save, Loader2, AlertCircle } from 'lucide-react';
import { getSettings, updateSetting } from '../services/admin.service';
import { toast } from 'react-hot-toast';
import ConfirmModal from '../components/common/ConfirmModal';

const DEFAULT_TERMS = [
  // Categories
  { id: 'cat1', danish: 'TILBEHØR', english: 'Accessories', visible: true },
  { id: 'cat2', danish: 'FOER', english: 'Lining', visible: true },
  { id: 'cat3', danish: 'BRODERI', english: 'Embroidery', visible: true },
  { id: 'cat4', danish: 'KOKARDE', english: 'Cockade', visible: true },
  { id: 'cat5', danish: 'PULL', english: 'Cap Body', visible: true },
  { id: 'cat6', danish: 'SKYGGE', english: 'Visor', visible: true },
  { id: 'cat7', danish: 'REMMER', english: 'Straps', visible: true },
  
  // Standard Keys
  { id: 'k1', danish: 'Silkepude', english: 'Silk Cushion', visible: true },
  { id: 'k2', danish: 'Huekuglepen', english: 'Cap Pen', visible: false },
  { id: 'k3', danish: 'Handsker', english: 'Gloves', visible: false },
  { id: 'k4', danish: 'Luksus champagneglas', english: 'Champagne Glass', visible: false },
  { id: 'k5', danish: 'Hueæske', english: 'Cap Box', visible: true },
  { id: 'k6', danish: 'Premium æske', english: 'Premium Box', visible: true },
  { id: 'k7', danish: 'Ekstra korkarde', english: 'Extra Cockade', visible: false },
  { id: 'k8', danish: 'Store kuglepen', english: 'Large Pen', visible: false },
  { id: 'k9', danish: 'Smart Tag', english: 'Smart Tag', visible: false },
  { id: 'k10', danish: 'Lyskugle', english: 'Light Ball', visible: false },
  { id: 'k11', danish: 'Fløjte', english: 'Whistle', visible: false },
  { id: 'k12', danish: 'Trompet', english: 'Trumpet', visible: false },
  { id: 'k13', danish: 'Bucketpins', english: 'Bucket Pins', visible: false },
  { id: 'k14', danish: 'Indvendigt foer billede', english: 'Lining Image', visible: true },
  { id: 'k15', danish: 'Indgraveringstekst', english: 'Engraving Text', visible: true },
  { id: 'k16', danish: 'Skrifttype', english: 'Font', visible: true },
  { id: 'k17', danish: 'Trådfarve', english: 'Thread Color', visible: true },
  { id: 'k18', danish: 'Navn / Tekst bagpå', english: 'Name / Text on back', visible: true },
  { id: 'k19', danish: 'Korkarde', english: 'Cockade Type', visible: true },
  { id: 'k20', danish: 'Roset farve', english: 'Rosette Color', visible: true },
  { id: 'k21', danish: 'Kors farve', english: 'Cross Color', visible: true },
  { id: 'k22', danish: 'Knap', english: 'Button Type', visible: true },
  { id: 'k23', danish: 'Hagerem', english: 'Chin Strap', visible: true },

  // Standard Values
  { id: 'v1', danish: 'Ja', english: 'Yes', visible: true },
  { id: 'v2', danish: 'Nej', english: 'No', visible: true },
  { id: 'v3', danish: 'Fravalgt', english: 'Not Selected', visible: true },
  { id: 'v4', danish: 'Sort', english: 'Black', visible: true },
  { id: 'v5', danish: 'Hvid', english: 'White', visible: true },
  { id: 'v6', danish: 'Guld', english: 'Gold', visible: true },
  { id: 'v7', danish: 'Sølv', english: 'Silver', visible: true },
  { id: 'v8', danish: 'Rød', english: 'Red', visible: true },
  { id: 'v9', danish: 'Blå', english: 'Blue', visible: true },
  { id: 'v10', danish: 'Grøn', english: 'Green', visible: true },
  { id: 'v11', danish: 'Gul', english: 'Yellow', visible: true },
  { id: 'v12', danish: 'Lilla', english: 'Purple', visible: true },
  { id: 'v13', danish: 'Rosa', english: 'Pink', visible: true },
  { id: 'v14', danish: 'Mat', english: 'Matte', visible: true },
  { id: 'v15', danish: 'Ingen', english: 'None', visible: true },
  { id: 'v16', danish: 'Standard', english: 'Standard', visible: true },
  { id: 'v17', danish: 'Luksus æske', english: 'Luxury Box', visible: true },
  { id: 'v18', danish: 'Hvid læderæske', english: 'White Leather Box', visible: true },
  { id: 'v19', danish: 'Kunstlæderæske', english: 'Faux Leather Box', visible: true },
  { id: 'v20', danish: 'Sort velour', english: 'Black Velour', visible: true },
  { id: 'v21', danish: 'Grøn velour', english: 'Green Velour', visible: true },
  { id: 'v22', danish: 'Standard med guld knuder', english: 'Standard with Gold Knots', visible: true },
  { id: 'v23', danish: 'Danmark', english: 'Denmark', visible: true },
];

export default function ProductionSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [terms, setTerms] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, termId: null });
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await getSettings();
      const productionTerms = settings.find(s => s.key === 'PRODUCTION_DISPLAY_TERMS');
      
      if (productionTerms && productionTerms.value && Array.isArray(productionTerms.value)) {
        // Merge missing terms from DEFAULT_TERMS so client gets new seed data automatically
        const savedTerms = productionTerms.value;
        const missingTerms = DEFAULT_TERMS.filter(dt => !savedTerms.some(st => st.danish.toLowerCase() === dt.danish.toLowerCase()));
        
        if (missingTerms.length > 0) {
           setTerms([...savedTerms, ...missingTerms]);
        } else {
           setTerms(savedTerms);
        }
      } else {
        setTerms(DEFAULT_TERMS);
      }
    } catch (error) {
      toast.error('Failed to load settings');
      setTerms(DEFAULT_TERMS);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaveModalOpen(false);
    setSaving(true);
    try {
      await updateSetting('PRODUCTION_DISPLAY_TERMS', terms);
      toast.success('Production display settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTerm = () => {
    setTerms([...terms, { id: Date.now().toString(), danish: '', english: '', visible: true }]);
  };

  const handleRemoveTerm = (id) => {
    setDeleteModal({ isOpen: true, termId: id });
  };

  const confirmDelete = () => {
    if (deleteModal.termId) {
      setTerms(terms.filter(t => t.id !== deleteModal.termId));
    }
    setDeleteModal({ isOpen: false, termId: null });
  };

  const handleTermChange = (id, field, value) => {
    setTerms(terms.map(t => t.id === id ? { ...t, [field]: value } : t));
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
      
      <div className="animate-in fade-in duration-500 max-w-[1000px] mx-auto pb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Production Display Settings</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Configure which order properties are visible to the factory and their English translations.</p>
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

      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-sm text-slate-600">
            <p className="font-bold text-slate-700 mb-1">How this works:</p>
            <p>The Production Portal will only display the categories and properties listed here if their "Visible" switch is turned on. Any property missing from this list will be HIDDEN by default. The factory will see the "English Term" instead of the original Danish term.</p>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-[1fr_1fr_100px_40px] gap-4 px-4 py-3 bg-slate-100 rounded-t border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <div>Original Danish Term</div>
            <div>English Translation</div>
            <div className="text-center">Visible</div>
            <div></div>
          </div>
          
          <div className="divide-y divide-slate-100 border-x border-b border-slate-100 rounded-b max-h-[60vh] overflow-y-auto">
            {terms.map((term) => (
              <div key={term.id} className="grid grid-cols-[1fr_1fr_100px_40px] gap-4 px-4 py-3 items-center hover:bg-slate-50 transition-colors">
                <input
                  type="text"
                  value={term.danish}
                  onChange={(e) => handleTermChange(term.id, 'danish', e.target.value)}
                  placeholder="e.g. Silkepude"
                  className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={term.english}
                  onChange={(e) => handleTermChange(term.id, 'english', e.target.value)}
                  placeholder="e.g. Silk Cushion"
                  className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <div className="flex justify-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={term.visible}
                      onChange={(e) => handleTermChange(term.id, 'visible', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                </div>
                <button
                  onClick={() => handleRemoveTerm(term.id)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            {terms.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                <p>No terms configured. Click "Add Term" below.</p>
              </div>
            )}
          </div>
          
          <div className="mt-4">
            <button
              onClick={handleAddTerm}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-[#1e3a8a] bg-blue-50 hover:bg-blue-100 rounded transition-colors border border-blue-200"
            >
              <Plus className="w-4 h-4" />
              Add Term Mapping
            </button>
          </div>
        </div>
      </div>
      
      <ConfirmModal 
        isOpen={deleteModal.isOpen}
        title="Delete Term"
        message="Are you sure you want to remove this term? The factory will no longer see translations for this item."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, termId: null })}
      />
      
      <ConfirmModal 
        isOpen={isSaveModalOpen}
        title="Save Settings"
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
