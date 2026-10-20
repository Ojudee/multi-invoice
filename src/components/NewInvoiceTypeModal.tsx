import React from 'react';
import {
  X,
  Compass,
  Building2,
  FileSpreadsheet,
  HardHat,
  Sparkles,
  Layers,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

interface NewInvoiceTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateInvoice: (
    type: 'architectural' | 'structural' | 'boq' | 'inspection' | 'multi_package'
  ) => void;
}

interface StudioOption {
  type: 'architectural' | 'structural' | 'boq' | 'inspection' | 'multi_package';
  title: string;
  badge: string;
  badgeColor: string;
  icon: React.ElementType;
  iconColor: string;
  borderHover: string;
  pricingModel: string;
  rateHighlights: string;
  description: string;
  features: string[];
  prefix: string;
}

const STUDIO_OPTIONS: StudioOption[] = [
  {
    type: 'architectural',
    title: 'Architectural Package Invoice Studio',
    badge: 'AREA BASED (PER M²)',
    badgeColor: 'bg-indigo-950/80 text-indigo-300 border-indigo-700/50',
    icon: Compass,
    iconColor: 'text-indigo-400',
    borderHover: 'hover:border-indigo-500',
    pricingModel: 'Rate per m² / sq ft',
    rateHighlights: 'Regular GMD 75 / Premium GMD 100 per m²',
    description:
      'Full architectural drawings, floor plans, elevations, sections, 3D renders, and municipal council permit submission package.',
    features: [
      'Floor-by-floor schedule & area multipliers',
      'Regular (GMD 75) & Premium (GMD 100) tiers',
      'Municipal permit drawings & compliance PDF',
    ],
    prefix: 'INV-ARC-...',
  },
  {
    type: 'structural',
    title: 'Structural Engineering Invoice Studio',
    badge: 'AREA BASED (PER M²)',
    badgeColor: 'bg-blue-950/80 text-blue-300 border-blue-700/50',
    icon: Building2,
    iconColor: 'text-blue-400',
    borderHover: 'hover:border-blue-500',
    pricingModel: 'Rate per m² / sq ft',
    rateHighlights: 'Regular GMD 65 / Premium GMD 85 per m²',
    description:
      'Independent structural design, foundation details, column/beam reinforcement schedules, Bar Bending Schedule (BBS), and calculation report.',
    features: [
      'Structural element layout & engineering scope',
      'Regular (GMD 65) & Premium (GMD 85) tiers',
      'BBS schedule & calculation report deliverables',
    ],
    prefix: 'INV-STR-...',
  },
  {
    type: 'boq',
    title: 'Bills of Quantities (BOQ) Invoice Studio',
    badge: 'FIXED RANGE (NOT PER M²) • USES QTY',
    badgeColor: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/50',
    icon: FileSpreadsheet,
    iconColor: 'text-emerald-400',
    borderHover: 'hover:border-emerald-500',
    pricingModel: 'Fixed building bracket size',
    rateHighlights: '100–500m²: GMD 18k–30k | 500–1000m²: GMD 20k–45k | 1000m²+: GMD 25k–65k',
    description:
      'Cost estimation and quantity takeoff charged on fixed range tiers, NOT per m². Displays QTY instead of Area with fully overridable values & descriptions.',
    features: [
      'Fixed range pricing brackets (100–500m², 500–1000m², 1000m²+)',
      'Uses QTY instead of Area/Scope in document schedule',
      'Fully editable/overridable quantities, fees, and text descriptions',
    ],
    prefix: 'INV-BOQ-...',
  },
  {
    type: 'inspection',
    title: 'Site Inspection & Supervision Studio',
    badge: 'FIXED FEE (NOT PER M²) • USES QTY',
    badgeColor: 'bg-amber-950/80 text-amber-300 border-amber-700/50',
    icon: HardHat,
    iconColor: 'text-amber-400',
    borderHover: 'hover:border-amber-500',
    pricingModel: 'Fixed fee per session / field visit',
    rateHighlights: 'GMD 15,000 per field visit / session (Overridable)',
    description:
      'Professional on-site engineering field inspection, terrain assessment, structural audit, and official compliance certificate.',
    features: [
      'Fixed fee per visit (Default GMD 15,000 / visit or custom)',
      'Uses QTY of visits instead of Area/Scope',
      'Fully editable visit count, rates, scope text, and report notes',
    ],
    prefix: 'INV-INS-...',
  },
  {
    type: 'multi_package',
    title: 'Multi-Package Consolidated Invoice Studio',
    badge: 'CONSOLIDATED MULTI-DISCIPLINE',
    badgeColor: 'bg-purple-950/80 text-purple-300 border-purple-700/50',
    icon: Sparkles,
    iconColor: 'text-purple-400',
    borderHover: 'hover:border-purple-500',
    pricingModel: 'All packages combined with separate schedules',
    rateHighlights: 'Independent schedules & pricing for each package',
    description:
      'Comprehensive master invoice bringing all 4 disciplines together into one invoice, with independent sections and multi-package print controls.',
    features: [
      'All 4 disciplines active with separate schedules',
      'Select individual packages or combined print view',
      'Consolidated multi-discipline breakdown card',
    ],
    prefix: 'INV-PKG-...',
  },
];

export const NewInvoiceTypeModal: React.FC<NewInvoiceTypeModalProps> = ({
  isOpen,
  onClose,
  onCreateInvoice,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-[#0b2341] border-b border-blue-900/60 p-4 sm:p-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                Create New Invoice
                <span className="text-xs font-mono font-normal text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                  Select Invoice Studio
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                Choose which dedicated Invoice Studio to create for your client. Each package operates as an independent billing system with its own rate structure, deliverables, and schedule.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options Grid */}
        <div className="p-4 sm:p-6 space-y-3 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {STUDIO_OPTIONS.map((opt) => {
              const IconComp = opt.icon;
              return (
                <div
                  key={opt.type}
                  onClick={() => onCreateInvoice(opt.type)}
                  className={`group relative bg-slate-950/80 hover:bg-slate-850 border border-slate-800 ${opt.borderHover} rounded-xl p-4 sm:p-5 transition-all cursor-pointer flex flex-col justify-between hover:shadow-xl hover:scale-[1.01]`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center ${opt.iconColor} group-hover:scale-110 transition-transform`}
                        >
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                            {opt.title}
                          </h3>
                          <span className="text-[11px] font-mono text-slate-500">
                            Prefix: {opt.prefix}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${opt.badgeColor}`}
                      >
                        {opt.badge}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-amber-300/90 font-mono bg-slate-900/90 px-2.5 py-1 rounded border border-slate-800">
                      {opt.rateHighlights}
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {opt.description}
                    </p>

                    <ul className="space-y-1 pt-1 border-t border-slate-850 text-[11px] text-slate-300">
                      {opt.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-amber-400 transition-colors">
                    <span>Launch this Studio</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <span>
            💡 You can switch studios or combine multiple packages into a single invoice at any time.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
