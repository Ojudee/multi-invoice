import React, { useState } from 'react';
import {
  Building2,
  User,
  MapPin,
  Calendar,
  Layers,
  Plus,
  Trash2,
  DollarSign,
  Percent,
  Sparkles,
  CreditCard,
  FileText,
  PenTool,
  CheckCircle2,
  Sliders,
  ShieldAlert,
  Save,
  FileDown,
  Printer,
  Check,
  ExternalLink,
  Edit3,
  SlidersHorizontal,
  FileSpreadsheet,
  HardHat,
} from 'lucide-react';
import {
  Invoice,
  FloorItem,
  AddonService,
  CurrencyCode,
  MeasurementUnit,
  InvoiceStatus,
  PackageType,
  PackageSelectionMap,
  InvoicePackagesConfig,
} from '../types';
import {
  PACKAGES,
  STRUCTURAL_PACKAGES,
  BOQ_PACKAGES,
  SITE_INSPECTION_PACKAGE,
  BANK_PRESETS,
  ARCHITECTURAL_ADDONS_PRESETS,
  DEFAULT_TERMS,
  getBOQPackageFee,
} from '../data/constants';
import {
  getInvoicePackagesConfig,
  getPackageSummaries,
  PACKAGE_PRESETS,
} from '../utils/packageManager';
import { usePackageServices, PackageCategory } from '../services/packageServicesStorage';
import { ServicePackageEditorModal } from './ServicePackageEditorModal';
import { calculateInvoice, formatCurrency } from '../utils/calculations';

export type StudioTab = 'architectural' | 'structural' | 'boq' | 'inspection' | 'multi_package';

interface InvoiceEditorProps {
  invoice: Invoice;
  onChange: (updatedInvoice: Invoice) => void;
  onOpenSignatureModal: () => void;
  onSave?: () => void;
  onDownloadPDF?: () => void;
  onPrint?: () => void;
  onPrintPreview?: (filter?: PackageSelectionMap) => void;
  saveStatusMessage?: string;
  initialStudioTab?: StudioTab;
  onStudioTabChange?: (tab: StudioTab) => void;
  onOpenArchitecturalPortal?: () => void;
  onOpenStructuralPortal?: () => void;
  onOpenBOQPortal?: () => void;
  onOpenPackagesPortal?: () => void;
}

