import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Printer,
  Sparkles,
  Layers,
  Share2,
  FolderOpen,
  Eye,
  SlidersHorizontal,
  PlusCircle,
  CheckCircle2,
  FileDown,
  Loader2,
  Save,
  Check,
  ZoomIn,
  ZoomOut,
  Maximize2,
  MoveHorizontal,
  Building2,
  HardHat,
  FileSpreadsheet,
  ExternalLink,
  Compass,
  Users,
  Github,
  Archive,
  RotateCcw,
} from 'lucide-react';
import { Invoice, PackageType } from './types';
import { INITIAL_INVOICES, createDefaultInvoiceByType } from './data/sampleInvoices';
import {
  DEFAULT_COMPANY,
  DEFAULT_TERMS,
  BANK_PRESETS,
  PACKAGES,
  STRUCTURAL_PACKAGES,
  BOQ_PACKAGES,
  SITE_INSPECTION_PACKAGE,
  ARCHITECTURAL_ADDONS_PRESETS,
  getBOQPackageFee,
} from './data/constants';
import { getDefaultPackagesConfig } from './utils/packageManager';
import { UnivisionLogo } from './components/UnivisionLogo';
import { InvoicePaper } from './components/InvoicePaper';
import { InvoiceEditor } from './components/InvoiceEditor';
import { InvoiceList } from './components/InvoiceList';
import { SignatureModal } from './components/SignatureModal';
import { ExportModal } from './components/ExportModal';
import { PrintPreviewModal } from './components/PrintPreviewModal';
import { NewInvoiceTypeModal } from './components/NewInvoiceTypeModal';
import { ArchitecturalSchedulePortal } from './components/ArchitecturalSchedulePortal';
import { StructuralEngineeringPortal } from './components/StructuralEngineeringPortal';
import { BOQPortal } from './components/BOQPortal';
import { PackagesPortal } from './components/PackagesPortal';
import { SiteInspectionPortal } from './components/SiteInspectionPortal';
import { DepartmentOfficialsModal } from './components/DepartmentOfficialsModal';
import { GitHubDeployModal } from './components/GitHubDeployModal';
import { calculateInvoice, formatCurrency } from './utils/calculations';
import { downloadInvoicePDF } from './utils/pdfExport';

export type ViewMode = 'split' | 'preview_only' | 'list' | 'rates';
export type PortalMode = 'invoices' | 'architectural' | 'structural' | 'boq' | 'packages' | 'inspection';

function getInitialPortalInfo(): { portal: PortalMode; isStandalone: boolean } {
  try {
    const params = new URLSearchParams(window.location.search);
    const p = (params.get('portal') || params.get('window')) as PortalMode;
    if (p === 'architectural' || p === 'structural' || p === 'boq' || p === 'packages' || p === 'inspection') {
      return { portal: p, isStandalone: true };
    }
  } catch {}
  return { portal: 'invoices', isStandalone: false };
}

