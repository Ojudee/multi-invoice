import React, { useState, useEffect } from 'react';
import {
  HardHat,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Camera,
  FileText,
  Printer,
  Receipt,
  Plus,
  Trash2,
  ExternalLink,
  Sparkles,
  ClipboardCheck,
  ShieldCheck,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  Check,
} from 'lucide-react';
import { UnivisionLogo } from './UnivisionLogo';
import { DEFAULT_COMPANY, SITE_INSPECTION_PACKAGE } from '../data/constants';
import { printInvoiceElement } from '../utils/printHelper';
import { Invoice } from '../types';
import { DepartmentOfficialsCard } from './DepartmentOfficialsCard';

export interface InspectionCheckItem {
  id: string;
  category: string;
  item: string;
  status: 'Pass' | 'Defect' | 'Pending' | 'N/A';
  notes: string;
}

export interface SiteActionItem {
  id: string;
  itemNo: string;
  description: string;
  severity: 'Critical' | 'Major' | 'Minor';
  location: string;
  remedialAction: string;
  deadline: string;
  isResolved: boolean;
}

export interface SiteObservation {
  id: string;
  title: string;
  category: string;
  description: string;
  status: 'Satisfactory' | 'Needs Attention' | 'Non-Compliant';
  recommendation: string;
}

export interface SiteInspectionProject {
  id: string;
  reportNumber: string;
  projectTitle: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  siteLocation: string;
  plotNumber: string;
  inspectionDate: string;
  inspectionStage: 'Foundation & Groundworks' | 'Columns & Beams Framing' | 'Pre-Pour Slab Inspection' | 'Roof Structure & Trusses' | 'Finishes & Final Handover';
  inspectorName: string;
  inspectorTitle: string;
  contractorName: string;
  weatherCondition: string;
  overallVerdict: 'Compliant & Approved' | 'Conditional Pass' | 'Non-Compliant (Defects Found)';
  summaryNotes: string;
  feeAmount: number;
  checks: InspectionCheckItem[];
  actionItems: SiteActionItem[];
  observations: SiteObservation[];
}

export const INITIAL_SITE_INSPECTION_PROJECT: SiteInspectionProject = {
  id: 'insp-proj-1',
  reportNumber: 'INS-2026-001',
  projectTitle: 'Site Inspection, Structural Audit & Compliance Report',
  clientName: '',
  clientPhone: '+220 ',
  clientEmail: '',
  siteLocation: 'Site Location, The Gambia',
  plotNumber: 'Plot Site',
  inspectionDate: new Date().toISOString().split('T')[0],
  inspectionStage: 'Pre-Pour Slab Inspection',
  inspectorName: 'Engr. L. Bojang, M.Sc., MNSE',
  inspectorTitle: 'Senior Structural & Site Inspection Engineer',
  contractorName: 'Registered Site General Contractor',
  weatherCondition: 'Clear & Dry (31°C)',
  overallVerdict: 'Compliant & Approved',
  summaryNotes: 'Site works inspected in accordance with Univision engineering drawings and municipal building code requirements. Structural spacing, cover blocks, and reinforcement steel bar grades conform to approved specifications.',
  feeAmount: SITE_INSPECTION_PACKAGE.fixedFee || 3500,
  checks: [
    { id: 'chk-1', category: 'Substructure & Foundation', item: 'Excavation depth, footing dimensions & soil bearing firm ground', status: 'Pass', notes: 'Bearing layer verified dry and firm' },
    { id: 'chk-2', category: 'Substructure & Foundation', item: 'Reinforcement cage spacing, clear cover blocks & starter bars', status: 'Pass', notes: '50mm concrete cover blocks placed' },
    { id: 'chk-3', category: 'Structural Frame', item: 'Column and beam reinforcement sizes, stirrup spacing & link ties', status: 'Pass', notes: 'High yield B500B rebar verified' },
    { id: 'chk-4', category: 'Structural Frame', item: 'Formwork shuttering rigidity, propping verticality & cleanout', status: 'Pass', notes: 'Steel props braced securely' },
    { id: 'chk-5', category: 'MEP Conduits', item: 'Conduit pipes, drainage drops and plumbing sleeves prior to cast', status: 'Pass', notes: 'Sleeves sealed and secured' },
    { id: 'chk-6', category: 'Masonry & Walling', item: 'Sandcrete block quality, bond alignment & lintel bed thickness', status: 'Pass', notes: 'Sandcrete blocks 150mm & 200mm tested' },
    { id: 'chk-7', category: 'Roof & Drainage', item: 'Roof truss tie-down straps, timber treatment & gutter gradient', status: 'Pass', notes: 'Treated timber with anti-termite' },
    { id: 'chk-8', category: 'Safety & Compliance', item: 'Site safety barriers, PPE equipment & boundary line setbacks', status: 'Pass', notes: 'Building line municipal setbacks confirmed' },
  ],
  actionItems: [
    {
      id: 'act-1',
      itemNo: 'ACT-01',
      description: 'Ensure 25mm spacer blocks are positioned beneath beam bottom bars before concrete pouring',
      severity: 'Minor',
      location: 'Grid B-3 Suspended Beam',
      remedialAction: 'Install precast mortar cover blocks',
      deadline: 'Prior to Concrete Pour',
      isResolved: true,
    },
    {
      id: 'act-2',
      itemNo: 'ACT-02',
      description: 'Clear away loose wood shavings and debris inside column formwork base',
      severity: 'Minor',
      location: 'Column C-1 & C-4 Base',
      remedialAction: 'Wash and vacuum formwork base opening',
      deadline: 'Prior to Pouring',
      isResolved: true,
    },
  ],
  observations: [
    {
      id: 'obs-1',
      title: 'Structural Reinforcement Lapping & Anchor Hooks',
      category: 'Structural Quality',
      description: 'Main rebar lap lengths exceed standard 50d requirement with clean 90-degree hooks into edge beams.',
      status: 'Satisfactory',
      recommendation: 'Maintain current bar tying quality throughout remaining stages.',
    },
    {
      id: 'obs-2',
      title: 'Concrete Batching & Ready-Mix Water-Cement Ratio',
      category: 'Materials Verification',
      description: 'Batching requires strict 1:1.5:3 C25 concrete mix design. Mechanical vibrators on site ready.',
      status: 'Satisfactory',
      recommendation: 'Perform slump test for each delivery batch before casting.',
    },
  ],
};

