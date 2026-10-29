import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Receipt,
  Printer,
  ExternalLink,
  Building2,
  HardHat,
  FileSpreadsheet,
  Compass,
  ArrowRight,
  ShieldCheck,
  Clock,
  Award,
  Users,
  Tag,
  FileCheck,
  Calculator,
  Edit3,
} from 'lucide-react';
import {
  ARCHITECTURAL_PACKAGES,
  STRUCTURAL_PACKAGES,
  BOQ_PACKAGES,
  BOQ_TIERED_PRICING,
  SITE_INSPECTION_PACKAGE,
  FLYER_VALUE_PROPOSITIONS,
  getBOQPackageFee,
  DEFAULT_COMPANY,
} from '../data/constants';
import { usePackageServices, PackageCategory } from '../services/packageServicesStorage';
import { ServicePackageEditorModal } from './ServicePackageEditorModal';
import { Invoice } from '../types';
import { UnivisionLogo } from './UnivisionLogo';
import { usePortalStorage } from '../services/portalStorage';

interface PackageEstimatorState {
  floorArea: number;
  includeArchitectural: boolean;
  archTier: 'regular' | 'premium';
  includeStructural: boolean;
  structTier: 'regular' | 'premium';
  includeBOQ: boolean;
  boqTier: 'regular' | 'premium';
  includeInspection: boolean;
}

const INITIAL_PACKAGE_ESTIMATOR: PackageEstimatorState = {
  floorArea: 250,
  includeArchitectural: true,
  archTier: 'premium',
  includeStructural: true,
  structTier: 'premium',
  includeBOQ: true,
  boqTier: 'regular',
  includeInspection: false,
};

function isPackageEstimatorState(value: unknown): value is PackageEstimatorState {
  if (typeof value !== 'object' || value === null) return false;
  const state = value as Record<string, unknown>;
  return (
    typeof state.floorArea === 'number' &&
    typeof state.includeArchitectural === 'boolean' &&
    (state.archTier === 'regular' || state.archTier === 'premium') &&
    typeof state.includeStructural === 'boolean' &&
    (state.structTier === 'regular' || state.structTier === 'premium') &&
    typeof state.includeBOQ === 'boolean' &&
    (state.boqTier === 'regular' || state.boqTier === 'premium') &&
    typeof state.includeInspection === 'boolean'
  );
}

interface PackagesPortalProps {
  isStandaloneWindow?: boolean;
  onPopoutWindow?: () => void;
  onGenerateInvoice?: (invoiceData: Partial<Invoice>) => void;
  onSwitchPortal?: (portal: 'invoices' | 'architectural' | 'structural' | 'boq' | 'packages' | 'inspection') => void;
  onPackageServicesSaved: (category: PackageCategory, regular: string[], premiumExtra: string[]) => void;
}

