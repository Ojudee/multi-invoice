import React, { useState, useEffect } from 'react';
import {
  Building2,
  HardHat,
  FileSpreadsheet,
  Calculator,
  Plus,
  Trash2,
  Download,
  Printer,
  ExternalLink,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
  Layers,
  FileCheck,
  ShieldAlert,
  ArrowRight,
  Maximize2,
  Sparkles,
  HelpCircle,
  Copy,
  Edit3,
} from 'lucide-react';
import {
  StructuralProject,
  StructuralMember,
  BarBendingItem,
  BuildingTypology,
  DesignCodeStandard,
  FoundationType,
  ConcreteGrade,
  SteelGrade,
} from '../types/structural';
import { Invoice } from '../types';
import { INITIAL_STRUCTURAL_PROJECT, REBAR_UNIT_WEIGHTS } from '../data/structuralPresets';
import { STRUCTURAL_PACKAGES, DEFAULT_COMPANY } from '../data/constants';
import { calculateStructuralProject } from '../utils/structuralCalculations';
import { UnivisionLogo } from './UnivisionLogo';
import { usePackageServices } from '../services/packageServicesStorage';
import { ServicePackageEditorModal } from './ServicePackageEditorModal';
import { printInvoiceElement } from '../utils/printHelper';
import { DepartmentOfficialsCard } from './DepartmentOfficialsCard';

interface StructuralEngineeringPortalProps {
  isStandaloneWindow?: boolean;
  onPopoutWindow?: () => void;
  onGenerateInvoice?: (invoiceData: Partial<Invoice>) => void;
  onSwitchPortal?: (portal: 'invoices' | 'architectural' | 'structural' | 'boq' | 'packages' | 'inspection') => void;
}

