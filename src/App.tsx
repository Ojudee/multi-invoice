import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Printer,
  Sparkles,
  Share2,
  FolderOpen,
  PlusCircle,
  FileDown,
  Loader2,
  Save,
  Building2,
  HardHat,
  FileSpreadsheet,
  ExternalLink,
  Compass,
  Users,
  Github,
  RotateCcw,
  SlidersHorizontal,
  CheckCircle2,
  Layers,
  ArrowRight,
  ShieldCheck,
  Package,
} from 'lucide-react';
import { Invoice, PackageType, PackageSelectionMap } from './types';
import {
  PortalKey,
  PORTAL_CONFIGS,
  loadPortalInvoices,
  savePortalInvoices,
  loadPortalActiveId,
  savePortalActiveId,
  loadPortalArchived,
  savePortalArchived,
} from './utils/portalManager';
import { createDefaultInvoiceByType } from './data/sampleInvoices';
import {
  DEFAULT_COMPANY,
  DEFAULT_TERMS,
  BANK_PRESETS,
  ARCHITECTURAL_PACKAGES,
  STRUCTURAL_PACKAGES,
  BOQ_PACKAGES,
  SITE_INSPECTION_PACKAGE,
  getBOQPackageFee,
} from './data/constants';
import { UnivisionLogo } from './components/UnivisionLogo';
import { InvoicePaper } from './components/InvoicePaper';
import { InvoiceEditor } from './components/InvoiceEditor';
import { InvoiceList } from './components/InvoiceList';
import { SignatureModal } from './components/SignatureModal';
import { ExportModal } from './components/ExportModal';
import { PrintPreviewModal } from './components/PrintPreviewModal';
import { ArchitecturalSchedulePortal } from './components/ArchitecturalSchedulePortal';
import { StructuralEngineeringPortal } from './components/StructuralEngineeringPortal';
import { BOQPortal } from './components/BOQPortal';
import { SiteInspectionPortal } from './components/SiteInspectionPortal';
import { PackagesPortal } from './components/PackagesPortal';
import { DepartmentOfficialsModal } from './components/DepartmentOfficialsModal';
import { GitHubDeployModal } from './components/GitHubDeployModal';
import { calculateInvoice, formatCurrency } from './utils/calculations';
import { downloadInvoicePDF } from './utils/pdfExport';

export type SubViewMode = 'split' | 'preview_only' | 'schedule' | 'list' | 'rates';

function getInitialPortal(): { portal: PortalKey; isStandalone: boolean } {
  try {
    const params = new URLSearchParams(window.location.search);
    const p = (params.get('portal') || params.get('window')) as PortalKey;
    if (p === 'general' || p === 'architectural' || p === 'structural' || p === 'boq' || p === 'inspection') {
      return { portal: p, isStandalone: true };
    }
  } catch {}
  return { portal: 'architectural', isStandalone: false };
}