interface SiteInspectionPortalProps {
  isStandaloneWindow?: boolean;
  onPopoutWindow?: () => void;
  onGenerateInvoice?: (invoiceData: Partial<Invoice>) => void;
  onSwitchPortal?: (portal: 'invoices' | 'architectural' | 'structural' | 'boq' | 'packages' | 'inspection') => void;
}

export function SiteInspectionPortal({
  isStandaloneWindow = false,
  onPopoutWindow,
  onGenerateInvoice,
  onSwitchPortal,
}: SiteInspectionPortalProps) {
  const [project, setProject] = useState<SiteInspectionProject>(() => {
    try {
      const saved = localStorage.getItem('univision_active_inspection_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_SITE_INSPECTION_PROJECT;
  });

  const [activeTab, setActiveTab] = useState<'checklist' | 'observations' | 'actions' | 'report'>('checklist');
  const [notification, setNotification] = useState<string>('');

  // Persist project changes
  useEffect(() => {
    try {
      localStorage.setItem('univision_active_inspection_v1', JSON.stringify(project));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.warn('Inspection storage issue', e);
    }
  }, [project]);

  const handleUpdate = <K extends keyof SiteInspectionProject>(key: K, value: SiteInspectionProject[K]) => {
    setProject((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleUpdateCheck = (id: string, updates: Partial<InspectionCheckItem>) => {
    setProject((prev) => ({
      ...prev,
      checks: prev.checks.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  };

  const handleAddCheck = () => {
    const newCheck: InspectionCheckItem = {
      id: `chk-${Date.now()}`,
      category: 'General Compliance',
      item: 'New inspection checkpoint',
      status: 'Pending',
      notes: '',
    };
    setProject((prev) => ({ ...prev, checks: [...prev.checks, newCheck] }));
  };

  const handleDeleteCheck = (id: string) => {
    setProject((prev) => ({ ...prev, checks: prev.checks.filter((c) => c.id !== id) }));
  };

  // Action Items helpers
  const handleAddAction = () => {
    const newAction: SiteActionItem = {
      id: `act-${Date.now()}`,
      itemNo: `ACT-${String(project.actionItems.length + 1).padStart(2, '0')}`,
      description: 'Remedial action required on site',
      severity: 'Minor',
      location: 'Site Location',
      remedialAction: 'Perform correction before next stage',
      deadline: 'Within 48 hours',
      isResolved: false,
    };
    setProject((prev) => ({ ...prev, actionItems: [...prev.actionItems, newAction] }));
  };

  const handleUpdateAction = (id: string, updates: Partial<SiteActionItem>) => {
    setProject((prev) => ({
      ...prev,
      actionItems: prev.actionItems.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    }));
  };

  const handleDeleteAction = (id: string) => {
    setProject((prev) => ({
      ...prev,
      actionItems: prev.actionItems.filter((a) => a.id !== id),
    }));
  };

  // Observations helpers
  const handleAddObservation = () => {
    const newObs: SiteObservation = {
      id: `obs-${Date.now()}`,
      title: 'Site Engineering Observation',
      category: 'Workmanship',
      description: 'Detailed technical finding observed during physical site walk-through.',
      status: 'Satisfactory',
      recommendation: 'Adhere to approved standard procedures.',
    };
    setProject((prev) => ({ ...prev, observations: [...prev.observations, newObs] }));
  };

  const handleUpdateObservation = (id: string, updates: Partial<SiteObservation>) => {
    setProject((prev) => ({
      ...prev,
      observations: prev.observations.map((o) => (o.id === id ? { ...o, ...updates } : o)),
    }));
  };

  const handleDeleteObservation = (id: string) => {
    setProject((prev) => ({
      ...prev,
      observations: prev.observations.filter((o) => o.id !== id),
    }));
  };

  // Turnkey invoice generator
  const handleGenerateInvoice = () => {
    const invoiceData: Partial<Invoice> = {
      invoiceNumber: `INV-INS-${Math.floor(100 + Math.random() * 900)}`,
      date: project.inspectionDate,
      client: {
        name: project.clientName || 'Valued Client',
        phone: project.clientPhone || '+220 ',
        email: project.clientEmail || '',
        address: project.siteLocation || 'The Gambia',
      },
      project: {
        projectName: project.projectTitle,
        projectAddress: project.siteLocation,
        cityProvince: 'West Coast Region',
        postalCode: 'WCR',
      },
      floors: [
        {
          id: `fl-ins-${Date.now()}`,
          floorName: `04 Site Inspection & Reports Package (${project.inspectionStage})`,
          area: 1,
          customRate: project.feeAmount,
        },
      ],
      packageType: 'custom',
      packageRate: project.feeAmount,
      additionalNotes: `Official Site Inspection & Compliance Certification.\nReport No: ${project.reportNumber}\nStage: ${project.inspectionStage}\nInspector: ${project.inspectorName}\nVerdict: ${project.overallVerdict}\n\nIncludes:\n- Professional Site Walkthrough & Audit\n- Checklist Verification (${project.checks.length} Points)\n- Action Items & Rectification Tracking\n- Official Univision Stamped Certificate & Report`,
      currency: 'GMD',
      unit: 'm²',
      packagesConfig: {
        architectural: { enabled: false, tier: 'regular', rate: 75 },
        structural: { enabled: false, tier: 'regular', rate: 65 },
        boq: { enabled: false, tier: 'regular', fee: 18000 },
        inspection: {
          enabled: true,
          tier: 'standard',
          fee: project.feeAmount,
          consultationTitle: `SITE INSPECTION & TECHNICAL CONSULTATION (${project.inspectionStage.toUpperCase()})`,
          inspectionScope: project.siteLocation || 'On-Site Field Visit & Terrain Assessment',
          servicesList: [
            'Site Inspection and Compliance Audit',
            'Checklist Verification & Stage Review',
            'Technical Consultation & Advisory',
          ],
          officialDeliverables: [
            `Official Univision Stamped Certificate #${project.reportNumber}`,
            'Photographic Audit & Remediation Recommendations',
          ],
        },
      },
    };

    if (onGenerateInvoice) {
      onGenerateInvoice(invoiceData);
      setNotification(`Created Site Inspection Invoice for GMD ${project.feeAmount.toLocaleString()}!`);
      setTimeout(() => setNotification(''), 4000);
    } else {
      try {
        localStorage.setItem('univision_pending_invoice_sync', JSON.stringify(invoiceData));
        window.dispatchEvent(new Event('storage'));
        setNotification('Inspection invoice synced to Invoice Studio!');
        setTimeout(() => setNotification(''), 4000);
      } catch {}
    }
  };

  // Safe isolated print
  const handlePrint = () => {
    if (activeTab !== 'report') {
      setActiveTab('report');
      setTimeout(() => {
        printInvoiceElement('inspection-printable-sheet', 'Univision Official Site Inspection Certificate & Report');
      }, 150);
      return;
    }
    printInvoiceElement('inspection-printable-sheet', 'Univision Official Site Inspection Certificate & Report');
  };

  const passCount = project.checks.filter((c) => c.status === 'Pass').length;
  const defectCount = project.checks.filter((c) => c.status === 'Defect').length;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Banner Controls */}
      <header className="bg-slate-950 border-b border-slate-800 px-4 py-3 sticky top-0 z-40 shadow-lg print:hidden">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-900/50 border border-amber-500/40 rounded-lg text-amber-400">
              <HardHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base tracking-wide">
                  SITE INSPECTION & REPORTS
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-400/40">
                  PACKAGE 04 • GMD {project.feeAmount.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                UNIVISION DESIGN AND CONSTRUCTION LTD. • Quality Audits, Punch Lists & Compliance Reports
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleGenerateInvoice}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>⚡ Generate Invoice (GMD {project.feeAmount.toLocaleString()})</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Inspection Document</span>
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

        {/* TAB BUTTONS (NO 'schedule' OR 'windows' IN TAB LABELS) */}
        <div className="max-w-7xl mx-auto mt-3 border-t border-slate-800 pt-2 flex items-center justify-between gap-3 overflow-x-auto text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('checklist')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'checklist'
                  ? 'bg-amber-600 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>1. Inspection Checklist ({project.checks.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('observations')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'observations'
                  ? 'bg-amber-600 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>2. Site Observations ({project.observations.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('actions')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'actions'
                  ? 'bg-amber-600 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>3. Action Items ({project.actionItems.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('report')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'report'
                  ? 'bg-amber-600 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>4. Official Inspection Certificate</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 font-mono hidden md:block">
            Status: <span className="text-emerald-400 font-bold">{passCount} Pass</span> •{' '}
            <span className="text-rose-400 font-bold">{defectCount} Defect</span> •{' '}
            Verdict: <span className="text-amber-400 font-bold">{project.overallVerdict}</span>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto w-full p-4 md:p-6 flex-1 space-y-6">
        {/* TAB 1: INSPECTION CHECKLIST */}
        {activeTab === 'checklist' && (
          <div className="space-y-4">
            {/* Project Details Bar */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 font-medium block">Project Title</label>
                <input
                  type="text"
                  value={project.projectTitle}
                  onChange={(e) => handleUpdate('projectTitle', e.target.value)}
                  placeholder="Enter project name..."
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-semibold"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-medium block">Client Name</label>
                <input
                  type="text"
                  value={project.clientName}
                  onChange={(e) => handleUpdate('clientName', e.target.value)}
                  placeholder="Client name..."
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-medium block">Site Location / Plot</label>
                <input
                  type="text"
                  value={project.siteLocation}
                  onChange={(e) => handleUpdate('siteLocation', e.target.value)}
                  placeholder="Site address..."
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-medium block">Inspection Stage</label>
                <select
                  value={project.inspectionStage}
                  onChange={(e) => handleUpdate('inspectionStage', e.target.value as SiteInspectionProject['inspectionStage'])}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-amber-300 font-semibold focus:outline-none focus:border-amber-500"
                >
                  <option value="Foundation & Groundworks">Foundation & Groundworks</option>
                  <option value="Columns & Beams Framing">Columns & Beams Framing</option>
                  <option value="Pre-Pour Slab Inspection">Pre-Pour Slab Inspection</option>
                  <option value="Roof Structure & Trusses">Roof Structure & Trusses</option>
                  <option value="Finishes & Final Handover">Finishes & Final Handover</option>
                </select>
              </div>
            </div>

            {/* Checklist Table */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">Physical Site Inspection Audit Points</h3>
                  <span className="text-[10px] bg-amber-900/60 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-mono">
                    {project.checks.length} Quality Verification Checks
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddCheck}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Audit Checkpoint
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-700 bg-slate-900/80 text-slate-400 font-semibold">
                      <th className="p-2.5 w-10 text-center">#</th>
                      <th className="p-2.5 w-44">Category</th>
                      <th className="p-2.5">Verification Point & Standard</th>
                      <th className="p-2.5 w-32 text-center">Audit Status</th>
                      <th className="p-2.5">Inspector Findings & Field Notes</th>
                      <th className="p-2.5 w-12 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-750">
                    {project.checks.map((chk, idx) => (
                      <tr key={chk.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-2 text-center text-slate-500 font-mono">{idx + 1}</td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={chk.category}
                            onChange={(e) => handleUpdateCheck(chk.id, { category: e.target.value })}
                            className="w-full bg-slate-900/60 border border-slate-700 rounded px-2 py-1 text-xs text-amber-300 font-semibold"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={chk.item}
                            onChange={(e) => handleUpdateCheck(chk.id, { item: e.target.value })}
                            className="w-full bg-slate-900/60 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <select
                            value={chk.status}
                            onChange={(e) => handleUpdateCheck(chk.id, { status: e.target.value as InspectionCheckItem['status'] })}
                            className={`px-2 py-1 rounded text-xs font-bold border ${
                              chk.status === 'Pass'
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-600/50'
                                : chk.status === 'Defect'
                                ? 'bg-rose-950 text-rose-300 border-rose-600/50'
                                : chk.status === 'Pending'
                                ? 'bg-amber-950 text-amber-300 border-amber-600/50'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            <option value="Pass">Pass</option>
                            <option value="Defect">Defect</option>
                            <option value="Pending">Pending</option>
                            <option value="N/A">N/A</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={chk.notes}
                            onChange={(e) => handleUpdateCheck(chk.id, { notes: e.target.value })}
                            placeholder="Observations, rebar diameters, concrete cover..."
                            className="w-full bg-slate-900/60 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 placeholder-slate-600"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteCheck(chk.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition"
                            title="Delete check"
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

            {/* SITE INSPECTION OFFICIALS & WHO DID WHAT */}
            <DepartmentOfficialsCard
              department="inspection"
              title="Site Inspection & Quality Compliance Officials (Who Did What)"
            />
          </div>
        )}

        {/* TAB 2: SITE OBSERVATIONS */}
        {activeTab === 'observations' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Technical Site Engineering Findings</h3>
                <p className="text-xs text-slate-400">
                  Comprehensive notes on construction quality, materials and workmanship
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddObservation}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Finding
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.observations.map((obs) => (
                <div key={obs.id} className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={obs.title}
                      onChange={(e) => handleUpdateObservation(obs.id, { title: e.target.value })}
                      className="bg-transparent font-bold text-white text-sm focus:outline-none border-b border-transparent focus:border-amber-400 w-2/3"
                    />
                    <div className="flex items-center gap-2">
                      <select
                        value={obs.status}
                        onChange={(e) => handleUpdateObservation(obs.id, { status: e.target.value as SiteObservation['status'] })}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          obs.status === 'Satisfactory'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-600/40'
                            : obs.status === 'Needs Attention'
                            ? 'bg-amber-950 text-amber-300 border-amber-600/40'
                            : 'bg-rose-950 text-rose-300 border-rose-600/40'
                        }`}
                      >
                        <option value="Satisfactory">Satisfactory</option>
                        <option value="Needs Attention">Needs Attention</option>
                        <option value="Non-Compliant">Non-Compliant</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleDeleteObservation(obs.id)}
                        className="text-slate-500 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-semibold block">Observation Details</label>
                    <textarea
                      rows={2}
                      value={obs.description}
                      onChange={(e) => handleUpdateObservation(obs.id, { description: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-amber-400 uppercase font-semibold block">Engineering Recommendation</label>
                    <textarea
                      rows={2}
                      value={obs.recommendation}
                      onChange={(e) => handleUpdateObservation(obs.id, { recommendation: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-amber-200/90 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: ACTION ITEMS & PUNCH LIST */}
        {activeTab === 'actions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Remedial Action Items & Punch List</h3>
                <p className="text-xs text-slate-400">
                  Required contractor rectifications prior to official sign-off
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddAction}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Action Item
              </button>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 overflow-x-auto shadow-xl">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/80 text-slate-400 font-semibold">
                    <th className="p-2.5 w-20">Code</th>
                    <th className="p-2.5">Non-Conformance / Issue</th>
                    <th className="p-2.5 w-28 text-center">Severity</th>
                    <th className="p-2.5 w-40">Location on Site</th>
                    <th className="p-2.5">Corrective Action Required</th>
                    <th className="p-2.5 w-32">Deadline</th>
                    <th className="p-2.5 w-20 text-center">Resolved</th>
                    <th className="p-2.5 w-10 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-750">
                  {project.actionItems.map((act) => (
                    <tr key={act.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-2 font-mono text-amber-400 font-bold">{act.itemNo}</td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={act.description}
                          onChange={(e) => handleUpdateAction(act.id, { description: e.target.value })}
                          className="w-full bg-slate-900/60 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <select
                          value={act.severity}
                          onChange={(e) => handleUpdateAction(act.id, { severity: e.target.value as SiteActionItem['severity'] })}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            act.severity === 'Critical'
                              ? 'bg-rose-950 text-rose-300 border-rose-600/50'
                              : act.severity === 'Major'
                              ? 'bg-amber-950 text-amber-300 border-amber-600/50'
                              : 'bg-blue-950 text-blue-300 border-blue-600/50'
                          }`}
                        >
                          <option value="Critical">Critical</option>
                          <option value="Major">Major</option>
                          <option value="Minor">Minor</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={act.location}
                          onChange={(e) => handleUpdateAction(act.id, { location: e.target.value })}
                          className="w-full bg-slate-900/60 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={act.remedialAction}
                          onChange={(e) => handleUpdateAction(act.id, { remedialAction: e.target.value })}
                          className="w-full bg-slate-900/60 border border-slate-700 rounded px-2 py-1 text-xs text-amber-200"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={act.deadline}
                          onChange={(e) => handleUpdateAction(act.id, { deadline: e.target.value })}
                          className="w-full bg-slate-900/60 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="checkbox"
                          checked={act.isResolved}
                          onChange={(e) => handleUpdateAction(act.id, { isResolved: e.target.checked })}
                          className="w-4 h-4 text-emerald-500 rounded border-slate-700 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteAction(act.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition"
                          title="Delete action"
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

        {/* TAB 4: OFFICIAL PRINTABLE CERTIFICATE & REPORT */}
        {activeTab === 'report' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center print:hidden">
              <span className="text-xs text-slate-400">
                Univision Design & Construction Ltd • Official Site Inspection Certificate & Compliance Report
              </span>
              <button
                type="button"
                onClick={handlePrint}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4" /> Print Inspection Certificate
              </button>
            </div>

            {/* A4 White Paper Inspection Document */}
            <div
              id="inspection-printable-sheet"
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
                      SITE SUPERVISION & STRUCTURAL AUDIT CONSULTANCY DIVISION
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Sukuta-jabang Highway, Sukuta Dalaba • Tel: +220 872104724 • univision0111@gmail.com
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber-950 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded">
                    SITE INSPECTION & AUDIT REPORT
                  </div>
                  <div className="text-sm font-black text-slate-900 mt-1 font-mono">
                    {project.reportNumber}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Date: {project.inspectionDate}
                  </div>
                </div>
              </div>

              {/* Project & Client Metadata */}
              <div className="bg-slate-100 border border-slate-200 rounded p-3 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] font-medium">PROJECT TITLE</span>
                  <span className="font-bold text-slate-900">{project.projectTitle || 'Site Project'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-medium">CLIENT</span>
                  <span className="font-bold text-slate-900">{project.clientName || 'Private Client'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-medium">SITE LOCATION</span>
                  <span className="font-bold text-slate-900">{project.siteLocation}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-medium">INSPECTION STAGE</span>
                  <span className="font-bold text-blue-900">{project.inspectionStage}</span>
                </div>
              </div>

              {/* Verdict Banner */}
              <div
                className={`p-3 rounded-lg border mb-4 flex items-center justify-between ${
                  project.overallVerdict === 'Compliant & Approved'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : project.overallVerdict === 'Conditional Pass'
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}
              >
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider block">OFFICIAL AUDIT VERDICT</span>
                  <span className="text-base font-black tracking-tight">{project.overallVerdict.toUpperCase()}</span>
                </div>
                <div className="text-right text-[11px]">
                  <div>Audited by: <strong>{project.inspectorName}</strong></div>
                  <div className="text-[10px] opacity-80">{project.inspectorTitle}</div>
                </div>
              </div>

              {/* Summary Findings */}
              <div className="mb-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-300 pb-1 mb-2">
                  1. Executive Summary & Quality Findings
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-200">
                  {project.summaryNotes}
                </p>
              </div>

              {/* Audit Checkpoint Results */}
              <div className="mb-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-300 pb-1 mb-2">
                  2. Quality Audit Point Verification Results
                </h4>
                <table className="w-full text-[11px] text-left border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                      <th className="p-1.5 border-r border-slate-200 w-8 text-center">#</th>
                      <th className="p-1.5 border-r border-slate-200 w-40">Category</th>
                      <th className="p-1.5 border-r border-slate-200">Verification Point</th>
                      <th className="p-1.5 border-r border-slate-200 w-24 text-center">Result</th>
                      <th className="p-1.5">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {project.checks.map((chk, i) => (
                      <tr key={chk.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="p-1 border-r border-slate-200 text-center font-mono text-[10px]">{i + 1}</td>
                        <td className="p-1 border-r border-slate-200 font-medium text-slate-700">{chk.category}</td>
                        <td className="p-1 border-r border-slate-200 text-slate-900">{chk.item}</td>
                        <td className="p-1 border-r border-slate-200 text-center font-bold">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] ${
                              chk.status === 'Pass'
                                ? 'bg-emerald-100 text-emerald-800'
                                : chk.status === 'Defect'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {chk.status}
                          </span>
                        </td>
                        <td className="p-1 text-slate-600 text-[10px]">{chk.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action Items List */}
              {project.actionItems.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-300 pb-1 mb-2">
                    3. Required Corrective Actions & Punch List
                  </h4>
                  <table className="w-full text-[10px] text-left border-collapse border border-slate-200">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                        <th className="p-1.5 border-r border-slate-200 w-16">Item No</th>
                        <th className="p-1.5 border-r border-slate-200">Required Correction</th>
                        <th className="p-1.5 border-r border-slate-200 w-28">Location</th>
                        <th className="p-1.5 border-r border-slate-200 w-28">Deadline</th>
                        <th className="p-1.5 w-20 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {project.actionItems.map((act) => (
                        <tr key={act.id} className="border-b border-slate-200">
                          <td className="p-1 border-r border-slate-200 font-mono font-bold">{act.itemNo}</td>
                          <td className="p-1 border-r border-slate-200 text-slate-800">{act.description}</td>
                          <td className="p-1 border-r border-slate-200 text-slate-600">{act.location}</td>
                          <td className="p-1 border-r border-slate-200 text-slate-600">{act.deadline}</td>
                          <td className="p-1 text-center font-bold">
                            <span className={act.isResolved ? 'text-emerald-700' : 'text-amber-700'}>
                              {act.isResolved ? 'Resolved' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* SITE INSPECTION OFFICIALS & WHO DID WHAT */}
              <DepartmentOfficialsCard department="inspection" isPrintVersion={true} />

              {/* Signatures & Certification Lockup */}
              <div className="border-t-2 border-slate-900 pt-4 mt-6 grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block uppercase">INSPECTING ENGINEER</span>
                  <div className="font-signature text-xl text-blue-900 my-1">{project.inspectorName.split(',')[0]}</div>
                  <span className="font-bold text-slate-900 block text-[11px]">{project.inspectorName}</span>
                  <span className="text-[10px] text-slate-500 block">{project.inspectorTitle}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block uppercase">SITE CONTRACTOR RECEIPT</span>
                  <div className="font-signature text-xl text-slate-800 my-1">Acknowledged</div>
                  <span className="font-bold text-slate-900 block text-[11px]">{project.contractorName}</span>
                  <span className="text-[10px] text-slate-500 block">Site Representative</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block uppercase">OFFICIAL CERTIFICATION STAMP</span>
                  <div className="border border-blue-900/40 rounded p-2 text-center bg-blue-50/50 mt-1">
                    <div className="text-[9px] font-black text-blue-950 uppercase tracking-widest">
                      UNIVISION VERIFIED
                    </div>
                    <div className="text-[8px] text-blue-800 font-mono">
                      CERT: {project.reportNumber}
                    </div>
                    <div className="text-[8px] text-slate-500">
                      Date: {project.inspectionDate}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
