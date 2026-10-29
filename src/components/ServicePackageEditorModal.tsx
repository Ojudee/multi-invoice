import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Save,
  Check,
  Compass,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';
import {
  PackageCategory,
  PackageStorageScope,
  usePackageServices,
  ALL_PACKAGE_DEFAULTS,
} from '../services/packageServicesStorage';

interface ServicePackageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: PackageCategory;
  storageScope: PackageStorageScope;
  onSaved?: (category: PackageCategory, regular: string[], premiumExtra: string[]) => void;
}

const CATEGORY_META: Record<
  PackageCategory,
  {
    title: string;
    code: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    borderAccent: string;
    badgeBg: string;
    badgeText: string;
    regularLabel: string;
    premiumLabel: string;
  }
> = {
  architectural: {
    title: 'Architectural Drawing Package',
    code: '01 ARCHITECTURAL',
    icon: Compass,
    accentColor: 'from-blue-600 to-indigo-600',
    borderAccent: 'border-blue-500/40',
    badgeBg: 'bg-blue-900/50',
    badgeText: 'text-blue-300',
    regularLabel: 'Regular Package (75 GMD/m²)',
    premiumLabel: 'Premium Package (100 GMD/m² - Extra Deliverables)',
  },
  structural: {
    title: 'Structural Engineering Package',
    code: '02 STRUCTURAL',
    icon: Building2,
    accentColor: 'from-blue-700 to-cyan-700',
    borderAccent: 'border-cyan-500/40',
    badgeBg: 'bg-cyan-900/50',
    badgeText: 'text-cyan-300',
    regularLabel: 'Regular Package (65 GMD/m²)',
    premiumLabel: 'Premium Package (85 GMD/m² - Extra Deliverables)',
  },
  boq: {
    title: 'Bills of Quantities (BOQ) Package',
    code: '03 BOQ',
    icon: FileSpreadsheet,
    accentColor: 'from-emerald-600 to-teal-600',
    borderAccent: 'border-emerald-500/40',
    badgeBg: 'bg-emerald-900/50',
    badgeText: 'text-emerald-300',
    regularLabel: 'Regular Package (Feasibility, Take-off, Summary, Detailed BOQ)',
    premiumLabel: 'Premium Package (Extra Breakdown, Tender, Quality Control)',
  },
};