export default function App() {
  const initialInfo = getInitialPortal();
  const [activePortal, setActivePortal] = useState<PortalKey>(initialInfo.portal);
  const [isStandaloneWindow] = useState<boolean>(initialInfo.isStandalone);

  // 100% INDEPENDENT INVOICE STATE FOR EACH OF THE 5 PORTALS
  const [invoicesByPortal, setInvoicesByPortal] = useState<Record<PortalKey, Invoice[]>>(() => ({
    general: loadPortalInvoices('general'),
    architectural: loadPortalInvoices('architectural'),
    structural: loadPortalInvoices('structural'),
    boq: loadPortalInvoices('boq'),
    inspection: loadPortalInvoices('inspection'),
  }));

  const [activeIdByPortal, setActiveIdByPortal] = useState<Record<PortalKey, string>>(() => ({
    general: loadPortalActiveId('general', 'inv-pkg-1'),
    architectural: loadPortalActiveId('architectural', 'inv-architectural-1'),
    structural: loadPortalActiveId('structural', 'inv-structural-1'),
    boq: loadPortalActiveId('boq', 'inv-boq-1'),
    inspection: loadPortalActiveId('inspection', 'inv-inspection-1'),
  }));

  const [archivedByPortal, setArchivedByPortal] = useState<Record<PortalKey, Invoice[]>>(() => ({
    general: loadPortalArchived('general'),
    architectural: loadPortalArchived('architectural'),
    structural: loadPortalArchived('structural'),
    boq: loadPortalArchived('boq'),
    inspection: loadPortalArchived('inspection'),
  }));

  const [subViewByPortal, setSubViewByPortal] = useState<Record<PortalKey, SubViewMode>>({
    general: 'split',
    architectural: 'split',
    structural: 'split',
    boq: 'split',
    inspection: 'split',
  });

  // Current portal's isolated active state
  const currentConfig = PORTAL_CONFIGS[activePortal];
  const currentInvoices = invoicesByPortal[activePortal] || [];
  const currentActiveId = activeIdByPortal[activePortal];
  const currentArchived = archivedByPortal[activePortal] || [];
  const currentSubView = subViewByPortal[activePortal] || 'split';

  const defaultCategory = activePortal === 'general' ? 'multi_package' : activePortal;
  const activeInvoice: Invoice =
    currentInvoices.find((inv) => inv.id === currentActiveId) ||
    currentInvoices[0] ||
    createDefaultInvoiceByType(defaultCategory, 1);

  // Modals state
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [printPreviewFilter, setPrintPreviewFilter] = useState<PackageSelectionMap | undefined>(undefined);
  const [isOfficialsModalOpen, setIsOfficialsModalOpen] = useState(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [notification, setNotification] = useState<string>('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);

  // Split View paper preview responsive scaling
  const [splitScale, setSplitScale] = useState<number>(0.58);
  const paperPreviewRef = useRef<HTMLDivElement>(null);
  const [paperPreviewMode, setPaperPreviewMode] = useState<'fit-page' | 'fit-width' | '100%'>('fit-page');
  const [paperPreviewScale, setPaperPreviewScale] = useState<number>(0.75);

  // Synchronize body class for portal styling
  useEffect(() => {
    document.body.className = `portal-${activePortal} bg-slate-950 text-slate-100 antialiased font-sans`;
  }, [activePortal]);

  // Persistent storage auto-save for current portal
  useEffect(() => {
    savePortalInvoices(activePortal, currentInvoices);
  }, [activePortal, currentInvoices]);

  useEffect(() => {
    savePortalActiveId(activePortal, activeInvoice.id);
  }, [activePortal, activeInvoice.id]);

  useEffect(() => {
    savePortalArchived(activePortal, currentArchived);
  }, [activePortal, currentArchived]);

  // Responsive scaling calculations
  useEffect(() => {
    const updateSplitScale = () => {
      const w = window.innerWidth;
      if (w >= 1536) setSplitScale(0.72);
      else if (w >= 1280) setSplitScale(0.62);
      else if (w >= 1024) setSplitScale(0.54);
      else if (w >= 768) setSplitScale(0.68);
      else setSplitScale(0.44);
    };
    updateSplitScale();
    window.addEventListener('resize', updateSplitScale);
    return () => window.removeEventListener('resize', updateSplitScale);
  }, []);

  useEffect(() => {
    const updatePreviewScale = () => {
      if (paperPreviewMode === '100%') {
        setPaperPreviewScale(1);
        return;
      }
      const w = window.innerWidth;
      const vh = window.innerHeight - 190;
      if (paperPreviewMode === 'fit-width') {
        const targetW = Math.min(w - 64, 880);
        setPaperPreviewScale(Math.min(1.0, Math.max(0.35, targetW / 820)));
      } else {
        const scaleH = vh / 1150;
        const scaleW = (w - 64) / 820;
        setPaperPreviewScale(Math.min(0.95, Math.max(0.35, Math.min(scaleH, scaleW))));
      }
    };
    updatePreviewScale();
    window.addEventListener('resize', updatePreviewScale);
    return () => window.removeEventListener('resize', updatePreviewScale);
  }, [paperPreviewMode]);

  // Set sub-view for active portal
  const setSubView = (mode: SubViewMode) => {
    setSubViewByPortal((prev) => ({
      ...prev,
      [activePortal]: mode,
    }));
  };

  // 1. UPDATE ACTIVE INVOICE IN CURRENT PORTAL
  const handleUpdateActiveInvoice = (updated: Invoice) => {
    setInvoicesByPortal((prev) => ({
      ...prev,
      [activePortal]: prev[activePortal].map((inv) =>
        inv.id === updated.id ? { ...updated, updatedAt: new Date().toISOString() } : inv
      ),
    }));
  };

  // 2. CREATE NEW INVOICE IN CURRENT PORTAL
  const handleCreateNewInvoiceInCurrentPortal = () => {
    const nextSeq = currentInvoices.length + currentArchived.length + 1;
    const cat = activePortal === 'general' ? 'multi_package' : activePortal;
    const newInv = createDefaultInvoiceByType(cat, nextSeq);

    setInvoicesByPortal((prev) => ({
      ...prev,
      [activePortal]: [newInv, ...prev[activePortal]],
    }));

    setActiveIdByPortal((prev) => ({
      ...prev,
      [activePortal]: newInv.id,
    }));

    setSubView('split');
    setNotification(`Created new ${currentConfig.shortTitle} Invoice: ${newInv.invoiceNumber}`);
    setTimeout(() => setNotification(''), 4000);
  };

  // 3. DUPLICATE INVOICE IN CURRENT PORTAL
  const handleDuplicateInvoice = (id: string) => {
    const target = currentInvoices.find((inv) => inv.id === id);
    if (!target) return;
    const duplicated: Invoice = {
      ...target,
      id: `inv-${activePortal}-${Date.now()}`,
      invoiceNumber: `${target.invoiceNumber}-COPY`,
      status: 'draft',
      clientSignature: '',
      clientSignatureType: 'none',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setInvoicesByPortal((prev) => ({
      ...prev,
      [activePortal]: [duplicated, ...prev[activePortal]],
    }));

    setActiveIdByPortal((prev) => ({
      ...prev,
      [activePortal]: duplicated.id,
    }));

    setNotification(`Duplicated ${target.invoiceNumber} as ${duplicated.invoiceNumber}`);
    setTimeout(() => setNotification(''), 3000);
  };

  // 4. ARCHIVE INVOICE IN CURRENT PORTAL
  const handleArchiveInvoice = (id: string) => {
    const target = currentInvoices.find((inv) => inv.id === id);
    if (!target) return;

    const remaining = currentInvoices.filter((inv) => inv.id !== id);
    setInvoicesByPortal((prev) => ({
      ...prev,
      [activePortal]: remaining,
    }));

    setArchivedByPortal((prev) => ({
      ...prev,
      [activePortal]: [target, ...prev[activePortal]],
    }));

    if (activeInvoice.id === id) {
      if (remaining.length > 0) {
        setActiveIdByPortal((prev) => ({
          ...prev,
          [activePortal]: remaining[0].id,
        }));
      } else {
        const cat = activePortal === 'general' ? 'multi_package' : activePortal;
        const fresh = createDefaultInvoiceByType(cat, 1);
        setInvoicesByPortal((prev) => ({
          ...prev,
          [activePortal]: [fresh],
        }));
        setActiveIdByPortal((prev) => ({
          ...prev,
          [activePortal]: fresh.id,
        }));
      }
    }

    setNotification(`Archived ${target.invoiceNumber} in ${currentConfig.shortTitle} Vault.`);
    setTimeout(() => setNotification(''), 3500);
  };

  // 5. RESTORE INVOICE IN CURRENT PORTAL
  const handleRestoreInvoice = (id: string) => {
    const target = currentArchived.find((inv) => inv.id === id);
    if (!target) return;

    setArchivedByPortal((prev) => ({
      ...prev,
      [activePortal]: prev[activePortal].filter((inv) => inv.id !== id),
    }));

    setInvoicesByPortal((prev) => ({
      ...prev,
      [activePortal]: [target, ...prev[activePortal]],
    }));

    setActiveIdByPortal((prev) => ({
      ...prev,
      [activePortal]: target.id,
    }));

    setNotification(`Restored ${target.invoiceNumber} into active ${currentConfig.shortTitle} directory.`);
    setTimeout(() => setNotification(''), 3500);
  };

  // 6. DELETE INVOICE IN CURRENT PORTAL
  const handleDeleteInvoice = (id: string) => {
    const remaining = currentInvoices.filter((inv) => inv.id !== id);
    if (remaining.length === 0) {
      const cat = activePortal === 'general' ? 'multi_package' : activePortal;
      const fresh = createDefaultInvoiceByType(cat, 1);
      setInvoicesByPortal((prev) => ({
        ...prev,
        [activePortal]: [fresh],
      }));
      setActiveIdByPortal((prev) => ({
        ...prev,
        [activePortal]: fresh.id,
      }));
    } else {
      setInvoicesByPortal((prev) => ({
        ...prev,
        [activePortal]: remaining,
      }));
      if (activeInvoice.id === id) {
        setActiveIdByPortal((prev) => ({
          ...prev,
          [activePortal]: remaining[0].id,
        }));
      }
    }
    setNotification('Invoice removed from current portal.');
    setTimeout(() => setNotification(''), 3000);
  };

  // 7. ARCHIVE ALL / RESTORE ALL IN CURRENT PORTAL
  const handleArchiveAll = () => {
    if (currentInvoices.length === 0) return;
    setArchivedByPortal((prev) => ({
      ...prev,
      [activePortal]: [...prev[activePortal], ...currentInvoices],
    }));
    const cat = activePortal === 'general' ? 'multi_package' : activePortal;
    const fresh = createDefaultInvoiceByType(cat, 1);
    setInvoicesByPortal((prev) => ({
      ...prev,
      [activePortal]: [fresh],
    }));
    setActiveIdByPortal((prev) => ({
      ...prev,
      [activePortal]: fresh.id,
    }));
    setNotification(`Archived all ${currentConfig.shortTitle} invoices.`);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleRestoreAllArchived = () => {
    if (currentArchived.length === 0) return;
    setInvoicesByPortal((prev) => ({
      ...prev,
      [activePortal]: [...currentArchived, ...prev[activePortal]],
    }));
    setArchivedByPortal((prev) => ({
      ...prev,
      [activePortal]: [],
    }));
    setNotification(`Restored all archived ${currentConfig.shortTitle} invoices.`);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleEmptyArchive = () => {
    const count = currentArchived.length;
    setArchivedByPortal((prev) => ({
      ...prev,
      [activePortal]: [],
    }));
    setNotification(`Emptied ${currentConfig.shortTitle} archive (${count} items permanently removed).`);
    setTimeout(() => setNotification(''), 3000);
  };

  const handlePermanentDeleteArchived = (id: string) => {
    setArchivedByPortal((prev) => ({
      ...prev,
      [activePortal]: prev[activePortal].filter((inv) => inv.id !== id),
    }));
    setNotification('Item permanently removed from archive.');
    setTimeout(() => setNotification(''), 2500);
  };

  const handleRestoreSampleInvoices = () => {
    const cat = activePortal === 'general' ? 'multi_package' : activePortal;
    const defaultInv = createDefaultInvoiceByType(cat, 1);
    setInvoicesByPortal((prev) => ({
      ...prev,
      [activePortal]: [defaultInv],
    }));
    setActiveIdByPortal((prev) => ({
      ...prev,
      [activePortal]: defaultInv.id,
    }));
    setNotification(`Restored fresh default ${currentConfig.shortTitle} invoice.`);
    setTimeout(() => setNotification(''), 3000);
  };

  // MANUAL SAVE BACKUP
  const handleManualSave = () => {
    savePortalInvoices(activePortal, currentInvoices);
    savePortalActiveId(activePortal, activeInvoice.id);
    setNotification(`Saved ${activeInvoice.invoiceNumber} to local storage`);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleSaveDataFile = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activeInvoice, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `${activeInvoice.invoiceNumber}_Univision_Data.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setNotification(`Downloaded ${activeInvoice.invoiceNumber}_Univision_Data.json backup file`);
      setTimeout(() => setNotification(''), 3000);
    } catch {
      setNotification('Error downloading backup file');
    }
  };

  // PDF DOWNLOAD & PRINT PREVIEW
  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    setNotification(`Compiling high-resolution A4 PDF for ${activeInvoice.invoiceNumber}...`);

    const success = await downloadInvoicePDF(activeInvoice, {
      filename: `${activeInvoice.invoiceNumber}_Univision_Invoice.pdf`,
      onProgress: (msg) => setNotification(msg),
    });

    setIsGeneratingPDF(false);
    if (success) {
      setNotification(`Downloaded ${activeInvoice.invoiceNumber}_Univision_Invoice.pdf`);
    } else {
      setNotification('Failed to generate PDF. Retrying...');
    }
    setTimeout(() => setNotification(''), 4000);
  };

  const handleOpenPrintPreview = (filter?: PackageSelectionMap) => {
    setPrintPreviewFilter(filter);
    setIsPrintPreviewOpen(true);
  };

  const handleSafePrint = async () => {
    await handleDownloadPDF();
    setTimeout(() => {
      try {
        window.print();
      } catch (err) {
        console.warn('System print blocked by sandbox', err);
      }
    }, 200);
  };

  // SYNC FROM TECHNICAL SCHEDULE DIRECTLY TO THIS PORTAL'S ACTIVE INVOICE
  const handleSyncTechnicalScheduleToInvoice = (updatedData: Partial<Invoice>) => {
    handleUpdateActiveInvoice({
      ...activeInvoice,
      ...updatedData,
      updatedAt: new Date().toISOString(),
    });
    setSubView('split');
    setNotification(`Updated ${activeInvoice.invoiceNumber} with technical specifications!`);
    setTimeout(() => setNotification(''), 4000);
  };

  // POP OUT PORTAL INTO STANDALONE WINDOW
  const handlePopoutWindow = (targetPortal: PortalKey) => {
    try {
      const url = `${window.location.origin}${window.location.pathname}?portal=${targetPortal}`;
      const pop = window.open(
        url,
        `Univision_${targetPortal}_Window`,
        'width=1340,height=920,resizable=yes,scrollbars=yes,status=no'
      );
      if (pop) {
        pop.focus();
        setNotification(`Opened ${targetPortal.toUpperCase()} in separate window!`);
      } else {
        setActivePortal(targetPortal);
      }
    } catch {
      setActivePortal(targetPortal);
    }
    setTimeout(() => setNotification(''), 4000);
  };

  // Determine lockStudioTab: 
  // If activePortal is general, lockStudioTab is 'multi_package' (or unconstrained combined mode)
  // If activePortal is discipline, lockStudioTab is that exact discipline
  const lockedStudioTab = activePortal === 'general' ? 'multi_package' : activePortal;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 antialiased font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* GLOBAL TOAST NOTIFICATION */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900/95 text-white text-xs px-4 py-2.5 rounded-lg border border-amber-500/50 shadow-2xl backdrop-blur-md flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-medium">{notification}</span>
        </div>
      )}

      {/* TOP HEADER: EXACTLY 5 DEDICATED INDEPENDENT PORTALS */}
      <header className="bg-slate-900 border-b border-slate-800 shadow-md sticky top-0 z-40 px-3 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          {/* Logo & Corporate Tagline */}
          <div className="flex items-center gap-3">
            <UnivisionLogo className="w-9 h-9 shrink-0 drop-shadow-md" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                  UNIVISION
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/30 uppercase tracking-wider">
                  5-Portal Studio Suite
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                4 Independent Discipline Portals + 1 General Combined Studio
              </p>
            </div>
          </div>

          {/* 5 PRIMARY INDEPENDENT PORTALS NAV */}
          <nav className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1 no-scrollbar">
            {/* PORTAL 1: ARCHITECTURAL */}
            <button
              type="button"
              onClick={() => setActivePortal('architectural')}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activePortal === 'architectural'
                  ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-md font-bold'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700'
              }`}
            >
              <Compass className={`w-3.5 h-3.5 ${activePortal === 'architectural' ? 'text-slate-950' : 'text-amber-400'}`} />
              <span>Architectural</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${activePortal === 'architectural' ? 'bg-slate-950/20 text-slate-950 font-bold' : 'bg-slate-800 text-amber-300 border border-amber-500/30'}`}>
                {invoicesByPortal.architectural[0]?.invoiceNumber || 'INV-ARC-001'}
              </span>
            </button>

            {/* PORTAL 2: STRUCTURAL */}
            <button
              type="button"
              onClick={() => setActivePortal('structural')}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activePortal === 'structural'
                  ? 'bg-blue-500 text-white border-blue-400 shadow-md font-bold'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700'
              }`}
            >
              <Building2 className={`w-3.5 h-3.5 ${activePortal === 'structural' ? 'text-white' : 'text-blue-400'}`} />
              <span>Structural</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${activePortal === 'structural' ? 'bg-blue-700 text-white font-bold' : 'bg-slate-800 text-blue-300 border border-blue-500/30'}`}>
                {invoicesByPortal.structural[0]?.invoiceNumber || 'INV-STR-001'}
              </span>
            </button>

            {/* PORTAL 3: BOQ */}
            <button
              type="button"
              onClick={() => setActivePortal('boq')}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activePortal === 'boq'
                  ? 'bg-emerald-500 text-white border-emerald-400 shadow-md font-bold'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700'
              }`}
            >
              <FileSpreadsheet className={`w-3.5 h-3.5 ${activePortal === 'boq' ? 'text-white' : 'text-emerald-400'}`} />
              <span>BOQ Studio</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${activePortal === 'boq' ? 'bg-emerald-700 text-white font-bold' : 'bg-slate-800 text-emerald-300 border border-emerald-500/30'}`}>
                {invoicesByPortal.boq[0]?.invoiceNumber || 'INV-BOQ-001'}
              </span>
            </button>

            {/* PORTAL 4: SITE INSPECTION */}
            <button
              type="button"
              onClick={() => setActivePortal('inspection')}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activePortal === 'inspection'
                  ? 'bg-orange-500 text-white border-orange-400 shadow-md font-bold'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700'
              }`}
            >
              <HardHat className={`w-3.5 h-3.5 ${activePortal === 'inspection' ? 'text-white' : 'text-orange-400'}`} />
              <span>Site Inspection</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${activePortal === 'inspection' ? 'bg-orange-700 text-white font-bold' : 'bg-slate-800 text-orange-300 border border-orange-500/30'}`}>
                {invoicesByPortal.inspection[0]?.invoiceNumber || 'INV-INS-001'}
              </span>
            </button>

            {/* PORTAL 5: GENERAL INVOICE STUDIO (COMBINED PACKAGES) */}
            <button
              type="button"
              onClick={() => setActivePortal('general')}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activePortal === 'general'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400 shadow-md font-bold ring-1 ring-purple-300'
                  : 'bg-slate-900/90 text-purple-200 hover:text-white hover:bg-purple-950/60 border-purple-800/60'
              }`}
              title="Combined Invoice Studio for bundling two or more disciplines into one invoice"
            >
              <Sparkles className={`w-3.5 h-3.5 ${activePortal === 'general' ? 'text-white' : 'text-purple-400'}`} />
              <span>General Studio (Combined)</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${activePortal === 'general' ? 'bg-purple-900 text-white font-bold' : 'bg-slate-800 text-purple-300 border border-purple-500/30'}`}>
                {invoicesByPortal.general[0]?.invoiceNumber || 'INV-PKG-001'}
              </span>
            </button>
          </nav>

          {/* Quick Corporate Tools */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsOfficialsModalOpen(true)}
              className="px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
              title="Official personnel & stamping matrix"
            >
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline">Who Did What</span>
            </button>

            <button
              type="button"
              onClick={() => handlePopoutWindow(activePortal)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
              title="Pop out this portal in a dedicated standalone OS window"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setIsGitHubModalOpen(true)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
              title="GitHub Deployment & Repository details"
            >
              <Github className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* SUB-BAR: ACTIVE PORTAL WORKSPACE CONTROLS */}
        <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Sub-view navigation for THIS portal */}
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar font-medium">
            <button
              type="button"
              onClick={() => setSubView('split')}
              className={`px-2.5 py-1 rounded transition cursor-pointer whitespace-nowrap ${
                currentSubView === 'split'
                  ? 'bg-slate-800 text-amber-400 font-bold border border-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Invoice Studio (Split)
            </button>

            <button
              type="button"
              onClick={() => setSubView('preview_only')}
              className={`px-2.5 py-1 rounded transition cursor-pointer whitespace-nowrap ${
                currentSubView === 'preview_only'
                  ? 'bg-slate-800 text-amber-400 font-bold border border-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Full Document Preview
            </button>

            {/* Technical Schedule or Combined Package Matrix */}
            <button
              type="button"
              onClick={() => setSubView('schedule')}
              className={`px-2.5 py-1 rounded transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                currentSubView === 'schedule'
                  ? 'bg-slate-800 text-amber-400 font-bold border border-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-3 h-3 text-amber-400" />
              <span>
                {activePortal === 'general'
                  ? 'Cross-Discipline Package Matrix'
                  : activePortal === 'architectural'
                  ? 'Drawing Sheets Schedule'
                  : activePortal === 'structural'
                  ? 'Framing & Rebar Schedule'
                  : activePortal === 'boq'
                  ? 'BOQ Takeoff & Brackets'
                  : 'Inspection Log & Audit'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSubView('list')}
              className={`px-2.5 py-1 rounded transition cursor-pointer whitespace-nowrap ${
                currentSubView === 'list'
                  ? 'bg-slate-800 text-amber-400 font-bold border border-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {currentConfig.shortTitle} Directory ({currentInvoices.length})
            </button>

            <button
              type="button"
              onClick={() => setSubView('rates')}
              className={`px-2.5 py-1 rounded transition cursor-pointer whitespace-nowrap ${
                currentSubView === 'rates'
                  ? 'bg-slate-800 text-amber-400 font-bold border border-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Rates & Scope
            </button>
          </div>

          {/* Action buttons for THIS portal's active invoice */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400 hidden md:inline">
              Active: <strong className="text-amber-400">{activeInvoice.invoiceNumber}</strong>
            </span>

            <button
              type="button"
              onClick={handleCreateNewInvoiceInCurrentPortal}
              className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded shadow-sm flex items-center gap-1 transition cursor-pointer"
              title={`Create a new independent ${currentConfig.shortTitle} invoice`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">+ New {currentConfig.shortTitle}</span>
              <span className="sm:hidden">+ New</span>
            </button>

            <button
              type="button"
              onClick={handleManualSave}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 font-semibold rounded flex items-center gap-1 transition cursor-pointer"
              title="Save current invoice changes"
            >
              <Save className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Save</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-bold rounded flex items-center gap-1 transition cursor-pointer"
              title="Download high-resolution vector PDF"
            >
              {isGeneratingPDF ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
              ) : (
                <FileDown className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>PDF</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenPrintPreview()}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded flex items-center gap-1 transition cursor-pointer"
              title="Print preview & dialog"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
              title="Export, WhatsApp, Email"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* PORTAL MAIN CONTENT WORKSPACE */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* SUBVIEW 1: INVOICE STUDIO (SPLIT VIEW) */}
        {currentSubView === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Dedicated Discipline Invoice Editor */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{currentConfig.title} Editor</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/30">
                      {activeInvoice.invoiceNumber}
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-400">{currentConfig.tagline}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveDataFile}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 cursor-pointer"
                    title="Download JSON backup"
                  >
                    <FolderOpen className="w-3.5 h-3.5" /> Backup
                  </button>
                </div>
              </div>

              {/* Invoice Editor with discipline locking for the 4 portals, or combined mode for General Studio */}
              <InvoiceEditor
                invoice={activeInvoice}
                onChange={handleUpdateActiveInvoice}
                onOpenSignatureModal={() => setIsSignatureModalOpen(true)}
                onDownloadPDF={handleDownloadPDF}
                onPrintPreview={() => handleOpenPrintPreview()}
                lockStudioTab={lockedStudioTab}
              />
            </div>

            {/* Right: Dedicated Interactive A4 Invoice Paper Preview */}
            <div className="lg:col-span-6 space-y-3 sticky top-28">
              <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-slate-300 font-medium">Live A4 Paper Preview</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <span>Scale: {Math.round(splitScale * 100)}%</span>
                  <button
                    type="button"
                    onClick={() => setSubView('preview_only')}
                    className="text-amber-400 hover:text-amber-300 font-semibold ml-2 cursor-pointer"
                  >
                    Full Screen Preview →
                  </button>
                </div>
              </div>

              <div className="w-full flex justify-center overflow-hidden">
                <div
                  style={{
                    transform: `scale(${splitScale})`,
                    transformOrigin: 'top center',
                    marginBottom: `calc((1130px * ${splitScale}) - 1130px)`,
                  }}
                  className="transition-transform duration-100 ease-out"
                >
                  <InvoicePaper
                    invoice={activeInvoice}
                    onOpenSignatureModal={() => setIsSignatureModalOpen(true)}
                    isInteractive={true}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBVIEW 2: FULL DOCUMENT PREVIEW (CENTERED A4) */}
        {currentSubView === 'preview_only' && (
          <div ref={paperPreviewRef} className="flex flex-col items-center w-full space-y-4">
            <div className="flex items-center justify-between w-full max-w-4xl px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs">
              <div className="flex items-center gap-3">
                <span className="text-slate-400">View Mode:</span>
                <button
                  type="button"
                  onClick={() => setPaperPreviewMode('fit-page')}
                  className={`px-2.5 py-1 rounded font-semibold transition cursor-pointer ${
                    paperPreviewMode === 'fit-page'
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Fit to Screen
                </button>
                <button
                  type="button"
                  onClick={() => setPaperPreviewMode('fit-width')}
                  className={`px-2.5 py-1 rounded font-semibold transition cursor-pointer ${
                    paperPreviewMode === 'fit-width'
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Fit Width
                </button>
                <button
                  type="button"
                  onClick={() => setPaperPreviewMode('100%')}
                  className={`px-2.5 py-1 rounded font-semibold transition cursor-pointer ${
                    paperPreviewMode === '100%'
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  100% Size
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPDF}
                  className="px-3 py-1 bg-amber-400 text-slate-950 font-bold rounded flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
                <button
                  type="button"
                  onClick={handleSafePrint}
                  className="px-3 py-1 bg-slate-800 text-white font-semibold rounded flex items-center gap-1.5 cursor-pointer border border-slate-700 hover:bg-slate-700"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
              </div>
            </div>

            <div className="w-full flex justify-center overflow-auto pb-12">
              <div
                style={{
                  transform: `scale(${paperPreviewScale})`,
                  transformOrigin: 'top center',
                  marginBottom: `calc((1130px * ${paperPreviewScale}) - 1130px)`,
                }}
                className="transition-transform duration-150 ease-out"
              >
                <InvoicePaper
                  invoice={activeInvoice}
                  onOpenSignatureModal={() => setIsSignatureModalOpen(true)}
                  isInteractive={true}
                />
              </div>
            </div>
          </div>
        )}

        {/* SUBVIEW 3: DISCIPLINE TECHNICAL SCHEDULE OR MULTI-PACKAGE MATRIX */}
        {currentSubView === 'schedule' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{currentConfig.title} — {activePortal === 'general' ? 'Package Matrix & Scope Comparison' : 'Technical Schedule & Specs'}</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/30">
                    Syncing with {activeInvoice.invoiceNumber}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activePortal === 'general'
                    ? 'Explore and bundle across all four Univision engineering disciplines into combined contracts.'
                    : `Edits made here operate 100% independently within the ${currentConfig.shortTitle} Portal.`}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSubView('split')}
                className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition cursor-pointer flex items-center gap-1.5"
              >
                <span>View {currentConfig.shortTitle} Invoice Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* EMBEDDED TECHNICAL TOOLS ACCORDING TO PORTAL */}
            {activePortal === 'general' && (
              <PackagesPortal
                isStandaloneWindow={false}
                onPopoutWindow={() => handlePopoutWindow('general')}
                onGenerateInvoice={handleSyncTechnicalScheduleToInvoice}
                onSwitchPortal={(p) => {
                  if (p === 'structural' || p === 'boq' || p === 'inspection' || p === 'architectural') {
                    setActivePortal(p);
                  }
                }}
              />
            )}

            {activePortal === 'architectural' && (
              <ArchitecturalSchedulePortal
                isStandaloneWindow={false}
                onPopoutWindow={() => handlePopoutWindow('architectural')}
                onGenerateInvoice={handleSyncTechnicalScheduleToInvoice}
                onSwitchPortal={(p) => {
                  if (p === 'structural' || p === 'boq' || p === 'inspection' || p === 'architectural') {
                    setActivePortal(p);
                  }
                }}
              />
            )}

            {activePortal === 'structural' && (
              <StructuralEngineeringPortal
                isStandaloneWindow={false}
                onPopoutWindow={() => handlePopoutWindow('structural')}
                onGenerateInvoice={handleSyncTechnicalScheduleToInvoice}
                onSwitchPortal={(p) => {
                  if (p === 'structural' || p === 'boq' || p === 'inspection' || p === 'architectural') {
                    setActivePortal(p);
                  }
                }}
              />
            )}

            {activePortal === 'boq' && (
              <BOQPortal
                isStandaloneWindow={false}
                onPopoutWindow={() => handlePopoutWindow('boq')}
                onGenerateInvoice={handleSyncTechnicalScheduleToInvoice}
                onSwitchPortal={(p) => {
                  if (p === 'structural' || p === 'boq' || p === 'inspection' || p === 'architectural') {
                    setActivePortal(p);
                  }
                }}
              />
            )}

            {activePortal === 'inspection' && (
              <SiteInspectionPortal
                isStandaloneWindow={false}
                onPopoutWindow={() => handlePopoutWindow('inspection')}
                onGenerateInvoice={handleSyncTechnicalScheduleToInvoice}
                onSwitchPortal={(p) => {
                  if (p === 'structural' || p === 'boq' || p === 'inspection' || p === 'architectural') {
                    setActivePortal(p);
                  }
                }}
              />
            )}
          </div>
        )}

        {/* SUBVIEW 4: INVOICES DIRECTORY FOR THIS PORTAL ONLY */}
        {currentSubView === 'list' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{currentConfig.title} — Invoices Directory</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 font-mono border border-slate-700">
                    {currentInvoices.length} Active • {currentArchived.length} Archived
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activePortal === 'general'
                    ? 'Directory for Multi-Discipline Combined Invoices (bundles of 2 or more disciplines).'
                    : `Strictly showing only ${currentConfig.shortTitle} invoices. Other portals remain 100% separate.`}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCreateNewInvoiceInCurrentPortal}
                className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition cursor-pointer flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ New {currentConfig.shortTitle} Invoice</span>
              </button>
            </div>

            <InvoiceList
              invoices={currentInvoices}
              archivedInvoices={currentArchived}
              activeInvoiceId={activeInvoice.id}
              onSelectInvoice={(id) => {
                setActiveIdByPortal((prev) => ({
                  ...prev,
                  [activePortal]: id,
                }));
                setSubView('split');
              }}
              onCreateNewInvoice={handleCreateNewInvoiceInCurrentPortal}
              onDuplicateInvoice={handleDuplicateInvoice}
              onDeleteInvoice={handleDeleteInvoice}
              onArchiveInvoice={handleArchiveInvoice}
              onArchiveAll={handleArchiveAll}
              onDeleteAll={() => {
                const cat = activePortal === 'general' ? 'multi_package' : activePortal;
                const fresh = createDefaultInvoiceByType(cat, 1);
                setInvoicesByPortal((prev) => ({
                  ...prev,
                  [activePortal]: [fresh],
                }));
                setActiveIdByPortal((prev) => ({
                  ...prev,
                  [activePortal]: fresh.id,
                }));
                setNotification(`Reset ${currentConfig.shortTitle} invoices directory.`);
                setTimeout(() => setNotification(''), 3000);
              }}
              onRestoreInvoice={handleRestoreInvoice}
              onRestoreAll={handleRestoreAllArchived}
              onPermanentDeleteArchived={handlePermanentDeleteArchived}
              onEmptyArchive={handleEmptyArchive}
              onRestoreSampleInvoices={handleRestoreSampleInvoices}
            />
          </div>
        )}

        {/* SUBVIEW 5: RATES & DELIVERABLES SCOPE */}
        {currentSubView === 'rates' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>{currentConfig.title} — Official Rates & Deliverables</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">{currentConfig.defaultRateInfo}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSubView('split')}
                  className="px-4 py-2 bg-amber-400 text-slate-950 font-bold text-xs rounded-lg hover:bg-amber-300 transition cursor-pointer self-start sm:self-auto"
                >
                  Apply in {currentConfig.shortTitle} Studio →
                </button>
              </div>

              {/* GENERAL COMBINED STUDIO RATES OVERVIEW */}
              {activePortal === 'general' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                  <div className="bg-slate-950 border border-amber-500/30 rounded-xl p-4 space-y-2">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                      01. ARCHITECTURAL
                    </span>
                    <div className="text-base font-extrabold text-white font-mono">D75 – D100 / m²</div>
                    <p className="text-[11px] text-slate-400">
                      Working drawings, floor layouts, elevations, door/window schedules & municipal permit sets.
                    </p>
                  </div>

                  <div className="bg-slate-950 border border-blue-500/30 rounded-xl p-4 space-y-2">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                      02. STRUCTURAL
                    </span>
                    <div className="text-base font-extrabold text-white font-mono">D65 – D85 / m²</div>
                    <p className="text-[11px] text-slate-400">
                      Foundations, reinforced columns, beams, suspended slabs, BBS & calculation reports.
                    </p>
                  </div>

                  <div className="bg-slate-950 border border-emerald-500/30 rounded-xl p-4 space-y-2">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                      03. BOQ & COST
                    </span>
                    <div className="text-base font-extrabold text-white font-mono">D30k – D60k Fixed</div>
                    <p className="text-[11px] text-slate-400">
                      Tiered material takeoff, trade labor schedules, bills of quantities & tender documents.
                    </p>
                  </div>

                  <div className="bg-slate-950 border border-orange-500/30 rounded-xl p-4 space-y-2">
                    <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">
                      04. SITE INSPECTION
                    </span>
                    <div className="text-base font-extrabold text-white font-mono">D15k / Visit • D50k Full</div>
                    <p className="text-[11px] text-slate-400">
                      Pre-pour rebar audits, concrete slump checks, defect photographic logs & certificates.
                    </p>
                  </div>
                </div>
              )}

              {/* ARCHITECTURAL RATES BREAKDOWN */}
              {activePortal === 'architectural' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                        STANDARD REGULAR TIER
                      </span>
                      <span className="text-base font-extrabold text-white font-mono">D75 / m²</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Standard working drawings package suitable for single-family residential villas and standard municipal submissions.
                    </p>
                    <ul className="space-y-2 text-xs text-slate-300">
                      {ARCHITECTURAL_PACKAGES.regular.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-950 border-2 border-amber-500/60 rounded-xl p-5 space-y-4 relative overflow-hidden shadow-lg">
                    <div className="absolute top-0 right-0 bg-amber-400 text-slate-950 text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase">
                      Recommended
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                        FULL EXECUTIVE PREMIUM TIER
                      </span>
                      <span className="text-base font-extrabold text-white font-mono">D100 / m²</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Comprehensive executive working drawings with 3D photorealistic visualizations, detailed joinery, and priority municipal approvals.
                    </p>
                    <ul className="space-y-2 text-xs text-slate-300">
                      {ARCHITECTURAL_PACKAGES.premium.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span className="font-medium text-white">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* STRUCTURAL RATES BREAKDOWN */}
              {activePortal === 'structural' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                        STRUCTURAL REGULAR TIER
                      </span>
                      <span className="text-base font-extrabold text-white font-mono">D65 / m²</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Essential structural engineering package for ground & low-rise residential framing.
                    </p>
                    <ul className="space-y-2 text-xs text-slate-300">
                      {STRUCTURAL_PACKAGES.regular.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-950 border-2 border-blue-500/60 rounded-xl p-5 space-y-4 relative overflow-hidden shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                        FULL STRUCTURAL EXECUTIVE TIER
                      </span>
                      <span className="text-base font-extrabold text-white font-mono">D85 / m²</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Multi-story reinforced framing, cantilevered beams, Bar Bending Schedule (BBS), and registered structural engineer calculation report.
                    </p>
                    <ul className="space-y-2 text-xs text-slate-300">
                      {STRUCTURAL_PACKAGES.premium.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                          <span className="font-medium text-white">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* BOQ RATES BREAKDOWN */}
              {activePortal === 'boq' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      BRACKET 1: 100–500 M²
                    </span>
                    <div className="text-xl font-extrabold text-white font-mono">D30,000 Fixed</div>
                    <p className="text-xs text-slate-400">
                      Complete material takeoff, trade schedules, and bill items for single-family residences.
                    </p>
                    <ul className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                      {BOQ_PACKAGES.regular.features.slice(0, 5).map((f, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-950 border-2 border-emerald-500/60 rounded-xl p-5 space-y-3 shadow-lg">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      BRACKET 2: 500–1000 M²
                    </span>
                    <div className="text-xl font-extrabold text-white font-mono">D45,000 Fixed</div>
                    <p className="text-xs text-slate-400">
                      Comprehensive commercial & multi-unit quantity takeoff with tender documents.
                    </p>
                    <ul className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                      {BOQ_PACKAGES.premium.features.slice(0, 5).map((f, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span className="text-white font-medium">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      BRACKET 3: &gt; 1000 M²
                    </span>
                    <div className="text-xl font-extrabold text-white font-mono">D60,000+ Fixed</div>
                    <p className="text-xs text-slate-400">
                      Major institutional developments, high-rise estates, and corporate complexes.
                    </p>
                    <ul className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                      {BOQ_PACKAGES.premium.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* SITE INSPECTION RATES BREAKDOWN */}
              {activePortal === 'inspection' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">
                        PER-VISIT AUDIT & REPORT
                      </span>
                      <span className="text-base font-extrabold text-white font-mono">D15,000 / Visit</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      On-site technical field audit before critical concrete pours (foundations, columns, suspended slabs).
                    </p>
                    <ul className="space-y-2 text-xs text-slate-300">
                      {SITE_INSPECTION_PACKAGE.includes.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-950 border-2 border-orange-500/60 rounded-xl p-5 space-y-4 shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">
                        FULL PROJECT SUPERVISION CONTRACT
                      </span>
                      <span className="text-base font-extrabold text-white font-mono">D50,000 Fixed</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      End-to-end continuous construction site monitoring across all structural phases with Univision quality certification.
                    </p>
                    <ul className="space-y-2 text-xs text-slate-300">
                      {SITE_INSPECTION_PACKAGE.officialDeliverables.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                          <span className="font-medium text-white">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-4 px-6 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © {new Date().getFullYear()} Univision Design and Construction Ltd. 5-Portal Advance Invoice System.
          </span>
          <div className="flex items-center gap-4 text-slate-400 font-medium">
            <span>The Gambia</span>
            <span>•</span>
            <span>Architectural</span>
            <span>•</span>
            <span>Structural</span>
            <span>•</span>
            <span>BOQ</span>
            <span>•</span>
            <span>Site Inspection</span>
            <span>•</span>
            <span className="text-purple-400 font-semibold">General Combined Studio</span>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {isSignatureModalOpen && (
        <SignatureModal
          isOpen={isSignatureModalOpen}
          onClose={() => setIsSignatureModalOpen(false)}
          onSave={(sigData, type) => {
            handleUpdateActiveInvoice({
              ...activeInvoice,
              clientSignature: sigData,
              clientSignatureType: type,
              clientSignDate: activeInvoice.clientSignDate || new Date().toISOString().split('T')[0],
            });
            setIsSignatureModalOpen(false);
            setNotification('Signature updated on current invoice');
            setTimeout(() => setNotification(''), 3000);
          }}
          initialSignature={activeInvoice.clientSignature}
          initialType={activeInvoice.clientSignatureType || 'none'}
          clientName={activeInvoice.client?.name || ''}
        />
      )}

      {isPrintPreviewOpen && (
        <PrintPreviewModal
          isOpen={isPrintPreviewOpen}
          onClose={() => setIsPrintPreviewOpen(false)}
          invoice={activeInvoice}
          initialPackageFilter={printPreviewFilter}
        />
      )}

      {isExportModalOpen && (
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          invoice={activeInvoice}
          onOpenPrintPreview={() => handleOpenPrintPreview()}
        />
      )}

      {isOfficialsModalOpen && (
        <DepartmentOfficialsModal
          isOpen={isOfficialsModalOpen}
          onClose={() => setIsOfficialsModalOpen(false)}
          initialDepartment={activePortal === 'general' ? 'architectural' : activePortal}
        />
      )}

      {isGitHubModalOpen && (
        <GitHubDeployModal
          isOpen={isGitHubModalOpen}
          onClose={() => setIsGitHubModalOpen(false)}
        />
      )}
    </div>
  );
}
