import React, { useState, useEffect } from 'react';
import {
  Compass,
  FileText,
  Calculator,
  Plus,
  Trash2,
  Printer,
  ExternalLink,
  Receipt,
  CheckCircle2,
  Sparkles,
  Edit3,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { UnivisionLogo } from './UnivisionLogo';
import { ARCHITECTURAL_PACKAGES, DEFAULT_COMPANY } from '../data/constants';
import { usePackageServices } from '../services/packageServicesStorage';
import { ServicePackageEditorModal } from './ServicePackageEditorModal';
import { printInvoiceElement } from '../utils/printHelper';
import { Invoice } from '../types';
import { DepartmentOfficialsCard } from './DepartmentOfficialsCard';

export interface ArchitecturalSheet {
  id: string;
  sheetNo: string;
  title: string;
  scale: string;
  revision: string;
  status: 'Approved' | 'Permit-Ready' | 'In Review' | 'Draft';
  notes: string;
}

export interface DoorWindowItem {
  id: string;
  mark: string;
  type: 'Door' | 'Window';
  dimensions: string; // e.g. "900 x 2100 mm"
  material: string;   // e.g. "Solid Hardwood / Glazed"
  location: string;   // e.g. "Main Entrance / Living Room"
  quantity: number;
}

export interface ArchitecturalProject {
  id: string;
  projectNumber: string;
  title: string;
  clientName: string;
  clientPhone: string;
  siteLocation: string;
  grossFloorArea: number; // m²
  leadArchitect: string;
  date: string;
  revision: string;
  sheets: ArchitecturalSheet[];
  doorWindowSchedule: DoorWindowItem[];
}

export const INITIAL_ARCHITECTURAL_PROJECT: ArchitecturalProject = {
  id: 'arch-proj-1',
  projectNumber: 'ARC-2026-001',
  title: 'Architectural Working Drawings & Design Package',
  clientName: '',
  clientPhone: '+220 ',
  siteLocation: 'Site Location, The Gambia',
  grossFloorArea: 250,
  leadArchitect: 'Arch. Lead Architect (Univision)',
  date: new Date().toISOString().split('T')[0],
  revision: 'Rev 0 (Permit Release)',
  sheets: [
    { id: 'sh-1', sheetNo: 'A-001', title: 'Cover Sheet, Drawing Register & General Architectural Notes', scale: 'N/A', revision: 'R0', status: 'Approved', notes: 'Master Title Block' },
    { id: 'sh-2', sheetNo: 'A-101', title: 'Site Masterplan, Boundary Setting & Drainage Coordinates', scale: '1:200', revision: 'R0', status: 'Permit-Ready', notes: 'Setbacks Verified' },
    { id: 'sh-3', sheetNo: 'A-102', title: 'Ground Floor Architectural Layout & Dimension Plan', scale: '1:100', revision: 'R0', status: 'Permit-Ready', notes: 'Primary Living Areas' },
    { id: 'sh-4', sheetNo: 'A-103', title: 'First Floor Architectural Layout & Balcony Details', scale: '1:100', revision: 'R0', status: 'Permit-Ready', notes: 'Master Suites' },
    { id: 'sh-5', sheetNo: 'A-104', title: 'Roof Plan, Gutters, Fall Gradients & Rainwater Disposal', scale: '1:100', revision: 'R0', status: 'Permit-Ready', notes: 'Corrugated Profile & Concrete Fascia' },
    { id: 'sh-6', sheetNo: 'A-201', title: 'Exterior Elevations: North Front & South Rear Facades', scale: '1:100', revision: 'R0', status: 'Approved', notes: 'Finishes & Louvers' },
    { id: 'sh-7', sheetNo: 'A-202', title: 'Exterior Elevations: East & West Lateral Facades', scale: '1:100', revision: 'R0', status: 'Approved', notes: 'Sun Shade Canopies' },
    { id: 'sh-8', sheetNo: 'A-301', title: 'Longitudinal & Transverse Cross Building Sections X-X & Y-Y', scale: '1:50', revision: 'R0', status: 'Permit-Ready', notes: 'Floor-to-Ceiling 3.2m' },
    { id: 'sh-9', sheetNo: 'A-401', title: 'Door, Window & Ironmongery Measured Schedule & Profiles', scale: '1:50', revision: 'R0', status: 'Approved', notes: 'Detailed Fenestration' },
    { id: 'sh-10', sheetNo: 'A-501', title: 'Interior Joinery, Kitchen Island & Bathroom Sanitary Details', scale: '1:25', revision: 'R0', status: 'Approved', notes: 'Premium Architectural Joinery' },
  ],
  doorWindowSchedule: [
    { id: 'dw-1', mark: 'D1', type: 'Door', dimensions: '1200 x 2400 mm', material: 'Security Solid Mahogany with Pivot Hinges', location: 'Main Entrance Portico', quantity: 1 },
    { id: 'dw-2', mark: 'D2', type: 'Door', dimensions: '900 x 2100 mm', material: 'Solid Core Flush Timber Panel', location: 'Master Bedrooms & Living Suites', quantity: 6 },
    { id: 'dw-3', mark: 'D3', type: 'Door', dimensions: '800 x 2100 mm', material: 'Water-Resistant Laminated Flush Door', location: 'En-Suite Toilets & Powder Rooms', quantity: 5 },
    { id: 'dw-4', mark: 'W1', type: 'Window', dimensions: '1800 x 1500 mm', material: 'Powder-Coated Aluminum Sliding Double Glaze', location: 'Living Room & Dining Halls', quantity: 4 },
    { id: 'dw-5', mark: 'W2', type: 'Window', dimensions: '1500 x 1200 mm', material: 'Powder-Coated Aluminum Glazed Casement', location: 'Bedrooms 1, 2, 3 & Study', quantity: 6 },
    { id: 'dw-6', mark: 'W3', type: 'Window', dimensions: '600 x 600 mm', material: 'Aluminum Louvered Frosted Privacy Window', location: 'Bathrooms & Storage', quantity: 5 },
  ],
};

interface ArchitecturalSchedulePortalProps {
  isStandaloneWindow?: boolean;
  onPopoutWindow?: () => void;
  onGenerateInvoice?: (invoiceData: Partial<Invoice>) => void;
  onSwitchPortal?: (portal: 'invoices' | 'architectural' | 'structural' | 'boq' | 'packages' | 'inspection') => void;
}

export function ArchitecturalSchedulePortal({
  isStandaloneWindow = false,
  onPopoutWindow,
  onGenerateInvoice,
  onSwitchPortal,
}: ArchitecturalSchedulePortalProps) {
  // Load or initialize project from storage
  const [project, setProject] = useState<ArchitecturalProject>(() => {
    try {
      const saved = localStorage.getItem('univision_active_arch_project_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.clientName !== 'Amadou Jallow') {
          return parsed;
        }
      }
    } catch {}
    return INITIAL_ARCHITECTURAL_PROJECT;
  });

  const [packageTier, setPackageTier] = useState<'regular' | 'premium'>('premium');
  const [activeTab, setActiveTab] = useState<'sheets' | 'calculator' | 'schedule' | 'preview'>('sheets');
  const [notification, setNotification] = useState<string>('');
  const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);

  // Hook for editable architectural package services
  const { regularServices, premiumExtraServices, premiumAllServices } = usePackageServices('architectural');

  // Persist project
  useEffect(() => {
    try {
      localStorage.setItem('univision_active_arch_project_v1', JSON.stringify(project));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.warn('Storage sync issue', e);
    }
  }, [project]);

  // Calculations
  const rate = ARCHITECTURAL_PACKAGES[packageTier].rate;
  const calculatedFee = (project.grossFloorArea || 0) * rate;

  const handleUpdate = <K extends keyof ArchitecturalProject>(key: K, value: ArchitecturalProject[K]) => {
    setProject((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Sheet helper
  const handleAddSheet = () => {
    const newSheet: ArchitecturalSheet = {
      id: `sh-${Date.now()}`,
      sheetNo: `A-${100 + project.sheets.length + 1}`,
      title: 'New Architectural Working Drawing',
      scale: '1:100',
      revision: 'R0',
      status: 'In Review',
      notes: 'Issued for Review',
    };
    setProject((prev) => ({ ...prev, sheets: [...prev.sheets, newSheet] }));
  };

  const handleUpdateSheet = (id: string, updates: Partial<ArchitecturalSheet>) => {
    setProject((prev) => ({
      ...prev,
      sheets: prev.sheets.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
  };

  const handleDeleteSheet = (id: string) => {
    setProject((prev) => ({
      ...prev,
      sheets: prev.sheets.filter((s) => s.id !== id),
    }));
  };

  // Door Window helper
  const handleAddDwItem = () => {
    const newItem: DoorWindowItem = {
      id: `dw-${Date.now()}`,
      mark: `W${project.doorWindowSchedule.length + 1}`,
      type: 'Window',
      dimensions: '1200 x 1200 mm',
      material: 'Aluminum Sliding Glazed',
      location: 'Living Area',
      quantity: 1,
    };
    setProject((prev) => ({
      ...prev,
      doorWindowSchedule: [...prev.doorWindowSchedule, newItem],
    }));
  };

  const handleUpdateDwItem = (id: string, updates: Partial<DoorWindowItem>) => {
    setProject((prev) => ({
      ...prev,
      doorWindowSchedule: prev.doorWindowSchedule.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }));
  };

  const handleDeleteDwItem = (id: string) => {
    setProject((prev) => ({
      ...prev,
      doorWindowSchedule: prev.doorWindowSchedule.filter((item) => item.id !== id),
    }));
  };

  // Generate / Push Invoice
  const handleGenerateInvoice = () => {
    const tierName = packageTier === 'premium' ? 'PREMIUM PACKAGE' : 'REGULAR PACKAGE';
    const activeServices = packageTier === 'premium' ? premiumAllServices : regularServices;

    const newInvoice: Partial<Invoice> = {
      invoiceNumber: `INV-ARC-${Math.floor(100 + Math.random() * 900)}`,
      date: project.date,
      project: {
        projectName: project.title,
        projectAddress: project.siteLocation,
        cityProvince: 'West Coast Region',
        postalCode: 'WCR',
      },
      client: {
        name: project.clientName,
        phone: project.clientPhone,
        email: '',
        address: project.siteLocation,
      },
      floors: [
        {
          id: `fl-arch-${Date.now()}`,
          floorName: `Architectural Drawing Package (${tierName}) - Total Floor Area`,
          area: project.grossFloorArea,
          customRate: rate,
        },
      ],
      packageType: packageTier,
      packageRate: rate,
      additionalNotes: `Package: 01 ARCHITECTURAL DRAWING PACKAGE - ${tierName}\nRate: GMD ${rate}/m² (Total Area: ${project.grossFloorArea} m²)\nLead Architect: ${project.leadArchitect}\n\nDeliverables Included in ${tierName}:\n${activeServices.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}`,
      currency: 'GMD',
      unit: 'm²',
    };

    if (onGenerateInvoice) {
      onGenerateInvoice(newInvoice);
      setNotification(`Created Architectural Invoice for GMD ${calculatedFee.toLocaleString()}!`);
      setTimeout(() => setNotification(''), 4000);
    } else {
      try {
        localStorage.setItem('univision_pending_invoice_sync', JSON.stringify(newInvoice));
        window.dispatchEvent(new Event('storage'));
        setNotification('Synced to Invoice Studio! Switch to Invoice Studio to view.');
        setTimeout(() => setNotification(''), 4000);
      } catch {}
    }
  };

  const handlePrint = () => {
    if (activeTab !== 'preview') {
      setActiveTab('preview');
      setTimeout(() => {
        printInvoiceElement('architectural-schedule-printable-sheet', 'Univision Architectural Drawing Package');
      }, 150);
      return;
    }
    printInvoiceElement('architectural-schedule-printable-sheet', 'Univision Architectural Drawing Package');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* HEADER */}
      <header className="bg-slate-950 border-b border-slate-800 px-4 py-3 sticky top-0 z-40 shadow-lg print:hidden">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-900/60 border border-blue-500/40 rounded-lg text-blue-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-wide">
                  Architectural Drawing Package
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-300 border border-blue-500/40">
                  PACKAGE 01
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Drawing Register, Deliverables Scope & Official Specifications
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Invoice Button */}
            <button
              type="button"
              onClick={handleGenerateInvoice}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>⚡ Generate Invoice (GMD {calculatedFee.toLocaleString()})</span>
            </button>

            {/* Print Sheet */}
            <button
              type="button"
              onClick={handlePrint}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Document</span>
            </button>

            {!isStandaloneWindow && onPopoutWindow && (
              <button
                type="button"
                onClick={onPopoutWindow}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg border border-slate-700 transition"
                title="Pop out into separate OS window"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* NOTIFICATION TOAST */}
        {notification && (
          <div className="max-w-7xl mx-auto mt-2">
            <div className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{notification}</span>
            </div>
          </div>
        )}

        {/* TABS NAVIGATION */}
        <div className="max-w-7xl mx-auto mt-3 border-t border-slate-800 pt-2 flex items-center justify-between gap-3 overflow-x-auto text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('sheets')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'sheets'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>1. Drawing Register ({project.sheets.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('calculator')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'calculator'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>2. Package Tiers & Fee Calculator</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('schedule')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'schedule'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>3. Door & Fenestration Register ({project.doorWindowSchedule.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'preview'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>4. Official Printable Document</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 font-mono hidden md:block">
            Area: <span className="text-amber-400 font-bold">{project.grossFloorArea} m²</span> • Rate:{' '}
            <span className="text-white font-bold">GMD {rate}/m²</span> ({packageTier.toUpperCase()})
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto w-full p-4 md:p-6 flex-1">
        {/* TAB 1: DRAWING REGISTER */}
        {activeTab === 'sheets' && (
          <div className="space-y-4">
            {/* Metadata Summary Card */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 font-medium block">Project Title</label>
                <input
                  type="text"
                  value={project.title}
                  onChange={(e) => handleUpdate('title', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-semibold"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-medium block">Client Name</label>
                <input
                  type="text"
                  value={project.clientName}
                  onChange={(e) => handleUpdate('clientName', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-medium block">Site Location</label>
                <input
                  type="text"
                  value={project.siteLocation}
                  onChange={(e) => handleUpdate('siteLocation', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-medium block">Gross Floor Area (m²)</label>
                <input
                  type="number"
                  value={project.grossFloorArea}
                  onChange={(e) => handleUpdate('grossFloorArea', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-amber-400 font-bold focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Drawing Sheet Register Table */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">Architectural Drawing Sheet Register</h3>
                  <span className="text-[10px] bg-blue-900/60 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-full font-mono">
                    {project.sheets.length} Sheets Issued
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddSheet}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Drawing Sheet
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900/80 text-slate-400 border-b border-slate-700">
                      <th className="p-2.5 w-24">Sheet No</th>
                      <th className="p-2.5">Drawing Title & Description</th>
                      <th className="p-2.5 w-20 text-center">Scale</th>
                      <th className="p-2.5 w-20 text-center">Rev</th>
                      <th className="p-2.5 w-28 text-center">Status</th>
                      <th className="p-2.5">Notes</th>
                      <th className="p-2.5 w-12 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60 font-sans">
                    {project.sheets.map((sheet) => (
                      <tr key={sheet.id} className="hover:bg-slate-750/50 transition">
                        <td className="p-2 font-mono font-bold text-blue-400">
                          <input
                            type="text"
                            value={sheet.sheetNo}
                            onChange={(e) => handleUpdateSheet(sheet.id, { sheetNo: e.target.value })}
                            className="w-full bg-slate-900/60 border border-slate-700 rounded px-1.5 py-1 text-xs text-blue-300 font-mono"
                          />
                        </td>
                        <td className="p-2 font-medium text-white">
                          <input
                            type="text"
                            value={sheet.title}
                            onChange={(e) => handleUpdateSheet(sheet.id, { title: e.target.value })}
                            className="w-full bg-slate-900/60 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="text"
                            value={sheet.scale}
                            onChange={(e) => handleUpdateSheet(sheet.id, { scale: e.target.value })}
                            className="w-full bg-slate-900/60 border border-slate-700 rounded px-1 py-1 text-center text-xs text-slate-300"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="text"
                            value={sheet.revision}
                            onChange={(e) => handleUpdateSheet(sheet.id, { revision: e.target.value })}
                            className="w-full bg-slate-900/60 border border-slate-700 rounded px-1 py-1 text-center text-xs text-slate-300 font-mono"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <select
                            value={sheet.status}
                            onChange={(e) =>
                              handleUpdateSheet(sheet.id, {
                                status: e.target.value as ArchitecturalSheet['status'],
                              })
                            }
                            className="bg-slate-900 border border-slate-700 text-xs rounded px-1.5 py-1 text-slate-200"
                          >
                            <option value="Approved">Approved</option>
                            <option value="Permit-Ready">Permit-Ready</option>
                            <option value="In Review">In Review</option>
                            <option value="Draft">Draft</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={sheet.notes}
                            onChange={(e) => handleUpdateSheet(sheet.id, { notes: e.target.value })}
                            className="w-full bg-slate-900/60 border border-slate-700 rounded px-2 py-1 text-xs text-slate-400"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteSheet(sheet.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition"
                            title="Delete sheet"
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

            {/* DEPARTMENT OFFICIALS & TASK ATTRIBUTION */}
            <DepartmentOfficialsCard
              department="architectural"
              title="Architectural Department Officials & Roles (Who Did What)"
            />
          </div>
        )}

        {/* TAB 2: PACKAGE TIERS & CALCULATOR */}
        {activeTab === 'calculator' && (
          <div className="space-y-6">
            {/* Header Banner */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>01 Architectural Drawing Package Deliverables</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Choose between Regular (GMD 75/m²) or Premium (GMD 100/m²). Customize the included service list anytime.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsServicesModalOpen(true)}
                  className="px-3.5 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/50 text-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  title="Customize included regular and premium services"
                >
                  <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Customize Services List</span>
                </button>

                <div className="text-right pl-3 border-l border-slate-700">
                  <span className="text-xs text-slate-400 block">Total Area</span>
                  <div className="text-lg font-black text-amber-400">{project.grossFloorArea} m²</div>
                </div>
              </div>
            </div>

            {/* PACKAGE COMPARISON CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* REGULAR CARD */}
              <div
                onClick={() => setPackageTier('regular')}
                className={`rounded-2xl p-5 border-2 transition-all cursor-pointer flex flex-col justify-between shadow-xl ${
                  packageTier === 'regular'
                    ? 'bg-slate-800/95 border-blue-500 ring-2 ring-blue-500/30'
                    : 'bg-slate-850/60 border-slate-700/80 hover:border-slate-600'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-blue-400 tracking-wider uppercase">
                      STANDARD COMPLIANCE
                    </span>
                    {packageTier === 'regular' && (
                      <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> Selected Tier
                      </span>
                    )}
                  </div>
                  <h4 className="text-xl font-black text-white">REGULAR PACKAGE</h4>
                  <div className="text-2xl font-black text-blue-300 mt-2">
                    GMD 75 <span className="text-xs font-normal text-slate-400">/ m²</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Essential complete architectural drawing set for planning & building approval.
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-700">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                      <span className="font-semibold text-slate-300">INCLUDED SERVICES ({regularServices.length}):</span>
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
                    <ul className="space-y-1.5 text-xs text-slate-200">
                      {regularServices.map((feat, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-700/80 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Package Fee for {project.grossFloorArea} m²:</span>
                    <span className="text-lg font-bold text-white">
                      GMD {(project.grossFloorArea * 75).toLocaleString()}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPackageTier('regular')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                      packageTier === 'regular'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    Select Regular
                  </button>
                </div>
              </div>

              {/* PREMIUM CARD */}
              <div
                onClick={() => setPackageTier('premium')}
                className={`rounded-2xl p-5 border-2 transition-all cursor-pointer flex flex-col justify-between shadow-xl ${
                  packageTier === 'premium'
                    ? 'bg-slate-800/95 border-amber-500 ring-2 ring-amber-500/30'
                    : 'bg-slate-850/60 border-slate-700/80 hover:border-slate-600'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-amber-400 tracking-wider uppercase flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" /> MOST POPULAR • LUXURY TURNKEY
                    </span>
                    {packageTier === 'premium' && (
                      <span className="bg-amber-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> Selected Tier
                      </span>
                    )}
                  </div>
                  <h4 className="text-xl font-black text-white">PREMIUM PACKAGE</h4>
                  <div className="text-2xl font-black text-amber-400 mt-2">
                    GMD 100 <span className="text-xs font-normal text-slate-400">/ m²</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Everything in Regular plus detailed interior architecture, video walkthrough, & joinery.
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-700">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                      <span className="font-semibold text-amber-300">
                        ALL REGULAR SERVICES + PREMIUM EXTRAS ({premiumAllServices.length}):
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsServicesModalOpen(true);
                        }}
                        className="text-[11px] text-amber-400 hover:text-amber-300 underline flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" /> Edit List
                      </button>
                    </div>
                    <div className="space-y-1.5 text-xs text-slate-200 max-h-56 overflow-y-auto pr-1">
                      {premiumAllServices.map((feat, i) => {
                        const isExtra = premiumExtraServices.includes(feat);
                        return (
                          <div
                            key={i}
                            className={`flex items-center gap-2 p-1 rounded ${
                              isExtra ? 'bg-amber-500/10 text-amber-200 font-medium' : ''
                            }`}
                          >
                            <CheckCircle2
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isExtra ? 'text-amber-400' : 'text-blue-400'
                              }`}
                            />
                            <span>
                              {feat} {isExtra && <span className="text-[10px] text-amber-400 ml-1 font-bold">(PREMIUM)</span>}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-700/80 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Package Fee for {project.grossFloorArea} m²:</span>
                    <span className="text-lg font-bold text-amber-400">
                      GMD {(project.grossFloorArea * 100).toLocaleString()}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPackageTier('premium')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                      packageTier === 'premium'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    Select Premium
                  </button>
                </div>
              </div>
            </div>

            {/* Push to invoice banner */}
            <div className="bg-gradient-to-r from-blue-900/50 to-indigo-900/50 border border-blue-500/30 rounded-xl p-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs text-blue-300">Selected Architectural Package:</div>
                <div className="text-lg font-black text-white">
                  {packageTier.toUpperCase()} PACKAGE • GMD {calculatedFee.toLocaleString()}
                </div>
              </div>
              <button
                type="button"
                onClick={handleGenerateInvoice}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-lg text-xs flex items-center gap-2 shadow-md transition cursor-pointer"
              >
                <Receipt className="w-4 h-4" />
                <span>Push Architectural Fee to Invoice Studio</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: DOOR & WINDOW SCHEDULE */}
        {activeTab === 'schedule' && (
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Door & Window Architectural Schedule</h3>
                <p className="text-xs text-slate-400">
                  Measured specification table for architectural fenestration, openings, and joinery.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddDwItem}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Fenestration Item
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/80 text-slate-400 border-b border-slate-700">
                    <th className="p-2.5 w-16">Mark</th>
                    <th className="p-2.5 w-24">Type</th>
                    <th className="p-2.5 w-32">Dimensions</th>
                    <th className="p-2.5">Material & Glass Specification</th>
                    <th className="p-2.5">Location In Building</th>
                    <th className="p-2.5 w-16 text-center">Qty</th>
                    <th className="p-2.5 w-12 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 font-sans">
                  {project.doorWindowSchedule.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-750/50 transition">
                      <td className="p-2 font-mono font-bold text-amber-400">
                        <input
                          type="text"
                          value={item.mark}
                          onChange={(e) => handleUpdateDwItem(item.id, { mark: e.target.value })}
                          className="w-full bg-slate-900/60 border border-slate-700 rounded px-1.5 py-1 text-xs text-amber-300 font-mono font-bold text-center"
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={item.type}
                          onChange={(e) =>
                            handleUpdateDwItem(item.id, {
                              type: e.target.value as 'Door' | 'Window',
                            })
                          }
                          className="bg-slate-900 border border-slate-700 text-xs rounded px-2 py-1 text-white"
                        >
                          <option value="Door">Door</option>
                          <option value="Window">Window</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.dimensions}
                          onChange={(e) => handleUpdateDwItem(item.id, { dimensions: e.target.value })}
                          className="w-full bg-slate-900/60 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.material}
                          onChange={(e) => handleUpdateDwItem(item.id, { material: e.target.value })}
                          className="w-full bg-slate-900/60 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.location}
                          onChange={(e) => handleUpdateDwItem(item.id, { location: e.target.value })}
                          className="w-full bg-slate-900/60 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateDwItem(item.id, { quantity: parseInt(e.target.value) || 1 })
                          }
                          className="w-full bg-slate-900/60 border border-slate-700 rounded px-1 py-1 text-xs text-center text-white font-bold"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteDwItem(item.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition"
                          title="Delete item"
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
        )}

        {/* TAB 4: OFFICIAL PRINTABLE SCHEDULE PREVIEW */}
        {activeTab === 'preview' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">
                Univision Design & Construction Ltd • Official Architectural Drawing Package Schedule
              </span>
              <button
                type="button"
                onClick={handlePrint}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print Architectural Schedule
              </button>
            </div>

            {/* A4 White Paper Sheet */}
            <div
              id="architectural-schedule-printable-sheet"
              className="bg-white text-slate-900 rounded-xl p-8 shadow-2xl max-w-4xl mx-auto border border-slate-300 font-sans print:p-0 print:border-none print:shadow-none"
            >
              {/* Document Header - Clean, robust layout with NO overshadowing */}
              <div className="border-b-2 border-slate-900 pb-4 mb-4 flex justify-between items-start gap-4">
                <div className="flex items-start gap-3">
                  <UnivisionLogo emblemOnly size="md" />
                  <div>
                    <h1 className="text-lg md:text-xl font-black text-slate-950 tracking-tight leading-tight">
                      UNIVISION DESIGN AND CONSTRUCTION LTD.
                    </h1>
                    <p className="text-[11px] font-semibold text-slate-600 tracking-wide uppercase">
                      ARCHITECTURAL DESIGN & URBAN PLANNING DIVISION
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Sukuta-jabang Highway, Sukuta Dalaba • Tel: +220 872104724 • univision0111@gmail.com
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded">
                    ARCHITECTURAL DRAWING PACKAGE SCHEDULE • {packageTier.toUpperCase()}
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
                  <span className="text-slate-500 block text-[10px] font-medium">PROJECT TITLE</span>
                  <span className="font-bold text-slate-900">{project.title}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-medium">CLIENT</span>
                  <span className="font-bold text-slate-900">{project.clientName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-medium">SITE LOCATION</span>
                  <span className="font-bold text-slate-900">{project.siteLocation}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-medium">GROSS FLOOR AREA</span>
                  <span className="font-bold text-blue-800">{project.grossFloorArea} m²</span>
                </div>
              </div>

              {/* Architectural Service Package Deliverables Scope */}
              <div className="bg-blue-50/80 border border-blue-200 rounded p-2.5 mb-4 text-[10px]">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-blue-950 uppercase tracking-wide">
                    ARCHITECTURAL DELIVERABLES SCOPE: {packageTier.toUpperCase()} PACKAGE (GMD {rate}/m² • TOTAL: GMD {calculatedFee.toLocaleString()})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsServicesModalOpen(true)}
                      className="text-[9px] font-semibold text-blue-800 hover:text-blue-950 underline flex items-center gap-0.5 print:hidden"
                      title="Edit architectural deliverables scope"
                    >
                      <Edit3 className="w-2.5 h-2.5" /> Edit Scope
                    </button>
                    <span className="text-[9px] font-semibold text-blue-900 bg-blue-100 px-1.5 py-0.5 rounded border border-blue-300">
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

              {/* Section 1: Drawing Sheet Index Register */}
              <div className="mb-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5 border-b border-slate-300 pb-1">
                  1. Architectural Drawing Sheet Register
                </h3>
                <table className="w-full text-[11px] border-collapse border border-slate-300">
                  <thead className="bg-slate-200 text-slate-800">
                    <tr>
                      <th className="border border-slate-300 p-1.5 text-left w-16">Sheet No</th>
                      <th className="border border-slate-300 p-1.5 text-left">Drawing Title & Description</th>
                      <th className="border border-slate-300 p-1.5 text-center w-16">Scale</th>
                      <th className="border border-slate-300 p-1.5 text-center w-14">Rev</th>
                      <th className="border border-slate-300 p-1.5 text-center w-24">Status</th>
                      <th className="border border-slate-300 p-1.5 text-left">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {project.sheets.map((sheet) => (
                      <tr key={sheet.id} className="odd:bg-white even:bg-slate-50">
                        <td className="border border-slate-300 p-1.5 font-bold font-mono text-blue-900">{sheet.sheetNo}</td>
                        <td className="border border-slate-300 p-1.5 font-medium">{sheet.title}</td>
                        <td className="border border-slate-300 p-1.5 text-center">{sheet.scale}</td>
                        <td className="border border-slate-300 p-1.5 text-center font-mono">{sheet.revision}</td>
                        <td className="border border-slate-300 p-1.5 text-center font-semibold text-slate-700">{sheet.status}</td>
                        <td className="border border-slate-300 p-1.5 text-slate-600">{sheet.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Section 2: Door & Window Fenestration Schedule */}
              <div className="mb-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5 border-b border-slate-300 pb-1">
                  2. Measured Architectural Fenestration & Opening Schedule
                </h3>
                <table className="w-full text-[11px] border-collapse border border-slate-300">
                  <thead className="bg-slate-200 text-slate-800">
                    <tr>
                      <th className="border border-slate-300 p-1 text-center w-14">Mark</th>
                      <th className="border border-slate-300 p-1 text-left w-20">Type</th>
                      <th className="border border-slate-300 p-1 text-left w-28">Dimensions</th>
                      <th className="border border-slate-300 p-1 text-left">Material & Joinery Specification</th>
                      <th className="border border-slate-300 p-1 text-left">Location</th>
                      <th className="border border-slate-300 p-1 text-center w-12">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {project.doorWindowSchedule.map((item) => (
                      <tr key={item.id} className="odd:bg-white even:bg-slate-50">
                        <td className="border border-slate-300 p-1 text-center font-bold text-amber-900 font-mono">{item.mark}</td>
                        <td className="border border-slate-300 p-1">{item.type}</td>
                        <td className="border border-slate-300 p-1 font-semibold">{item.dimensions}</td>
                        <td className="border border-slate-300 p-1">{item.material}</td>
                        <td className="border border-slate-300 p-1">{item.location}</td>
                        <td className="border border-slate-300 p-1 text-center font-bold">{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* DEPARTMENT OFFICIALS & WHO DID WHAT */}
              <DepartmentOfficialsCard department="architectural" isPrintVersion={true} />

              {/* Sign-off & Verification */}
              <div className="border-t-2 border-slate-300 pt-4 mt-6 grid grid-cols-2 gap-8 text-xs text-slate-600">
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1">
                    LEAD ARCHITECTURAL CONSULTANT
                  </span>
                  <div className="font-bold text-slate-900">{project.leadArchitect}</div>
                  <div className="text-[11px] text-slate-500">Univision Design and Construction Ltd.</div>
                  <div className="h-8 border-b border-dashed border-slate-400 mt-2"></div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Architectural Seal & Signature</div>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1">
                    CLIENT ACKNOWLEDGEMENT & APPROVAL
                  </span>
                  <div className="font-bold text-slate-900">{project.clientName}</div>
                  <div className="text-[11px] text-slate-500">Authorized Client Representative</div>
                  <div className="h-8 border-b border-dashed border-slate-400 mt-2"></div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Signature & Date of Approval</div>
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
        initialCategory="architectural"
      />
    </div>
  );
}