export const InvoiceEditor: React.FC<InvoiceEditorProps> = ({
  invoice,
  onChange,
  onOpenSignatureModal,
  onSave,
  onDownloadPDF,
  onPrint,
  onPrintPreview,
  saveStatusMessage = 'Auto-saved locally',
  initialStudioTab,
  onStudioTabChange,
  onOpenArchitecturalPortal,
  onOpenStructuralPortal,
  onOpenBOQPortal,
  onOpenPackagesPortal,
}) => {
  const [activeTab, setActiveTab] = useState<'project' | 'floors' | 'packages' | 'financials' | 'payment' | 'terms'>('floors');
  const [servicesModalCategory, setServicesModalCategory] = useState<PackageCategory | null>(null);

  const { regularServices, premiumExtraServices } = usePackageServices('boq');
  const { regularServices: archReg, premiumAllServices: archPremAll } = usePackageServices('architectural');
  const calculations = calculateInvoice(invoice);

  // Separate Packages Configuration & Summaries
  const pkgConfig = getInvoicePackagesConfig(invoice);
  const pkgSummaries = getPackageSummaries(invoice);

  // Multi-package combination selector for printing
  const [combineSelection, setCombineSelection] = useState<PackageSelectionMap>({
    architectural: true,
    structural: true,
    boq: false,
    inspection: false,
    addons: false,
  });

  const updatePkgConfig = (updater: (prev: InvoicePackagesConfig) => InvoicePackagesConfig) => {
    const updated = updater(pkgConfig);
    onChange({
      ...invoice,
      packagesConfig: updated,
      packageType: updated.architectural.tier,
      packageRate: updated.architectural.rate,
    });
  };

  const handleTogglePackageInCombine = (key: keyof PackageSelectionMap) => {
    setCombineSelection((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const combineGrandTotal = (Object.keys(combineSelection) as (keyof PackageSelectionMap)[]).reduce(
    (sum, k) => (combineSelection[k] ? sum + pkgSummaries.packages[k].subtotal : sum),
    0
  );
  const combineActiveCount = Object.values(combineSelection).filter(Boolean).length;

  // Selected Studio Tab in Schedule Tab
  const [schedulePackageTab, setSchedulePackageTab] = useState<StudioTab>(() => {
    if (initialStudioTab) return initialStudioTab;
    if (invoice.invoiceCategory) return invoice.invoiceCategory;
    if (invoice.invoiceNumber.includes('BOQ')) return 'boq';
    if (invoice.invoiceNumber.includes('INS')) return 'inspection';
    if (invoice.invoiceNumber.includes('STR')) return 'structural';
    if (invoice.invoiceNumber.includes('PKG')) return 'multi_package';
    return 'architectural';
  });

  React.useEffect(() => {
    if (initialStudioTab) {
      setSchedulePackageTab(initialStudioTab);
      setActiveTab('floors');
    }
  }, [initialStudioTab]);

  const handleSelectStudioTab = (tab: StudioTab) => {
    setSchedulePackageTab(tab);
    onStudioTabChange?.(tab);
  };

  const addBOQItem = (name = 'Full Bill of Quantities (BOQ)', fee = 30000, qty = 1, range = '100 Sq.m - 500 Sq.m') => {
    const newItem: FloorItem = {
      id: `boq-${Date.now()}`,
      floorName: name,
      quantity: qty,
      unitLabel: 'Set',
      area: qty,
      customRate: fee,
      areaLabel: `${qty} Set (${range})`,
      rateLabel: `${fee.toLocaleString()} Fixed`,
      amountOverride: qty * fee,
      deliverables: [...(pkgConfig.boq.deliverables || BOQ_PACKAGES.regular.features)],
    };
    onChange({
      ...invoice,
      floors: [...invoice.floors, newItem],
    });
  };

  const addInspectionItem = (name = 'On-Site Technical Field Inspection Visit', rate = 15000, visits = 1) => {
    const newItem: FloorItem = {
      id: `ins-${Date.now()}`,
      floorName: name,
      quantity: visits,
      unitLabel: 'Visit',
      area: visits,
      customRate: rate,
      areaLabel: `${visits} ${visits === 1 ? 'Visit' : 'Visits'}`,
      rateLabel: `${rate.toLocaleString()} / Visit`,
      amountOverride: visits * rate,
      deliverables: [...SITE_INSPECTION_PACKAGE.includes.slice(0, 4)],
    };
    onChange({
      ...invoice,
      floors: [...invoice.floors, newItem],
    });
  };

  const addStructuralItem = (name = 'Structural Columns & Slabs Scope', area = 150, rate = 85) => {
    const newItem: FloorItem = {
      id: `str-${Date.now()}`,
      floorName: name,
      area,
      customRate: rate,
      deliverables: [...STRUCTURAL_PACKAGES.premium.features.slice(0, 4)],
    };
    onChange({
      ...invoice,
      floors: [...invoice.floors, newItem],
    });
  };

  const [newDeliverableInput, setNewDeliverableInput] = useState('');
  const [newServiceInput, setNewServiceInput] = useState('');
  const [newOfficialInput, setNewOfficialInput] = useState('');

  // Deliverables management for any package
  const addDeliverable = (pkgKey: 'architectural' | 'structural' | 'boq', text: string) => {
    if (!text.trim()) return;
    const current = pkgConfig[pkgKey].deliverables || [];
    updatePkgConfig((c) => ({
      ...c,
      [pkgKey]: { ...c[pkgKey], deliverables: [...current, text.trim()] },
    }));
    setNewDeliverableInput('');
  };

  const removeDeliverable = (pkgKey: 'architectural' | 'structural' | 'boq', index: number) => {
    const current = pkgConfig[pkgKey].deliverables || [];
    updatePkgConfig((c) => ({
      ...c,
      [pkgKey]: { ...c[pkgKey], deliverables: current.filter((_, i) => i !== index) },
    }));
  };

  const editDeliverable = (pkgKey: 'architectural' | 'structural' | 'boq', index: number, text: string) => {
    const current = [...(pkgConfig[pkgKey].deliverables || [])];
    current[index] = text;
    updatePkgConfig((c) => ({
      ...c,
      [pkgKey]: { ...c[pkgKey], deliverables: current },
    }));
  };

  // Site Inspection Services
  const addInspectionService = (text: string) => {
    if (!text.trim()) return;
    const current = pkgConfig.inspection.servicesList || [...SITE_INSPECTION_PACKAGE.includes];
    updatePkgConfig((c) => ({
      ...c,
      inspection: { ...c.inspection, servicesList: [...current, text.trim()] },
    }));
    setNewServiceInput('');
  };

  const removeInspectionService = (index: number) => {
    const current = pkgConfig.inspection.servicesList || [...SITE_INSPECTION_PACKAGE.includes];
    updatePkgConfig((c) => ({
      ...c,
      inspection: { ...c.inspection, servicesList: current.filter((_, i) => i !== index) },
    }));
  };

  const editInspectionService = (index: number, text: string) => {
    const current = [...(pkgConfig.inspection.servicesList || [...SITE_INSPECTION_PACKAGE.includes])];
    current[index] = text;
    updatePkgConfig((c) => ({
      ...c,
      inspection: { ...c.inspection, servicesList: current },
    }));
  };

  // Site Inspection Official Deliverables
  const addInspectionOfficialDeliverable = (text: string) => {
    if (!text.trim()) return;
    const current = pkgConfig.inspection.officialDeliverables || [...SITE_INSPECTION_PACKAGE.officialDeliverables];
    updatePkgConfig((c) => ({
      ...c,
      inspection: { ...c.inspection, officialDeliverables: [...current, text.trim()] },
    }));
    setNewOfficialInput('');
  };

  const removeInspectionOfficialDeliverable = (index: number) => {
    const current = pkgConfig.inspection.officialDeliverables || [...SITE_INSPECTION_PACKAGE.officialDeliverables];
    updatePkgConfig((c) => ({
      ...c,
      inspection: { ...c.inspection, officialDeliverables: current.filter((_, i) => i !== index) },
    }));
  };

  const editInspectionOfficialDeliverable = (index: number, text: string) => {
    const current = [...(pkgConfig.inspection.officialDeliverables || [...SITE_INSPECTION_PACKAGE.officialDeliverables])];
    current[index] = text;
    updatePkgConfig((c) => ({
      ...c,
      inspection: { ...c.inspection, officialDeliverables: current },
    }));
  };

  // Field updaters
  const updateClient = (field: keyof Invoice['client'], value: string) => {
    onChange({
      ...invoice,
      client: { ...invoice.client, [field]: value },
    });
  };

  const updateProject = (field: keyof Invoice['project'], value: string) => {
    onChange({
      ...invoice,
      project: { ...invoice.project, [field]: value },
    });
  };

  const updateCompany = (field: keyof Invoice['company'], value: string) => {
    onChange({
      ...invoice,
      company: { ...invoice.company, [field]: value },
    });
  };

  const updatePaymentDetails = (field: keyof Invoice['paymentDetails'], value: string) => {
    onChange({
      ...invoice,
      paymentDetails: { ...invoice.paymentDetails, [field]: value },
    });
  };

  // Floors manager
  const addFloor = () => {
    const newFloor: FloorItem = {
      id: `floor-${Date.now()}`,
      floorName: `Floor Level ${invoice.floors.length + 1}`,
      area: 120,
    };
    onChange({
      ...invoice,
      floors: [...invoice.floors, newFloor],
    });
  };

  const updateFloor = (id: string, updates: Partial<FloorItem>) => {
    onChange({
      ...invoice,
      floors: invoice.floors.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    });
  };

  const deleteFloor = (id: string) => {
    onChange({
      ...invoice,
      floors: invoice.floors.filter((f) => f.id !== id),
    });
  };

  // Preset layouts
  const applyFloorPreset = (type: 'duplex' | 'commercial' | 'bungalow' | 'villa') => {
    let newFloors: FloorItem[] = [];
    if (type === 'duplex') {
      newFloors = [
        { id: `fl-${Date.now()}-1`, floorName: 'Ground Floor Living & Kitchen', area: 160 },
        { id: `fl-${Date.now()}-2`, floorName: 'First Floor Bedrooms', area: 140 },
        { id: `fl-${Date.now()}-3`, floorName: 'Outbuilding / Boys Quarters', area: 40 },
      ];
    } else if (type === 'commercial') {
      newFloors = [
        { id: `fl-${Date.now()}-1`, floorName: 'Ground Floor Retail & Banking', area: 280 },
        { id: `fl-${Date.now()}-2`, floorName: 'First Floor Professional Suites', area: 280 },
        { id: `fl-${Date.now()}-3`, floorName: 'Second Floor Corporate Offices', area: 250 },
        { id: `fl-${Date.now()}-4`, floorName: 'Rooftop Terrace & Mechanical', area: 120 },
      ];
    } else if (type === 'bungalow') {
      newFloors = [
        { id: `fl-${Date.now()}-1`, floorName: 'Ground Floor Residential', area: 175 },
        { id: `fl-${Date.now()}-2`, floorName: 'Covered Veranda & Carport', area: 35 },
      ];
    } else {
      // Villa
      newFloors = [
        { id: `fl-${Date.now()}-1`, floorName: 'Ground Floor (Atrium & Living)', area: 195 },
        { id: `fl-${Date.now()}-2`, floorName: 'Upper Floor (Suites & Family Lounge)', area: 165 },
        { id: `fl-${Date.now()}-3`, floorName: 'Penthouse Deck & Pergola', area: 55 },
      ];
    }

    onChange({
      ...invoice,
      floors: newFloors,
    });
  };

  // Package Switcher
  const selectPackage = (type: PackageType) => {
    const rate = type === 'regular' ? 75 : type === 'premium' ? 100 : invoice.packageRate;
    onChange({
      ...invoice,
      packageType: type,
      packageRate: rate,
    });
  };

  // Addon Toggler
  const toggleAddon = (addonId: string) => {
    const existing = invoice.addons.find((a) => a.id === addonId);
    if (existing) {
      onChange({
        ...invoice,
        addons: invoice.addons.map((a) =>
          a.id === addonId ? { ...a, enabled: !a.enabled } : a
        ),
      });
    } else {
      const preset = ARCHITECTURAL_ADDONS_PRESETS.find((p) => p.id === addonId);
      if (preset) {
        onChange({
          ...invoice,
          addons: [...invoice.addons, { ...preset, enabled: true }],
        });
      }
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col text-slate-100">
      {/* Editor Header Bar */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#0b2341] rounded-lg border border-blue-500/30 text-amber-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">
              Invoice Studio: {invoice.invoiceNumber}
            </h2>
            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>{invoice.client.name || 'Unassigned Client'}</span>
              <span>·</span>
              <span className="font-mono tabular-nums text-amber-400 font-semibold">
                {formatCurrency(calculations.grandTotal, invoice.currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Save Status Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 text-[11px] text-slate-300 border border-slate-700">
            <Check className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>{saveStatusMessage}</span>
          </div>

          {/* Status Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-medium">Status:</span>
            <select
              value={invoice.status}
              onChange={(e) => {
                const nextStatus = e.target.value as InvoiceStatus;
                let nextPaid = invoice.depositPaidAmount;
                if (nextStatus === 'paid') {
                  nextPaid = calculations.grandTotal;
                } else if (nextStatus === 'deposit_paid' && nextPaid === 0) {
                  nextPaid = calculations.depositRequiredAmount;
                }
                onChange({ ...invoice, status: nextStatus, depositPaidAmount: nextPaid });
              }}
              className="px-2 py-1 text-xs font-semibold bg-slate-800 border border-slate-700 rounded text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            >
              <option value="draft">Draft</option>
              <option value="issued">Issued / Pending</option>
              <option value="deposit_paid">Deposit Paid</option>
              <option value="paid">Paid in Full</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          {/* Explicit Save Button */}
          {onSave && (
            <button
              type="button"
              onClick={onSave}
              className="px-3 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Save invoice to storage"
            >
              <Save className="w-3.5 h-3.5" />
              Save
            </button>
          )}

          {/* Direct PDF Download */}
          {onDownloadPDF && (
            <button
              type="button"
              onClick={onDownloadPDF}
              className="px-2.5 py-1 text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Download PDF document directly"
            >
              <FileDown className="w-3.5 h-3.5" />
              PDF
            </button>
          )}

          {/* Print Preview Button */}
          {onPrintPreview && (
            <button
              type="button"
              onClick={() => onPrintPreview()}
              className="px-2.5 py-1 text-xs font-semibold bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-600/50 rounded flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Open Print Preview with centered A4 margins"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              Print Preview
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 p-2 bg-slate-950 border-b border-slate-800 overflow-x-auto text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('floors')}
          className={`px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'floors'
              ? 'bg-[#0b2341] text-amber-400 border border-blue-500/40 shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Floors & Schedule
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('packages')}
          className={`px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'packages'
              ? 'bg-[#0b2341] text-amber-400 border border-blue-500/40 shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Packages & Print</span>
          <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded-full font-bold ml-0.5">
            {pkgSummaries.activeCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('project')}
          className={`px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'project'
              ? 'bg-[#0b2341] text-amber-400 border border-blue-500/40 shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          Client & Project
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('financials')}
          className={`px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'financials'
              ? 'bg-[#0b2341] text-amber-400 border border-blue-500/40 shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          Advance & Pricing
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('payment')}
          className={`px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'payment'
              ? 'bg-[#0b2341] text-amber-400 border border-blue-500/40 shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          Payment Details
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('terms')}
          className={`px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'terms'
              ? 'bg-[#0b2341] text-amber-400 border border-blue-500/40 shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Terms & Sign
        </button>
      </div>

      {/* Main Tab Panels */}
      <div className="p-5 overflow-y-auto max-h-[640px] space-y-6">
        {/* ================= TAB 1: FLOORS & ALL PACKAGE SCHEDULES ================= */}
        {activeTab === 'floors' && (
          <div className="space-y-5">
            {/* Package Navigation Bar inside Tab 1 */}
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  Package Schedules & Tier Selection
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select and configure the exact pricing tiers, scopes, deliverables, and service lists for all packages.
                </p>
              </div>

              {/* Sub-tabs for each dedicated Invoice Studio */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs flex-wrap">
                <button
                  type="button"
                  onClick={() => handleSelectStudioTab('architectural')}
                  className={`px-2.5 py-1 rounded font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    schedulePackageTab === 'architectural'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🏛️ Arch Studio</span>
                  <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                    pkgConfig.architectural.enabled ? 'bg-blue-900 text-blue-200' : 'bg-black/30 text-slate-500'
                  }`}>
                    {pkgConfig.architectural.enabled ? pkgConfig.architectural.tier.toUpperCase() : 'OFF'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectStudioTab('structural')}
                  className={`px-2.5 py-1 rounded font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    schedulePackageTab === 'structural'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🏗️ Structural Studio</span>
                  <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                    pkgConfig.structural.enabled ? 'bg-indigo-900 text-indigo-200' : 'bg-black/30 text-slate-500'
                  }`}>
                    {pkgConfig.structural.enabled ? pkgConfig.structural.tier.toUpperCase() : 'OFF'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectStudioTab('boq')}
                  className={`px-2.5 py-1 rounded font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    schedulePackageTab === 'boq'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>📊 BOQ Studio</span>
                  <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                    pkgConfig.boq.enabled ? 'bg-emerald-900 text-emerald-200' : 'bg-black/30 text-slate-500'
                  }`}>
                    {pkgConfig.boq.enabled ? pkgConfig.boq.tier.toUpperCase() : 'OFF'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectStudioTab('inspection')}
                  className={`px-2.5 py-1 rounded font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    schedulePackageTab === 'inspection'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🔍 Inspection Studio</span>
                  <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                    pkgConfig.inspection.enabled ? 'bg-amber-900 text-amber-200' : 'bg-black/30 text-slate-500'
                  }`}>
                    {pkgConfig.inspection.enabled ? 'ACTIVE' : 'OFF'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectStudioTab('multi_package')}
                  className={`px-2.5 py-1 rounded font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    schedulePackageTab === 'multi_package'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>📦 Multi-Package Studio</span>
                  <span className="text-[10px] px-1 py-0.2 rounded font-mono bg-purple-900 text-purple-200">
                    COMBINED
                  </span>
                </button>
              </div>
            </div>

            {/* ================= 1. ARCHITECTURAL PACKAGE SECTION ================= */}
            {schedulePackageTab === 'architectural' && (
              <div className="space-y-4 animate-fade-in">
                {/* Architectural Package Header & Toggle */}
                <div className="flex items-center justify-between p-3 bg-slate-950 border border-blue-500/30 rounded-lg">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>🏛️ Architectural Drawing Package</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Permit drawings, floor plans, elevations, sections, roof plan & municipal compliance PDF set.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pkgConfig.architectural.enabled}
                      onChange={() =>
                        updatePkgConfig((c) => ({
                          ...c,
                          architectural: { ...c.architectural, enabled: !c.architectural.enabled },
                        }))
                      }
                      className="rounded border-slate-700 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                      pkgConfig.architectural.enabled
                        ? 'bg-blue-900/60 text-blue-200 border-blue-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {pkgConfig.architectural.enabled ? 'INCLUDED' : 'DISABLED'}
                    </span>
                  </label>
                </div>

                {!pkgConfig.architectural.enabled && (
                  <div className="p-4 bg-slate-950/70 border border-dashed border-slate-800 rounded-lg text-center space-y-2">
                    <p className="text-xs text-slate-400">
                      Architectural Drawing Package is currently <strong>DISABLED</strong> for this invoice.
                    </p>
                    <p className="text-[11px] text-slate-500">
                      This invoice operates independently using other packages (e.g. Structural, BOQ, or Inspection). To bill for architectural drawings, toggle it to INCLUDED above.
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        updatePkgConfig((c) => ({
                          ...c,
                          architectural: { ...c.architectural, enabled: true },
                        }))
                      }
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded cursor-pointer transition"
                    >
                      Enable Architectural Package
                    </button>
                  </div>
                )}

                {/* Architectural Tiers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => selectPackage('regular')}
                    className={`p-3 rounded-lg border cursor-pointer transition ${
                      pkgConfig.architectural.tier === 'regular'
                        ? 'border-blue-500 bg-blue-950/30 ring-1 ring-blue-500/50'
                        : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-blue-400">REGULAR ARCHITECTURAL</span>
                      <span className="text-xs font-mono font-bold text-white bg-blue-900/50 px-2 py-0.5 rounded">
                        {invoice.currency} 75 /{invoice.unit}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Floor plans, elevations, sections, roof plan, door/window schedule & municipal permit PDF set.
                    </p>
                  </div>

                  <div
                    onClick={() => selectPackage('premium')}
                    className={`p-3 rounded-lg border cursor-pointer transition ${
                      pkgConfig.architectural.tier === 'premium'
                        ? 'border-amber-500 bg-amber-950/20 ring-1 ring-amber-500/50'
                        : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-amber-400">PREMIUM ARCHITECTURAL</span>
                      <span className="text-xs font-mono font-bold text-amber-300 bg-amber-900/40 px-2 py-0.5 rounded">
                        {invoice.currency} 100 /{invoice.unit}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Includes Regular plus 3D walkthrough, joinery, interior design layouts & ceiling plans.
                    </p>
                  </div>
                </div>

                {/* Presets and Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                    Covered Floor Levels ({invoice.floors.length} levels)
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-slate-400">Presets:</span>
                    <button
                      type="button"
                      onClick={() => applyFloorPreset('villa')}
                      className="px-2 py-0.5 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors"
                    >
                      Villa (3-Lvl)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFloorPreset('duplex')}
                      className="px-2 py-0.5 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors"
                    >
                      Duplex + BQ
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFloorPreset('commercial')}
                      className="px-2 py-0.5 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors"
                    >
                      Commercial
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFloorPreset('bungalow')}
                      className="px-2 py-0.5 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors"
                    >
                      Bungalow
                    </button>
                  </div>
                </div>

                {/* Floor Items Table / List */}
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
                    <div className="col-span-5">Floor / Area Name</div>
                    <div className="col-span-3 text-right">Area ({invoice.unit})</div>
                    <div className="col-span-2 text-right">Rate ({invoice.currency})</div>
                    <div className="col-span-2 text-right">Action</div>
                  </div>

                  {invoice.floors.map((floor) => {
                    const floorRate = floor.customRate ?? invoice.packageRate;
                    const floorTotal = (Number(floor.area) || 0) * floorRate;

                    return (
                      <div
                        key={floor.id}
                        className="grid grid-cols-12 gap-2 items-center bg-slate-800/80 border border-slate-700 p-2.5 rounded-lg hover:border-slate-600 transition-colors"
                      >
                        <div className="col-span-5">
                          <input
                            type="text"
                            value={floor.floorName}
                            onChange={(e) => updateFloor(floor.id, { floorName: e.target.value })}
                            placeholder="e.g. Ground Floor, Upper Floor..."
                            className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded text-white focus:outline-hidden focus:border-amber-500"
                          />
                        </div>

                        <div className="col-span-3">
                          <div className="relative">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={floor.area}
                              onChange={(e) => updateFloor(floor.id, { area: parseFloat(e.target.value) || 0 })}
                              className="w-full text-right px-2.5 py-1.5 text-xs font-mono tabular-nums bg-slate-900 border border-slate-700 rounded text-amber-300 focus:outline-hidden focus:border-amber-500"
                            />
                            <span className="absolute right-2 top-2 text-[10px] text-slate-500 pointer-events-none">
                              {invoice.unit}
                            </span>
                          </div>
                        </div>

                        <div className="col-span-2 text-right">
                          <div className="text-xs font-mono text-slate-300 tabular-nums">
                            {floorRate}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono tabular-nums">
                            ={formatCurrency(floorTotal, invoice.currency)}
                          </div>
                        </div>

                        <div className="col-span-2 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => deleteFloor(floor.id)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700/60 rounded transition-colors cursor-pointer"
                            title="Remove floor level"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={addFloor}
                    className="w-full py-2 border border-dashed border-slate-700 hover:border-amber-500/60 hover:bg-slate-800/40 text-slate-300 hover:text-amber-400 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Add Floor Level / Area Section
                  </button>
                </div>

                {/* Architectural Deliverables (Editable) */}
                <div className="p-3.5 bg-slate-950/80 border border-blue-500/30 rounded-lg space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-300 uppercase tracking-wide flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      Architectural Deliverables & Items (Editable)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updatePkgConfig((c) => ({
                          ...c,
                          architectural: {
                            ...c.architectural,
                            deliverables: [
                              ...(c.architectural.tier === 'regular'
                                ? PACKAGES.regular.features
                                : PACKAGES.premium.features),
                            ],
                          },
                        }))
                      }
                      className="text-[11px] text-slate-400 hover:text-amber-400 underline cursor-pointer"
                    >
                      Reset Standard
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {(pkgConfig.architectural.deliverables || []).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => editDeliverable('architectural', idx, e.target.value)}
                          className="flex-1 px-2.5 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-slate-200 focus:outline-hidden focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => removeDeliverable('architectural', idx)}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add deliverable input */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                    <input
                      type="text"
                      placeholder="Add new architectural deliverable..."
                      value={newDeliverableInput}
                      onChange={(e) => setNewDeliverableInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addDeliverable('architectural', newDeliverableInput);
                        }
                      }}
                      className="flex-1 px-2.5 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-white focus:outline-hidden focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => addDeliverable('architectural', newDeliverableInput)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded transition cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ================= 2. STRUCTURAL PACKAGE SECTION ================= */}
            {schedulePackageTab === 'structural' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between p-3 bg-slate-950 border border-indigo-500/30 rounded-lg">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>🏗️ Structural Engineering Package</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Foundation engineering, column/beam schedules, slab layout, Bar Bending Schedule (BBS) & calculations.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pkgConfig.structural.enabled}
                      onChange={() =>
                        updatePkgConfig((c) => ({
                          ...c,
                          structural: { ...c.structural, enabled: !c.structural.enabled },
                        }))
                      }
                      className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                      pkgConfig.structural.enabled
                        ? 'bg-indigo-900/60 text-indigo-200 border-indigo-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {pkgConfig.structural.enabled ? 'INCLUDED' : 'DISABLED'}
                    </span>
                  </label>
                </div>

                {/* Structural Tiers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() =>
                      updatePkgConfig((c) => ({
                        ...c,
                        structural: { ...c.structural, enabled: true, tier: 'regular', rate: 65 },
                      }))
                    }
                    className={`p-3 rounded-lg border cursor-pointer transition ${
                      pkgConfig.structural.tier === 'regular'
                        ? 'border-indigo-500 bg-indigo-950/30 ring-1 ring-indigo-500/50'
                        : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-indigo-400">REGULAR STRUCTURAL</span>
                      <span className="text-xs font-mono font-bold text-white bg-indigo-900/50 px-2 py-0.5 rounded">
                        {invoice.currency} 65 /{invoice.unit}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Foundation design, column layout, beam layout, slab layout, roof structure & structural notes.
                    </p>
                  </div>

                  <div
                    onClick={() =>
                      updatePkgConfig((c) => ({
                        ...c,
                        structural: { ...c.structural, enabled: true, tier: 'premium', rate: 85 },
                      }))
                    }
                    className={`p-3 rounded-lg border cursor-pointer transition ${
                      pkgConfig.structural.tier === 'premium'
                        ? 'border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500/50'
                        : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-emerald-400">PREMIUM STRUCTURAL</span>
                      <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-900/40 px-2 py-0.5 rounded">
                        {invoice.currency} 85 /{invoice.unit}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Includes Regular plus Bar Bending Schedule (BBS), structural calculations report & stair reinforcement.
                    </p>
                  </div>
                </div>

                {/* Scope area & rate input */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Structural Scope Area ({invoice.unit}):</label>
                    <input
                      type="number"
                      min="1"
                      value={pkgConfig.structural.area ?? pkgSummaries.totalArea}
                      onChange={(e) => {
                        const a = parseFloat(e.target.value) || 0;
                        updatePkgConfig((c) => ({
                          ...c,
                          structural: { ...c.structural, area: a },
                        }));
                      }}
                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-900 border border-slate-700 rounded text-indigo-300 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Structural Rate ({invoice.currency}/{invoice.unit}):</label>
                    <input
                      type="number"
                      min="1"
                      value={pkgConfig.structural.rate}
                      onChange={(e) => {
                        const r = parseFloat(e.target.value) || 0;
                        updatePkgConfig((c) => ({
                          ...c,
                          structural: { ...c.structural, tier: 'custom', rate: r },
                        }));
                      }}
                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-900 border border-slate-700 rounded text-amber-300 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Structural Engineering Scope Elements Schedule (Area Based — Per M²) */}
                <div className="p-3.5 bg-slate-950 border border-indigo-500/30 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wide flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                        Structural Engineering Elements Schedule (Area Based — Per {invoice.unit})
                      </h5>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Calculated per {invoice.unit} based on structural design elements (foundation, columns, beams, slabs, BBS).
                      </p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                      RATE PER {invoice.unit}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
                      <div className="col-span-5">Structural Element / Framing Scope</div>
                      <div className="col-span-3 text-right">Area ({invoice.unit})</div>
                      <div className="col-span-2 text-right">Rate ({invoice.currency})</div>
                      <div className="col-span-2 text-right">Action</div>
                    </div>

                    {invoice.floors.map((floor) => {
                      const area = Number(floor.area) || 0;
                      const rate = floor.customRate ?? pkgConfig.structural.rate ?? 85;
                      const elementTotal = area * rate;

                      return (
                        <div
                          key={floor.id}
                          className="grid grid-cols-12 gap-2 items-center bg-slate-900/90 border border-indigo-500/30 p-2.5 rounded-lg hover:border-indigo-500/60 transition-colors"
                        >
                          <div className="col-span-5 space-y-1">
                            <input
                              type="text"
                              value={floor.floorName}
                              onChange={(e) => updateFloor(floor.id, { floorName: e.target.value })}
                              placeholder="e.g. Foundation & Superstructure Framing Scope"
                              className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded text-white focus:outline-hidden focus:border-indigo-500"
                            />
                            {floor.deliverables && floor.deliverables.length > 0 && (
                              <div className="text-[10px] text-indigo-400/80 font-mono truncate">
                                Includes: {floor.deliverables.slice(0, 3).join(', ')}
                              </div>
                            )}
                          </div>

                          <div className="col-span-3">
                            <div className="relative">
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={area}
                                onChange={(e) => updateFloor(floor.id, { area: parseFloat(e.target.value) || 0 })}
                                className="w-full text-right px-2.5 py-1.5 text-xs font-mono tabular-nums bg-slate-950 border border-slate-700 rounded text-indigo-300 focus:outline-hidden focus:border-indigo-500"
                              />
                              <span className="absolute right-2 top-2 text-[10px] text-slate-500 pointer-events-none">
                                {invoice.unit}
                              </span>
                            </div>
                          </div>

                          <div className="col-span-2 text-right">
                            <div className="text-xs font-mono text-slate-300 tabular-nums">
                              {rate}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono tabular-nums">
                              ={formatCurrency(elementTotal, invoice.currency)}
                            </div>
                          </div>

                          <div className="col-span-2 flex items-center justify-end">
                            <button
                              type="button"
                              onClick={() => deleteFloor(floor.id)}
                              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                              title="Remove structural element"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => addStructuralItem('Structural Columns & Slabs Scope', 150, pkgConfig.structural.rate || 85)}
                      className="w-full py-2 border border-dashed border-indigo-500/40 hover:border-indigo-500 hover:bg-indigo-950/20 text-indigo-300 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Add Structural Element / Area Scope
                    </button>
                  </div>
                </div>

                {/* Structural Deliverables (Editable) */}
                <div className="p-3.5 bg-slate-950/80 border border-indigo-500/30 rounded-lg space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300 uppercase tracking-wide flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      Structural Deliverables & Items (Editable)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updatePkgConfig((c) => ({
                          ...c,
                          structural: {
                            ...c.structural,
                            deliverables: [
                              ...(c.structural.tier === 'regular'
                                ? STRUCTURAL_PACKAGES.regular.features
                                : STRUCTURAL_PACKAGES.premium.features),
                            ],
                          },
                        }))
                      }
                      className="text-[11px] text-slate-400 hover:text-amber-400 underline cursor-pointer"
                    >
                      Reset Standard
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {(pkgConfig.structural.deliverables || []).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => editDeliverable('structural', idx, e.target.value)}
                          className="flex-1 px-2.5 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-slate-200 focus:outline-hidden focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => removeDeliverable('structural', idx)}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add deliverable input */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                    <input
                      type="text"
                      placeholder="Add new structural deliverable..."
                      value={newDeliverableInput}
                      onChange={(e) => setNewDeliverableInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addDeliverable('structural', newDeliverableInput);
                        }
                      }}
                      className="flex-1 px-2.5 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-white focus:outline-hidden focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => addDeliverable('structural', newDeliverableInput)}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded transition cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ================= 3. BOQ PACKAGE SECTION ================= */}
            {schedulePackageTab === 'boq' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between p-3 bg-slate-950 border border-emerald-500/30 rounded-lg">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>📊 Bills of Quantities (BOQ) Package</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Pricing reflects the fixed range charge rate for your building size bracket.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pkgConfig.boq.enabled}
                      onChange={() =>
                        updatePkgConfig((c) => ({
                          ...c,
                          boq: { ...c.boq, enabled: !c.boq.enabled },
                        }))
                      }
                      className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                      pkgConfig.boq.enabled
                        ? 'bg-emerald-900/60 text-emerald-200 border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {pkgConfig.boq.enabled ? 'INCLUDED' : 'DISABLED'}
                    </span>
                  </label>
                </div>

                {/* BOQ Tiers (Regular vs Premium) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => {
                      const fee = getBOQPackageFee(pkgSummaries.totalArea, 'regular');
                      updatePkgConfig((c) => ({
                        ...c,
                        boq: { ...c.boq, enabled: true, tier: 'regular', fee },
                      }));
                    }}
                    className={`p-3 rounded-lg border cursor-pointer transition ${
                      pkgConfig.boq.tier === 'regular'
                        ? 'border-blue-500 bg-blue-950/30 ring-1 ring-blue-500/50'
                        : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-blue-400">REGULAR BOQ</span>
                      <span className="text-xs font-mono font-bold text-white bg-blue-900/50 px-2 py-0.5 rounded">
                        GMD 18k – 25k (Fixed Range)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Quantity takeoff, material & labor summary, detailed trade BOQ & report.
                    </p>
                  </div>

                  <div
                    onClick={() => {
                      const fee = getBOQPackageFee(pkgSummaries.totalArea, 'premium');
                      updatePkgConfig((c) => ({
                        ...c,
                        boq: { ...c.boq, enabled: true, tier: 'premium', fee },
                      }));
                    }}
                    className={`p-3 rounded-lg border cursor-pointer transition ${
                      pkgConfig.boq.tier === 'premium'
                        ? 'border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500/50'
                        : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-emerald-400">PREMIUM BOQ</span>
                      <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-900/40 px-2 py-0.5 rounded">
                        GMD 30k – 65k (Fixed Range)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Comprehensive quantity surveying, procurement schedule, tender docs & quality control.
                    </p>
                  </div>
                </div>

                {/* Fixed Range Charge Rate Selector (Critical requirement) */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                    Fixed Range Charge Rate (Area / Scope Bracket)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      {
                        range: '100 Sq.m - 500 Sq.m',
                        regFee: 18000,
                        premFee: 30000,
                      },
                      {
                        range: '500 Sq.m - 1,000 Sq.m',
                        regFee: 20000,
                        premFee: 45000,
                      },
                      {
                        range: '1,000 Sq.m plus',
                        regFee: 25000,
                        premFee: 65000,
                      },
                    ].map((tier) => {
                      const isSelected = (pkgConfig.boq.areaRange || '').includes(tier.range.split(' ')[0]);
                      const targetFee = pkgConfig.boq.tier === 'premium' ? tier.premFee : tier.regFee;
                      return (
                        <button
                          key={tier.range}
                          type="button"
                          onClick={() => {
                            const newFee = targetFee;
                            updatePkgConfig((c) => ({
                              ...c,
                              boq: {
                                ...c.boq,
                                enabled: true,
                                areaRange: tier.range,
                                fee: newFee,
                              },
                            }));
                            if (invoice.floors.length === 0) {
                              addBOQItem(`Full Bill of Quantities (BOQ) - ${tier.range}`, newFee, 1, tier.range);
                            } else {
                              onChange({
                                ...invoice,
                                floors: invoice.floors.map((floor) => {
                                  if (floor.unitLabel === 'Set' || floor.floorName.toLowerCase().includes('boq') || invoice.invoiceCategory === 'boq') {
                                    const q = typeof floor.quantity === 'number' ? floor.quantity : 1;
                                    return {
                                      ...floor,
                                      floorName: `Full Bill of Quantities (BOQ) - ${tier.range}`,
                                      customRate: newFee,
                                      rateLabel: `${newFee.toLocaleString()} Fixed`,
                                      areaLabel: `${q} Set (${tier.range})`,
                                      amountOverride: q * newFee,
                                    };
                                  }
                                  return floor;
                                }),
                              });
                            }
                          }}
                          className={`p-2 rounded border text-left transition cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-950/70 border-emerald-500 text-white ring-1 ring-emerald-500/50'
                              : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div className="font-bold text-xs">{tier.range}</div>
                          <div className="text-[11px] font-mono text-amber-400 mt-0.5">
                            {formatCurrency(targetFee, invoice.currency)} Fixed
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Agreed BOQ Fee Override */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
                    <span className="text-slate-400">Agreed Fixed BOQ Charge Rate:</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="1000"
                        step="500"
                        value={pkgConfig.boq.fee}
                        onChange={(e) => {
                          const f = parseFloat(e.target.value) || 0;
                          updatePkgConfig((c) => ({
                            ...c,
                            boq: { ...c.boq, fee: f },
                          }));
                          onChange({
                            ...invoice,
                            floors: invoice.floors.map((floor) => {
                              if (floor.unitLabel === 'Set' || floor.floorName.toLowerCase().includes('boq') || invoice.invoiceCategory === 'boq') {
                                const q = typeof floor.quantity === 'number' ? floor.quantity : 1;
                                return {
                                  ...floor,
                                  customRate: f,
                                  rateLabel: `${f.toLocaleString()} Fixed`,
                                  amountOverride: q * f,
                                };
                              }
                              return floor;
                            }),
                          });
                        }}
                        className="w-28 px-2 py-1 text-xs font-mono text-right bg-slate-900 border border-slate-700 rounded text-amber-300 focus:outline-hidden"
                      />
                      <span className="text-slate-400 font-mono">{invoice.currency}</span>
                    </div>
                  </div>
                </div>

                {/* Dedicated BOQ Schedule Items Table (Uses QTY instead of Area/Scope, Fixed Range Pricing) */}
                <div className="p-3.5 bg-slate-950 border border-emerald-500/30 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-emerald-300 uppercase tracking-wide flex items-center gap-1.5">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                        BOQ Schedule Items (Charged by Fixed Range & QTY — Not Per M²)
                      </h5>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Each item is priced on a fixed range bracket. Override any value, quantity, unit, or description text below.
                      </p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                      USES QTY
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
                      <div className="col-span-5">BOQ Scope / Item Description</div>
                      <div className="col-span-2 text-right">QTY (Quantity)</div>
                      <div className="col-span-3 text-right">Fixed Fee ({invoice.currency})</div>
                      <div className="col-span-2 text-right">Action</div>
                    </div>

                    {invoice.floors.map((floor) => {
                      const qty = typeof floor.quantity === 'number' ? floor.quantity : (floor.area > 0 ? floor.area : 1);
                      const fee = typeof floor.customRate === 'number' ? floor.customRate : (pkgConfig.boq.fee || 30000);
                      const itemTotal = typeof floor.amountOverride === 'number' ? floor.amountOverride : qty * fee;

                      return (
                        <div
                          key={floor.id}
                          className="grid grid-cols-12 gap-2 items-center bg-slate-900/90 border border-emerald-500/30 p-2.5 rounded-lg hover:border-emerald-500/60 transition-colors"
                        >
                          <div className="col-span-5 space-y-1">
                            <input
                              type="text"
                              value={floor.floorName}
                              onChange={(e) => updateFloor(floor.id, { floorName: e.target.value })}
                              placeholder="e.g. Full Bill of Quantities (BOQ) - 100 to 500 m² Fixed Scope"
                              className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded text-white focus:outline-hidden focus:border-emerald-500"
                            />
                            {floor.deliverables && floor.deliverables.length > 0 && (
                              <div className="text-[10px] text-emerald-400/80 font-mono truncate">
                                Includes: {floor.deliverables.slice(0, 3).join(', ')}
                              </div>
                            )}
                          </div>

                          <div className="col-span-2">
                            <div className="relative">
                              <input
                                type="number"
                                step="1"
                                min="1"
                                value={qty}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 1;
                                  updateFloor(floor.id, {
                                    quantity: val,
                                    area: val,
                                    areaLabel: `${val} ${floor.unitLabel || 'Set'}`,
                                    amountOverride: val * fee,
                                  });
                                }}
                                className="w-full text-right px-2.5 py-1.5 text-xs font-mono tabular-nums bg-slate-950 border border-slate-700 rounded text-amber-300 focus:outline-hidden focus:border-emerald-500"
                              />
                              <span className="absolute right-2 top-2 text-[10px] text-slate-500 pointer-events-none">
                                {floor.unitLabel || 'Set'}
                              </span>
                            </div>
                          </div>

                          <div className="col-span-3">
                            <div className="relative">
                              <input
                                type="number"
                                step="500"
                                min="0"
                                value={fee}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  updateFloor(floor.id, {
                                    customRate: val,
                                    rateLabel: `${val.toLocaleString()} Fixed`,
                                    amountOverride: qty * val,
                                  });
                                }}
                                className="w-full text-right px-2.5 py-1.5 text-xs font-mono tabular-nums bg-slate-950 border border-slate-700 rounded text-emerald-300 focus:outline-hidden focus:border-emerald-500"
                              />
                              <span className="text-[10px] text-slate-400 block text-right mt-0.5 font-mono">
                                ={formatCurrency(itemTotal, invoice.currency)}
                              </span>
                            </div>
                          </div>

                          <div className="col-span-2 flex items-center justify-end">
                            <button
                              type="button"
                              onClick={() => deleteFloor(floor.id)}
                              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                              title="Remove BOQ item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => addBOQItem('Bills of Quantities (BOQ) Scope', pkgConfig.boq.fee || 30000, 1, pkgConfig.boq.areaRange || '100 Sq.m - 500 Sq.m')}
                      className="w-full py-2 border border-dashed border-emerald-500/40 hover:border-emerald-500 hover:bg-emerald-950/20 text-emerald-300 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Add BOQ Item / Scope Bracket
                    </button>
                  </div>
                </div>

                {/* BOQ Deliverables (Editable) */}
                <div className="p-3.5 bg-slate-950/80 border border-emerald-500/30 rounded-lg space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300 uppercase tracking-wide flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      BOQ Deliverables & Items (Editable)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updatePkgConfig((c) => ({
                          ...c,
                          boq: {
                            ...c.boq,
                            deliverables: [
                              ...(c.boq.tier === 'premium'
                                ? BOQ_PACKAGES.premium.features
                                : BOQ_PACKAGES.regular.features),
                            ],
                          },
                        }))
                      }
                      className="text-[11px] text-slate-400 hover:text-amber-400 underline cursor-pointer"
                    >
                      Reset Standard
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {(pkgConfig.boq.deliverables || []).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => editDeliverable('boq', idx, e.target.value)}
                          className="flex-1 px-2.5 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-slate-200 focus:outline-hidden focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => removeDeliverable('boq', idx)}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add deliverable input */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                    <input
                      type="text"
                      placeholder="Add new BOQ deliverable..."
                      value={newDeliverableInput}
                      onChange={(e) => setNewDeliverableInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addDeliverable('boq', newDeliverableInput);
                        }
                      }}
                      className="flex-1 px-2.5 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-white focus:outline-hidden focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => addDeliverable('boq', newDeliverableInput)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded transition cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ================= 4. SITE INSPECTION PACKAGE SECTION ================= */}
            {schedulePackageTab === 'inspection' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between p-3 bg-slate-950 border border-amber-500/30 rounded-lg">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>🔍 Site Inspection & Reports Package</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      On-site inspection, boundary/topography sketch plans, technical consultation & certified advisory.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pkgConfig.inspection.enabled}
                      onChange={() =>
                        updatePkgConfig((c) => ({
                          ...c,
                          inspection: { ...c.inspection, enabled: !c.inspection.enabled },
                        }))
                      }
                      className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                    />
                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                      pkgConfig.inspection.enabled
                        ? 'bg-amber-900/60 text-amber-200 border-amber-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {pkgConfig.inspection.enabled ? 'INCLUDED' : 'DISABLED'}
                    </span>
                  </label>
                </div>

                {/* Consultation Title & Scope inputs (Editable as requested!) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      Inspection / Technical Consultation Title:
                    </label>
                    <input
                      type="text"
                      value={pkgConfig.inspection.consultationTitle || 'SITE INSPECTION & TECHNICAL CONSULTATION'}
                      onChange={(e) =>
                        updatePkgConfig((c) => ({
                          ...c,
                          inspection: { ...c.inspection, consultationTitle: e.target.value },
                        }))
                      }
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded text-white focus:outline-hidden focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      Area / Scope Description:
                    </label>
                    <input
                      type="text"
                      value={pkgConfig.inspection.inspectionScope || 'On-Site Field Visit & Terrain Assessment'}
                      onChange={(e) =>
                        updatePkgConfig((c) => ({
                          ...c,
                          inspection: { ...c.inspection, inspectionScope: e.target.value },
                        }))
                      }
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded text-amber-300 focus:outline-hidden focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Inspection Fee Rate Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div
                    onClick={() => {
                      const newRate = 15000;
                      updatePkgConfig((c) => ({
                        ...c,
                        inspection: { ...c.inspection, enabled: true, fee: newRate },
                      }));
                      if (invoice.floors.length === 0) {
                        addInspectionItem('On-Site Technical Field Inspection & Compliance Audit', newRate, 1);
                      } else {
                        onChange({
                          ...invoice,
                          floors: invoice.floors.map((floor) => {
                            if (floor.unitLabel === 'Visit' || floor.floorName.toLowerCase().includes('ins') || invoice.invoiceCategory === 'inspection') {
                              const v = typeof floor.quantity === 'number' ? floor.quantity : 1;
                              return {
                                ...floor,
                                customRate: newRate,
                                rateLabel: `${newRate.toLocaleString()} / Visit`,
                                areaLabel: `${v} ${v === 1 ? 'Visit' : 'Visits'}`,
                                amountOverride: v * newRate,
                              };
                            }
                            return floor;
                          }),
                        });
                      }
                    }}
                    className={`p-2.5 rounded-lg border cursor-pointer transition ${
                      pkgConfig.inspection.fee === 15000
                        ? 'border-amber-500 bg-amber-950/40 ring-1 ring-amber-500/50'
                        : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-amber-400">FIELD VISIT</span>
                      <span className="text-xs font-mono font-bold text-white bg-amber-900/50 px-2 py-0.5 rounded">
                        GMD 15k / Visit
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      On-site engineering inspection, rebar & concrete audit, compliance report.
                    </p>
                  </div>

                  <div
                    onClick={() => {
                      const newRate = 3500;
                      updatePkgConfig((c) => ({
                        ...c,
                        inspection: { ...c.inspection, enabled: true, fee: newRate },
                      }));
                      onChange({
                        ...invoice,
                        floors: invoice.floors.map((floor) => {
                          if (floor.unitLabel === 'Visit' || floor.floorName.toLowerCase().includes('ins') || invoice.invoiceCategory === 'inspection') {
                            const v = typeof floor.quantity === 'number' ? floor.quantity : 1;
                            return {
                              ...floor,
                              customRate: newRate,
                              rateLabel: `${newRate.toLocaleString()} / Visit`,
                              amountOverride: v * newRate,
                            };
                          }
                          return floor;
                        }),
                      });
                    }}
                    className={`p-2.5 rounded-lg border cursor-pointer transition ${
                      pkgConfig.inspection.fee === 3500
                        ? 'border-blue-500 bg-blue-950/30 ring-1 ring-blue-500/50'
                        : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-blue-400">STANDARD VISIT</span>
                      <span className="text-xs font-mono font-bold text-white bg-blue-900/50 px-2 py-0.5 rounded">
                        GMD 3,500 Fixed
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Single on-site visit, boundary & terrain sketch, professional consultation.
                    </p>
                  </div>

                  <div
                    onClick={() => {
                      const newRate = 6500;
                      updatePkgConfig((c) => ({
                        ...c,
                        inspection: { ...c.inspection, enabled: true, fee: newRate },
                      }));
                      onChange({
                        ...invoice,
                        floors: invoice.floors.map((floor) => {
                          if (floor.unitLabel === 'Visit' || floor.floorName.toLowerCase().includes('ins') || invoice.invoiceCategory === 'inspection') {
                            const v = typeof floor.quantity === 'number' ? floor.quantity : 1;
                            return {
                              ...floor,
                              customRate: newRate,
                              rateLabel: `${newRate.toLocaleString()} / Visit`,
                              amountOverride: v * newRate,
                            };
                          }
                          return floor;
                        }),
                      });
                    }}
                    className={`p-2.5 rounded-lg border cursor-pointer transition ${
                      pkgConfig.inspection.fee === 6500
                        ? 'border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500/50'
                        : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-emerald-400">ADVISORY VISIT</span>
                      <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-900/40 px-2 py-0.5 rounded">
                        GMD 6,500 Fixed
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Multi-stage site visits, contour review, soil condition assessment & advisory.
                    </p>
                  </div>
                </div>

                {/* Dedicated Site Inspection Visits Schedule Table (Uses QTY of visits instead of Area/Scope) */}
                <div className="p-3.5 bg-slate-950 border border-amber-500/30 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                        <HardHat className="w-3.5 h-3.5 text-amber-400" />
                        Site Inspection Visits Schedule (Uses QTY of Visits — Not Per M²)
                      </h5>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Charged as fixed fee per visit or fixed advisory. Override any visits count, fee, or description text below.
                      </p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30">
                      USES QTY (VISITS)
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
                      <div className="col-span-5">Visit Scope / Inspection Description</div>
                      <div className="col-span-2 text-right">QTY (Visits)</div>
                      <div className="col-span-3 text-right">Rate / Visit ({invoice.currency})</div>
                      <div className="col-span-2 text-right">Action</div>
                    </div>

                    {invoice.floors.map((floor) => {
                      const visits = typeof floor.quantity === 'number' ? floor.quantity : (floor.area > 0 ? floor.area : 1);
                      const rate = typeof floor.customRate === 'number' ? floor.customRate : (pkgConfig.inspection.fee || 15000);
                      const visitTotal = typeof floor.amountOverride === 'number' ? floor.amountOverride : visits * rate;

                      return (
                        <div
                          key={floor.id}
                          className="grid grid-cols-12 gap-2 items-center bg-slate-900/90 border border-amber-500/30 p-2.5 rounded-lg hover:border-amber-500/60 transition-colors"
                        >
                          <div className="col-span-5 space-y-1">
                            <input
                              type="text"
                              value={floor.floorName}
                              onChange={(e) => updateFloor(floor.id, { floorName: e.target.value })}
                              placeholder="e.g. On-Site Technical Field Inspection & Compliance Audit"
                              className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded text-white focus:outline-hidden focus:border-amber-500"
                            />
                            {floor.deliverables && floor.deliverables.length > 0 && (
                              <div className="text-[10px] text-amber-400/80 font-mono truncate">
                                Includes: {floor.deliverables.slice(0, 3).join(', ')}
                              </div>
                            )}
                          </div>

                          <div className="col-span-2">
                            <div className="relative">
                              <input
                                type="number"
                                step="1"
                                min="1"
                                value={visits}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 1;
                                  updateFloor(floor.id, {
                                    quantity: val,
                                    area: val,
                                    areaLabel: `${val} ${val === 1 ? 'Visit' : 'Visits'}`,
                                    amountOverride: val * rate,
                                  });
                                }}
                                className="w-full text-right px-2.5 py-1.5 text-xs font-mono tabular-nums bg-slate-950 border border-slate-700 rounded text-amber-300 focus:outline-hidden focus:border-amber-500"
                              />
                              <span className="absolute right-2 top-2 text-[10px] text-slate-500 pointer-events-none">
                                {floor.unitLabel || (visits === 1 ? 'Visit' : 'Visits')}
                              </span>
                            </div>
                          </div>

                          <div className="col-span-3">
                            <div className="relative">
                              <input
                                type="number"
                                step="500"
                                min="0"
                                value={rate}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  updateFloor(floor.id, {
                                    customRate: val,
                                    rateLabel: `${val.toLocaleString()} / Visit`,
                                    amountOverride: visits * val,
                                  });
                                  updatePkgConfig((c) => ({ ...c, inspection: { ...c.inspection, fee: val } }));
                                }}
                                className="w-full text-right px-2.5 py-1.5 text-xs font-mono tabular-nums bg-slate-950 border border-slate-700 rounded text-amber-300 focus:outline-hidden focus:border-amber-500"
                              />
                              <span className="text-[10px] text-slate-400 block text-right mt-0.5 font-mono">
                                ={formatCurrency(visitTotal, invoice.currency)}
                              </span>
                            </div>
                          </div>

                          <div className="col-span-2 flex items-center justify-end">
                            <button
                              type="button"
                              onClick={() => deleteFloor(floor.id)}
                              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                              title="Remove visit item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => addInspectionItem('On-Site Technical Field Inspection Visit', pkgConfig.inspection.fee || 15000, 1)}
                      className="w-full py-2 border border-dashed border-amber-500/40 hover:border-amber-500 hover:bg-amber-950/20 text-amber-300 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Add On-Site Field Visit
                    </button>
                  </div>
                </div>

                {/* Service List / Included Services (Editable as requested!) */}
                <div className="p-3.5 bg-slate-950/80 border border-amber-500/30 rounded-lg space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-amber-400" />
                      Service List (Included Services - Editable)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updatePkgConfig((c) => ({
                          ...c,
                          inspection: {
                            ...c.inspection,
                            servicesList: [...SITE_INSPECTION_PACKAGE.includes],
                          },
                        }))
                      }
                      className="text-[11px] text-slate-400 hover:text-amber-400 underline cursor-pointer"
                    >
                      Reset Standard
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {(pkgConfig.inspection.servicesList || SITE_INSPECTION_PACKAGE.includes).map((service, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={service}
                          onChange={(e) => editInspectionService(idx, e.target.value)}
                          className="flex-1 px-2.5 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-slate-200 focus:outline-hidden focus:border-amber-500"
                        />
                        <button
                          type="button"
                          onClick={() => removeInspectionService(idx)}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded cursor-pointer"
                          title="Remove service"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add service input */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                    <input
                      type="text"
                      placeholder="Add new included service..."
                      value={newServiceInput}
                      onChange={(e) => setNewServiceInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addInspectionService(newServiceInput);
                        }
                      }}
                      className="flex-1 px-2.5 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-white focus:outline-hidden focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => addInspectionService(newServiceInput)}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded transition cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Official Deliverables (Editable as requested!) */}
                <div className="p-3.5 bg-slate-950/80 border border-slate-700 rounded-lg space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-400" />
                      Official Deliverables (Editable)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updatePkgConfig((c) => ({
                          ...c,
                          inspection: {
                            ...c.inspection,
                            officialDeliverables: [...SITE_INSPECTION_PACKAGE.officialDeliverables],
                          },
                        }))
                      }
                      className="text-[11px] text-slate-400 hover:text-amber-400 underline cursor-pointer"
                    >
                      Reset Standard
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {(pkgConfig.inspection.officialDeliverables || SITE_INSPECTION_PACKAGE.officialDeliverables).map((deliv, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={deliv}
                          onChange={(e) => editInspectionOfficialDeliverable(idx, e.target.value)}
                          className="flex-1 px-2.5 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-slate-200 focus:outline-hidden focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => removeInspectionOfficialDeliverable(idx)}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded cursor-pointer"
                          title="Remove deliverable"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add official deliverable input */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                    <input
                      type="text"
                      placeholder="Add new official deliverable..."
                      value={newOfficialInput}
                      onChange={(e) => setNewOfficialInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addInspectionOfficialDeliverable(newOfficialInput);
                        }
                      }}
                      className="flex-1 px-2.5 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-white focus:outline-hidden focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => addInspectionOfficialDeliverable(newOfficialInput)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded transition cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Schedule Totals Bar */}
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-xs">
              <div className="text-slate-400">
                Total Covered Area:{' '}
                <span className="font-mono font-bold text-white text-sm tabular-nums">
                  {calculations.totalArea.toFixed(2)} {invoice.unit}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-[11px] block">Active Packages Total:</span>
                <span className="font-mono font-bold text-amber-400 text-sm tabular-nums">
                  {formatCurrency(calculations.grandTotal, invoice.currency)}
                </span>
              </div>
            </div>

            {/* Additional Notes input */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wide">
                Additional Notes & Specifications
              </label>
              <textarea
                rows={3}
                value={invoice.additionalNotes}
                onChange={(e) => onChange({ ...invoice, additionalNotes: e.target.value })}
                placeholder="Specific client instructions, structural notes, swimming pool or roof pergola details..."
                className="w-full p-2.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-hidden focus:border-amber-500 leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* ================= TAB 2: SEPARATE PACKAGES & PRINT HUB ================= */}
        {activeTab === 'packages' && (
          <div className="space-y-6">
            {/* Header info */}
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Separate Invoice Packages & Multi-Print Studio
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage each package independently. Configure tiers, print only ONE package at a time, or combine any two or more into a consolidated invoice.
              </p>
            </div>

            {/* 1. MASTER PRINT HUB (DIRECT SINGLE-PACKAGE & COMBINED PRINTING) */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-[#0b2341] border border-blue-500/40 rounded-xl p-4 shadow-xl space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-400/10 rounded border border-amber-500/30 text-amber-400">
                    <Printer className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Print One Package at a Time (1-Click Standalone)
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Instantly opens Print Preview with that single package isolated, its exact fee, 50% advance deposit, and terms.
                    </p>
                  </div>
                </div>

                {onPrintPreview && (
                  <button
                    type="button"
                    onClick={() => onPrintPreview(PACKAGE_PRESETS.all)}
                    className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print All Active Packages ({pkgSummaries.activeCount})</span>
                  </button>
                )}
              </div>

              {/* Direct Standalone Print Preset Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => onPrintPreview?.(PACKAGE_PRESETS.architectural)}
                  className="p-2.5 bg-slate-900/90 hover:bg-blue-950/80 border border-blue-500/40 hover:border-blue-400 rounded-lg text-left transition cursor-pointer group shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-300 group-hover:text-white flex items-center gap-1">
                      <span>🏛️ Architectural</span>
                    </span>
                    <Printer className="w-3 h-3 text-blue-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Print Architectural Package ({pkgConfig.architectural.tier.toUpperCase()})
                  </div>
                  <div className="text-xs font-mono font-bold text-amber-400 mt-0.5">
                    {formatCurrency(pkgSummaries.packages.architectural.subtotal, invoice.currency)}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onPrintPreview?.(PACKAGE_PRESETS.structural)}
                  className="p-2.5 bg-slate-900/90 hover:bg-indigo-950/80 border border-indigo-500/40 hover:border-indigo-400 rounded-lg text-left transition cursor-pointer group shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300 group-hover:text-white flex items-center gap-1">
                      <span>🏗️ Structural</span>
                    </span>
                    <Printer className="w-3 h-3 text-indigo-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Print Structural Package ({pkgConfig.structural.tier.toUpperCase()})
                  </div>
                  <div className="text-xs font-mono font-bold text-amber-400 mt-0.5">
                    {formatCurrency(pkgSummaries.packages.structural.subtotal, invoice.currency)}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onPrintPreview?.(PACKAGE_PRESETS.boq)}
                  className="p-2.5 bg-slate-900/90 hover:bg-emerald-950/80 border border-emerald-500/40 hover:border-emerald-400 rounded-lg text-left transition cursor-pointer group shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300 group-hover:text-white flex items-center gap-1">
                      <span>📊 BOQ Package</span>
                    </span>
                    <Printer className="w-3 h-3 text-emerald-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Print BOQ Package ({pkgConfig.boq.tier.toUpperCase()})
                  </div>
                  <div className="text-xs font-mono font-bold text-amber-400 mt-0.5">
                    {formatCurrency(pkgSummaries.packages.boq.subtotal, invoice.currency)}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onPrintPreview?.(PACKAGE_PRESETS.inspection)}
                  className="p-2.5 bg-slate-900/90 hover:bg-amber-950/80 border border-amber-500/40 hover:border-amber-400 rounded-lg text-left transition cursor-pointer group shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 group-hover:text-white flex items-center gap-1">
                      <span>🔍 Site Inspection</span>
                    </span>
                    <Printer className="w-3 h-3 text-amber-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Print Site Inspection Package
                  </div>
                  <div className="text-xs font-mono font-bold text-amber-400 mt-0.5">
                    {formatCurrency(pkgSummaries.packages.inspection.subtotal, invoice.currency)}
                  </div>
                </button>
              </div>

              {/* 2. CUSTOM COMBINATION TOOL (COMBINE ANY TWO OR MORE) */}
              <div className="bg-slate-950/80 border border-purple-500/30 rounded-lg p-3 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5 uppercase tracking-wide">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" />
                    Combine Any Two or Three Packages to Print
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setCombineSelection({
                          architectural: true,
                          structural: true,
                          boq: false,
                          inspection: false,
                          addons: false,
                        })
                      }
                      className="px-2 py-0.5 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded cursor-pointer"
                    >
                      Arch + Structural
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCombineSelection({
                          architectural: true,
                          structural: false,
                          boq: true,
                          inspection: false,
                          addons: false,
                        })
                      }
                      className="px-2 py-0.5 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded cursor-pointer"
                    >
                      Arch + BOQ
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCombineSelection({
                          architectural: false,
                          structural: true,
                          boq: true,
                          inspection: false,
                          addons: false,
                        })
                      }
                      className="px-2 py-0.5 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded cursor-pointer"
                    >
                      Structural + BOQ
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <label
                    className={`flex items-start gap-2 p-2 rounded border cursor-pointer transition ${
                      combineSelection.architectural
                        ? 'bg-blue-950/60 border-blue-500 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={combineSelection.architectural}
                      onChange={() => handleTogglePackageInCombine('architectural')}
                      className="mt-0.5 rounded border-slate-700 text-blue-500 focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-xs font-semibold">🏛️ Arch</div>
                      <div className="text-[10px] text-slate-400">
                        {formatCurrency(pkgSummaries.packages.architectural.subtotal, invoice.currency)}
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2 p-2 rounded border cursor-pointer transition ${
                      combineSelection.structural
                        ? 'bg-indigo-950/60 border-indigo-500 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={combineSelection.structural}
                      onChange={() => handleTogglePackageInCombine('structural')}
                      className="mt-0.5 rounded border-slate-700 text-indigo-500 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="text-xs font-semibold">🏗️ Struct</div>
                      <div className="text-[10px] text-slate-400">
                        {formatCurrency(pkgSummaries.packages.structural.subtotal, invoice.currency)}
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2 p-2 rounded border cursor-pointer transition ${
                      combineSelection.boq
                        ? 'bg-emerald-950/60 border-emerald-500 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={combineSelection.boq}
                      onChange={() => handleTogglePackageInCombine('boq')}
                      className="mt-0.5 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                    />
                    <div>
                      <div className="text-xs font-semibold">📊 BOQ</div>
                      <div className="text-[10px] text-slate-400">
                        {formatCurrency(pkgSummaries.packages.boq.subtotal, invoice.currency)}
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2 p-2 rounded border cursor-pointer transition ${
                      combineSelection.inspection
                        ? 'bg-amber-950/60 border-amber-500 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={combineSelection.inspection}
                      onChange={() => handleTogglePackageInCombine('inspection')}
                      className="mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                    />
                    <div>
                      <div className="text-xs font-semibold">🔍 Site Insp</div>
                      <div className="text-[10px] text-slate-400">
                        {formatCurrency(pkgSummaries.packages.inspection.subtotal, invoice.currency)}
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2 p-2 rounded border cursor-pointer transition ${
                      combineSelection.addons
                        ? 'bg-purple-950/60 border-purple-500 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={combineSelection.addons}
                      onChange={() => handleTogglePackageInCombine('addons')}
                      className="mt-0.5 rounded border-slate-700 text-purple-500 focus:ring-purple-500"
                    />
                    <div>
                      <div className="text-xs font-semibold">⚡ Add-ons</div>
                      <div className="text-[10px] text-slate-400">
                        {formatCurrency(pkgSummaries.packages.addons.subtotal, invoice.currency)}
                      </div>
                    </div>
                  </label>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-300">
                    Combined ({combineActiveCount} packages):{' '}
                    <strong className="text-amber-400 font-mono">
                      {formatCurrency(combineGrandTotal, invoice.currency)}
                    </strong>
                  </span>

                  {onPrintPreview && (
                    <button
                      type="button"
                      onClick={() => onPrintPreview(combineSelection)}
                      disabled={combineActiveCount === 0}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print This Combination</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ================= SEPARATE PACKAGE CARDS ================= */}

            {/* PACKAGE 1: ARCHITECTURAL DRAWING PACKAGE */}
            <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-xl space-y-3.5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-950/80 border border-blue-500/40 rounded-lg text-blue-400 font-bold">
                    🏛️
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                        01 Architectural Drawing Package
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-600/40">
                        {pkgConfig.architectural.tier.toUpperCase()} TIER
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Concept design, floor plans, 3D exterior visualizer, sections & municipal building approval set.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-amber-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                    {formatCurrency(pkgSummaries.packages.architectural.subtotal, invoice.currency)}
                  </span>
                  {onPrintPreview && (
                    <button
                      type="button"
                      onClick={() => onPrintPreview(PACKAGE_PRESETS.architectural)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded flex items-center gap-1 transition cursor-pointer"
                      title="Print this Architectural Package"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Print Package</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Architectural Tier Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => selectPackage('regular')}
                  className={`p-3 rounded-lg border cursor-pointer transition ${
                    pkgConfig.architectural.tier === 'regular'
                      ? 'border-blue-500 bg-blue-950/30 ring-1 ring-blue-500/50'
                      : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-blue-400">REGULAR PACKAGE</span>
                    <span className="text-xs font-mono font-bold text-white bg-blue-900/50 px-2 py-0.5 rounded">
                      {invoice.currency} 75 /{invoice.unit}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Floor plans, elevations, sections, roof plan, door/window schedule & permit PDF.
                  </p>
                </div>

                <div
                  onClick={() => selectPackage('premium')}
                  className={`p-3 rounded-lg border cursor-pointer transition ${
                    pkgConfig.architectural.tier === 'premium'
                      ? 'border-amber-500 bg-amber-950/20 ring-1 ring-amber-500/50'
                      : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-amber-400">PREMIUM PACKAGE</span>
                    <span className="text-xs font-mono font-bold text-amber-300 bg-amber-900/40 px-2 py-0.5 rounded">
                      {invoice.currency} 100 /{invoice.unit}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Includes Regular plus 3D walkthrough, joinery, interior design layouts & ceiling plans.
                  </p>
                </div>
              </div>

              {/* Architectural Custom Rate */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-xs">
                <span className="text-slate-300">
                  Floor Area: <strong className="text-white font-mono">{pkgSummaries.totalArea} {invoice.unit}</strong> (from Floors schedule)
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Rate Override:</span>
                  <input
                    type="number"
                    min="1"
                    value={pkgConfig.architectural.rate}
                    onChange={(e) => {
                      const r = parseFloat(e.target.value) || 0;
                      updatePkgConfig((c) => ({
                        ...c,
                        architectural: { ...c.architectural, tier: 'custom', rate: r },
                      }));
                    }}
                    className="w-20 px-2 py-1 text-xs font-mono text-right bg-slate-800 border border-slate-700 rounded text-amber-300 focus:outline-hidden"
                  />
                  <span className="text-slate-400">{invoice.currency}/{invoice.unit}</span>
                </div>
              </div>
            </div>

            {/* PACKAGE 2: STRUCTURAL ENGINEERING PACKAGE */}
            <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-xl space-y-3.5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-950/80 border border-indigo-500/40 rounded-lg text-indigo-400 font-bold">
                    🏗️
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                        02 Structural Engineering Package
                      </h4>
                      <label className="flex items-center gap-1.5 cursor-pointer ml-1">
                        <input
                          type="checkbox"
                          checked={pkgConfig.structural.enabled}
                          onChange={() =>
                            updatePkgConfig((c) => ({
                              ...c,
                              structural: { ...c.structural, enabled: !c.structural.enabled },
                            }))
                          }
                          className="rounded border-slate-700 text-indigo-500 focus:ring-indigo-500"
                        />
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          pkgConfig.structural.enabled
                            ? 'bg-indigo-900/60 text-indigo-200 border-indigo-500/40'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {pkgConfig.structural.enabled ? 'INCLUDED' : 'DISABLED'}
                        </span>
                      </label>
                    </div>
                    <p className="text-xs text-slate-400">
                      Foundation engineering, column/beam schedules, slab design, Bar Bending Schedule (BBS) & calculations.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-amber-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                    {formatCurrency(pkgSummaries.packages.structural.subtotal, invoice.currency)}
                  </span>
                  {onPrintPreview && (
                    <button
                      type="button"
                      onClick={() => onPrintPreview(PACKAGE_PRESETS.structural)}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded flex items-center gap-1 transition cursor-pointer"
                      title="Print only this Structural package"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Print Package</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Structural Tiers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() =>
                    updatePkgConfig((c) => ({
                      ...c,
                      structural: { ...c.structural, enabled: true, tier: 'regular', rate: 65 },
                    }))
                  }
                  className={`p-3 rounded-lg border cursor-pointer transition ${
                    pkgConfig.structural.tier === 'regular'
                      ? 'border-indigo-500 bg-indigo-950/30 ring-1 ring-indigo-500/50'
                      : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-indigo-400">REGULAR STRUCTURAL</span>
                    <span className="text-xs font-mono font-bold text-white bg-indigo-900/50 px-2 py-0.5 rounded">
                      {invoice.currency} 65 /{invoice.unit}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Foundation design, column layout, beam layout, slab layout, roof structure & structural notes.
                  </p>
                </div>

                <div
                  onClick={() =>
                    updatePkgConfig((c) => ({
                      ...c,
                      structural: { ...c.structural, enabled: true, tier: 'premium', rate: 85 },
                    }))
                  }
                  className={`p-3 rounded-lg border cursor-pointer transition ${
                    pkgConfig.structural.tier === 'premium'
                      ? 'border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500/50'
                      : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-emerald-400">PREMIUM STRUCTURAL</span>
                    <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-900/40 px-2 py-0.5 rounded">
                      {invoice.currency} 85 /{invoice.unit}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Includes Regular plus Bar Bending Schedule (BBS), structural calculations report & stair reinforcement.
                  </p>
                </div>
              </div>

              {/* Structural Scope Area & Rate Override */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Structural Scope Area:</span>
                  <input
                    type="number"
                    min="1"
                    value={pkgConfig.structural.area ?? pkgSummaries.totalArea}
                    onChange={(e) => {
                      const a = parseFloat(e.target.value) || 0;
                      updatePkgConfig((c) => ({
                        ...c,
                        structural: { ...c.structural, area: a },
                      }));
                    }}
                    className="w-20 px-2 py-1 text-xs font-mono text-right bg-slate-800 border border-slate-700 rounded text-indigo-300 focus:outline-hidden"
                  />
                  <span className="text-slate-400">{invoice.unit}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Rate:</span>
                  <input
                    type="number"
                    min="1"
                    value={pkgConfig.structural.rate}
                    onChange={(e) => {
                      const r = parseFloat(e.target.value) || 0;
                      updatePkgConfig((c) => ({
                        ...c,
                        structural: { ...c.structural, tier: 'custom', rate: r },
                      }));
                    }}
                    className="w-20 px-2 py-1 text-xs font-mono text-right bg-slate-800 border border-slate-700 rounded text-amber-300 focus:outline-hidden"
                  />
                  <span className="text-slate-400">{invoice.currency}/{invoice.unit}</span>
                </div>
              </div>
            </div>

            {/* PACKAGE 3: BILLS OF QUANTITIES (BOQ) PACKAGE */}
            <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-xl space-y-3.5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-950/80 border border-emerald-500/40 rounded-lg text-emerald-400 font-bold">
                    📊
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                        03 Bills of Quantities (BOQ) Package
                      </h4>
                      <label className="flex items-center gap-1.5 cursor-pointer ml-1">
                        <input
                          type="checkbox"
                          checked={pkgConfig.boq.enabled}
                          onChange={() =>
                            updatePkgConfig((c) => ({
                              ...c,
                              boq: { ...c.boq, enabled: !c.boq.enabled },
                            }))
                          }
                          className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                        />
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          pkgConfig.boq.enabled
                            ? 'bg-emerald-900/60 text-emerald-200 border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {pkgConfig.boq.enabled ? 'INCLUDED' : 'DISABLED'}
                        </span>
                      </label>
                    </div>
                    <p className="text-xs text-slate-400">
                      Material takeoff, labor cost breakdown, trade pricing, cashflow & tender documentation.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-amber-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                    {formatCurrency(pkgSummaries.packages.boq.subtotal, invoice.currency)}
                  </span>
                  {onPrintPreview && (
                    <button
                      type="button"
                      onClick={() => onPrintPreview(PACKAGE_PRESETS.boq)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded flex items-center gap-1 transition cursor-pointer"
                      title="Print only this BOQ package"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Print Package</span>
                    </button>
                  )}
                </div>
              </div>

              {/* BOQ Tiers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => {
                    const fee = getBOQPackageFee(pkgSummaries.totalArea, 'regular');
                    updatePkgConfig((c) => ({
                      ...c,
                      boq: { ...c.boq, enabled: true, tier: 'regular', fee },
                    }));
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition ${
                    pkgConfig.boq.tier === 'regular'
                      ? 'border-blue-500 bg-blue-950/30 ring-1 ring-blue-500/50'
                      : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-blue-400">REGULAR BOQ</span>
                    <span className="text-xs font-mono font-bold text-white bg-blue-900/50 px-2 py-0.5 rounded">
                      GMD 18k – 25k
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Quantity takeoff, material & labor summary, detailed trade BOQ & report.
                  </p>
                </div>

                <div
                  onClick={() => {
                    const fee = getBOQPackageFee(pkgSummaries.totalArea, 'premium');
                    updatePkgConfig((c) => ({
                      ...c,
                      boq: { ...c.boq, enabled: true, tier: 'premium', fee },
                    }));
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition ${
                    pkgConfig.boq.tier === 'premium'
                      ? 'border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500/50'
                      : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-emerald-400">PREMIUM BOQ</span>
                    <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-900/40 px-2 py-0.5 rounded">
                      GMD 30k – 65k
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Comprehensive quantity surveying, procurement schedule, tender docs & quality control.
                  </p>
                </div>
              </div>

              {/* BOQ Fee Input */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-xs">
                <span className="text-slate-400">
                  Tier Bracket: 100-500 m² (18k/30k) • 500-1,000 m² (20k/45k) • 1,000+ m² (25k/65k)
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Agreed Fee:</span>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    value={pkgConfig.boq.fee}
                    onChange={(e) => {
                      const f = parseFloat(e.target.value) || 0;
                      updatePkgConfig((c) => ({
                        ...c,
                        boq: { ...c.boq, tier: 'custom', fee: f },
                      }));
                    }}
                    className="w-28 px-2 py-1 text-xs font-mono text-right bg-slate-800 border border-slate-700 rounded text-amber-300 focus:outline-hidden"
                  />
                  <span className="text-slate-400">{invoice.currency}</span>
                </div>
              </div>
            </div>

            {/* PACKAGE 4: SITE INSPECTION & REPORTS PACKAGE */}
            <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-xl space-y-3.5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-950/80 border border-amber-500/40 rounded-lg text-amber-400 font-bold">
                    🔍
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                        04 Site Inspection & Reports Package
                      </h4>
                      <label className="flex items-center gap-1.5 cursor-pointer ml-1">
                        <input
                          type="checkbox"
                          checked={pkgConfig.inspection.enabled}
                          onChange={() =>
                            updatePkgConfig((c) => ({
                              ...c,
                              inspection: { ...c.inspection, enabled: !c.inspection.enabled },
                            }))
                          }
                          className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                        />
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          pkgConfig.inspection.enabled
                            ? 'bg-amber-900/60 text-amber-200 border-amber-500/40'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {pkgConfig.inspection.enabled ? 'INCLUDED' : 'DISABLED'}
                        </span>
                      </label>
                    </div>
                    <p className="text-xs text-slate-400">
                      On-site inspection, boundary & terrain sketch plans, professional consultation & certified report.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-amber-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                    {formatCurrency(pkgSummaries.packages.inspection.subtotal, invoice.currency)}
                  </span>
                  {onPrintPreview && (
                    <button
                      type="button"
                      onClick={() => onPrintPreview(PACKAGE_PRESETS.inspection)}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded flex items-center gap-1 transition cursor-pointer"
                      title="Print only this Site Inspection package"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Print Package</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Site Inspection Tiers (Standard vs Comprehensive) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() =>
                    updatePkgConfig((c) => ({
                      ...c,
                      inspection: { ...c.inspection, enabled: true, fee: 3500 },
                    }))
                  }
                  className={`p-3 rounded-lg border cursor-pointer transition ${
                    pkgConfig.inspection.fee === 3500
                      ? 'border-amber-500 bg-amber-950/30 ring-1 ring-amber-500/50'
                      : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-amber-400">STANDARD INSPECTION</span>
                    <span className="text-xs font-mono font-bold text-white bg-amber-900/50 px-2 py-0.5 rounded">
                      GMD 3,500 Fixed
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Single on-site visit, boundary & terrain sketch plans, professional consultation & certified report.
                  </p>
                </div>

                <div
                  onClick={() =>
                    updatePkgConfig((c) => ({
                      ...c,
                      inspection: { ...c.inspection, enabled: true, fee: 6500 },
                    }))
                  }
                  className={`p-3 rounded-lg border cursor-pointer transition ${
                    pkgConfig.inspection.fee === 6500
                      ? 'border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500/50'
                      : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-emerald-400">COMPREHENSIVE ADVISORY</span>
                    <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-900/40 px-2 py-0.5 rounded">
                      GMD 6,500 Fixed
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Includes multi-stage site visits, topography & contour review, soil condition assessment & detailed advisory.
                  </p>
                </div>
              </div>

              {/* Inspection Fee input */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-xs">
                <span className="text-slate-300">
                  Select tier above or enter custom inspection fee:
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Inspection Fee:</span>
                  <input
                    type="number"
                    min="500"
                    step="500"
                    value={pkgConfig.inspection.fee}
                    onChange={(e) => {
                      const f = parseFloat(e.target.value) || 0;
                      updatePkgConfig((c) => ({
                        ...c,
                        inspection: { ...c.inspection, fee: f },
                      }));
                    }}
                    className="w-24 px-2 py-1 text-xs font-mono text-right bg-slate-800 border border-slate-700 rounded text-amber-300 focus:outline-hidden"
                  />
                  <span className="text-slate-400">{invoice.currency}</span>
                </div>
              </div>
            </div>

            {/* PACKAGE 5: ADDITIONAL DELIVERABLES & ADD-ONS */}
            <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-xl space-y-3.5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Additional Engineering & Architectural Deliverables
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-amber-400">
                    +{formatCurrency(pkgSummaries.packages.addons.subtotal, invoice.currency)}
                  </span>
                  {onPrintPreview && pkgSummaries.packages.addons.subtotal > 0 && (
                    <button
                      type="button"
                      onClick={() => onPrintPreview(PACKAGE_PRESETS.addons)}
                      className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded flex items-center gap-1 transition cursor-pointer"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Print Addons</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {ARCHITECTURAL_ADDONS_PRESETS.map((addon) => {
                  const isEnabled = invoice.addons.some((a) => a.id === addon.id && a.enabled);
                  return (
                    <label
                      key={addon.id}
                      className={`flex items-start justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        isEnabled
                          ? 'border-amber-500/60 bg-amber-950/20'
                          : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={() => toggleAddon(addon.id)}
                          className="mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                        />
                        <div>
                          <div className="text-xs font-semibold text-white">{addon.name}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{addon.description}</div>
                        </div>
                      </div>
                      <div className="text-xs font-mono font-bold text-slate-200 shrink-0 ml-3">
                        {formatCurrency(addon.amount, invoice.currency)}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Flyer Portals Launcher */}
            <div className="bg-gradient-to-r from-slate-900 to-[#0b2341] border border-blue-500/40 rounded-xl p-4 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Official Flyer Portals (Interactive Calculators)
                  </span>
                </div>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 font-semibold px-2 py-0.5 rounded border border-blue-400/30">
                  SEPARATE PORTALS
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Launch full-page standalone portals with live matrixes, rate tables, and official specifications.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {onOpenArchitecturalPortal && (
                  <button
                    type="button"
                    onClick={onOpenArchitecturalPortal}
                    className="flex items-center justify-between px-3 py-2 bg-indigo-900/60 hover:bg-indigo-800/80 border border-indigo-500/50 rounded-lg text-xs font-semibold text-indigo-200 transition shadow-sm cursor-pointer"
                  >
                    <span>🏛️ Architectural</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
                {onOpenStructuralPortal && (
                  <button
                    type="button"
                    onClick={onOpenStructuralPortal}
                    className="flex items-center justify-between px-3 py-2 bg-blue-900/60 hover:bg-blue-800/80 border border-blue-500/50 rounded-lg text-xs font-semibold text-blue-200 transition shadow-sm cursor-pointer"
                  >
                    <span>🏗️ Structural</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
                {onOpenBOQPortal && (
                  <button
                    type="button"
                    onClick={onOpenBOQPortal}
                    className="flex items-center justify-between px-3 py-2 bg-emerald-900/60 hover:bg-emerald-800/80 border border-emerald-500/50 rounded-lg text-xs font-semibold text-emerald-200 transition shadow-sm cursor-pointer"
                  >
                    <span>📊 BOQ Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
                {onOpenPackagesPortal && (
                  <button
                    type="button"
                    onClick={onOpenPackagesPortal}
                    className="flex items-center justify-between px-3 py-2 bg-amber-900/60 hover:bg-amber-800/80 border border-amber-500/50 rounded-lg text-xs font-semibold text-amber-200 transition shadow-sm cursor-pointer"
                  >
                    <span>🏷️ Packages Hub</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: CLIENT & PROJECT ================= */}
        {activeTab === 'project' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-amber-400" />
                Client & Project Identification
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Matches the Client Information and Project Information boxes on the official Univision invoice.
              </p>
            </div>

            {/* Client Info Section */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <User className="w-3.5 h-3.5" /> Client Information
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Client Full Name</label>
                  <input
                    type="text"
                    value={invoice.client.name}
                    onChange={(e) => updateClient('name', e.target.value)}
                    placeholder="e.g. Amadou Lamin Jallow"
                    className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded text-white focus:outline-hidden focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={invoice.client.phone}
                    onChange={(e) => updateClient('phone', e.target.value)}
                    placeholder="e.g. +220 7891234"
                    className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded text-white focus:outline-hidden focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={invoice.client.email}
                    onChange={(e) => updateClient('email', e.target.value)}
                    placeholder="e.g. amadou.jallow@example.gm"
                    className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded text-white focus:outline-hidden focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Client Physical Address</label>
                  <input
                    type="text"
                    value={invoice.client.address}
                    onChange={(e) => updateClient('address', e.target.value)}
                    placeholder="e.g. Brufut Heights, Layout Phase 2"
                    className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded text-white focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Project Info Section */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" /> Project Information
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-slate-400 mb-1">Project Name / Description</label>
                  <input
                    type="text"
                    value={invoice.project.projectName}
                    onChange={(e) => updateProject('projectName', e.target.value)}
                    placeholder="e.g. Modern 5-Bedroom Residential Villa"
                    className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded text-white focus:outline-hidden focus:border-amber-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-slate-400 mb-1">Project Site Address</label>
                  <input
                    type="text"
                    value={invoice.project.projectAddress}
                    onChange={(e) => updateProject('projectAddress', e.target.value)}
                    placeholder="e.g. Plot 42, Sukuta Dalaba Extension"
                    className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded text-white focus:outline-hidden focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">City / Province / Region</label>
                  <input
                    type="text"
                    value={invoice.project.cityProvince}
                    onChange={(e) => updateProject('cityProvince', e.target.value)}
                    placeholder="e.g. West Coast Region"
                    className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded text-white focus:outline-hidden focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Postal Code</label>
                  <input
                    type="text"
                    value={invoice.project.postalCode}
                    onChange={(e) => updateProject('postalCode', e.target.value)}
                    placeholder="e.g. WCR-SKT"
                    className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded text-white focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Invoice Meta Numbers */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Invoice Number</label>
                <input
                  type="text"
                  value={invoice.invoiceNumber}
                  onChange={(e) => onChange({ ...invoice, invoiceNumber: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-slate-900 border border-slate-700 rounded text-amber-400 focus:outline-hidden focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Issue Date</label>
                <input
                  type="date"
                  value={invoice.date}
                  onChange={(e) => onChange({ ...invoice, date: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded text-white focus:outline-hidden focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Due Date</label>
                <input
                  type="date"
                  value={invoice.dueDate || ''}
                  onChange={(e) => onChange({ ...invoice, dueDate: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded text-white focus:outline-hidden focus:border-amber-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: ADVANCE & PRICING ================= */}
        {activeTab === 'financials' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-400" />
                Advance Deposit & Financial Breakdown
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure advance deposit requirements, commercial discounts, VAT, and currency units.
              </p>
            </div>

            {/* Currency & Unit Configuration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-950 border border-slate-800 rounded-lg">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Currency</label>
                <select
                  value={invoice.currency}
                  onChange={(e) =>
                    onChange({ ...invoice, currency: e.target.value as CurrencyCode })
                  }
                  className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded text-white focus:outline-hidden focus:border-amber-500 font-mono"
                >
                  <option value="GMD">GMD - Gambian Dalasi (Official)</option>
                  <option value="USD">USD - US Dollar ($)</option>
                  <option value="EUR">EUR - Euro (€)</option>
                  <option value="GBP">GBP - British Pound (£)</option>
                  <option value="XOF">XOF - West African CFA Franc</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Measurement Unit</label>
                <select
                  value={invoice.unit}
                  onChange={(e) =>
                    onChange({ ...invoice, unit: e.target.value as MeasurementUnit })
                  }
                  className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded text-white focus:outline-hidden focus:border-amber-500 font-mono"
                >
                  <option value="m²">Square Metres (m²) - Standard</option>
                  <option value="sq ft">Square Feet (sq ft)</option>
                </select>
              </div>
            </div>

            {/* Advance Deposit Section */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Advance Commencement Deposit
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Univision work commences upon receipt of agreed advance deposit (Standard: 50%).
                  </p>
                </div>
                <div className="font-mono font-bold text-amber-400 text-sm tabular-nums">
                  {formatCurrency(calculations.depositRequiredAmount, invoice.currency)}
                </div>
              </div>

              {/* Deposit Quick Buttons */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                {[30, 50, 60, 70, 100].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => onChange({ ...invoice, depositPercent: pct })}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      invoice.depositPercent === pct
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {pct}% Deposit
                  </button>
                ))}
              </div>

              {/* Advance Deposit Percentage Custom Control */}
              <div className="flex items-center justify-between text-xs bg-slate-900/60 px-3 py-1.5 rounded-md border border-slate-800/80">
                <span className="text-[11px] text-slate-400">
                  Agreed Advance Rate: <strong className="text-amber-400 font-mono">{invoice.depositPercent}%</strong>
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400">Custom Rate:</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={invoice.depositPercent}
                    onChange={(e) =>
                      onChange({
                        ...invoice,
                        depositPercent: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)),
                      })
                    }
                    className="w-16 px-2 py-0.5 text-xs font-mono tabular-nums text-right bg-slate-950 border border-slate-700 rounded text-amber-400 focus:outline-hidden focus:border-amber-500"
                  />
                  <span className="text-xs text-slate-400 font-semibold">%</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] text-slate-400">
                      Deposit Already Received Amount
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        onChange({
                          ...invoice,
                          depositPaidAmount: calculations.depositRequiredAmount,
                          status: invoice.status === 'draft' || invoice.status === 'issued' ? 'deposit_paid' : invoice.status,
                        })
                      }
                      className="text-[10px] text-amber-400 hover:text-amber-300 underline cursor-pointer"
                      title="Set deposit paid to the required advance deposit"
                    >
                      Fill Advance ({invoice.depositPercent}%)
                    </button>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={invoice.depositPaidAmount}
                    onChange={(e) =>
                      onChange({
                        ...invoice,
                        depositPaidAmount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs font-mono tabular-nums bg-slate-900 border border-slate-700 rounded text-white focus:outline-hidden focus:border-amber-500"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] text-slate-400">
                      Remaining Balance on Delivery
                    </label>
                    <span className="text-[10px] text-slate-400">
                      ({100 - invoice.depositPercent}% of Total)
                    </span>
                  </div>
                  <div className="px-3 py-1.5 text-xs font-mono font-bold text-emerald-400 bg-slate-900 border border-slate-800 rounded tabular-nums flex items-center justify-between">
                    <span>{formatCurrency(calculations.balanceDue, invoice.currency)}</span>
                    <span className="text-[10px] font-sans text-slate-400 font-normal">
                      Total: {formatCurrency(calculations.grandTotal, invoice.currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Discount & Tax / VAT */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Discount Percentage (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={invoice.discountPercent}
                    onChange={(e) =>
                      onChange({
                        ...invoice,
                        discountPercent: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs font-mono bg-slate-900 border border-slate-700 rounded text-white focus:outline-hidden focus:border-amber-500"
                  />
                  <span className="text-xs text-slate-400">%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tax / VAT Percentage (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={invoice.taxPercent}
                    onChange={(e) =>
                      onChange({
                        ...invoice,
                        taxPercent: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs font-mono bg-slate-900 border border-slate-700 rounded text-white focus:outline-hidden focus:border-amber-500"
                  />
                  <span className="text-xs text-slate-400">%</span>
                </div>
              </div>
            </div>

            {/* Final Calculation Summary */}
            <div className="p-4 bg-[#0b2341] border border-blue-500/30 rounded-lg space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Drawing Package ({calculations.totalArea} {invoice.unit}):</span>
                <span className="font-mono tabular-nums">
                  {formatCurrency(calculations.drawingPackageTotal, invoice.currency)}
                </span>
              </div>
              {calculations.addonsTotal > 0 && (
                <div className="flex justify-between text-slate-300">
                  <span>Additional Services:</span>
                  <span className="font-mono tabular-nums">
                    +{formatCurrency(calculations.addonsTotal, invoice.currency)}
                  </span>
                </div>
              )}
              {calculations.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount ({invoice.discountPercent}%):</span>
                  <span className="font-mono tabular-nums">
                    -{formatCurrency(calculations.discountAmount, invoice.currency)}
                  </span>
                </div>
              )}
              {calculations.taxAmount > 0 && (
                <div className="flex justify-between text-slate-300">
                  <span>Tax ({invoice.taxPercent}%):</span>
                  <span className="font-mono tabular-nums">
                    +{formatCurrency(calculations.taxAmount, invoice.currency)}
                  </span>
                </div>
              )}
              <div className="pt-2 border-t border-blue-400/30 flex justify-between items-center text-sm font-bold text-white">
                <span className="uppercase tracking-wider">Total Amount:</span>
                <span className="text-amber-400 font-mono text-base tabular-nums">
                  {formatCurrency(calculations.grandTotal, invoice.currency)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 5: PAYMENT DETAILS ================= */}
        {activeTab === 'payment' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-400" />
                Banking & Payment Instructions
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Displays the payment box on the bottom right of the PDF invoice.
              </p>
            </div>

            {/* Quick Bank Presets */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1.5 uppercase font-bold tracking-wider">
                Select Company Account Preset (The Gambia)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {BANK_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() =>
                      onChange({
                        ...invoice,
                        paymentDetails: {
                          ...preset,
                          reference: invoice.paymentDetails.reference || invoice.invoiceNumber,
                        },
                      })
                    }
                    className={`p-2.5 text-left rounded-lg border text-xs transition-all ${
                      invoice.paymentDetails.bankName === preset.bankName
                        ? 'border-amber-500 bg-amber-950/20 text-white'
                        : 'border-slate-800 bg-slate-800/40 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold">{preset.bankName}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {preset.accountNumber}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Editable Fields */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={invoice.paymentDetails.bankName}
                    onChange={(e) => updatePaymentDetails('bankName', e.target.value)}
                    placeholder="e.g. Trust Bank Ltd"
                    className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded text-white focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    value={invoice.paymentDetails.accountName}
                    onChange={(e) => updatePaymentDetails('accountName', e.target.value)}
                    placeholder="UNIVISION DESIGN AND CONSTRUCTION LTD"
                    className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded text-white focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={invoice.paymentDetails.accountNumber}
                    onChange={(e) => updatePaymentDetails('accountNumber', e.target.value)}
                    placeholder="110-384920-01"
                    className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-slate-900 border border-slate-700 rounded text-amber-400 focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Payment Reference</label>
                  <input
                    type="text"
                    value={invoice.paymentDetails.reference}
                    onChange={(e) => updatePaymentDetails('reference', e.target.value)}
                    placeholder="INV-2026-084 / Project Name"
                    className="w-full px-3 py-1.5 text-xs font-mono bg-slate-900 border border-slate-700 rounded text-white focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Mobile Money Provider</label>
                  <input
                    type="text"
                    value={invoice.paymentDetails.mobileMoneyProvider || ''}
                    onChange={(e) => updatePaymentDetails('mobileMoneyProvider', e.target.value)}
                    placeholder="Wave / QMoney / Afrimoney"
                    className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded text-white focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Mobile Money Number</label>
                  <input
                    type="text"
                    value={invoice.paymentDetails.mobileMoneyNumber || ''}
                    onChange={(e) => updatePaymentDetails('mobileMoneyNumber', e.target.value)}
                    placeholder="+220 872104724"
                    className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded text-white focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 6: TERMS & SIGNATURE ================= */}
        {activeTab === 'terms' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                Terms & Conditions and Digital Signing
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage legal terms and collect authenticated digital signatures.
              </p>
            </div>

            {/* Terms List */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Terms & Conditions Clauses
                </h4>
                <button
                  type="button"
                  onClick={() => onChange({ ...invoice, terms: [...DEFAULT_TERMS] })}
                  className="text-[11px] text-amber-400 hover:underline"
                >
                  Reset to Univision Defaults
                </button>
              </div>

              <div className="space-y-2">
                {invoice.terms.map((term, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-mono w-4">{idx + 1}.</span>
                    <input
                      type="text"
                      value={term}
                      onChange={(e) => {
                        const newTerms = [...invoice.terms];
                        newTerms[idx] = e.target.value;
                        onChange({ ...invoice, terms: newTerms });
                      }}
                      className="flex-1 px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded text-slate-200 focus:outline-hidden focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newTerms = invoice.terms.filter((_, i) => i !== idx);
                        onChange({ ...invoice, terms: newTerms });
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-400 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...invoice,
                      terms: [...invoice.terms, 'New architectural agreement clause.'],
                    })
                  }
                  className="mt-2 text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Condition Clause
                </button>
              </div>
            </div>

            {/* Client Signature Manager */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <PenTool className="w-3.5 h-3.5 text-amber-400" />
                Client Digital Signature & Signer Date
              </h4>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 bg-slate-900 border border-slate-800 rounded-lg">
                <div className="flex-1">
                  <div className="text-xs text-slate-400 mb-1">Current Signature on File:</div>
                  {invoice.clientSignature ? (
                    invoice.clientSignatureType === 'draw' ? (
                      <div className="bg-white p-2 rounded max-w-xs">
                        <img
                          src={invoice.clientSignature}
                          alt="Signature"
                          className="max-h-12 object-contain"
                        />
                      </div>
                    ) : (
                      <div className="font-signature text-2xl text-amber-400">
                        {invoice.clientSignature}
                      </div>
                    )
                  ) : (
                    <span className="text-xs text-slate-500 italic">No signature recorded yet.</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onOpenSignatureModal}
                    className="px-4 py-2 text-xs font-bold bg-[#0b2341] hover:bg-[#133863] text-amber-400 border border-blue-500/40 rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    {invoice.clientSignature ? 'Update Signature' : 'Open Signature Pad'}
                  </button>

                  {invoice.clientSignature && (
                    <button
                      type="button"
                      onClick={() =>
                        onChange({
                          ...invoice,
                          clientSignature: '',
                          clientSignatureType: 'none',
                        })
                      }
                      className="px-3 py-2 text-xs text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Client Signature Date (mm/dd/yyyy)
                </label>
                <input
                  type="date"
                  value={invoice.clientSignDate || invoice.date}
                  onChange={(e) => onChange({ ...invoice, clientSignDate: e.target.value })}
                  className="w-full sm:w-64 px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded text-white focus:outline-hidden focus:border-amber-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <ServicePackageEditorModal
        isOpen={servicesModalCategory !== null}
        onClose={() => setServicesModalCategory(null)}
        initialCategory={servicesModalCategory || 'architectural'}
      />
    </div>
  );
};
