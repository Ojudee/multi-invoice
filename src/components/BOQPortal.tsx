import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Calculator,
  Plus,
  Trash2,
  Download,
  Printer,
  ExternalLink,
  Receipt,
  CheckCircle2,
  Sparkles,
  Info,
  DollarSign,
  Layers,
  ArrowRight,
  TrendingUp,
  FileCheck,
  Search,
  Filter,
  Edit3,
} from 'lucide-react';
import { BOQProject, BOQItem, BOQSectionCode } from '../types/boq';
import { Invoice } from '../types';
import { INITIAL_BOQ_PROJECT, BOQ_SECTIONS_META } from '../data/boqPresets';
import {
  BOQ_TIERED_PRICING,
  BOQ_PACKAGES,
  getBOQPackageFee,
  DEFAULT_COMPANY,
} from '../data/constants';
import { useBOQServices } from '../services/boqServicesStorage';
import { BOQServicesEditorModal } from './BOQServicesEditorModal';
import { calculateBOQ, exportBOQToCSV } from '../utils/boqCalculations';
import { UnivisionLogo } from './UnivisionLogo';
import { printInvoiceElement } from '../utils/printHelper';
import { DepartmentOfficialsCard } from './DepartmentOfficialsCard';

interface BOQPortalProps {
  isStandaloneWindow?: boolean;
  onPopoutWindow?: () => void;
  onGenerateInvoice?: (invoiceData: Partial<Invoice>) => void;
  onSwitchPortal?: (portal: 'invoices' | 'architectural' | 'structural' | 'boq' | 'packages' | 'inspection') => void;
}