export default function App() {
  const initialInfo = getInitialPortalInfo();
  const [portalMode, setPortalMode] = useState<PortalMode>(initialInfo.portal);
  const [isStandaloneWindow] = useState<boolean>(initialInfo.isStandalone);

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const isCleared = localStorage.getItem('univision_directory_cleared') === 'true';
      if (isCleared) {
        return [];
      }
      const saved =
        localStorage.getItem('univision_invoices_v3') ||
        localStorage.getItem('univision_invoices_v2') ||
        localStorage.getItem('univision_invoices_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading invoices from storage', e);
    }
    return INITIAL_INVOICES;
  });

  const [activeInvoiceId, setActiveInvoiceId] = useState<string>(() => {
    try {
      const savedId =
        localStorage.getItem('univision_active_invoice_id') ||
        sessionStorage.getItem('univision_active_invoice_id');
      if (savedId) return savedId;
    } catch {}
    return INITIAL_INVOICES[0]?.id || 'inv-univision-001';
  });

  // Archived Invoices state with persistent storage
  const [archivedInvoices, setArchivedInvoices] = useState<Invoice[]>(() => {
    try {
      const saved = localStorage.getItem('univision_archived_invoices_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error loading archived invoices', e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('univision_archived_invoices_v1', JSON.stringify(archivedInvoices));
    } catch (e) {
      console.error('Error saving archived invoices', e);
    }
  }, [archivedInvoices]);

  const [rateCategoryTab, setRateCategoryTab] = useState<
    'all' | 'architectural' | 'structural' | 'boq' | 'inspection' | 'addons'
  >('all');

  // Keep body class in sync with active portal mode for print styling
  useEffect(() => {
    document.body.className = `portal-mode-${portalMode}`;
  }, [portalMode]);

  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [isOfficialsModalOpen, setIsOfficialsModalOpen] = useState(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [notification, setNotification] = useState<string>('');

  // Scaling & fit modes for PC view
  const [splitFitMode, setSplitFitMode] = useState<'fit-width' | 'fit-page' | '100%'>('fit-width');
  const [splitScale, setSplitScale] = useState<number>(1);
  const [paperPreviewMode, setPaperPreviewMode] = useState<'fit-page' | 'fit-width' | '100%'>('fit-page');
  const [paperPreviewScale, setPaperPreviewScale] = useState<number>(0.75);
  const rightColRef = useRef<HTMLDivElement>(null);
  const paperPreviewRef = useRef<HTMLDivElement>(null);

  // Auto-calculate split pane scale so document fits column or page cleanly
  useEffect(() => {
    const updateSplitScale = () => {
      if (!rightColRef.current) return;
      const colWidth = rightColRef.current.clientWidth - 16;
      const paperW = 800;
      const paperH = 1130;
      if (splitFitMode === 'fit-width') {
        const s = Math.min(1, Math.max(0.45, Math.round((colWidth / paperW) * 100) / 100));
        setSplitScale(s);
      } else if (splitFitMode === 'fit-page') {
        const vh = window.innerHeight - 220;
        const s = Math.min(1, Math.max(0.35, Math.min(colWidth / paperW, vh / paperH)));
        setSplitScale(Math.round(s * 100) / 100);
      } else {
        setSplitScale(1);
      }
    };

    updateSplitScale();
    window.addEventListener('resize', updateSplitScale);
    return () => window.removeEventListener('resize', updateSplitScale);
  }, [splitFitMode, viewMode, portalMode]);

  // Auto-calculate paper preview scale so it fits the screen height/width
  useEffect(() => {
    if (viewMode !== 'preview_only') return;
    const updatePreviewScale = () => {
      if (!paperPreviewRef.current) return;
      const vw = paperPreviewRef.current.clientWidth - 32;
      const vh = window.innerHeight - 190;
      const paperW = 800;
      const paperH = 1130;
      if (paperPreviewMode === 'fit-page') {
        const s = Math.min(1.2, Math.max(0.4, Math.min(vw / paperW, vh / paperH)));
        setPaperPreviewScale(Math.round(s * 100) / 100);
      } else if (paperPreviewMode === 'fit-width') {
        const s = Math.min(1.3, Math.max(0.4, vw / paperW));
        setPaperPreviewScale(Math.round(s * 100) / 100);
      } else {
        setPaperPreviewScale(1);
      }
    };

    const timer = setTimeout(updatePreviewScale, 50);
    window.addEventListener('resize', updatePreviewScale);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePreviewScale);
    };
  }, [paperPreviewMode, viewMode]);

  // Persist invoices whenever state changes
  useEffect(() => {
    try {
      const serialized = JSON.stringify(invoices);
      localStorage.setItem('univision_invoices_v3', serialized);
      localStorage.setItem('univision_invoices_v2', serialized);
      localStorage.setItem('univision_invoices_v1', serialized);
      sessionStorage.setItem('univision_invoices_v1', serialized);
      if (invoices.length === 0) {
        localStorage.setItem('univision_directory_cleared', 'true');
      } else {
        localStorage.removeItem('univision_directory_cleared');
      }
    } catch (e) {
      console.warn('Storage error on auto-save', e);
    }
  }, [invoices]);

  // Persist active invoice ID
  useEffect(() => {
    try {
      localStorage.setItem('univision_active_invoice_id', activeInvoiceId);
      sessionStorage.setItem('univision_active_invoice_id', activeInvoiceId);
    } catch (e) {
      console.warn('Storage error saving active ID', e);
    }
  }, [activeInvoiceId]);

  // Listen for storage events (e.g. from popout windows syncing invoices)
  useEffect(() => {
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'univision_pending_invoice_sync' && e.newValue) {
        try {
          const syncData = JSON.parse(e.newValue);
          localStorage.removeItem('univision_pending_invoice_sync');
          handleGenerateInvoice(syncData);
        } catch {}
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
  }, [invoices]);

  const activeInvoice =
    invoices.find((inv) => inv.id === activeInvoiceId) || invoices[0];

  const handleUpdateActiveInvoice = (updated: Invoice) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === updated.id ? { ...updated, updatedAt: new Date().toISOString() } : inv
      )
    );
  };

  const handleSaveDataFile = () => {
    if (!activeInvoice) return;
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

  const handleManualSave = () => {
    if (!activeInvoice) return;
    try {
      const serialized = JSON.stringify(invoices);
      localStorage.setItem('univision_invoices_v1', serialized);
      sessionStorage.setItem('univision_invoices_v1', serialized);
      localStorage.setItem('univision_active_invoice_id', activeInvoiceId);
      sessionStorage.setItem('univision_active_invoice_id', activeInvoiceId);
      setNotification(`Saved ${activeInvoice.invoiceNumber} to storage`);
      setTimeout(() => setNotification(''), 3000);
    } catch (e) {
      console.error(e);
      setNotification('Browser storage restricted; downloading backup file...');
      handleSaveDataFile();
    }
  };

  const handleCreateNewInvoice = () => {
    setIsNewInvoiceModalOpen(true);
  };

  const handleCreateInvoiceWithType = (
    type: 'architectural' | 'structural' | 'boq' | 'inspection' | 'multi_package'
  ) => {
    const nextSeq = invoices.length + archivedInvoices.length + 85;
    const newInv = createDefaultInvoiceByType(type, nextSeq);

    setInvoices((prev) => [newInv, ...prev]);
    setActiveInvoiceId(newInv.id);
    setViewMode('split');
    setPortalMode('invoices');
    setIsNewInvoiceModalOpen(false);

    const studioName =
      type === 'architectural'
        ? 'Architectural Drawing Studio'
        : type === 'structural'
        ? 'Structural Engineering Studio'
        : type === 'boq'
        ? 'Bills of Quantities (BOQ) Studio'
        : type === 'inspection'
        ? 'Site Inspection & Supervision Studio'
        : 'Multi-Package Consolidated Studio';

    setNotification(`Launched ${studioName}: ${newInv.invoiceNumber}`);
    setTimeout(() => setNotification(''), 4000);
  };

  const handleDuplicateInvoice = (id: string) => {
    const target = invoices.find((inv) => inv.id === id);
    if (!target) return;
    const duplicated: Invoice = {
      ...target,
      id: `inv-${Date.now()}`,
      invoiceNumber: `${target.invoiceNumber}-COPY`,
      status: 'draft',
      clientSignature: '',
      clientSignatureType: 'none',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setInvoices((prev) => [duplicated, ...prev]);
    setActiveInvoiceId(duplicated.id);
    setNotification(`Duplicated ${target.invoiceNumber}`);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleDeleteInvoice = (id: string) => {
    setInvoices((prev) => {
      const nextList = prev.filter((inv) => inv.id !== id);
      try {
        const serialized = JSON.stringify(nextList);
        localStorage.setItem('univision_invoices_v3', serialized);
        localStorage.setItem('univision_invoices_v2', serialized);
        localStorage.setItem('univision_invoices_v1', serialized);
        sessionStorage.setItem('univision_invoices_v1', serialized);
        if (nextList.length === 0) {
          localStorage.setItem('univision_directory_cleared', 'true');
        }
      } catch (e) {
        console.warn('Storage error on delete', e);
      }
      return nextList;
    });
    setActiveInvoiceId((prevId) => {
      if (prevId === id) {
        const remaining = invoices.filter((inv) => inv.id !== id);
        return remaining[0]?.id || '';
      }
      return prevId;
    });
    setNotification('Invoice deleted from active directory');
    setTimeout(() => setNotification(''), 3000);
  };

  const handleArchiveInvoice = (id: string) => {
    const target = invoices.find((inv) => inv.id === id);
    if (!target) return;
    const archived: Invoice = {
      ...target,
      isArchived: true,
      archivedAt: new Date().toISOString(),
    };
    const nextList = invoices.filter((inv) => inv.id !== id);
    setInvoices(nextList);
    setArchivedInvoices((prev) => [archived, ...prev]);
    if (activeInvoiceId === id) {
      setActiveInvoiceId(nextList[0]?.id || '');
    }
    setNotification(`Archived invoice ${target.invoiceNumber}. Preserved safely in Archive tab.`);
    setTimeout(() => setNotification(''), 3500);
  };

  const handleArchiveAll = () => {
    if (invoices.length === 0) return;
    const now = new Date().toISOString();
    const newlyArchived = invoices.map((inv) => ({
      ...inv,
      isArchived: true,
      archivedAt: now,
    }));
    setArchivedInvoices((prev) => [...newlyArchived, ...prev]);
    setInvoices([]);
    setActiveInvoiceId('');
    try {
      localStorage.setItem('univision_invoices_v3', JSON.stringify([]));
      localStorage.setItem('univision_invoices_v2', JSON.stringify([]));
      localStorage.setItem('univision_invoices_v1', JSON.stringify([]));
      sessionStorage.setItem('univision_invoices_v1', JSON.stringify([]));
      localStorage.setItem('univision_directory_cleared', 'true');
    } catch (e) {}
    setNotification(`Archived all ${newlyArchived.length} invoices. They are kept safe in the Archive tab.`);
    setTimeout(() => setNotification(''), 3500);
  };

  const handleDeleteAll = () => {
    const count = invoices.length;
    setInvoices([]);
    setActiveInvoiceId('');
    try {
      localStorage.setItem('univision_invoices_v3', JSON.stringify([]));
      localStorage.setItem('univision_invoices_v2', JSON.stringify([]));
      localStorage.setItem('univision_invoices_v1', JSON.stringify([]));
      sessionStorage.setItem('univision_invoices_v1', JSON.stringify([]));
      localStorage.setItem('univision_directory_cleared', 'true');
      localStorage.removeItem('univision_active_invoice_id');
      sessionStorage.removeItem('univision_active_invoice_id');
    } catch (e) {}
    setNotification(`Deleted ${count} invoices from active directory.`);
    setTimeout(() => setNotification(''), 3500);
  };

  const handleRestoreInvoice = (id: string) => {
    const target = archivedInvoices.find((inv) => inv.id === id);
    if (!target) return;
    const restored: Invoice = {
      ...target,
      isArchived: false,
      updatedAt: new Date().toISOString(),
    };
    setArchivedInvoices((prev) => prev.filter((inv) => inv.id !== id));
    setInvoices((prev) => [restored, ...prev]);
    setActiveInvoiceId(restored.id);
    setViewMode('split');
    setNotification(`Restored invoice ${restored.invoiceNumber} to Active Directory`);
    setTimeout(() => setNotification(''), 3500);
  };

  const handleRestoreAll = () => {
    if (archivedInvoices.length === 0) return;
    const restoredList = archivedInvoices.map((inv) => ({
      ...inv,
      isArchived: false,
      updatedAt: new Date().toISOString(),
    }));
    setInvoices((prev) => [...restoredList, ...prev]);
    setArchivedInvoices([]);
    if (restoredList[0]) {
      setActiveInvoiceId(restoredList[0].id);
    }
    setNotification(`Restored all ${restoredList.length} invoices back to Active Directory`);
    setTimeout(() => setNotification(''), 3500);
  };

  const handlePermanentDeleteArchived = (id: string) => {
    setArchivedInvoices((prev) => {
      const nextList = prev.filter((inv) => inv.id !== id);
      try {
        localStorage.setItem('univision_archived_invoices_v1', JSON.stringify(nextList));
      } catch {}
      return nextList;
    });
    setNotification('Invoice permanently removed from archive.');
    setTimeout(() => setNotification(''), 3000);
  };

  const handleEmptyArchive = () => {
    const count = archivedInvoices.length;
    setArchivedInvoices([]);
    try {
      localStorage.setItem('univision_archived_invoices_v1', JSON.stringify([]));
    } catch {}
    setNotification(`Permanently emptied archive (${count} items removed).`);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleRestoreSampleInvoices = () => {
    try {
      localStorage.removeItem('univision_directory_cleared');
    } catch {}
    setInvoices(INITIAL_INVOICES);
    setActiveInvoiceId(INITIAL_INVOICES[0]?.id || '');
    setNotification('Restored standard Univision template invoices.');
    setTimeout(() => setNotification(''), 3000);
  };

  const handleApplyStructuralTier = (tier: 'regular' | 'premium') => {
    if (!activeInvoice) return;
    const cfg = getDefaultPackagesConfig(activeInvoice);
    const rate = tier === 'regular' ? 65 : 85;
    const updatedCfg = {
      ...cfg,
      structural: { ...cfg.structural, enabled: true, tier, rate },
    };
    handleUpdateActiveInvoice({
      ...activeInvoice,
      packagesConfig: updatedCfg,
    });
    setNotification(
      `Applied Structural ${tier.toUpperCase()} tier (${activeInvoice.currency} ${rate}/${activeInvoice.unit}) to ${activeInvoice.invoiceNumber}`
    );
    setTimeout(() => setNotification(''), 3500);
  };

  const handleApplyBOQTier = (tier: 'regular' | 'premium') => {
    if (!activeInvoice) return;
    const calcs = calculateInvoice(activeInvoice);
    const fee = getBOQPackageFee(calcs.totalArea, tier);
    const cfg = getDefaultPackagesConfig(activeInvoice);
    const updatedCfg = {
      ...cfg,
      boq: { ...cfg.boq, enabled: true, tier, fee },
    };
    handleUpdateActiveInvoice({
      ...activeInvoice,
      packagesConfig: updatedCfg,
    });
    setNotification(
      `Applied BOQ ${tier.toUpperCase()} tier (${activeInvoice.currency} ${fee.toLocaleString()}) to ${activeInvoice.invoiceNumber}`
    );
    setTimeout(() => setNotification(''), 3500);
  };

  const handleApplyInspectionTier = (fee: number, tierName: string) => {
    if (!activeInvoice) return;
    const cfg = getDefaultPackagesConfig(activeInvoice);
    const updatedCfg = {
      ...cfg,
      inspection: { ...cfg.inspection, enabled: true, fee },
    };
    handleUpdateActiveInvoice({
      ...activeInvoice,
      packagesConfig: updatedCfg,
    });
    setNotification(
      `Applied Site Inspection (${tierName} - ${activeInvoice.currency} ${fee.toLocaleString()}) to ${activeInvoice.invoiceNumber}`
    );
    setTimeout(() => setNotification(''), 3500);
  };

  const handleSelectPackageFromPaper = (type: PackageType) => {
    if (!activeInvoice) return;
    const rate = type === 'regular' ? 75 : type === 'premium' ? 100 : activeInvoice.packageRate;
    handleUpdateActiveInvoice({
      ...activeInvoice,
      packageType: type,
      packageRate: rate,
    });
  };

  const handleSaveSignature = (sigData: string, type: 'draw' | 'type' | 'none') => {
    if (!activeInvoice) return;
    handleUpdateActiveInvoice({
      ...activeInvoice,
      clientSignature: sigData,
      clientSignatureType: type,
      clientSignDate: activeInvoice.clientSignDate || new Date().toISOString().split('T')[0],
    });
    setNotification('Signature updated on invoice');
    setTimeout(() => setNotification(''), 3000);
  };

  const handleImportInvoice = (imported: Invoice) => {
    const withNewId: Invoice = {
      ...imported,
      id: `inv-import-${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };
    setInvoices((prev) => [withNewId, ...prev]);
    setActiveInvoiceId(withNewId.id);
    setNotification(`Imported invoice ${withNewId.invoiceNumber}`);
    setTimeout(() => setNotification(''), 3000);
  };

  // Direct vector-grade PDF generator
  const handleDownloadPDF = async () => {
    if (!activeInvoice) return;
    setIsGeneratingPDF(true);
    setNotification('Compiling high-resolution A4 PDF...');

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

  // Safe print handler
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

  // Pop out portal into standalone OS window
  const handlePopoutWindow = (targetPortal: 'architectural' | 'structural' | 'boq' | 'packages' | 'inspection') => {
    try {
      const url = `${window.location.origin}${window.location.pathname}?portal=${targetPortal}`;
      const pop = window.open(
        url,
        `Univision_${targetPortal}_Window`,
        'width=1340,height=920,resizable=yes,scrollbars=yes,status=no'
      );
      if (pop) {
        pop.focus();
        setNotification(`Opened ${targetPortal.toUpperCase()} in a separate view!`);
      } else {
        setPortalMode(targetPortal);
        setNotification(`Switched to ${targetPortal.toUpperCase()} view.`);
      }
    } catch {
      setPortalMode(targetPortal);
    }
    setTimeout(() => setNotification(''), 4000);
  };

  // Turnkey invoice generator from Structural, BOQ or Packages
  const handleGenerateInvoice = (invoiceData: Partial<Invoice>) => {
    const nextNum = invoices.length + 84;
    const padded = String(nextNum).padStart(3, '0');
    const fullInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: invoiceData.invoiceNumber || `INV-2026-${padded}`,
      date: invoiceData.date || new Date().toISOString().split('T')[0],
      dueDate: invoiceData.dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      status: 'draft',
      company: invoiceData.company || DEFAULT_COMPANY,
      client: invoiceData.client || {
        name: 'Client Name',
        phone: '+220 ',
        email: '',
        address: '',
      },
      project: invoiceData.project || {
        projectName: 'Univision Project',
        projectAddress: 'Site Plot, The Gambia',
        cityProvince: 'West Coast Region',
        postalCode: 'WCR',
      },
      floors: invoiceData.floors || [
        { id: `fl-${Date.now()}-1`, floorName: 'Design Package', area: 150 },
      ],
      packageType: invoiceData.packageType || 'premium',
      packageRate: invoiceData.packageRate || 100,
      additionalNotes: invoiceData.additionalNotes || '',
      addons: invoiceData.addons || [],
      currency: invoiceData.currency || 'GMD',
      unit: invoiceData.unit || 'm²',
      discountPercent: invoiceData.discountPercent ?? 0,
      taxPercent: invoiceData.taxPercent ?? 0,
      depositPercent: invoiceData.depositPercent ?? 50,
      depositPaidAmount: invoiceData.depositPaidAmount ?? 0,
      terms: invoiceData.terms || [...DEFAULT_TERMS],
      paymentDetails: invoiceData.paymentDetails || {
        ...BANK_PRESETS[0],
        reference: invoiceData.invoiceNumber || `INV-2026-${padded}`,
      },
      clientSignature: '',
      clientSignatureType: 'none',
      clientSignDate: '',
      contractorSigned: false,
      packagesConfig: invoiceData.packagesConfig,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setInvoices((prev) => [fullInvoice, ...prev]);
    setActiveInvoiceId(fullInvoice.id);
    setPortalMode('invoices');
    setViewMode('split');
    setNotification(`⚡ Created invoice ${fullInvoice.invoiceNumber} in Invoice Studio!`);
    setTimeout(() => setNotification(''), 4500);
  };

  // STANDALONE ROUTING (If opened in separate OS window via URL parameter)
  if (isStandaloneWindow) {
    if (portalMode === 'architectural') {
      return (
        <ArchitecturalSchedulePortal
          isStandaloneWindow={true}
          onGenerateInvoice={handleGenerateInvoice}
          onSwitchPortal={(p) => setPortalMode(p)}
        />
      );
    }
    if (portalMode === 'structural') {
      return (
        <StructuralEngineeringPortal
          isStandaloneWindow={true}
          onGenerateInvoice={handleGenerateInvoice}
          onSwitchPortal={(p) => setPortalMode(p)}
        />
      );
    }
    if (portalMode === 'boq') {
      return (
        <BOQPortal
          isStandaloneWindow={true}
          onGenerateInvoice={handleGenerateInvoice}
          onSwitchPortal={(p) => setPortalMode(p)}
        />
      );
    }
    if (portalMode === 'packages') {
      return (
        <PackagesPortal
          isStandaloneWindow={true}
          onGenerateInvoice={handleGenerateInvoice}
          onSwitchPortal={(p) => setPortalMode(p)}
        />
      );
    }
    if (portalMode === 'inspection') {
      return (
        <SiteInspectionPortal
          isStandaloneWindow={true}
          onGenerateInvoice={handleGenerateInvoice}
          onSwitchPortal={(p) => setPortalMode(p)}
        />
      );
    }
  }

  return (
    <>
      {/* 
        Always-mounted off-screen render target:
        Guarantees html-to-image can capture the exact paper preview with 100% fidelity
      */}
      <div
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '0',
          width: '850px',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: -100,
        }}
        aria-hidden="true"
      >
        {activeInvoice && (
          <InvoicePaper
            id="univision-invoice-render-target"
            invoice={activeInvoice}
            isInteractive={false}
          />
        )}
      </div>

      {/* 
        =======================================================================
        ISOLATED PRINT CONTAINER (Triggered only during @media print)
        =======================================================================
      */}
      <div className="print-only-container">
        {activeInvoice && (
          <InvoicePaper
            id="univision-invoice-print-sheet"
            invoice={activeInvoice}
            isInteractive={false}
          />
        )}
      </div>

      {/* 
        =======================================================================
        INTERACTIVE SCREEN APPLICATION CONTAINER
        =======================================================================
      */}
      <div className="screen-only-container min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
        {/* TOP NAVIGATION BAR: UNIVISION PORTAL BAR */}
        <header className="bg-[#0b2341] border-b border-blue-900/60 sticky top-0 z-40 px-3 md:px-6 py-2.5 shadow-xl">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            {/* Zone 1: Brand Title */}
            <button
              type="button"
              onClick={() => {
                setPortalMode('invoices');
                setViewMode('split');
              }}
              className="flex items-center text-left focus:outline-hidden group cursor-pointer"
            >
              <UnivisionLogo size="sm" light showSubtitle={true} />
            </button>

            {/* Zone 2: Primary Portal Switcher */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Invoicing Studio Button */}
              <button
                type="button"
                onClick={() => setPortalMode('invoices')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  portalMode === 'invoices'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-850'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Invoice Studio</span>
              </button>

              {/* Architectural Portal + Pop-out */}
              <div className="flex items-center bg-slate-900/80 rounded-lg border border-indigo-900/60 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setPortalMode('architectural')}
                  className={`px-2.5 py-1.5 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                    portalMode === 'architectural'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-indigo-200 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Architectural</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePopoutWindow('architectural')}
                  title="Open Architectural portal in separate view"
                  className="px-1.5 py-1.5 text-indigo-300 hover:text-white hover:bg-indigo-800/60 border-l border-indigo-900/60 transition cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Structural Portal + Pop-out */}
              <div className="flex items-center bg-slate-900/80 rounded-lg border border-blue-900/60 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setPortalMode('structural')}
                  className={`px-2.5 py-1.5 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                    portalMode === 'structural'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-blue-200 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Structural</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePopoutWindow('structural')}
                  title="Open Structural portal in separate view"
                  className="px-1.5 py-1.5 text-blue-300 hover:text-white hover:bg-blue-800/60 border-l border-blue-900/60 transition cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* BOQ Portal + Pop-out */}
              <div className="flex items-center bg-slate-900/80 rounded-lg border border-emerald-900/60 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setPortalMode('boq')}
                  className={`px-2.5 py-1.5 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                    portalMode === 'boq'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-emerald-200 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>BOQ</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePopoutWindow('boq')}
                  title="Open BOQ in separate view"
                  className="px-1.5 py-1.5 text-emerald-300 hover:text-white hover:bg-emerald-800/60 border-l border-emerald-900/60 transition cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Site Inspection Portal + Pop-out */}
              <div className="flex items-center bg-slate-900/80 rounded-lg border border-amber-900/60 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setPortalMode('inspection')}
                  className={`px-2.5 py-1.5 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                    portalMode === 'inspection'
                      ? 'bg-amber-600 text-slate-950 font-bold shadow-sm'
                      : 'text-amber-200 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <HardHat className="w-3.5 h-3.5 text-amber-400" />
                  <span>Site Inspection</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePopoutWindow('inspection')}
                  title="Open Site Inspection in separate view"
                  className="px-1.5 py-1.5 text-amber-300 hover:text-white hover:bg-amber-800/60 border-l border-amber-900/60 transition cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Design Packages & Pricing */}
              <div className="flex items-center bg-slate-900/80 rounded-lg border border-purple-900/60 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setPortalMode('packages')}
                  className={`px-2.5 py-1.5 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                    portalMode === 'packages'
                      ? 'bg-purple-600 text-white font-bold shadow-sm'
                      : 'text-purple-200 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Design Packages</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePopoutWindow('packages')}
                  title="Open Design Packages matrix in separate view"
                  className="px-1.5 py-1.5 text-purple-300 hover:text-white hover:bg-purple-800/60 border-l border-purple-900/60 transition cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Zone 3: Quick Action Buttons & Corporate Tools */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Personnel Matrix: Who Did What */}
              <button
                type="button"
                onClick={() => setIsOfficialsModalOpen(true)}
                className="px-2.5 py-1.5 text-xs font-semibold text-blue-200 hover:text-white bg-blue-950/70 hover:bg-blue-900 border border-blue-500/40 rounded-lg shadow-sm transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
                title="View personnel assignments & task execution (Who did what)"
              >
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Who Did What</span>
              </button>

              {/* GitHub Deployment Guide */}
              <button
                type="button"
                onClick={() => setIsGitHubModalOpen(true)}
                className="px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded-lg shadow-sm transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
                title="Deploy codebase to GitHub"
              >
                <Github className="w-3.5 h-3.5 text-slate-300" />
                <span className="hidden sm:inline">Deploy</span>
              </button>

              {portalMode === 'invoices' && (
                <>
                  <button
                    type="button"
                    onClick={handleManualSave}
                    className="px-2.5 py-1.5 text-xs font-semibold text-emerald-300 hover:text-white bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/40 rounded-lg shadow-sm transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
                    title="Save all changes to browser storage"
                  >
                    <Save className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">Save</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadPDF}
                    disabled={isGeneratingPDF}
                    className="px-3 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 rounded-lg shadow-sm transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
                    title="Download genuine vector PDF document"
                  >
                    {isGeneratingPDF ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FileDown className="w-3.5 h-3.5" />
                    )}
                    <span>PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPrintPreviewOpen(true)}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-[#0b2341] hover:bg-[#123963] border border-blue-500/50 hover:border-amber-400/60 rounded-lg shadow-sm transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
                    title="Open centered A4 Print Preview with margins and direct print"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Print Preview</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsExportModalOpen(true)}
                    className="p-1.5 text-blue-200 hover:text-white hover:bg-blue-900/60 rounded-lg transition-colors cursor-pointer"
                    title="More sharing options (WhatsApp, Email, JSON)"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Sub-bar for Invoice Studio Navigation */}
          {portalMode === 'invoices' && (
            <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-blue-950/60 flex items-center justify-between gap-4 overflow-x-auto text-xs">
              <nav className="flex items-center gap-5 text-xs font-medium text-blue-200">
                <button
                  type="button"
                  onClick={() => setViewMode('split')}
                  className={`hover:text-amber-400 transition-colors whitespace-nowrap cursor-pointer ${
                    viewMode === 'split' ? 'text-amber-400 font-bold' : ''
                  }`}
                >
                  Editor & Split View
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('preview_only')}
                  className={`hover:text-amber-400 transition-colors whitespace-nowrap cursor-pointer ${
                    viewMode === 'preview_only' ? 'text-amber-400 font-bold' : ''
                  }`}
                >
                  Full Document Preview
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`hover:text-amber-400 transition-colors whitespace-nowrap cursor-pointer ${
                    viewMode === 'list' ? 'text-amber-400 font-bold' : ''
                  }`}
                >
                  Invoices Directory ({invoices.length})
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('rates')}
                  className={`hover:text-amber-400 transition-colors whitespace-nowrap cursor-pointer ${
                    viewMode === 'rates' ? 'text-amber-400 font-bold' : ''
                  }`}
                >
                  Package Tiers & Rates
                </button>
              </nav>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewInvoiceModalOpen(true)}
                  className="px-2.5 py-1 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded shadow-sm transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ New Studio Invoice</span>
                </button>

                {activeInvoice && (
                  <div className="text-[11px] text-slate-400 font-mono hidden md:block">
                    Active: <span className="text-amber-400 font-bold">{activeInvoice.invoiceNumber}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </header>

        {/* PORTAL ROUTING */}
        {portalMode === 'architectural' && (
          <ArchitecturalSchedulePortal
            isStandaloneWindow={false}
            onPopoutWindow={() => handlePopoutWindow('architectural')}
            onGenerateInvoice={handleGenerateInvoice}
            onSwitchPortal={(p) => setPortalMode(p)}
          />
        )}

        {portalMode === 'structural' && (
          <StructuralEngineeringPortal
            isStandaloneWindow={false}
            onPopoutWindow={() => handlePopoutWindow('structural')}
            onGenerateInvoice={handleGenerateInvoice}
            onSwitchPortal={(p) => setPortalMode(p)}
          />
        )}

        {portalMode === 'boq' && (
          <BOQPortal
            isStandaloneWindow={false}
            onPopoutWindow={() => handlePopoutWindow('boq')}
            onGenerateInvoice={handleGenerateInvoice}
            onSwitchPortal={(p) => setPortalMode(p)}
          />
        )}

        {portalMode === 'packages' && (
          <PackagesPortal
            isStandaloneWindow={false}
            onPopoutWindow={() => handlePopoutWindow('packages')}
            onGenerateInvoice={handleGenerateInvoice}
            onSwitchPortal={(p) => setPortalMode(p)}
          />
        )}

        {portalMode === 'inspection' && (
          <SiteInspectionPortal
            isStandaloneWindow={false}
            onPopoutWindow={() => handlePopoutWindow('inspection')}
            onGenerateInvoice={handleGenerateInvoice}
            onSwitchPortal={(p) => setPortalMode(p)}
          />
        )}

        {/* INVOICE STUDIO PORTAL */}
        {portalMode === 'invoices' && (
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
            {/* VIEW 1: SPLIT VIEW (Studio + Live Paper Preview) */}
            {viewMode === 'split' && activeInvoice && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left: Advanced Controls & Schedule Editor */}
                <div className="lg:col-span-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">
                      Editing: <span className="text-white font-mono">{activeInvoice.invoiceNumber}</span>
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleManualSave}
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" /> Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveDataFile}
                        className="text-xs text-blue-300 hover:text-blue-200 font-semibold flex items-center gap-1 cursor-pointer"
                        title="Download data backup file (.json)"
                      >
                        <FolderOpen className="w-3.5 h-3.5" /> Backup File
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateNewInvoice}
                        className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" /> New Invoice
                      </button>
                    </div>
                  </div>

                  <InvoiceEditor
                    invoice={activeInvoice}
                    onChange={handleUpdateActiveInvoice}
                    onOpenSignatureModal={() => setIsSignatureModalOpen(true)}
                    onSave={handleManualSave}
                    onDownloadPDF={handleDownloadPDF}
                    onPrint={handleSafePrint}
                    onPrintPreview={() => setIsPrintPreviewOpen(true)}
                    saveStatusMessage="Saved to browser"
                    onOpenArchitecturalPortal={() => setPortalMode('architectural')}
                    onOpenStructuralPortal={() => setPortalMode('structural')}
                    onOpenBOQPortal={() => setPortalMode('boq')}
                    onOpenPackagesPortal={() => setPortalMode('packages')}
                  />
                </div>

                {/* Right: Live Interactive Paper Preview */}
                <div ref={rightColRef} className="lg:col-span-6 flex flex-col items-center w-full">
                  <div className="w-full flex flex-wrap items-center justify-between pb-3 text-xs text-slate-400 gap-2">
                    <div className="flex items-center gap-2">
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      <span className="font-medium text-slate-300">Live Document</span>
                      {splitScale < 1 && (
                        <span className="text-[10.5px] font-mono text-amber-400/90 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          {Math.round(splitScale * 100)}% Scale
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSplitFitMode('fit-width')}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                          splitFitMode === 'fit-width'
                            ? 'bg-amber-400 text-slate-950 font-bold'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                        title="Fit document width to column"
                      >
                        Fit Width
                      </button>
                      <button
                        type="button"
                        onClick={() => setSplitFitMode('fit-page')}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                          splitFitMode === 'fit-page'
                            ? 'bg-amber-400 text-slate-950 font-bold'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                        title="Fit entire A4 page on screen height"
                      >
                        Fit Page
                      </button>
                      <button
                        type="button"
                        onClick={() => setSplitFitMode('100%')}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                          splitFitMode === '100%'
                            ? 'bg-amber-400 text-slate-950 font-bold'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                        title="100% actual resolution"
                      >
                        100%
                      </button>
                    </div>
                  </div>

                  {/* Document container */}
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
                        onSelectPackage={handleSelectPackageFromPaper}
                        onOpenSignatureModal={() => setIsSignatureModalOpen(true)}
                        isInteractive={true}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 2: PREVIEW ONLY (Full Page Centered A4) */}
            {viewMode === 'preview_only' && activeInvoice && (
              <div ref={paperPreviewRef} className="flex flex-col items-center w-full space-y-4">
                <div className="flex items-center justify-between w-full max-w-4xl px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">View Mode:</span>
                    <button
                      type="button"
                      onClick={() => setPaperPreviewMode('fit-page')}
                      className={`px-2.5 py-1 rounded font-semibold transition cursor-pointer ${
                        paperPreviewMode === 'fit-page'
                          ? 'bg-amber-400 text-slate-950'
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
                          ? 'bg-amber-400 text-slate-950'
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
                          ? 'bg-amber-400 text-slate-950'
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
                      className="px-3 py-1 bg-amber-400 text-slate-950 font-bold rounded flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      Download PDF
                    </button>
                    <button
                      type="button"
                      onClick={handleSafePrint}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-amber-400" />
                      Print
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
                      onSelectPackage={handleSelectPackageFromPaper}
                      onOpenSignatureModal={() => setIsSignatureModalOpen(true)}
                      isInteractive={true}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Empty State when no invoice is active in Split or Preview mode */}
            {(viewMode === 'split' || viewMode === 'preview_only') && !activeInvoice && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 sm:p-12 text-center max-w-2xl mx-auto my-12 space-y-4">
                <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-amber-400">
                  <FileText className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Active Directory is Empty</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    All invoices have been archived or deleted from the directory. You can create a new invoice, restore from the archive vault, or reload Univision template invoices.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCreateNewInvoice}
                    className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Create New Invoice</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/40 font-semibold text-xs rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Archive className="w-4 h-4 text-purple-400" />
                    <span>Invoices Directory & Archive ({archivedInvoices.length} archived)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRestoreSampleInvoices}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold text-xs rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-amber-400" />
                    <span>Load Univision Templates</span>
                  </button>
                </div>
              </div>
            )}

            {/* VIEW 3: INVOICES DIRECTORY */}
            {viewMode === 'list' && (
              <div className="space-y-4">
                <InvoiceList
                  invoices={invoices}
                  archivedInvoices={archivedInvoices}
                  activeInvoiceId={activeInvoiceId}
                  onSelectInvoice={(id) => {
                    setActiveInvoiceId(id);
                    setViewMode('split');
                  }}
                  onCreateNewInvoice={handleCreateNewInvoice}
                  onDuplicateInvoice={handleDuplicateInvoice}
                  onDeleteInvoice={handleDeleteInvoice}
                  onArchiveInvoice={handleArchiveInvoice}
                  onArchiveAll={handleArchiveAll}
                  onDeleteAll={handleDeleteAll}
                  onRestoreInvoice={handleRestoreInvoice}
                  onRestoreAll={handleRestoreAll}
                  onPermanentDeleteArchived={handlePermanentDeleteArchived}
                  onEmptyArchive={handleEmptyArchive}
                  onRestoreSampleInvoices={handleRestoreSampleInvoices}
                />
              </div>
            )}

            {/* VIEW 4: ALL UNIVISION PACKAGE TIERS & RATE SCHEDULES */}
            {viewMode === 'rates' && (
              <div className="max-w-5xl mx-auto space-y-7 pb-10">
                <div className="text-center space-y-2">
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-500/30 uppercase tracking-widest">
                    Official Univision Rate Schedules & Specifications
                  </span>
                  <h2 className="text-2xl font-black text-white tracking-wide">
                    All Service Package Tiers & Rates
                  </h2>
                  <p className="text-sm text-slate-400 max-w-2xl mx-auto">
                    Full contracted deliverables, engineering scopes, and rate matrices. You can inspect deliverables and apply any tier directly to active invoice <strong className="text-amber-400 font-mono">{activeInvoice?.invoiceNumber}</strong>.
                  </p>
                </div>

                {/* Category Navigation Pills */}
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  {[
                    { id: 'all', label: '🌟 All Packages' },
                    { id: 'architectural', label: '🏛️ Architectural' },
                    { id: 'structural', label: '🏗️ Structural' },
                    { id: 'boq', label: '📊 Bills of Quantities' },
                    { id: 'inspection', label: '🔍 Site Inspection' },
                    { id: 'addons', label: '⚡ Add-ons' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setRateCategoryTab(tab.id as any)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        rateCategoryTab === tab.id
                          ? 'bg-[#0b2341] text-amber-400 border border-blue-500/50 shadow-sm ring-1 ring-blue-500/30'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* 1. ARCHITECTURAL DRAWING PACKAGES */}
                {(rateCategoryTab === 'all' || rateCategoryTab === 'architectural') && (
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-blue-950/80 rounded border border-blue-500/40 text-blue-400 text-xs font-bold">
                          01
                        </span>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                          Architectural Drawing Packages
                        </h3>
                      </div>
                      <span className="text-xs text-slate-400">Calculated per m² of gross covered floor area</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Architectural Regular */}
                      <div className="border border-slate-700 bg-slate-900 rounded-xl overflow-hidden shadow-lg flex flex-col">
                        <div className="bg-[#0b2341] p-5 text-white border-b border-blue-900/60">
                          <span className="text-[11px] font-black uppercase tracking-widest text-blue-300">
                            Standard Permitting Set
                          </span>
                          <h4 className="text-lg font-bold mt-0.5">REGULAR ARCHITECTURAL</h4>
                          <div className="font-mono text-2xl font-black text-amber-400 mt-1.5">
                            GMD 75 <span className="text-sm text-slate-300 font-normal">/m²</span>
                          </div>
                          <p className="text-xs text-blue-100 mt-1.5 leading-relaxed">
                            Official architectural permit set designed for municipal council approvals and general construction.
                          </p>
                        </div>
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <ul className="space-y-2">
                            {PACKAGES.regular.features.map((feat, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                          <button
                            type="button"
                            onClick={() => {
                              if (activeInvoice) {
                                handleSelectPackageFromPaper('regular');
                                setViewMode('split');
                              }
                            }}
                            className="w-full py-2 bg-blue-900/40 hover:bg-blue-800/60 text-blue-200 border border-blue-700/50 rounded-lg text-xs font-bold transition cursor-pointer"
                          >
                            Apply Regular Architectural to Invoice
                          </button>
                        </div>
                      </div>

                      {/* Architectural Premium */}
                      <div className="border border-amber-500/40 bg-slate-900 rounded-xl overflow-hidden shadow-lg flex flex-col ring-1 ring-amber-500/30">
                        <div className="bg-[#c27803] p-5 text-white border-b border-amber-600">
                          <span className="text-[11px] font-black uppercase tracking-widest text-amber-100">
                            Full Architectural & Interior Suite
                          </span>
                          <h4 className="text-lg font-bold mt-0.5">PREMIUM ARCHITECTURAL</h4>
                          <div className="font-mono text-2xl font-black text-white mt-1.5">
                            GMD 100 <span className="text-sm text-amber-100 font-normal">/m²</span>
                          </div>
                          <p className="text-xs text-amber-50 mt-1.5 leading-relaxed">
                            Comprehensive luxury architectural package including custom joinery details, 3D walkthrough, and lighting layouts.
                          </p>
                        </div>
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <ul className="space-y-2">
                            {PACKAGES.premium.features.map((feat, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-amber-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                          <button
                            type="button"
                            onClick={() => {
                              if (activeInvoice) {
                                handleSelectPackageFromPaper('premium');
                                setViewMode('split');
                              }
                            }}
                            className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition shadow-md cursor-pointer"
                          >
                            Apply Premium Architectural to Invoice
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. STRUCTURAL ENGINEERING PACKAGES */}
                {(rateCategoryTab === 'all' || rateCategoryTab === 'structural') && (
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-indigo-950/80 rounded border border-indigo-500/40 text-indigo-400 text-xs font-bold">
                          02
                        </span>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                          Structural Engineering Drawing Packages
                        </h3>
                      </div>
                      <span className="text-xs text-slate-400">Foundation, reinforced concrete, BBS & calculations</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Structural Regular */}
                      <div className="border border-slate-700 bg-slate-900 rounded-xl overflow-hidden shadow-lg flex flex-col">
                        <div className="bg-indigo-950 p-5 text-white border-b border-indigo-800/60">
                          <span className="text-[11px] font-black uppercase tracking-widest text-indigo-300">
                            Standard Structural Drawings
                          </span>
                          <h4 className="text-lg font-bold mt-0.5">REGULAR STRUCTURAL</h4>
                          <div className="font-mono text-2xl font-black text-amber-400 mt-1.5">
                            GMD 65 <span className="text-sm text-slate-300 font-normal">/m²</span>
                          </div>
                          <p className="text-xs text-indigo-200 mt-1.5 leading-relaxed">
                            Complete structural construction drawings for foundation, ground beams, columns, slab layouts, and roof trusses.
                          </p>
                        </div>
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <ul className="space-y-2">
                            {STRUCTURAL_PACKAGES.regular.features.map((feat, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                          <button
                            type="button"
                            onClick={() => {
                              handleApplyStructuralTier('regular');
                              setViewMode('split');
                            }}
                            className="w-full py-2 bg-indigo-900/50 hover:bg-indigo-800/70 text-indigo-200 border border-indigo-700/50 rounded-lg text-xs font-bold transition cursor-pointer"
                          >
                            Apply Regular Structural to Invoice
                          </button>
                        </div>
                      </div>

                      {/* Structural Premium */}
                      <div className="border border-emerald-500/40 bg-slate-900 rounded-xl overflow-hidden shadow-lg flex flex-col ring-1 ring-emerald-500/30">
                        <div className="bg-emerald-950 p-5 text-white border-b border-emerald-800/60">
                          <span className="text-[11px] font-black uppercase tracking-widest text-emerald-300">
                            Full Engineering & Calculations Suite
                          </span>
                          <h4 className="text-lg font-bold mt-0.5">PREMIUM STRUCTURAL</h4>
                          <div className="font-mono text-2xl font-black text-emerald-300 mt-1.5">
                            GMD 85 <span className="text-sm text-emerald-100 font-normal">/m²</span>
                          </div>
                          <p className="text-xs text-emerald-200 mt-1.5 leading-relaxed">
                            Includes Regular structural plus Bar Bending Schedule (BBS), structural calculations report, and stair reinforcement.
                          </p>
                        </div>
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <ul className="space-y-2">
                            {STRUCTURAL_PACKAGES.premium.features.map((feat, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                          <button
                            type="button"
                            onClick={() => {
                              handleApplyStructuralTier('premium');
                              setViewMode('split');
                            }}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition shadow-md cursor-pointer"
                          >
                            Apply Premium Structural to Invoice
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. BILLS OF QUANTITIES (BOQ) PACKAGES */}
                {(rateCategoryTab === 'all' || rateCategoryTab === 'boq') && (
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-emerald-950/80 rounded border border-emerald-500/40 text-emerald-400 text-xs font-bold">
                          03
                        </span>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                          Bills of Quantities (BOQ) Packages
                        </h3>
                      </div>
                      <span className="text-xs text-slate-400">Material take-offs, labor schedules, and tender pricing</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* BOQ Regular */}
                      <div className="border border-slate-700 bg-slate-900 rounded-xl overflow-hidden shadow-lg flex flex-col">
                        <div className="bg-slate-950 p-5 text-white border-b border-slate-800">
                          <span className="text-[11px] font-black uppercase tracking-widest text-blue-400">
                            Standard Quantity Take-off
                          </span>
                          <h4 className="text-lg font-bold mt-0.5">REGULAR BOQ PACKAGE</h4>
                          <div className="font-mono text-xl font-bold text-amber-400 mt-1.5">
                            GMD 18,000 – 25,000 <span className="text-xs text-slate-400 font-normal">tiered by area</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-2 space-y-0.5 font-mono">
                            <div>• 100 – 500 m²: GMD 18,000</div>
                            <div>• 500 – 1,000 m²: GMD 20,000</div>
                            <div>• 1,000+ m²: GMD 25,000</div>
                          </div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <ul className="space-y-2">
                            {BOQ_PACKAGES.regular.features.map((feat, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                          <button
                            type="button"
                            onClick={() => {
                              handleApplyBOQTier('regular');
                              setViewMode('split');
                            }}
                            className="w-full py-2 bg-blue-900/50 hover:bg-blue-800/70 text-blue-200 border border-blue-700/50 rounded-lg text-xs font-bold transition cursor-pointer"
                          >
                            Apply Regular BOQ to Invoice
                          </button>
                        </div>
                      </div>

                      {/* BOQ Premium */}
                      <div className="border border-emerald-500/40 bg-slate-900 rounded-xl overflow-hidden shadow-lg flex flex-col ring-1 ring-emerald-500/30">
                        <div className="bg-emerald-950 p-5 text-white border-b border-emerald-800/60">
                          <span className="text-[11px] font-black uppercase tracking-widest text-emerald-300">
                            Comprehensive Cost Consultancy
                          </span>
                          <h4 className="text-lg font-bold mt-0.5">PREMIUM BOQ PACKAGE</h4>
                          <div className="font-mono text-xl font-bold text-emerald-300 mt-1.5">
                            GMD 30,000 – 65,000 <span className="text-xs text-emerald-200 font-normal">tiered by area</span>
                          </div>
                          <div className="text-[11px] text-emerald-200 mt-2 space-y-0.5 font-mono">
                            <div>• 100 – 500 m²: GMD 30,000</div>
                            <div>• 500 – 1,000 m²: GMD 45,000</div>
                            <div>• 1,000+ m²: GMD 65,000</div>
                          </div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <ul className="space-y-2">
                            {BOQ_PACKAGES.premium.features.map((feat, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                          <button
                            type="button"
                            onClick={() => {
                              handleApplyBOQTier('premium');
                              setViewMode('split');
                            }}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition shadow-md cursor-pointer"
                          >
                            Apply Premium BOQ to Invoice
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. SITE INSPECTION & REPORTS PACKAGE */}
                {(rateCategoryTab === 'all' || rateCategoryTab === 'inspection') && (
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-amber-950/80 rounded border border-amber-500/40 text-amber-400 text-xs font-bold">
                          04
                        </span>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                          Site Inspection & Technical Advisory Packages
                        </h3>
                      </div>
                      <span className="text-xs text-slate-400">On-site terrain survey, boundary sketch, & certified inspection</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Standard Inspection */}
                      <div className="border border-slate-700 bg-slate-900 rounded-xl overflow-hidden shadow-lg flex flex-col">
                        <div className="bg-amber-950/60 p-5 text-white border-b border-amber-900/60">
                          <span className="text-[11px] font-black uppercase tracking-widest text-amber-300">
                            Single On-Site Visit
                          </span>
                          <h4 className="text-lg font-bold mt-0.5">STANDARD SITE INSPECTION</h4>
                          <div className="font-mono text-2xl font-black text-amber-400 mt-1.5">
                            GMD 3,500 <span className="text-sm text-slate-300 font-normal">Fixed</span>
                          </div>
                          <p className="text-xs text-amber-200 mt-1.5 leading-relaxed">
                            On-site physical inspection, boundary orientation, initial sketch plans, and consultation.
                          </p>
                        </div>
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <ul className="space-y-2">
                            {SITE_INSPECTION_PACKAGE.includes.map((feat, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                          <button
                            type="button"
                            onClick={() => {
                              handleApplyInspectionTier(3500, 'Standard');
                              setViewMode('split');
                            }}
                            className="w-full py-2 bg-amber-600/80 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs transition cursor-pointer"
                          >
                            Apply Standard Inspection to Invoice
                          </button>
                        </div>
                      </div>

                      {/* Comprehensive Advisory */}
                      <div className="border border-emerald-500/40 bg-slate-900 rounded-xl overflow-hidden shadow-lg flex flex-col ring-1 ring-emerald-500/30">
                        <div className="bg-emerald-950/80 p-5 text-white border-b border-emerald-900/60">
                          <span className="text-[11px] font-black uppercase tracking-widest text-emerald-300">
                            Multi-Stage & Topography
                          </span>
                          <h4 className="text-lg font-bold mt-0.5">COMPREHENSIVE SITE ADVISORY</h4>
                          <div className="font-mono text-2xl font-black text-emerald-300 mt-1.5">
                            GMD 6,500 <span className="text-sm text-emerald-100 font-normal">Fixed</span>
                          </div>
                          <p className="text-xs text-emerald-200 mt-1.5 leading-relaxed">
                            Multi-stage site visits, topography & contour level survey, soil condition review, and certified engineering documentation.
                          </p>
                        </div>
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <ul className="space-y-2">
                            <li className="flex items-start gap-2 text-xs text-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span>Multi-Stage On-Site Engineering Inspections</span>
                            </li>
                            <li className="flex items-start gap-2 text-xs text-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span>Boundary Alignment & Terrain Topography Review</span>
                            </li>
                            <li className="flex items-start gap-2 text-xs text-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span>Soil Condition Assessment & Drainage Advisory</span>
                            </li>
                            <li className="flex items-start gap-2 text-xs text-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span>Formal Certified Inspection Report for Municipality</span>
                            </li>
                          </ul>
                          <button
                            type="button"
                            onClick={() => {
                              handleApplyInspectionTier(6500, 'Comprehensive');
                              setViewMode('split');
                            }}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition shadow-md cursor-pointer"
                          >
                            Apply Comprehensive Advisory to Invoice
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. EXTRA ENGINEERING & ARCHITECTURAL ADD-ONS */}
                {(rateCategoryTab === 'all' || rateCategoryTab === 'addons') && (
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-purple-950/80 rounded border border-purple-500/40 text-purple-400 text-xs font-bold">
                          05
                        </span>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                          Architectural & Engineering Add-on Deliverables
                        </h3>
                      </div>
                      <span className="text-xs text-slate-400">Optional specialized services</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {ARCHITECTURAL_ADDONS_PRESETS.map((addon) => (
                        <div
                          key={addon.id}
                          className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2 hover:border-purple-500/40 transition"
                        >
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-bold text-white">{addon.name}</h5>
                            <span className="text-xs font-mono font-bold text-amber-400">
                              GMD {addon.amount.toLocaleString()}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            {addon.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>
        )}

        {/* Signature Modal */}
        <SignatureModal
          isOpen={isSignatureModalOpen}
          onClose={() => setIsSignatureModalOpen(false)}
          onSave={handleSaveSignature}
          initialSignature={activeInvoice?.clientSignature}
          initialType={activeInvoice?.clientSignatureType}
          clientName={activeInvoice?.client?.name}
        />

        {/* Export & Sharing Modal */}
        {activeInvoice && (
          <ExportModal
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
            invoice={activeInvoice}
            onImportInvoice={handleImportInvoice}
            onOpenPrintPreview={() => {
              setIsExportModalOpen(false);
              setIsPrintPreviewOpen(true);
            }}
          />
        )}

        {/* Print Preview Modal */}
        {activeInvoice && (
          <PrintPreviewModal
            isOpen={isPrintPreviewOpen}
            onClose={() => setIsPrintPreviewOpen(false)}
            invoice={activeInvoice}
          />
        )}

        {/* New Invoice Type Selection Studio Modal */}
        <NewInvoiceTypeModal
          isOpen={isNewInvoiceModalOpen}
          onClose={() => setIsNewInvoiceModalOpen(false)}
          onCreateInvoice={handleCreateInvoiceWithType}
        />

        {/* Department Personnel & Task Matrix Modal (Who Did What) */}
        <DepartmentOfficialsModal
          isOpen={isOfficialsModalOpen}
          onClose={() => setIsOfficialsModalOpen(false)}
          initialDepartment={
            portalMode === 'architectural'
              ? 'architectural'
              : portalMode === 'structural'
              ? 'structural'
              : portalMode === 'boq'
              ? 'boq'
              : portalMode === 'inspection'
              ? 'inspection'
              : 'commercial'
          }
        />

        {/* Deploy to GitHub Instructions & Command Helper */}
        <GitHubDeployModal
          isOpen={isGitHubModalOpen}
          onClose={() => setIsGitHubModalOpen(false)}
          userEmail="darboejuloo1@gmail.com"
        />

        {/* Toast Notification */}
        {notification && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500/60 text-emerald-300 text-xs font-semibold px-4 py-2.5 rounded-lg shadow-2xl flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{notification}</span>
          </div>
        )}

        {/* Footer */}
        <footer className="bg-slate-950 border-t border-slate-900 py-6 px-4 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-400">UNIVISION DESIGN AND CONSTRUCTION LTD.</span>
              <span>·</span>
              <span>Sukuta Dalaba, The Gambia</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Professional Architectural, Structural Engineering & BOQ Invoicing System
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