export function PackagesPortal({
  isStandaloneWindow = false,
  onPopoutWindow,
  onGenerateInvoice,
  onSwitchPortal,
  onPackageServicesSaved,
}: PackagesPortalProps) {
  const [estimator, setEstimator, saveStatus] = usePortalStorage(
    'univision_general_package_estimator_v1',
    INITIAL_PACKAGE_ESTIMATOR,
    isPackageEstimatorState
  );
  const {
    floorArea,
    includeArchitectural,
    archTier,
    includeStructural,
    structTier,
    includeBOQ,
    boqTier,
    includeInspection,
  } = estimator;
  const setFloorArea = (value: number) => setEstimator((prev) => ({ ...prev, floorArea: value }));
  const setIncludeArchitectural = (value: boolean) => setEstimator((prev) => ({ ...prev, includeArchitectural: value }));
  const setArchTier = (value: PackageEstimatorState['archTier']) => setEstimator((prev) => ({ ...prev, archTier: value }));
  const setIncludeStructural = (value: boolean) => setEstimator((prev) => ({ ...prev, includeStructural: value }));
  const setStructTier = (value: PackageEstimatorState['structTier']) => setEstimator((prev) => ({ ...prev, structTier: value }));
  const setIncludeBOQ = (value: boolean) => setEstimator((prev) => ({ ...prev, includeBOQ: value }));
  const setBoqTier = (value: PackageEstimatorState['boqTier']) => setEstimator((prev) => ({ ...prev, boqTier: value }));
  const setIncludeInspection = (value: boolean) => setEstimator((prev) => ({ ...prev, includeInspection: value }));
  const [notification, setNotification] = useState<string>('');
  const [servicesModalCategory, setServicesModalCategory] = useState<PackageCategory | null>(null);

  const { regularServices: archReg, premiumExtraServices: archPremExtra } = usePackageServices('architectural', 'general');
  const { regularServices: structReg, premiumExtraServices: structPremExtra } = usePackageServices('structural', 'general');
  const { regularServices: boqReg, premiumExtraServices: boqPremExtra } = usePackageServices('boq', 'general');

  // Calculations
  const archFee = includeArchitectural
    ? floorArea * ARCHITECTURAL_PACKAGES[archTier].rate
    : 0;

  const structFee = includeStructural
    ? floorArea * STRUCTURAL_PACKAGES[structTier].rate
    : 0;

  const boqFee = includeBOQ ? getBOQPackageFee(floorArea, boqTier) : 0;

  const inspectionFee = includeInspection ? SITE_INSPECTION_PACKAGE.fixedFee : 0;

  const grandBundleTotal = archFee + structFee + boqFee + inspectionFee;

  // Generate turnkey invoice
  const handleGenerateBundleInvoice = () => {
    const floors = [];
    if (includeArchitectural) {
      floors.push({
        id: `fl-bundle-arch`,
        floorName: `01 Architectural Drawing Package (${ARCHITECTURAL_PACKAGES[archTier].name})`,
        area: floorArea,
        customRate: ARCHITECTURAL_PACKAGES[archTier].rate,
      });
    }
    if (includeStructural) {
      floors.push({
        id: `fl-bundle-struct`,
        floorName: `02 Structural Drawing Package (${STRUCTURAL_PACKAGES[structTier].name})`,
        area: floorArea,
        customRate: STRUCTURAL_PACKAGES[structTier].rate,
      });
    }

    const addons = [];
    if (includeBOQ) {
      addons.push({
        id: `addon-bundle-boq`,
        name: `Bills of Quantities (BOQ) - ${boqTier.toUpperCase()} PACKAGE`,
        description: `Measured trade material takeoff & cost schedule for ${floorArea} m²`,
        amount: boqFee,
        enabled: true,
      });
    }
    if (includeInspection) {
      addons.push({
        id: `addon-bundle-inspect`,
        name: SITE_INSPECTION_PACKAGE.name,
        description: SITE_INSPECTION_PACKAGE.includes.join(' • '),
        amount: inspectionFee,
        enabled: true,
      });
    }

    const newInvoice: Partial<Invoice> = {
      invoiceNumber: `INV-PKG-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString().split('T')[0],
      project: {
        projectName: 'Univision Design & Engineering Turnkey Package',
        projectAddress: 'Plot Site, The Gambia',
        cityProvince: 'West Coast Region',
        postalCode: 'WCR',
      },
      floors,
      addons,
      packageType: archTier,
      packageRate: ARCHITECTURAL_PACKAGES[archTier].rate,
      additionalNotes: `Turnkey Package Agreement based on Official Univision Design Service Packages.\nIncludes Architectural (${archTier}), Structural (${structTier})${includeBOQ ? `, BOQ (${boqTier})` : ''}${includeInspection ? ', and Site Inspection' : ''}.`,
      currency: 'GMD',
      unit: 'm²',
    };

    if (onGenerateInvoice) {
      onGenerateInvoice(newInvoice);
      setNotification(`Created turnkey package invoice for GMD ${grandBundleTotal.toLocaleString()}!`);
      setTimeout(() => setNotification(''), 4000);
    } else {
      setNotification('Invoice Studio is unavailable. Reopen this portal from the Invoice Studio to create an invoice.');
      setTimeout(() => setNotification(''), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-slate-950 border-b border-slate-800 px-4 py-3 sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-900/60 border border-amber-500/40 rounded-lg text-amber-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base tracking-wide">
                  OFFICIAL DESIGN SERVICE PACKAGES & PRICING
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-400/30">
                  FLYER PRICING MATRIX
                </span>
                <span
                  role="status"
                  className={`text-[10px] font-semibold ${saveStatus === 'saved' ? 'text-emerald-400' : 'text-red-400'}`}
                >
                  {saveStatus === 'saved' ? 'Saved locally' : 'Save failed'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                UNIVISION DESIGN AND CONSTRUCTION LTD. • Quality Designs. Accurate Solutions. Smarter Construction.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {notification && (
              <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-md flex items-center gap-1.5 animate-pulse">
                <CheckCircle2 className="w-3.5 h-3.5" /> {notification}
              </span>
            )}

            {!isStandaloneWindow && onPopoutWindow && (
              <button
                onClick={onPopoutWindow}
                className="flex items-center gap-1.5 text-xs bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border border-amber-500/40 px-3 py-2 rounded-lg transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Pop Out ↗</span>
              </button>
            )}

            {onSwitchPortal && (
              <button
                onClick={() => onSwitchPortal('invoices')}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-2 rounded-lg transition"
              >
                Invoice Studio
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Grid reproducing the 4 columns from the flyer */}
      <main className="max-w-7xl mx-auto w-full px-4 py-6 flex-1 space-y-8">
        {/* Banner Title */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 bg-blue-900/40 border border-blue-500/30 px-3 py-1 rounded-full text-xs text-blue-300 font-bold uppercase tracking-wider mb-1">
            <UnivisionLogo emblemOnly size="sm" />
            UNIVISION DESIGN AND CONSTRUCTION LTD.
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            PROFESSIONAL DESIGN SERVICE PACKAGES
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-amber-400 tracking-wide uppercase">
            QUALITY DESIGNS. ACCURATE SOLUTIONS. SMARTER CONSTRUCTION.
          </p>
        </div>

        {/* 4 Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
          {/* COLUMN 01: ARCHITECTURAL DRAWING PACKAGE */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 flex flex-col shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-blue-400">01</span>
                <div>
                  <h3 className="font-extrabold text-white text-sm leading-tight">
                    ARCHITECTURAL
                  </h3>
                  <span className="text-xs text-slate-300 font-semibold">DRAWING PACKAGE</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setServicesModalCategory('architectural')}
                className="px-2 py-1 bg-blue-950/60 hover:bg-blue-900 border border-blue-500/40 rounded text-[10px] font-semibold text-blue-300 flex items-center gap-1 transition cursor-pointer"
                title="Edit Architectural Regular & Premium Deliverables"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit List</span>
              </button>
            </div>

            {/* Regular */}
            <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-700/80 mb-3">
              <div className="flex justify-between items-baseline">
                <span className="text-[11px] font-bold text-amber-400 uppercase">Regular Package</span>
                <div>
                  <span className="text-xs text-slate-400 font-bold">GMD </span>
                  <span className="text-xl font-black text-white">75</span>
                  <span className="text-xs text-slate-400"> /m²</span>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-slate-300 space-y-1">
                <div className="flex items-center justify-between font-semibold text-slate-400 text-[10px] uppercase">
                  <span>Includes ({archReg.length}):</span>
                  <button
                    type="button"
                    onClick={() => setServicesModalCategory('architectural')}
                    className="text-[9px] text-blue-400 hover:underline lowercase"
                  >
                    edit
                  </button>
                </div>
                {archReg.map((f, i) => (
                  <div key={i} className="flex items-start gap-1">
                    <CheckCircle2 className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Premium */}
            <div className="bg-amber-950/40 rounded-xl p-3 border border-amber-600/40 mt-auto">
              <div className="flex justify-between items-baseline">
                <span className="text-[11px] font-bold text-amber-300 uppercase">Premium Package</span>
                <div>
                  <span className="text-xs text-slate-400 font-bold">GMD </span>
                  <span className="text-xl font-black text-amber-400">100</span>
                  <span className="text-xs text-slate-400"> /m²</span>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-slate-200 space-y-1">
                <div className="flex items-center justify-between font-semibold text-amber-400 text-[10px] uppercase">
                  <span>Everything in Regular Plus:</span>
                  <button
                    type="button"
                    onClick={() => setServicesModalCategory('architectural')}
                    className="text-[9px] text-amber-400 hover:underline lowercase"
                  >
                    edit
                  </button>
                </div>
                {archPremExtra.map((f, i) => (
                  <div key={i} className="flex items-start gap-1">
                    <CheckCircle2 className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* COLUMN 02: STRUCTURAL DRAWING PACKAGE */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 flex flex-col shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-blue-400">02</span>
                <div>
                  <h3 className="font-extrabold text-white text-sm leading-tight">
                    STRUCTURAL
                  </h3>
                  <span className="text-xs text-slate-300 font-semibold">DRAWING PACKAGE</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setServicesModalCategory('structural')}
                className="px-2 py-1 bg-blue-950/60 hover:bg-blue-900 border border-blue-500/40 rounded text-[10px] font-semibold text-blue-300 flex items-center gap-1 transition cursor-pointer"
                title="Edit Structural Regular & Premium Deliverables"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit List</span>
              </button>
            </div>

            {/* Regular */}
            <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-700/80 mb-3">
              <div className="flex justify-between items-baseline">
                <span className="text-[11px] font-bold text-blue-400 uppercase">Regular Package</span>
                <div>
                  <span className="text-xs text-slate-400 font-bold">GMD </span>
                  <span className="text-xl font-black text-white">65</span>
                  <span className="text-xs text-slate-400"> /m²</span>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-slate-300 space-y-1">
                <div className="flex items-center justify-between font-semibold text-slate-400 text-[10px] uppercase">
                  <span>Includes ({structReg.length}):</span>
                  <button
                    type="button"
                    onClick={() => setServicesModalCategory('structural')}
                    className="text-[9px] text-blue-400 hover:underline lowercase"
                  >
                    edit
                  </button>
                </div>
                {structReg.map((f, i) => (
                  <div key={i} className="flex items-start gap-1">
                    <CheckCircle2 className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Premium */}
            <div className="bg-blue-950/40 rounded-xl p-3 border border-blue-600/40 mt-auto">
              <div className="flex justify-between items-baseline">
                <span className="text-[11px] font-bold text-blue-300 uppercase">Premium Package</span>
                <div>
                  <span className="text-xs text-slate-400 font-bold">GMD </span>
                  <span className="text-xl font-black text-blue-400">85</span>
                  <span className="text-xs text-slate-400"> /m²</span>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-slate-200 space-y-1">
                <div className="flex items-center justify-between font-semibold text-blue-300 text-[10px] uppercase">
                  <span>Everything in Regular Plus:</span>
                  <button
                    type="button"
                    onClick={() => setServicesModalCategory('structural')}
                    className="text-[9px] text-blue-400 hover:underline lowercase"
                  >
                    edit
                  </button>
                </div>
                {structPremExtra.map((f, i) => (
                  <div key={i} className="flex items-start gap-1">
                    <CheckCircle2 className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* COLUMN 03: BILLS OF QUANTITIES (BOQ) */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 flex flex-col shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
                <div>
                  <h3 className="font-extrabold text-white text-sm leading-tight">
                    BILLS OF QUANTITIES
                  </h3>
                  <span className="text-xs text-emerald-400 font-semibold">(BOQ)</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setServicesModalCategory('boq')}
                className="px-2 py-1 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 rounded text-[10px] font-semibold text-emerald-300 flex items-center gap-1 transition cursor-pointer"
                title="Edit Regular & Premium BOQ Services List"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit List</span>
              </button>
            </div>

            {/* Regular Tiers & Services */}
            <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-700/80 mb-3">
              <div className="flex justify-between items-baseline mb-1.5">
                <span className="text-[11px] font-bold text-emerald-400 uppercase">
                  Regular Package
                </span>
                <span className="text-[10px] text-slate-400 font-semibold bg-slate-800 px-1.5 py-0.5 rounded">
                  Standard BOQ
                </span>
              </div>
              <div className="space-y-1.5 text-[11px] mb-3">
                <div className="flex justify-between bg-slate-800/60 p-1.5 rounded">
                  <span className="text-slate-300">100 Sq.m - 500 Sq.m</span>
                  <span className="font-bold text-white">GMD 18,000</span>
                </div>
                <div className="flex justify-between bg-slate-800/60 p-1.5 rounded">
                  <span className="text-slate-300">500 Sq.m - 1,000 Sq.m</span>
                  <span className="font-bold text-white">GMD 20,000</span>
                </div>
                <div className="flex justify-between bg-slate-800/60 p-1.5 rounded">
                  <span className="text-slate-300">1,000 Sq.m plus</span>
                  <span className="font-bold text-white">GMD 25,000</span>
                </div>
              </div>

              {/* Services Listed Under Regular */}
              <div className="text-[11px] text-slate-300 space-y-1 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between font-semibold text-slate-400 text-[10px] uppercase">
                  <span>INCLUDES ({boqReg.length}):</span>
                  <button
                    type="button"
                    onClick={() => setServicesModalCategory('boq')}
                    className="text-[9px] text-emerald-400 hover:underline lowercase"
                  >
                    edit
                  </button>
                </div>
                {boqReg.map((service, i) => (
                  <div key={i} className="flex items-start gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{service}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Premium Tiers & Services */}
            <div className="bg-emerald-950/40 rounded-xl p-3 border border-emerald-600/40 mt-auto">
              <div className="flex justify-between items-baseline mb-1.5">
                <span className="text-[11px] font-bold text-emerald-300 uppercase">
                  Premium Package
                </span>
                <span className="text-[10px] text-emerald-300 font-semibold bg-emerald-900/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  Comprehensive
                </span>
              </div>
              <div className="space-y-1.5 text-[11px] mb-3">
                <div className="flex justify-between bg-emerald-900/40 p-1.5 rounded">
                  <span className="text-emerald-200">100 Sq.m - 500 Sq.m</span>
                  <span className="font-bold text-white">GMD 30,000</span>
                </div>
                <div className="flex justify-between bg-emerald-900/40 p-1.5 rounded">
                  <span className="text-emerald-200">500 Sq.m - 1,000 Sq.m</span>
                  <span className="font-bold text-white">GMD 45,000</span>
                </div>
                <div className="flex justify-between bg-emerald-900/40 p-1.5 rounded">
                  <span className="text-emerald-200">1,000 Sq.m plus</span>
                  <span className="font-bold text-white">GMD 65,000</span>
                </div>
              </div>

              {/* Services Listed Under Premium */}
              <div className="text-[11px] text-slate-200 space-y-1 pt-2 border-t border-emerald-800/60">
                <div className="flex items-center justify-between font-semibold text-emerald-300 text-[10px] uppercase">
                  <span>EVERYTHING IN REGULAR PLUS ({boqPremExtra.length}):</span>
                  <button
                    type="button"
                    onClick={() => setServicesModalCategory('boq')}
                    className="text-[9px] text-emerald-300 hover:underline lowercase"
                  >
                    edit
                  </button>
                </div>
                {boqPremExtra.map((service, i) => (
                  <div key={i} className="flex items-start gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{service}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* COLUMN 04: SITE INSPECTION & REPORTS PACKAGE */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 flex flex-col shadow-xl">
            <div className="border-b border-slate-700 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Compass className="w-6 h-6 text-amber-400" />
                <div>
                  <h3 className="font-extrabold text-white text-sm leading-tight">
                    SITE INSPECTION
                  </h3>
                  <span className="text-xs text-slate-300 font-semibold">& REPORTS PACKAGE</span>
                </div>
              </div>
            </div>

            <div className="bg-amber-950/30 rounded-xl p-4 border border-amber-600/40 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                  Fixed Fee
                </span>
                <div className="my-2">
                  <span className="text-xs text-slate-300 font-bold">GMD </span>
                  <span className="text-3xl font-black text-amber-400">3,500</span>
                </div>

                <div className="mt-4 text-xs text-slate-200 space-y-2">
                  <div className="font-semibold text-amber-300 text-[11px] uppercase">
                    Includes:
                  </div>
                  {SITE_INSPECTION_PACKAGE.includes.map((item, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-amber-800/60 text-[11px] text-amber-200/80">
                On-site engineering inspection, physical assessment report, sketch plans & expert consultation.
              </div>
            </div>
          </div>
        </div>

        {/* INTERACTIVE TURNKEY PACKAGE BUNDLE CALCULATOR */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Calculator className="w-5 h-5 text-amber-400" />
                Turnkey Bundle & One-Click Invoice Builder
              </h2>
              <p className="text-xs text-slate-400">
                Mix and match any design package from the flyer to generate a unified client invoice instantly
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs text-slate-300 font-medium">Floor Area:</label>
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1">
                <input
                  type="number"
                  min="50"
                  max="5000"
                  value={floorArea}
                  onChange={(e) => setFloorArea(Number(e.target.value) || 0)}
                  className="w-20 bg-transparent text-sm font-bold text-amber-400 focus:outline-none text-right"
                />
                <span className="text-xs text-slate-400 font-semibold">m²</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Arch */}
            <div className={`p-3 rounded-xl border transition ${includeArchitectural ? 'bg-slate-900 border-blue-500' : 'bg-slate-900/40 border-slate-800 opacity-60'}`}>
              <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-white mb-2">
                <input
                  type="checkbox"
                  checked={includeArchitectural}
                  onChange={(e) => setIncludeArchitectural(e.target.checked)}
                  className="rounded text-blue-600 w-4 h-4"
                />
                01 Architectural Package
              </label>
              {includeArchitectural && (
                <div className="space-y-2 text-xs">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setArchTier('regular')}
                      className={`flex-1 py-1 px-2 rounded text-[11px] font-semibold ${archTier === 'regular' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'}`}
                    >
                      Reg 75/m²
                    </button>
                    <button
                      onClick={() => setArchTier('premium')}
                      className={`flex-1 py-1 px-2 rounded text-[11px] font-semibold ${archTier === 'premium' ? 'bg-amber-600 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'}`}
                    >
                      Prem 100/m²
                    </button>
                  </div>
                  <div className="text-right text-xs font-bold text-blue-400">
                    GMD {archFee.toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            {/* Struct */}
            <div className={`p-3 rounded-xl border transition ${includeStructural ? 'bg-slate-900 border-blue-500' : 'bg-slate-900/40 border-slate-800 opacity-60'}`}>
              <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-white mb-2">
                <input
                  type="checkbox"
                  checked={includeStructural}
                  onChange={(e) => setIncludeStructural(e.target.checked)}
                  className="rounded text-blue-600 w-4 h-4"
                />
                02 Structural Package
              </label>
              {includeStructural && (
                <div className="space-y-2 text-xs">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setStructTier('regular')}
                      className={`flex-1 py-1 px-2 rounded text-[11px] font-semibold ${structTier === 'regular' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'}`}
                    >
                      Reg 65/m²
                    </button>
                    <button
                      onClick={() => setStructTier('premium')}
                      className={`flex-1 py-1 px-2 rounded text-[11px] font-semibold ${structTier === 'premium' ? 'bg-blue-500 text-white font-bold' : 'bg-slate-800 text-slate-300'}`}
                    >
                      Prem 85/m²
                    </button>
                  </div>
                  <div className="text-right text-xs font-bold text-blue-400">
                    GMD {structFee.toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            {/* BOQ */}
            <div className={`p-3 rounded-xl border transition ${includeBOQ ? 'bg-slate-900 border-emerald-500' : 'bg-slate-900/40 border-slate-800 opacity-60'}`}>
              <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-white mb-2">
                <input
                  type="checkbox"
                  checked={includeBOQ}
                  onChange={(e) => setIncludeBOQ(e.target.checked)}
                  className="rounded text-emerald-600 w-4 h-4"
                />
                Bills of Quantities (BOQ)
              </label>
              {includeBOQ && (
                <div className="space-y-2 text-xs">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setBoqTier('regular')}
                      className={`flex-1 py-1 px-2 rounded text-[11px] font-semibold ${boqTier === 'regular' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'}`}
                    >
                      Regular Tier
                    </button>
                    <button
                      onClick={() => setBoqTier('premium')}
                      className={`flex-1 py-1 px-2 rounded text-[11px] font-semibold ${boqTier === 'premium' ? 'bg-emerald-500 text-white font-bold' : 'bg-slate-800 text-slate-300'}`}
                    >
                      Premium Tier
                    </button>
                  </div>
                  <div className="text-right text-xs font-bold text-emerald-400">
                    GMD {boqFee.toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            {/* Site Inspection */}
            <div className={`p-3 rounded-xl border transition ${includeInspection ? 'bg-slate-900 border-amber-500' : 'bg-slate-900/40 border-slate-800 opacity-60'}`}>
              <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-white mb-2">
                <input
                  type="checkbox"
                  checked={includeInspection}
                  onChange={(e) => setIncludeInspection(e.target.checked)}
                  className="rounded text-amber-600 w-4 h-4"
                />
                Site Inspection & Reports
              </label>
              {includeInspection && (
                <div className="space-y-2 text-xs">
                  <span className="text-[11px] text-slate-400 block">Fixed Consultation & Sketch Fee</span>
                  <div className="text-right text-xs font-bold text-amber-400">
                    GMD {inspectionFee.toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bundle Total & Action */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-xl p-4">
            <div>
              <span className="text-xs text-slate-400 block font-medium">Combined Package Total for {floorArea} m²:</span>
              <div className="text-2xl font-black text-amber-400">
                GMD {grandBundleTotal.toLocaleString()}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerateBundleInvoice}
                className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-black px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 transition shadow-lg hover:shadow-amber-500/20"
              >
                <Receipt className="w-4 h-4" />
                <span>⚡ Generate Combined Turnkey Invoice</span>
              </button>
            </div>
          </div>
        </div>

        {/* WHY CHOOSE UNIVISION (From Flyer) */}
        <div className="border-t border-slate-800 pt-6">
          <h3 className="text-center font-bold text-white text-sm uppercase tracking-wider mb-4">
            WHY CHOOSE UNIVISION DESIGN AND CONSTRUCTION LTD?
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
            {FLYER_VALUE_PROPOSITIONS.map((val, idx) => (
              <div key={idx} className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3">
                <div className="text-xs font-bold text-amber-400 mb-1">{val.title}</div>
                <div className="text-[10px] text-slate-400 leading-tight">{val.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <ServicePackageEditorModal
        isOpen={servicesModalCategory !== null}
        onClose={() => setServicesModalCategory(null)}
        initialCategory={servicesModalCategory || 'architectural'}
        storageScope="general"
        onSaved={onPackageServicesSaved}
      />
    </div>
  );
}