export function BOQPortal({
  isStandaloneWindow = false,
  onPopoutWindow,
  onGenerateInvoice,
  onSwitchPortal,
}: BOQPortalProps) {
  const [project, setProject] = useState<BOQProject>(() => {
    try {
      const saved = localStorage.getItem('univision_active_boq_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.clientName !== 'Alhaji Musa Ceesay') {
          return parsed;
        }
      }
    } catch {}
    return INITIAL_BOQ_PROJECT;
  });

  const [activeTab, setActiveTab] = useState<'tiers' | 'items' | 'summary' | 'print'>('items');
  const [selectedSection, setSelectedSection] = useState<BOQSectionCode | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [flyerTierType, setFlyerTierType] = useState<'regular' | 'premium'>('regular');
  const [notification, setNotification] = useState<string>('');
  const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);

  const {
    regularServices,
    premiumExtraServices,
    premiumAllServices,
  } = useBOQServices();

  // Persist project and dispatch storage event for cross-window syncing
  useEffect(() => {
    try {
      localStorage.setItem('univision_active_boq_v1', JSON.stringify(project));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.warn('Storage sync error', e);
    }
  }, [project]);

  const calculations = calculateBOQ(project);
  const flyerFee = getBOQPackageFee(project.grossFloorArea, flyerTierType);

  const handleUpdate = <K extends keyof BOQProject>(key: K, value: BOQProject[K]) => {
    setProject((prev) => ({
      ...prev,
      [key]: value,
      updatedAt: new Date().toISOString(),
    }));
  };

  // Item management
  const handleAddItem = (sectionCode: BOQSectionCode) => {
    const newItem: BOQItem = {
      id: `boq-${Date.now()}`,
      sectionCode,
      itemNumber: `${sectionCode.replace('SEC-0', '')}.${project.items.filter((i) => i.sectionCode === sectionCode).length + 1}`,
      description: 'New Measured Trade Work Item',
      unit: 'm²',
      quantity: 50,
      unitRate: 450,
      totalAmount: 22500,
    };
    setProject((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const handleUpdateItem = (id: string, updates: Partial<BOQItem>) => {
    setProject((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== id) return item;
        const merged = { ...item, ...updates };
        merged.totalAmount = Math.round((Number(merged.quantity) || 0) * (Number(merged.unitRate) || 0));
        return merged;
      }),
    }));
  };

  const handleDeleteItem = (id: string) => {
    setProject((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.id !== id),
    }));
  };

  // Generate an official Invoice for this BOQ
  const handleGenerateInvoiceFromBOQ = (mode: 'consultancy_package' | 'full_construction') => {
    let invoiceData: Partial<Invoice>;

    if (mode === 'consultancy_package') {
      const tierName = flyerTierType === 'premium' ? 'PREMIUM BOQ PACKAGE' : 'REGULAR BOQ PACKAGE';
      invoiceData = {
        invoiceNumber: `INV-BOQ-${project.boqNumber.replace(/[^0-9]/g, '') || '2026'}`,
        date: new Date().toISOString().split('T')[0],
        client: {
          name: project.clientName,
          phone: project.clientPhone,
          email: project.clientEmail,
          address: `${project.projectAddress}, ${project.cityRegion}`,
        },
        project: {
          projectName: project.title,
          projectAddress: project.projectAddress,
          cityProvince: project.cityRegion,
          postalCode: 'WCR, Gambia',
        },
        floors: [
          {
            id: `fl-boq-${Date.now()}`,
            floorName: `BILLS OF QUANTITIES (BOQ): ${tierName} (${project.grossFloorArea} m²)`,
            area: project.grossFloorArea,
            customRate: Math.round(flyerFee / (project.grossFloorArea || 1)),
          },
        ],
        packageType: flyerTierType === 'premium' ? 'premium' : 'regular',
        packageRate: Math.round(flyerFee / (project.grossFloorArea || 1)),
        depositPaidAmount: 0,
        additionalNotes: `Package: BILLS OF QUANTITIES (BOQ) - ${tierName}\nFee Tier: GMD ${flyerFee.toLocaleString()} (Area: ${project.grossFloorArea} m²)\n\nServices Included in ${tierName}:\n${(flyerTierType === 'premium' ? premiumAllServices : regularServices).map((s, idx) => `${idx + 1}. ${s}`).join('\n')}`,
        currency: 'GMD',
        unit: 'm²',
        packagesConfig: {
          architectural: { enabled: false, tier: 'regular', rate: 75 },
          structural: { enabled: false, tier: 'regular', rate: 65 },
          boq: {
            enabled: true,
            tier: flyerTierType === 'premium' ? 'premium' : 'regular',
            fee: flyerFee,
            areaRange: `${project.grossFloorArea} m² Fixed Scope`,
            deliverables: flyerTierType === 'premium' ? premiumAllServices : regularServices,
          },
          inspection: { enabled: false, fee: 3500 },
        },
      };
    } else {
      // Full construction estimate schedule
      invoiceData = {
        invoiceNumber: `INV-CONSTR-${project.boqNumber.replace(/[^0-9]/g, '') || '2026'}`,
        date: new Date().toISOString().split('T')[0],
        client: {
          name: project.clientName,
          phone: project.clientPhone,
          email: project.clientEmail,
          address: `${project.projectAddress}, ${project.cityRegion}`,
        },
        project: {
          projectName: project.title,
          projectAddress: project.projectAddress,
          cityProvince: project.cityRegion,
          postalCode: 'WCR, Gambia',
        },
        floors: [
          {
            id: `fl-constr-sub`,
            floorName: 'Substructure & Concrete Superstructure Works',
            area: project.grossFloorArea,
            customRate: Math.round((calculations.sectionTotals['SEC-01'] + calculations.sectionTotals['SEC-02']) / (project.grossFloorArea || 1)),
          },
          {
            id: `fl-constr-arc`,
            floorName: 'Walling, Roofing & Architectural Finishes',
            area: project.grossFloorArea,
            customRate: Math.round((calculations.sectionTotals['SEC-03'] + calculations.sectionTotals['SEC-04'] + calculations.sectionTotals['SEC-06']) / (project.grossFloorArea || 1)),
          },
          {
            id: `fl-constr-mep`,
            floorName: 'MEP Services & Preliminaries',
            area: project.grossFloorArea,
            customRate: Math.round((calculations.sectionTotals['SEC-07'] + calculations.sectionTotals['SEC-08'] + calculations.sectionTotals['SEC-09']) / (project.grossFloorArea || 1)),
          },
        ],
        packageType: 'custom',
        packageRate: calculations.costPerSqm,
        additionalNotes: `Full Project Construction Estimate based on BOQ Schedule ${project.boqNumber}.\nSubtotal: GMD ${calculations.subtotal.toLocaleString()} | Grand Total: GMD ${calculations.grandTotal.toLocaleString()}`,
        currency: 'GMD',
        unit: 'm²',
      };
    }

    if (onGenerateInvoice) {
      onGenerateInvoice(invoiceData);
      setNotification(`Created invoice from BOQ (${mode === 'consultancy_package' ? 'Flyer Package' : 'Construction Schedule'})!`);
      setTimeout(() => setNotification(''), 4000);
    } else {
      try {
        localStorage.setItem('univision_pending_invoice_sync', JSON.stringify(invoiceData));
        window.dispatchEvent(new Event('storage'));
        setNotification('Invoice synced! Switch to Invoice Studio to view.');
        setTimeout(() => setNotification(''), 4000);
      } catch {}
    }
  };

  const filteredItems = project.items.filter((item) => {
    const matchesSection = selectedSection === 'ALL' || item.sectionCode === selectedSection;
    const matchesSearch =
      !searchQuery ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.itemNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSection && matchesSearch;
  });

  const handlePrint = () => {
    if (activeTab !== 'print') {
      setActiveTab('print');
      setTimeout(() => {
        printInvoiceElement('boq-schedule-printable-sheet', 'Univision Bill of Quantities');
      }, 150);
      return;
    }
    printInvoiceElement('boq-schedule-printable-sheet', 'Univision Bill of Quantities');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Banner / Window Controls */}
      <header className="bg-slate-950 border-b border-slate-800 px-4 py-3 sticky top-0 z-40 shadow-lg print:hidden">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-900/60 border border-emerald-500/40 rounded-lg text-emerald-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base tracking-wide">
                  BILLS OF QUANTITIES (BOQ) PORTAL
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-400/30">
                  PACKAGE 03
                </span>
              </div>
              <p className="text-xs text-slate-400">
                UNIVISION DESIGN & CONSTRUCTION LTD • Material Takeoff, Cost Estimation & Tiered Packages
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {notification && (
              <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-md flex items-center gap-1.5 animate-pulse">
                <CheckCircle2 className="w-3.5 h-3.5" /> {notification}
              </span>
            )}

            {/* Quick Package Consultancy Invoice button */}
            <button
              onClick={() => handleGenerateInvoiceFromBOQ('consultancy_package')}
              className="flex items-center gap-1.5 text-xs bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold px-3 py-2 rounded-lg transition shadow-md hover:shadow-amber-500/20 cursor-pointer"
              title="Generate Invoice for BOQ Consultancy Fee"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>⚡ Generate BOQ Invoice (GMD {flyerFee.toLocaleString()})</span>
            </button>

            {/* Export CSV / Excel */}
            <button
              onClick={() => exportBOQToCSV(project)}
              className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-lg transition cursor-pointer"
              title="Download BOQ in Excel / CSV format"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            {/* Print Official BOQ */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-lg transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Document</span>
            </button>

            {/* Pop out to separate window */}
            {!isStandaloneWindow && onPopoutWindow && (
              <button
                onClick={onPopoutWindow}
                className="flex items-center gap-1.5 text-xs bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 px-3 py-2 rounded-lg transition cursor-pointer"
                title="Open BOQ in its own separate browser window"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Pop Out ↗</span>
              </button>
            )}

            {/* Return to invoicing studio */}
            {onSwitchPortal && (
              <button
                onClick={() => onSwitchPortal('invoices')}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-2 rounded-lg transition cursor-pointer"
              >
                Invoice Studio
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs (NO 'schedule' OR 'windows' ON TABS) */}
        <div className="max-w-7xl mx-auto mt-3 flex items-center gap-1 border-t border-slate-800/80 pt-2 overflow-x-auto">
          {[
            { id: 'items', label: '1. Measured Works & Trade Sections', icon: Layers },
            { id: 'tiers', label: '2. Package Tiers & Fee Calculator', icon: DollarSign },
            { id: 'summary', label: '3. Cost Summary & Margins', icon: TrendingUp },
            { id: 'print', label: '4. Official Printable Document', icon: FileSpreadsheet },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
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
        {/* TAB 1: MEASURED WORKS & TRADE SECTIONS */}
        {activeTab === 'items' && (
          <div className="space-y-4">
            {/* Top Project Metadata Strip */}
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                  Project Title
                </label>
                <input
                  type="text"
                  value={project.title}
                  onChange={(e) => handleUpdate('title', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                  Client Name
                </label>
                <input
                  type="text"
                  value={project.clientName}
                  onChange={(e) => handleUpdate('clientName', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                  Gross Floor Area (m²)
                </label>
                <input
                  type="number"
                  min="1"
                  value={project.grossFloorArea}
                  onChange={(e) => handleUpdate('grossFloorArea', Number(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-emerald-400 font-bold focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                  Grand Estimated Total
                </label>
                <div className="text-base font-black text-amber-400 py-1">
                  GMD {calculations.grandTotal.toLocaleString()}{' '}
                  <span className="text-[11px] font-normal text-slate-400">
                    ({calculations.costPerSqm.toLocaleString()} GMD/m²)
                  </span>
                </div>
              </div>
            </div>

            {/* Section Filters & Search */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                <button
                  onClick={() => setSelectedSection('ALL')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${
                    selectedSection === 'ALL'
                      ? 'bg-slate-200 text-slate-900 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  All Sections ({project.items.length})
                </button>
                {BOQ_SECTIONS_META.map((sec) => (
                  <button
                    key={sec.code}
                    onClick={() => setSelectedSection(sec.code)}
                    className={`text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap transition font-medium ${
                      selectedSection === sec.code
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {sec.code}: {sec.title.split('&')[0]}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none w-48"
                  />
                </div>
                <button
                  onClick={() =>
                    handleAddItem(selectedSection === 'ALL' ? 'SEC-01' : selectedSection)
                  }
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Item
                </button>
              </div>
            </div>

            {/* Items Table */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900 text-slate-300 border-b border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Item No</th>
                      <th className="py-2.5 px-3">Section</th>
                      <th className="py-2.5 px-3">Trade Description & Specification</th>
                      <th className="py-2.5 px-3">Unit</th>
                      <th className="py-2.5 px-3">Qty</th>
                      <th className="py-2.5 px-3">Rate (GMD)</th>
                      <th className="py-2.5 px-3">Total (GMD)</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60">
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-750 transition">
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={item.itemNumber}
                            onChange={(e) => handleUpdateItem(item.id, { itemNumber: e.target.value })}
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 w-16 text-emerald-400 font-bold focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <span className="text-[10px] bg-slate-900 text-slate-300 px-1.5 py-0.5 rounded font-mono border border-slate-700">
                            {item.sectionCode}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleUpdateItem(item.id, { description: e.target.value })}
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 w-96 text-slate-100 focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <select
                            value={item.unit}
                            onChange={(e) => handleUpdateItem(item.id, { unit: e.target.value as any })}
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-300 focus:outline-none"
                          >
                            <option value="m²">m²</option>
                            <option value="m³">m³</option>
                            <option value="m">m</option>
                            <option value="Nr">Nr</option>
                            <option value="Item">Item</option>
                            <option value="Sum">Sum</option>
                            <option value="kg">kg</option>
                            <option value="Tons">Tons</option>
                            <option value="Trips">Trips</option>
                          </select>
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            step="0.1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(item.id, { quantity: Number(e.target.value) || 0 })}
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 w-16 text-center text-slate-100 focus:outline-none font-medium"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            value={item.unitRate}
                            onChange={(e) => handleUpdateItem(item.id, { unitRate: Number(e.target.value) || 0 })}
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 w-20 text-slate-100 focus:outline-none font-medium"
                          />
                        </td>
                        <td className="py-2 px-3 font-bold text-amber-300">
                          {item.totalAmount.toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={() => handleDeleteItem(item.id)}
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

            {/* BOQ OFFICIALS & WHO DID WHAT */}
            <DepartmentOfficialsCard
              department="boq"
              title="BOQ & Cost Engineering Department Officials (Who Did What)"
            />
          </div>
        )}

        {/* TAB 2: FLYER PACKAGE FEE CALCULATOR */}
        {activeTab === 'tiers' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    BILLS OF QUANTITIES (BOQ) CONSULTANCY TIERS (OFFICIAL FLYER)
                  </h2>
                  <p className="text-xs text-slate-300">
                    Univision Design and Construction Ltd • Fixed Fee by Gross Floor Area
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsServicesModalOpen(true)}
                    className="px-3.5 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                    title="Customize the services list for Regular and Premium packages"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                    <span>✏️ Edit Services List</span>
                  </button>
                  <div className="text-right">
                    <span className="text-xs text-slate-400">Current Area:</span>
                    <div className="text-xl font-black text-emerald-400">{project.grossFloorArea} m²</div>
                  </div>
                </div>
              </div>

              {/* Flyer Pricing Matrix Table */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Regular Package Tiers */}
                <div
                  onClick={() => setFlyerTierType('regular')}
                  className={`cursor-pointer rounded-xl p-5 border transition ${
                    flyerTierType === 'regular'
                      ? 'bg-blue-950/70 border-blue-500 ring-2 ring-blue-500/30'
                      : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-bold text-white">REGULAR PACKAGE</h3>
                    <span className="text-xs bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded border border-blue-400/30">
                      Standard BOQ
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    {BOQ_TIERED_PRICING.map((tier, idx) => {
                      const isCurrent =
                        project.grossFloorArea >= tier.minArea &&
                        project.grossFloorArea <= tier.maxArea;
                      return (
                        <div
                          key={idx}
                          className={`flex items-center justify-between p-2.5 rounded-lg ${
                            isCurrent
                              ? 'bg-blue-900/60 border border-blue-500 text-white font-bold'
                              : 'bg-slate-900/60 text-slate-300'
                          }`}
                        >
                          <span>{tier.label}</span>
                          <span className="text-sm font-black text-blue-400">
                            GMD {tier.regularFee.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-700 flex justify-between items-center text-xs">
                    <span className="text-slate-400">Fee for this project ({project.grossFloorArea} m²):</span>
                    <span className="text-base font-bold text-white">
                      GMD {getBOQPackageFee(project.grossFloorArea, 'regular').toLocaleString()}
                    </span>
                  </div>

                  {/* Services Listed Under Regular */}
                  <div className="mt-4 pt-3 border-t border-slate-700/80">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wide flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        INCLUDES (Services Under Regular):
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsServicesModalOpen(true);
                        }}
                        className="text-[10px] font-semibold text-blue-400 hover:text-blue-200 bg-blue-900/40 hover:bg-blue-900/80 px-2 py-0.5 rounded border border-blue-500/30 flex items-center gap-1 transition"
                        title="Edit regular package services"
                      >
                        <Edit3 className="w-3 h-3" /> Edit List
                      </button>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      {regularServices.map((feat, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Premium Package Tiers */}
                <div
                  onClick={() => setFlyerTierType('premium')}
                  className={`cursor-pointer rounded-xl p-5 border transition ${
                    flyerTierType === 'premium'
                      ? 'bg-emerald-950/70 border-emerald-500 ring-2 ring-emerald-500/30'
                      : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-bold text-white">PREMIUM PACKAGE</h3>
                    <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-400/30">
                      ★ Comprehensive Takeoff & Cashflow
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    {BOQ_TIERED_PRICING.map((tier, idx) => {
                      const isCurrent =
                        project.grossFloorArea >= tier.minArea &&
                        project.grossFloorArea <= tier.maxArea;
                      return (
                        <div
                          key={idx}
                          className={`flex items-center justify-between p-2.5 rounded-lg ${
                            isCurrent
                              ? 'bg-emerald-900/60 border border-emerald-500 text-white font-bold'
                              : 'bg-slate-900/60 text-slate-300'
                          }`}
                        >
                          <span>{tier.label}</span>
                          <span className="text-sm font-black text-emerald-400">
                            GMD {tier.premiumFee.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-700 flex justify-between items-center text-xs">
                    <span className="text-slate-400">Fee for this project ({project.grossFloorArea} m²):</span>
                    <span className="text-base font-bold text-emerald-300">
                      GMD {getBOQPackageFee(project.grossFloorArea, 'premium').toLocaleString()}
                    </span>
                  </div>

                  {/* Services Listed Under Premium */}
                  <div className="mt-4 pt-3 border-t border-slate-700/80">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        EVERYTHING IN REGULAR PLUS:
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsServicesModalOpen(true);
                        }}
                        className="text-[10px] font-semibold text-emerald-400 hover:text-emerald-200 bg-emerald-900/40 hover:bg-emerald-900/80 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1 transition"
                        title="Edit premium package extra services"
                      >
                        <Edit3 className="w-3 h-3" /> Edit List
                      </button>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      {premiumExtraServices.map((feat, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-emerald-100">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* One-Click Invoice Sync Action */}
              <div className="mt-5 pt-4 border-t border-slate-700 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-300">
                  Selected BOQ Tier: <strong className="text-white">{flyerTierType.toUpperCase()}</strong> • Calculated Consultancy Fee:{' '}
                  <strong className="text-amber-400 text-sm">GMD {flyerFee.toLocaleString()}</strong>
                </div>
                <button
                  onClick={() => handleGenerateInvoiceFromBOQ('consultancy_package')}
                  className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-2 transition shadow-md"
                >
                  <Receipt className="w-4 h-4" />
                  <span>⚡ Push GMD {flyerFee.toLocaleString()} BOQ Fee to Invoice Studio</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: COST SUMMARY & MARGINS */}
        {activeTab === 'summary' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Work Sections Breakdown
              </h3>
              <div className="space-y-2 text-xs">
                {BOQ_SECTIONS_META.map((sec) => {
                  const total = calculations.sectionTotals[sec.code] || 0;
                  const pct = calculations.sectionPercentages[sec.code] || 0;
                  return (
                    <div key={sec.code} className="space-y-1">
                      <div className="flex justify-between items-center text-slate-300">
                        <span>
                          <strong className="text-slate-100">{sec.code}</strong>: {sec.title}
                        </span>
                        <span className="font-bold text-white">
                          GMD {total.toLocaleString()} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Calculator className="w-4 h-4 text-amber-400" />
                Contingency, Overhead & Total Valuation
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Contingency Reserve (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={project.contingencyPercent}
                    onChange={(e) => handleUpdate('contingencyPercent', Number(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Contractor Margin / Profit (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={project.contractorMarginPercent}
                    onChange={(e) => handleUpdate('contractorMarginPercent', Number(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Totals Box */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Measured Works Subtotal:</span>
                  <span className="font-semibold text-white">GMD {calculations.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Contingency ({project.contingencyPercent}%):</span>
                  <span className="font-semibold text-white">GMD {calculations.contingencyAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Contractor Margin ({project.contractorMarginPercent}%):</span>
                  <span className="font-semibold text-white">GMD {calculations.contractorMarginAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 text-base font-bold">
                  <span className="text-slate-200">GRAND TOTAL PROJECT ESTIMATE:</span>
                  <span className="text-emerald-400 text-lg">GMD {calculations.grandTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400 pt-1">
                  <span>Unit Cost / m²:</span>
                  <span className="font-bold text-amber-400">GMD {calculations.costPerSqm.toLocaleString()} / m²</span>
                </div>
              </div>

              <button
                onClick={() => handleGenerateInvoiceFromBOQ('full_construction')}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 transition shadow-md"
              >
                <Receipt className="w-4 h-4" />
                <span>Push Full Construction Schedule to Invoice Studio</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: OFFICIAL BOQ SCHEDULE PRINT PREVIEW */}
        {activeTab === 'print' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">
                Univision Design & Construction Ltd • Official Pristine Bill of Quantities Schedule
              </span>
              <button
                type="button"
                onClick={handlePrint}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print Document
              </button>
            </div>

            {/* A4 Paper BOQ Schedule */}
            <div
              id="boq-schedule-printable-sheet"
              className="bg-white text-slate-900 rounded-xl p-8 shadow-2xl max-w-4xl mx-auto border border-slate-300 font-sans print:p-0 print:border-none print:shadow-none"
            >
              {/* Header - Clean, robust layout with NO overshadowing */}
              <div className="border-b-2 border-slate-900 pb-4 mb-4 flex justify-between items-start gap-4">
                <div className="flex items-start gap-3">
                  <UnivisionLogo emblemOnly size="md" />
                  <div>
                    <h1 className="text-lg md:text-xl font-black text-slate-950 tracking-tight leading-tight">
                      UNIVISION DESIGN AND CONSTRUCTION LTD.
                    </h1>
                    <p className="text-[11px] font-semibold text-slate-600 tracking-wide uppercase">
                      QUANTITY SURVEYING & CONSTRUCTION COST MANAGEMENT
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Sukuta-jabang Highway, Sukuta Dalaba • Tel: +220 872104724 • univision0111@gmail.com
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded">
                    BILLS OF QUANTITIES (BOQ) SCHEDULE • {flyerTierType.toUpperCase()}
                  </div>
                  <div className="text-sm font-black text-slate-900 mt-1 font-mono">
                    {project.boqNumber}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Date: {project.date} • {project.version}
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
                  <span className="font-bold text-slate-900">{project.projectAddress}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">GROSS FLOOR AREA</span>
                  <span className="font-bold text-emerald-700">{project.grossFloorArea} m²</span>
                </div>
              </div>

              {/* BOQ Service Package Deliverables Scope */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded p-2.5 mb-4 text-[10px]">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-emerald-950 uppercase tracking-wide">
                    OFFICIAL BOQ SERVICE PACKAGE: {flyerTierType.toUpperCase()} (FEE: GMD {flyerFee.toLocaleString()})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsServicesModalOpen(true)}
                      className="text-[9px] font-semibold text-emerald-800 hover:text-emerald-950 underline flex items-center gap-0.5 print:hidden"
                      title="Edit BOQ deliverables specification"
                    >
                      <Edit3 className="w-2.5 h-2.5" /> Edit Scope
                    </button>
                    <span className="text-[9px] font-semibold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                      OFFICIAL CONTRACT SPECIFICATION
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-emerald-900">
                  {(flyerTierType === 'premium' ? premiumAllServices : regularServices).map((svc, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <span className="text-emerald-700 font-bold">✓</span>
                      <span>{svc}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <table className="w-full text-[11px] border-collapse border border-slate-300">
                  <thead className="bg-slate-200 text-slate-800">
                    <tr>
                      <th className="border border-slate-300 p-1.5 text-left w-14">Item</th>
                      <th className="border border-slate-300 p-1.5 text-left">Description of Measured Work</th>
                      <th className="border border-slate-300 p-1.5 text-center w-12">Unit</th>
                      <th className="border border-slate-300 p-1.5 text-center w-16">Qty</th>
                      <th className="border border-slate-300 p-1.5 text-right w-24">Rate (GMD)</th>
                      <th className="border border-slate-300 p-1.5 text-right w-28">Amount (GMD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {project.items.map((it) => (
                      <tr key={it.id} className="odd:bg-white even:bg-slate-50">
                        <td className="border border-slate-300 p-1.5 font-bold text-slate-800">{it.itemNumber}</td>
                        <td className="border border-slate-300 p-1.5">{it.description}</td>
                        <td className="border border-slate-300 p-1.5 text-center font-medium">{it.unit}</td>
                        <td className="border border-slate-300 p-1.5 text-center font-bold">{it.quantity}</td>
                        <td className="border border-slate-300 p-1.5 text-right">{it.unitRate.toLocaleString()}</td>
                        <td className="border border-slate-300 p-1.5 text-right font-bold text-slate-900">
                          {it.totalAmount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-semibold text-slate-800">
                      <td colSpan={5} className="border border-slate-300 p-1.5 text-right">
                        SUBTOTAL (MEASURED WORKS):
                      </td>
                      <td className="border border-slate-300 p-1.5 text-right font-bold">
                        GMD {calculations.subtotal.toLocaleString()}
                      </td>
                    </tr>
                    <tr className="bg-slate-100 text-slate-700">
                      <td colSpan={5} className="border border-slate-300 p-1.5 text-right">
                        Contingency Reserve ({project.contingencyPercent}%):
                      </td>
                      <td className="border border-slate-300 p-1.5 text-right">
                        GMD {calculations.contingencyAmount.toLocaleString()}
                      </td>
                    </tr>
                    <tr className="bg-slate-100 text-slate-700">
                      <td colSpan={5} className="border border-slate-300 p-1.5 text-right">
                        Contractor Margin & Profit ({project.contractorMarginPercent}%):
                      </td>
                      <td className="border border-slate-300 p-1.5 text-right">
                        GMD {calculations.contractorMarginAmount.toLocaleString()}
                      </td>
                    </tr>
                    <tr className="bg-slate-200 text-slate-950 font-black text-xs">
                      <td colSpan={5} className="border border-slate-300 p-2 text-right">
                        GRAND TOTAL ESTIMATED PROJECT COST:
                      </td>
                      <td className="border border-slate-300 p-2 text-right text-emerald-800">
                        GMD {calculations.grandTotal.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* BOQ OFFICIALS & WHO DID WHAT */}
              <DepartmentOfficialsCard department="boq" isPrintVersion={true} />

              {/* Sign-off Strip */}
              <div className="border-t-2 border-slate-300 pt-4 mt-6 grid grid-cols-2 gap-6 text-xs">
                <div>
                  <div className="font-bold text-slate-900 mb-1">NOTES & SPECIFICATION BASELINE:</div>
                  <ul className="text-[10px] text-slate-600 list-disc pl-4 space-y-0.5">
                    {project.notes.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </div>
                <div className="text-right">
                  <div className="inline-block border border-dashed border-slate-400 p-3 rounded text-center w-60">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      QUANTITY SURVEYOR CERTIFICATION
                    </span>
                    <div className="font-bold text-emerald-900 text-xs mt-1">
                      {project.preparedBy}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Reg: {project.qsRegNumber}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-semibold mt-1">
                      ✓ VERIFIED ACCURATE BILLING
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <BOQServicesEditorModal
        isOpen={isServicesModalOpen}
        onClose={() => setIsServicesModalOpen(false)}
      />
    </div>
  );
}