export function StructuralEngineeringPortal({
  isStandaloneWindow = false,
  onPopoutWindow,
  onGenerateInvoice,
  onSwitchPortal,
}: StructuralEngineeringPortalProps) {
  // Load or init structural project
  const [project, setProject] = useState<StructuralProject>(() => {
    try {
      const saved = localStorage.getItem('univision_active_structural_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.clientName !== 'Alhaji Musa Ceesay') {
          return parsed;
        }
      }
    } catch {}
    return INITIAL_STRUCTURAL_PROJECT;
  });

  const [packageTier, setPackageTier] = useState<'regular' | 'premium'>('premium');
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'bbs' | 'parameters' | 'sheet'>('overview');
  const [notification, setNotification] = useState<string>('');
  const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);

  const { regularServices, premiumExtraServices, premiumAllServices } = usePackageServices('structural');

  // Auto-sync rate if tied to package
  useEffect(() => {
    if (project.pricingModel === 'rate_per_sqm') {
      const targetRate = STRUCTURAL_PACKAGES[packageTier].rate;
      if (project.ratePerSqm !== targetRate) {
        setProject((prev) => ({ ...prev, ratePerSqm: targetRate }));
      }
    }
  }, [packageTier]);

  // Persist project
  useEffect(() => {
    try {
      localStorage.setItem('univision_active_structural_v1', JSON.stringify(project));
      // Dispatch cross-window storage event
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.warn('Storage sync issue', e);
    }
  }, [project]);

  const calculations = calculateStructuralProject(project);

  const handleUpdate = <K extends keyof StructuralProject>(key: K, value: StructuralProject[K]) => {
    setProject((prev) => ({
      ...prev,
      [key]: value,
      updatedAt: new Date().toISOString(),
    }));
  };

  // Bar bending schedule helpers
  const handleAddBbsItem = () => {
    const newItem: BarBendingItem = {
      id: `bbs-${Date.now()}`,
      barMark: `Y${project.bbsItems.length + 1}`,
      member: 'Beams / Columns',
      diameterMm: 16,
      numberOfMembers: 4,
      barsPerMember: 4,
      cutLengthM: 3.8,
      totalLengthM: 60.8,
      unitWeightKgM: REBAR_UNIT_WEIGHTS[16],
      totalWeightKg: Math.round(60.8 * REBAR_UNIT_WEIGHTS[16]),
      shapeCode: 'Shape 00 (Straight)',
    };
    setProject((prev) => ({
      ...prev,
      bbsItems: [...prev.bbsItems, newItem],
    }));
  };

  const handleUpdateBbsItem = (id: string, updates: Partial<BarBendingItem>) => {
    setProject((prev) => ({
      ...prev,
      bbsItems: prev.bbsItems.map((item) => {
        if (item.id !== id) return item;
        const merged = { ...item, ...updates };
        const totalBars = (Number(merged.numberOfMembers) || 1) * (Number(merged.barsPerMember) || 1);
        merged.totalLengthM = Number((totalBars * (Number(merged.cutLengthM) || 0)).toFixed(2));
        merged.unitWeightKgM = REBAR_UNIT_WEIGHTS[merged.diameterMm] || 1.578;
        merged.totalWeightKg = Number((merged.totalLengthM * merged.unitWeightKgM).toFixed(1));
        return merged;
      }),
    }));
  };

  const handleDeleteBbsItem = (id: string) => {
    setProject((prev) => ({
      ...prev,
      bbsItems: prev.bbsItems.filter((i) => i.id !== id),
    }));
  };

  // Structural member helpers
  const handleAddMember = () => {
    const newMem: StructuralMember = {
      id: `mem-${Date.now()}`,
      memberType: 'Column',
      mark: `C${project.members.length + 1}`,
      description: 'Reinforced Concrete Column',
      dimensions: '230 x 230 mm',
      mainBars: '4Y16 High Yield',
      linksOrShear: 'Y8 @ 150mm c/c Stirrups',
      concreteGrade: project.concreteGrade,
      quantity: 8,
    };
    setProject((prev) => ({
      ...prev,
      members: [...prev.members, newMem],
    }));
  };

  const handleUpdateMember = (id: string, updates: Partial<StructuralMember>) => {
    setProject((prev) => ({
      ...prev,
      members: prev.members.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    }));
  };

  const handleDeleteMember = (id: string) => {
    setProject((prev) => ({
      ...prev,
      members: prev.members.filter((m) => m.id !== id),
    }));
  };

  // Create an invoice from this structural project
  const handleGenerateInvoiceFromStructural = () => {
    const pkg = STRUCTURAL_PACKAGES[packageTier];
    const totalArea = Number(project.totalFloorArea) || 200;
    const rate = pkg.rate; // 65 or 85

    const newInvoiceData: Partial<Invoice> = {
      invoiceNumber: `INV-STR-${project.projectNumber.replace(/[^0-9]/g, '') || '2026'}`,
      date: new Date().toISOString().split('T')[0],
      client: {
        name: project.clientName,
        phone: project.clientPhone,
        email: project.clientEmail,
        address: `${project.siteLocation}, ${project.cityRegion}`,
      },
      project: {
        projectName: project.title,
        projectAddress: project.siteLocation,
        cityProvince: project.cityRegion,
        postalCode: 'WCR, Gambia',
      },
      floors: [
        {
          id: `fl-str-${Date.now()}`,
          floorName: `Structural Design: ${project.title} (${packageTier === 'premium' ? 'Premium Package' : 'Regular Package'})`,
          area: totalArea,
          customRate: rate,
        },
      ],
      packageType: packageTier === 'premium' ? 'premium' : 'regular',
      packageRate: rate,
      currency: 'GMD',
      unit: 'm²',
      packagesConfig: {
        architectural: { enabled: false, tier: 'regular', rate: 75 },
        structural: {
          enabled: true,
          tier: packageTier === 'premium' ? 'premium' : 'regular',
          rate,
          area: totalArea,
          deliverables: packageTier === 'premium' ? premiumAllServices : regularServices,
        },
        boq: { enabled: false, tier: 'regular', fee: 18000 },
        inspection: { enabled: false, fee: 3500 },
      },
    };

    if (onGenerateInvoice) {
      onGenerateInvoice(newInvoiceData);
      setNotification(`Created Structural Invoice (${pkg.name} @ GMD ${rate}/m²)!`);
      setTimeout(() => setNotification(''), 4000);
    } else {
      // Put in localStorage for cross-window uptake
      try {
        localStorage.setItem('univision_pending_invoice_sync', JSON.stringify(newInvoiceData));
        window.dispatchEvent(new Event('storage'));
        setNotification('Invoice synced! Switch to Invoice Studio to view.');
        setTimeout(() => setNotification(''), 4000);
      } catch {}
    }
  };

  const handlePrint = () => {
    if (activeTab !== 'sheet') {
      setActiveTab('sheet');
      setTimeout(() => {
        printInvoiceElement('structural-engineering-printable-sheet', 'Univision Structural Engineering Package');
      }, 150);
      return;
    }
    printInvoiceElement('structural-engineering-printable-sheet', 'Univision Structural Engineering Package');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Banner / Window Controls */}
      <header className="bg-slate-950 border-b border-slate-800 px-4 py-3 sticky top-0 z-40 shadow-lg print:hidden">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-900/60 border border-blue-500/40 rounded-lg text-blue-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base tracking-wide">
                  STRUCTURAL ENGINEERING PORTAL
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-400/30">
                  PACKAGE 02
                </span>
              </div>
              <p className="text-xs text-slate-400">
                UNIVISION DESIGN & CONSTRUCTION LTD • Foundation, RC Frames, Slabs, BBS & Calculations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {notification && (
              <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-md flex items-center gap-1.5 animate-pulse">
                <CheckCircle2 className="w-3.5 h-3.5" /> {notification}
              </span>
            )}

            {/* Package Badge / Quick Selector */}
            <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700">
              <button
                onClick={() => setPackageTier('regular')}
                className={`text-xs px-2.5 py-1.5 rounded-md font-semibold transition ${
                  packageTier === 'regular'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Regular (GMD 65/m²)
              </button>
              <button
                onClick={() => setPackageTier('premium')}
                className={`text-xs px-2.5 py-1.5 rounded-md font-semibold transition ${
                  packageTier === 'premium'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Premium (GMD 85/m²)
              </button>
            </div>

            {/* One-Click Invoice Sync */}
            <button
              onClick={handleGenerateInvoiceFromStructural}
              className="flex items-center gap-1.5 text-xs bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold px-3 py-2 rounded-lg transition shadow-md hover:shadow-amber-500/20 cursor-pointer"
              title="Generate ready-to-bill invoice from this structural engineering project"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>⚡ Generate Invoice</span>
            </button>

            {/* Print Engineering Sheet */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-lg transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Document</span>
            </button>

            {/* Pop out to separate OS browser window */}
            {!isStandaloneWindow && onPopoutWindow && (
              <button
                onClick={onPopoutWindow}
                className="flex items-center gap-1.5 text-xs bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/40 px-3 py-2 rounded-lg transition"
                title="Open this portal in a completely separate window"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Pop Out ↗</span>
              </button>
            )}

            {/* Return to invoicing studio if in in-app tab */}
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

        {/* Navigation Tabs (NO 'schedule' OR 'windows' ON TABS) */}
        <div className="max-w-7xl mx-auto mt-3 flex items-center gap-1 border-t border-slate-800/80 pt-2 overflow-x-auto">
          {[
            { id: 'overview', label: '1. Package Tiers & Deliverables', icon: Info },
            { id: 'members', label: '2. Structural Member Register', icon: Layers },
            { id: 'bbs', label: '3. Bar Bending Reinforcement (BBS)', icon: Calculator },
            { id: 'parameters', label: '4. Design Codes & Loading', icon: HardHat },
            { id: 'sheet', label: '5. Official Printable Document', icon: FileSpreadsheet },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full px-4 py-6 flex-1">
        {/* TAB 1: OVERVIEW & STRUCTURAL PACKAGE SELECTION */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Structural Package Comparison Card */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    02 STRUCTURAL DRAWING PACKAGE DELIVERABLES
                  </h2>
                  <p className="text-xs text-slate-300">
                    Univision Design and Construction Ltd • Configurable service packages & fee estimator
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsServicesModalOpen(true)}
                    className="px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/50 text-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    title="Customize included regular and premium services"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Customize Services List</span>
                  </button>
                  <div className="text-right pl-3 border-l border-slate-700">
                    <span className="text-xs text-slate-400">Total Structural Floor Area:</span>
                    <div className="text-xl font-black text-amber-400">{project.totalFloorArea} m²</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Regular Package */}
                <div
                  onClick={() => setPackageTier('regular')}
                  className={`cursor-pointer rounded-xl p-4 border transition ${
                    packageTier === 'regular'
                      ? 'bg-blue-950/70 border-blue-500 ring-2 ring-blue-500/30'
                      : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs uppercase tracking-wider font-bold text-blue-400">
                        Tier 01
                      </span>
                      <h3 className="text-base font-bold text-white">REGULAR PACKAGE</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-blue-400">GMD 65</span>
                      <span className="text-xs text-slate-400"> / m²</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 mt-2 mb-3">
                    {STRUCTURAL_PACKAGES.regular.description}
                  </p>
                  <div className="bg-slate-900/80 rounded-lg p-3 space-y-1.5 text-xs text-slate-200">
                    <div className="flex items-center justify-between text-slate-300 mb-1">
                      <span className="font-semibold">Includes ({regularServices.length}):</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsServicesModalOpen(true);
                        }}
                        className="text-[11px] text-blue-400 hover:text-blue-300 underline flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" /> Edit List
                      </button>
                    </div>
                    {regularServices.map((f, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-700 flex justify-between items-center text-xs">
                    <span className="text-slate-400">Calculated Fee for {project.totalFloorArea} m²:</span>
                    <span className="font-bold text-white">
                      GMD {(project.totalFloorArea * 65).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Premium Package */}
                <div
                  onClick={() => setPackageTier('premium')}
                  className={`cursor-pointer rounded-xl p-4 border transition ${
                    packageTier === 'premium'
                      ? 'bg-emerald-950/70 border-emerald-500 ring-2 ring-emerald-500/30'
                      : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs uppercase tracking-wider font-bold text-emerald-400 flex items-center gap-1">
                        ★ Recommended • Tier 02
                      </span>
                      <h3 className="text-base font-bold text-white">PREMIUM PACKAGE</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-emerald-400">GMD 85</span>
                      <span className="text-xs text-slate-400"> / m²</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 mt-2 mb-3">
                    {STRUCTURAL_PACKAGES.premium.description}
                  </p>
                  <div className="bg-slate-900/80 rounded-lg p-3 space-y-1.5 text-xs text-slate-200">
                    <div className="flex items-center justify-between text-emerald-300 mb-1">
                      <span className="font-semibold">All Regular Plus ({premiumExtraServices.length} extras):</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsServicesModalOpen(true);
                        }}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 underline flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" /> Edit List
                      </button>
                    </div>
                    {premiumExtraServices.map((f, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-emerald-100 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-700 flex justify-between items-center text-xs">
                    <span className="text-slate-400">Calculated Fee for {project.totalFloorArea} m²:</span>
                    <span className="font-bold text-emerald-300 text-sm">
                      GMD {(project.totalFloorArea * 85).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Information Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  Project & Client Information
                </h3>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Project Title / Description
                  </label>
                  <input
                    type="text"
                    value={project.title}
                    onChange={(e) => handleUpdate('title', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Project Number
                    </label>
                    <input
                      type="text"
                      value={project.projectNumber}
                      onChange={(e) => handleUpdate('projectNumber', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Building Typology
                    </label>
                    <select
                      value={project.typology}
                      onChange={(e) => handleUpdate('typology', e.target.value as BuildingTypology)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="bungalow">Bungalow (Ground Floor Only)</option>
                      <option value="two_storey">Two-Storey Villa (G+1)</option>
                      <option value="multi_storey">Multi-Storey Commercial (G+2+)</option>
                      <option value="commercial">Commercial Plaza / Retail</option>
                      <option value="industrial">Warehouse / Industrial</option>
                      <option value="boundary_wall">Boundary Wall & Gatehouse</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Client Full Name
                    </label>
                    <input
                      type="text"
                      value={project.clientName}
                      onChange={(e) => handleUpdate('clientName', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Client Phone Number
                    </label>
                    <input
                      type="text"
                      value={project.clientPhone}
                      onChange={(e) => handleUpdate('clientPhone', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Site Plot / Street Address
                    </label>
                    <input
                      type="text"
                      value={project.siteLocation}
                      onChange={(e) => handleUpdate('siteLocation', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Region / Municipality
                    </label>
                    <input
                      type="text"
                      value={project.cityRegion}
                      onChange={(e) => handleUpdate('cityRegion', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Total Floor Area (m²)
                  </label>
                  <input
                    type="number"
                    min="10"
                    value={project.totalFloorArea}
                    onChange={(e) => handleUpdate('totalFloorArea', Number(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-bold"
                  />
                </div>
              </div>

              {/* Engineer Credentials & Billing Summary */}
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <HardHat className="w-4 h-4 text-emerald-400" />
                  Structural Engineer & Fee Calculation
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Lead Structural Engineer
                    </label>
                    <input
                      type="text"
                      value={project.engineerName}
                      onChange={(e) => handleUpdate('engineerName', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Engineering Reg / Stamp No.
                    </label>
                    <input
                      type="text"
                      value={project.engineerRegNo}
                      onChange={(e) => handleUpdate('engineerRegNo', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Design Code Standard
                    </label>
                    <select
                      value={project.designCode}
                      onChange={(e) => handleUpdate('designCode', e.target.value as DesignCodeStandard)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="British Standard (BS 8110:1997)">British Standard (BS 8110:1997)</option>
                      <option value="Eurocode 2 (EN 1992-1-1)">Eurocode 2 (EN 1992-1-1)</option>
                      <option value="American Concrete Institute (ACI 318-19)">American Concrete Institute (ACI 318-19)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Foundation Type
                    </label>
                    <select
                      value={project.foundationType}
                      onChange={(e) => handleUpdate('foundationType', e.target.value as FoundationType)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="Isolated Pad Footings">Isolated Pad Footings</option>
                      <option value="Strip Footings & Plinth Beam">Strip Footings & Plinth Beam</option>
                      <option value="Raft / Mat Foundation">Raft / Mat Foundation</option>
                      <option value="Pile Foundations & Caps">Pile Foundations & Caps</option>
                    </select>
                  </div>
                </div>

                {/* Live Engineering Fee Breakdown */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 mt-2">
                  <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                    Calculated Structural Fee (Flyer Tier: {packageTier.toUpperCase()})
                  </div>
                  <div className="flex justify-between items-center py-1 text-sm border-b border-slate-800">
                    <span className="text-slate-300">
                      Drawing Package ({project.totalFloorArea} m² @ GMD {project.ratePerSqm}/m²):
                    </span>
                    <span className="font-semibold text-white">
                      GMD {calculations.designFeeAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 text-sm border-b border-slate-800">
                    <span className="text-slate-300">
                      Total Estimated Rebar Reinforcement:
                    </span>
                    <span className="font-semibold text-amber-400">
                      {calculations.totalSteelTonnage} Metric Tons ({calculations.totalSteelWeightKg.toLocaleString()} kg)
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 text-base font-bold">
                    <span className="text-slate-200">Total Structural Design Fee:</span>
                    <span className="text-emerald-400 text-lg">
                      GMD {calculations.totalEngineeringFee.toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleGenerateInvoiceFromStructural}
                  className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition shadow-md"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Push Structural Fee to Invoice Studio</span>
                </button>
              </div>
            </div>

            {/* STRUCTURAL DEPARTMENT OFFICIALS & WHO DID WHAT */}
            <DepartmentOfficialsCard
              department="structural"
              title="Structural Engineering Department Officials & Task Attribution (Who Did What)"
            />
          </div>
        )}

        {/* TAB 2: STRUCTURAL ELEMENTS SCHEDULE */}
        {activeTab === 'members' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-400" />
                  Reinforced Concrete Members Schedule
                </h3>
                <p className="text-xs text-slate-400">
                  Detailed specification for Footings, Columns, Beams, Slabs, and Staircases
                </p>
              </div>
              <button
                onClick={handleAddMember}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" /> Add Structural Member
              </button>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900 text-slate-300 border-b border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Mark</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3">Dimensions</th>
                      <th className="py-2.5 px-3">Main Reinforcement</th>
                      <th className="py-2.5 px-3">Shear / Links</th>
                      <th className="py-2.5 px-3">Grade</th>
                      <th className="py-2.5 px-3">Qty</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60">
                    {project.members.map((mem) => (
                      <tr key={mem.id} className="hover:bg-slate-750 transition">
                        <td className="py-2 px-3 font-bold text-blue-400">
                          <input
                            type="text"
                            value={mem.mark}
                            onChange={(e) => handleUpdateMember(mem.id, { mark: e.target.value })}
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 w-24 text-blue-300 font-bold focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <select
                            value={mem.memberType}
                            onChange={(e) => handleUpdateMember(mem.id, { memberType: e.target.value as any })}
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none"
                          >
                            <option value="Footing">Footing</option>
                            <option value="Column">Column</option>
                            <option value="Ground Beam">Ground Beam</option>
                            <option value="Suspended Beam">Suspended Beam</option>
                            <option value="Floor Slab">Floor Slab</option>
                            <option value="Staircase">Staircase</option>
                            <option value="Roof Truss">Roof Truss</option>
                          </select>
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={mem.description}
                            onChange={(e) => handleUpdateMember(mem.id, { description: e.target.value })}
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 w-44 text-slate-200 focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={mem.dimensions}
                            onChange={(e) => handleUpdateMember(mem.id, { dimensions: e.target.value })}
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 w-32 text-slate-200 focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={mem.mainBars}
                            onChange={(e) => handleUpdateMember(mem.id, { mainBars: e.target.value })}
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 w-36 text-amber-300 font-medium focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={mem.linksOrShear}
                            onChange={(e) => handleUpdateMember(mem.id, { linksOrShear: e.target.value })}
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 w-36 text-slate-300 focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-3 text-slate-400">
                          {mem.concreteGrade}
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="1"
                            value={mem.quantity}
                            onChange={(e) => handleUpdateMember(mem.id, { quantity: Number(e.target.value) || 1 })}
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 w-14 text-center text-white focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={() => handleDeleteMember(mem.id)}
                            className="text-slate-400 hover:text-red-400 p-1 transition"
                            title="Remove Member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BAR BENDING SCHEDULE (BBS) */}
        {activeTab === 'bbs' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-amber-400" />
                  Bar Bending Schedule (BBS) & Steel Takeoff
                </h3>
                <p className="text-xs text-slate-400">
                  Standard BS 4466 / BS 8666 cut-length calculation with high-yield B500B unit weights
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddBbsItem}
                  className="bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition"
                >
                  <Plus className="w-4 h-4" /> Add Bar Item
                </button>
              </div>
            </div>

            {/* Rebar Summary Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
                <span className="text-xs text-slate-400 block">Total Steel Weight</span>
                <span className="text-xl font-black text-amber-400">
                  {calculations.totalSteelWeightKg.toLocaleString()} kg
                </span>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
                <span className="text-xs text-slate-400 block">Total Tonnage</span>
                <span className="text-xl font-black text-emerald-400">
                  {calculations.totalSteelTonnage} Tons
                </span>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
                <span className="text-xs text-slate-400 block">Est. Gambia Rebar Cost</span>
                <span className="text-xl font-black text-blue-400">
                  GMD {calculations.estimatedRebarCost.toLocaleString()}
                </span>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
                <span className="text-xs text-slate-400 block">Bar Items Listed</span>
                <span className="text-xl font-black text-slate-200">
                  {project.bbsItems.length} Entries
                </span>
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900 text-slate-300 border-b border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Bar Mark</th>
                      <th className="py-2.5 px-3">Member Ref</th>
                      <th className="py-2.5 px-3">Size (mm)</th>
                      <th className="py-2.5 px-3">Members</th>
                      <th className="py-2.5 px-3">Bars/Memb</th>
                      <th className="py-2.5 px-3">Cut Len (m)</th>
                      <th className="py-2.5 px-3">Total Len (m)</th>
                      <th className="py-2.5 px-3">Unit Wt (kg/m)</th>
                      <th className="py-2.5 px-3">Total Wt (kg)</th>
                      <th className="py-2.5 px-3">Shape Code</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60">
                    {project.bbsItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-750 transition">
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={item.barMark}
                            onChange={(e) => handleUpdateBbsItem(item.id, { barMark: e.target.value })}
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 w-16 text-amber-400 font-bold focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={item.member}
                            onChange={(e) => handleUpdateBbsItem(item.id, { member: e.target.value })}
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 w-32 text-slate-200 focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <select
                            value={item.diameterMm}
                            onChange={(e) => handleUpdateBbsItem(item.id, { diameterMm: Number(e.target.value) as any })}
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-bold focus:outline-none"
                          >
                            <option value={8}>Y8 (0.395 kg/m)</option>
                            <option value={10}>Y10 (0.617 kg/m)</option>
                            <option value={12}>Y12 (0.888 kg/m)</option>
                            <option value={16}>Y16 (1.578 kg/m)</option>
                            <option value={20}>Y20 (2.466 kg/m)</option>
                            <option value={25}>Y25 (3.853 kg/m)</option>
                            <option value={32}>Y32 (6.313 kg/m)</option>
                          </select>
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="1"
                            value={item.numberOfMembers}
                            onChange={(e) => handleUpdateBbsItem(item.id, { numberOfMembers: Number(e.target.value) || 1 })}
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 w-14 text-center text-slate-200 focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="1"
                            value={item.barsPerMember}
                            onChange={(e) => handleUpdateBbsItem(item.id, { barsPerMember: Number(e.target.value) || 1 })}
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 w-14 text-center text-slate-200 focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            step="0.05"
                            value={item.cutLengthM}
                            onChange={(e) => handleUpdateBbsItem(item.id, { cutLengthM: Number(e.target.value) || 0 })}
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 w-18 text-slate-200 focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-3 text-slate-300 font-medium">
                          {item.totalLengthM} m
                        </td>
                        <td className="py-2 px-3 text-slate-400">
                          {item.unitWeightKgM}
                        </td>
                        <td className="py-2 px-3 text-amber-300 font-bold">
                          {item.totalWeightKg} kg
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={item.shapeCode}
                            onChange={(e) => handleUpdateBbsItem(item.id, { shapeCode: e.target.value })}
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 w-32 text-slate-300 focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={() => handleDeleteBbsItem(item.id)}
                            className="text-slate-400 hover:text-red-400 p-1 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CODES & LOADING DESIGN */}
        {activeTab === 'parameters' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <HardHat className="w-4 h-4 text-blue-400" />
                Material Strengths & Geotechnical Data
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Concrete Characteristic Grade
                  </label>
                  <select
                    value={project.concreteGrade}
                    onChange={(e) => handleUpdate('concreteGrade', e.target.value as ConcreteGrade)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="C20/25">C20/25 (Blinding & Mass Concrete)</option>
                    <option value="C25/30">C25/30 (Standard Frame - Recommended)</option>
                    <option value="C30/37">C30/37 (High Strength Columns/Slabs)</option>
                    <option value="C35/45">C35/45 (Heavy Commercial/Piles)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Steel Reinforcement Grade
                  </label>
                  <select
                    value={project.steelGrade}
                    onChange={(e) => handleUpdate('steelGrade', e.target.value as SteelGrade)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Grade 500 (B500B / High Yield)">Grade 500 (B500B / High Yield)</option>
                    <option value="Grade 460 (BS 4449)">Grade 460 (BS 4449)</option>
                    <option value="Mild Steel (250 N/mm²)">Mild Steel (250 N/mm²)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Soil Allowable Bearing Capacity (kN/m²)
                </label>
                <input
                  type="number"
                  value={project.soilBearingCapacity}
                  onChange={(e) => handleUpdate('soilBearingCapacity', Number(e.target.value) || 150)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Typical Gambian coastal/laterite soils: 140 - 180 kN/m²
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Foundation Cover (mm)
                  </label>
                  <input
                    type="number"
                    value={project.coverFoundationMm}
                    onChange={(e) => handleUpdate('coverFoundationMm', Number(e.target.value) || 50)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Beams & Columns Cover (mm)
                  </label>
                  <input
                    type="number"
                    value={project.coverBeamsMm}
                    onChange={(e) => handleUpdate('coverBeamsMm', Number(e.target.value) || 30)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Info className="w-4 h-4 text-emerald-400" />
                Structural Design Loading Criteria
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Floor Finishes Dead Load (kN/m²)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={project.deadLoadFinishes}
                    onChange={(e) => handleUpdate('deadLoadFinishes', Number(e.target.value) || 1.5)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Partitions Dead Load (kN/m²)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={project.deadLoadPartitions}
                    onChange={(e) => handleUpdate('deadLoadPartitions', Number(e.target.value) || 1.0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Residential/Office Live Load (kN/m²)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={project.liveLoadFloor}
                    onChange={(e) => handleUpdate('liveLoadFloor', Number(e.target.value) || 2.0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Basic Wind Velocity (m/s)
                  </label>
                  <input
                    type="number"
                    value={project.basicWindSpeed}
                    onChange={(e) => handleUpdate('basicWindSpeed', Number(e.target.value) || 28)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Engineer Structural Compliance Notes
                </label>
                <textarea
                  rows={3}
                  value={project.notes}
                  onChange={(e) => handleUpdate('notes', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: OFFICIAL PRINTABLE STRUCTURAL SHEET PREVIEW */}
        {activeTab === 'sheet' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">
                Official Univision Design & Construction Structural Engineering Calculation Sheet
              </span>
              <button
                onClick={handlePrint}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition"
              >
                <Printer className="w-4 h-4" /> Print Engineering Sheet
              </button>
            </div>

            {/* A4 White Paper Engineering Document */}
            <div
              id="structural-engineering-printable-sheet"
              className="bg-white text-slate-900 rounded-xl p-8 shadow-2xl max-w-4xl mx-auto border border-slate-300 font-sans print:p-0 print:border-none print:shadow-none"
            >
              {/* Document Header */}
              <div className="border-b-2 border-slate-900 pb-4 mb-4 flex justify-between items-start gap-4">
                <div className="flex items-start gap-3">
                  <UnivisionLogo emblemOnly size="md" />
                  <div>
                    <h1 className="text-lg md:text-xl font-black text-slate-950 tracking-tight leading-tight">
                      UNIVISION DESIGN AND CONSTRUCTION LTD.
                    </h1>
                    <p className="text-[11px] font-semibold text-slate-600 tracking-wide uppercase">
                      STRUCTURAL & CIVIL ENGINEERING CONSULTANCY DIVISION
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Sukuta-jabang Highway, Sukuta Dalaba • Tel: +220 872104724 • univision0111@gmail.com
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded">
                    STRUCTURAL ENGINEERING SCHEDULE • {packageTier.toUpperCase()}
                  </div>
                  <div className="text-sm font-black text-slate-900 mt-1 font-mono">
                    {project.projectNumber}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Date: {project.date} • {project.revision}
                  </div>
                </div>
              </div>

              {/* Title & Metadata Strip */}
              <div className="bg-slate-100 border border-slate-200 rounded p-3 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">PROJECT</span>
                  <span className="font-bold text-slate-900">{project.title}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">CLIENT</span>
                  <span className="font-bold text-slate-900">{project.clientName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">SITE LOCATION</span>
                  <span className="font-bold text-slate-900">{project.siteLocation}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">LEAD ENGINEER</span>
                  <span className="font-bold text-slate-900">{project.engineerName}</span>
                </div>
              </div>

              {/* Structural Deliverables Scope Box */}
              <div className="bg-blue-50/80 border border-blue-200 rounded p-2.5 mb-4 text-[10px]">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-blue-950 uppercase tracking-wide">
                    OFFICIAL STRUCTURAL DELIVERABLES: {packageTier.toUpperCase()} PACKAGE (GMD {project.ratePerSqm}/m² • TOTAL: GMD {calculations.totalEngineeringFee.toLocaleString()})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsServicesModalOpen(true)}
                      className="text-[9px] font-semibold text-blue-800 hover:text-blue-950 underline flex items-center gap-0.5 print:hidden"
                      title="Edit structural deliverables specification"
                    >
                      <Edit3 className="w-2.5 h-2.5" /> Edit Scope
                    </button>
                    <span className="text-[9px] font-semibold text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded border border-blue-300">
                      OFFICIAL CONTRACT SPECIFICATION
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-blue-950">
                  {(packageTier === 'premium' ? premiumAllServices : regularServices).map((svc, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <span className="text-blue-700 font-bold">✓</span>
                      <span>{svc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Engineering Scope Table */}
              <div className="mb-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5 border-b border-slate-300 pb-1">
                  1. Structural Member Reinforcement Schedule
                </h3>
                <table className="w-full text-[11px] border-collapse border border-slate-300">
                  <thead className="bg-slate-200 text-slate-800">
                    <tr>
                      <th className="border border-slate-300 p-1 text-left">Mark</th>
                      <th className="border border-slate-300 p-1 text-left">Description</th>
                      <th className="border border-slate-300 p-1 text-left">Size / Dimensions</th>
                      <th className="border border-slate-300 p-1 text-left">Main Bars</th>
                      <th className="border border-slate-300 p-1 text-left">Links / Stirrups</th>
                      <th className="border border-slate-300 p-1 text-center">Grade</th>
                      <th className="border border-slate-300 p-1 text-center">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {project.members.map((m) => (
                      <tr key={m.id} className="odd:bg-white even:bg-slate-50">
                        <td className="border border-slate-300 p-1 font-bold">{m.mark}</td>
                        <td className="border border-slate-300 p-1">{m.description}</td>
                        <td className="border border-slate-300 p-1">{m.dimensions}</td>
                        <td className="border border-slate-300 p-1 font-semibold text-slate-900">{m.mainBars}</td>
                        <td className="border border-slate-300 p-1">{m.linksOrShear}</td>
                        <td className="border border-slate-300 p-1 text-center">{m.concreteGrade}</td>
                        <td className="border border-slate-300 p-1 text-center font-bold">{m.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bar Bending Schedule Takeoff */}
              <div className="mb-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5 border-b border-slate-300 pb-1">
                  2. Bar Bending Schedule & Rebar Summary (BBS)
                </h3>
                <table className="w-full text-[11px] border-collapse border border-slate-300">
                  <thead className="bg-slate-200 text-slate-800">
                    <tr>
                      <th className="border border-slate-300 p-1 text-left">Mark</th>
                      <th className="border border-slate-300 p-1 text-left">Member</th>
                      <th className="border border-slate-300 p-1 text-center">Size</th>
                      <th className="border border-slate-300 p-1 text-center">No.</th>
                      <th className="border border-slate-300 p-1 text-center">Cut Len (m)</th>
                      <th className="border border-slate-300 p-1 text-center">Total Len (m)</th>
                      <th className="border border-slate-300 p-1 text-center">Weight (kg)</th>
                      <th className="border border-slate-300 p-1 text-left">Shape</th>
                    </tr>
                  </thead>
                  <tbody>
                    {project.bbsItems.slice(0, 8).map((b) => (
                      <tr key={b.id} className="odd:bg-white even:bg-slate-50">
                        <td className="border border-slate-300 p-1 font-bold">{b.barMark}</td>
                        <td className="border border-slate-300 p-1">{b.member}</td>
                        <td className="border border-slate-300 p-1 text-center font-bold">Y{b.diameterMm}</td>
                        <td className="border border-slate-300 p-1 text-center">{b.numberOfMembers * b.barsPerMember}</td>
                        <td className="border border-slate-300 p-1 text-center">{b.cutLengthM}m</td>
                        <td className="border border-slate-300 p-1 text-center">{b.totalLengthM}m</td>
                        <td className="border border-slate-300 p-1 text-center font-bold">{b.totalWeightKg}</td>
                        <td className="border border-slate-300 p-1">{b.shapeCode}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-200 font-bold text-slate-900">
                      <td colSpan={6} className="border border-slate-300 p-1 text-right">
                        TOTAL ESTIMATED HIGH-YIELD REBAR STEEL:
                      </td>
                      <td className="border border-slate-300 p-1 text-center font-black">
                        {calculations.totalSteelWeightKg.toLocaleString()} kg ({calculations.totalSteelTonnage} T)
                      </td>
                      <td className="border border-slate-300 p-1"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* STRUCTURAL DEPARTMENT OFFICIALS & WHO DID WHAT */}
              <DepartmentOfficialsCard department="structural" isPrintVersion={true} />

              {/* Sign-off & Stamp */}
              <div className="border-t-2 border-slate-300 pt-4 mt-6 grid grid-cols-2 gap-6 text-xs">
                <div>
                  <div className="font-bold text-slate-900 mb-1">DESIGN PARAMETERS SUMMARY:</div>
                  <p className="text-[11px] text-slate-600">
                    Design Standard: {project.designCode}<br />
                    Foundation: {project.foundationType} @ {project.soilBearingCapacity} kN/m²<br />
                    Concrete Grade: {project.concreteGrade} • High-Yield B500B
                  </p>
                </div>
                <div className="text-right">
                  <div className="inline-block border border-dashed border-slate-400 p-3 rounded text-center w-60">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      ENGINEERING STAMP & APPROVAL
                    </span>
                    <div className="font-bold text-blue-900 text-xs mt-1">
                      {project.engineerName}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Reg: {project.engineerRegNo}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-semibold mt-1">
                      ✓ PERMIT-READY SPECIFICATION
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* EDITABLE SERVICES MODAL */}
      <ServicePackageEditorModal
        isOpen={isServicesModalOpen}
        onClose={() => setIsServicesModalOpen(false)}
        initialCategory="structural"
      />
    </div>
  );
}