export const ServicePackageEditorModal: React.FC<ServicePackageEditorModalProps> = ({
  isOpen,
  onClose,
  initialCategory = 'boq',
  storageScope,
  onSaved,
}) => {
  const [activeCategory, setActiveCategory] = useState<PackageCategory>(initialCategory);
  const [activeTab, setActiveTab] = useState<'regular' | 'premium'>('regular');

  // Load package services for currently active category
  const {
    regularServices,
    premiumExtraServices,
    updateAllServices,
    resetDefaults,
  } = usePackageServices(activeCategory, storageScope);

  const [localRegular, setLocalRegular] = useState<string[]>(regularServices);
  const [localPremium, setLocalPremium] = useState<string[]>(premiumExtraServices);
  const [newRegularInput, setNewRegularInput] = useState('');
  const [newPremiumInput, setNewPremiumInput] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(false);

  // Sync state whenever modal opens or category changes
  useEffect(() => {
    if (isOpen) {
      if (initialCategory) {
        setActiveCategory(initialCategory);
      }
    }
  }, [isOpen, initialCategory]);

  useEffect(() => {
    setLocalRegular(regularServices);
    setLocalPremium(premiumExtraServices);
    setSaveSuccess(false);
    setSaveError(false);
  }, [activeCategory, regularServices, premiumExtraServices]);

  if (!isOpen) return null;

  const currentMeta = CATEGORY_META[activeCategory];
  const IconComponent = currentMeta.icon;

  const handleAddRegular = () => {
    const trimmed = newRegularInput.trim();
    if (trimmed) {
      setLocalRegular([...localRegular, trimmed]);
      setNewRegularInput('');
    }
  };

  const handleAddPremium = () => {
    const trimmed = newPremiumInput.trim();
    if (trimmed) {
      setLocalPremium([...localPremium, trimmed]);
      setNewPremiumInput('');
    }
  };

  const handleEditRegular = (index: number, value: string) => {
    const next = [...localRegular];
    next[index] = value;
    setLocalRegular(next);
  };

  const handleEditPremium = (index: number, value: string) => {
    const next = [...localPremium];
    next[index] = value;
    setLocalPremium(next);
  };

  const handleDeleteRegular = (index: number) => {
    setLocalRegular(localRegular.filter((_, i) => i !== index));
  };

  const handleDeletePremium = (index: number) => {
    setLocalPremium(localPremium.filter((_, i) => i !== index));
  };

  const handleReset = () => {
    if (window.confirm(`Reset ${currentMeta.title} to official default specifications?`)) {
      const defaults = ALL_PACKAGE_DEFAULTS[activeCategory];
      if (!resetDefaults()) {
        setSaveError(true);
        setSaveSuccess(false);
        return;
      }
      setLocalRegular([...defaults.regular]);
      setLocalPremium([...defaults.premiumExtra]);
      setSaveError(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const handleSave = () => {
    const cleanedRegular = localRegular.map((s) => s.trim()).filter(Boolean);
    const cleanedPremium = localPremium.map((s) => s.trim()).filter(Boolean);
    if (!updateAllServices(cleanedRegular, cleanedPremium)) {
      setSaveError(true);
      setSaveSuccess(false);
      return;
    }
    onSaved?.(activeCategory, cleanedRegular, cleanedPremium);
    setSaveError(false);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* MODAL HEADER */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-gradient-to-br ${currentMeta.accentColor} text-white shadow-md`}>
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Customize Service Package Deliverables
                </h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${currentMeta.badgeBg} ${currentMeta.badgeText} border ${currentMeta.borderAccent}`}>
                  {currentMeta.code}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Edit and configure regular and premium deliverables across all schedules & invoices
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PACKAGE CATEGORY SELECTOR TABS */}
        <div className="px-6 pt-3 pb-2 bg-slate-900 border-b border-slate-800 flex items-center gap-2 overflow-x-auto">
          {(['architectural', 'structural', 'boq'] as PackageCategory[]).map((cat) => {
            const meta = CATEGORY_META[cat];
            const CatIcon = meta.icon;
            const isSelected = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setActiveCategory(cat);
                  setActiveTab('regular');
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-750'
                }`}
              >
                <CatIcon className="w-3.5 h-3.5" />
                <span>{meta.title.replace(' Package', '')}</span>
              </button>
            );
          })}
        </div>

        {/* REGULAR vs PREMIUM TABS */}
        <div className="px-6 py-2.5 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('regular')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'regular'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              <span>REGULAR PACKAGE ({localRegular.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('premium')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'premium'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>PREMIUM EXTRA ({localPremium.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1.5 px-2.5 py-1 rounded hover:bg-slate-800 transition cursor-pointer"
            title="Reset package to official standard items"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset to Standard Defaults</span>
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'regular' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{currentMeta.regularLabel}</span>
                <span className="text-[11px] text-blue-400 font-mono">
                  {localRegular.length} services included
                </span>
              </div>

              {/* Service list items */}
              <div className="space-y-2">
                {localRegular.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-slate-950/60 border border-slate-800 rounded-lg p-2 focus-within:border-blue-500 transition"
                  >
                    <span className="text-xs font-mono text-slate-500 w-6 text-center select-none">
                      {idx + 1}.
                    </span>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleEditRegular(idx, e.target.value)}
                      placeholder="Service name..."
                      className="flex-1 bg-transparent text-xs text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteRegular(idx)}
                      className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition"
                      title="Remove service"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add new regular service */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  value={newRegularInput}
                  onChange={(e) => setNewRegularInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddRegular();
                    }
                  }}
                  placeholder="Type new regular service item and press Enter or Add..."
                  className="flex-1 bg-slate-950 border border-dashed border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddRegular}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>
          )}

          {activeTab === 'premium' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-amber-300/80">
                <span>{currentMeta.premiumLabel}</span>
                <span className="text-[11px] text-amber-400 font-mono">
                  {localPremium.length} additional services
                </span>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[11px] text-amber-200">
                <strong>Premium Tier Note:</strong> The Premium Package automatically includes all{' '}
                <strong>{localRegular.length} Regular Services</strong> plus the additional high-tier
                services listed below.
              </div>

              {/* Premium extra list items */}
              <div className="space-y-2">
                {localPremium.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-slate-950/60 border border-slate-800 rounded-lg p-2 focus-within:border-amber-500 transition"
                  >
                    <span className="text-xs font-mono text-amber-500 w-6 text-center select-none">
                      +{idx + 1}.
                    </span>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleEditPremium(idx, e.target.value)}
                      placeholder="Premium deliverable name..."
                      className="flex-1 bg-transparent text-xs text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeletePremium(idx)}
                      className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition"
                      title="Remove deliverable"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add new premium service */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  value={newPremiumInput}
                  onChange={(e) => setNewPremiumInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPremium();
                    }
                  }}
                  placeholder="Type new premium deliverable and press Enter or Add..."
                  className="flex-1 bg-slate-950 border border-dashed border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={handleAddPremium}
                  className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {saveError ? (
              <span role="alert" className="text-red-400 font-semibold">
                Unable to save changes. Browser storage may be full or unavailable.
              </span>
            ) : saveSuccess ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Changes saved and applied!
              </span>
            ) : (
              <span>Modifications immediately sync across schedules, print sheets, and invoices.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-md hover:shadow-lg transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" /> Save & Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Backward-compatible alias
export const BOQServicesEditorModal = ServicePackageEditorModal;
