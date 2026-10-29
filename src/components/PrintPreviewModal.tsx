import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Printer,
  FileDown,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Check,
  Loader2,
  FileCode,
  MoveHorizontal,
  Sparkles,
  SlidersHorizontal,
  Layers,
} from 'lucide-react';
import { Invoice, PackageSelectionMap, PackageFilterPreset } from '../types';
import { InvoicePaper } from './InvoicePaper';
import { downloadInvoicePDF, downloadPrintableHTML } from '../utils/pdfExport';
import { printInvoiceElement } from '../utils/printHelper';
import {
  PACKAGE_PRESETS,
  filterInvoiceForPackages,
  getPackageSummaries,
  getInvoiceDiscipline,
  isSinglePackageInvoice,
} from '../utils/packageManager';
import { formatCurrency, calculateInvoice } from '../utils/calculations';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  initialPackageFilter?: PackageSelectionMap;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  invoice,
  initialPackageFilter,
}) => {
  const [scale, setScale] = useState<number>(0.65);
  const [fitMode, setFitMode] = useState<'page' | 'width' | 'custom'>('page');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printNotice, setPrintNotice] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [showMargins, setShowMargins] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Discipline & Single-package restrictions
  const invoiceDiscipline = getInvoiceDiscipline(invoice);
  const isInvoiceSingle = isSinglePackageInvoice(invoice);
  const singlePreset: PackageFilterPreset =
    invoiceDiscipline === 'boq'
      ? 'boq'
      : invoiceDiscipline === 'inspection'
      ? 'inspection'
      : invoiceDiscipline === 'structural'
      ? 'structural'
      : 'architectural';

  // Package Filter State for single-package and custom multi-package printing
  const [packageFilter, setPackageFilter] = useState<PackageSelectionMap>(() => {
    if (isInvoiceSingle) {
      return PACKAGE_PRESETS[singlePreset];
    }
    if (initialPackageFilter) return initialPackageFilter;
    if (invoice.activePrintFilter) return invoice.activePrintFilter;
    return PACKAGE_PRESETS.all;
  });
  const [activePreset, setActivePreset] = useState<PackageFilterPreset>(() => {
    if (isInvoiceSingle) return singlePreset;
    if (initialPackageFilter) return 'custom';
    return 'all';
  });
  const [showCustomCombine, setShowCustomCombine] = useState(false);

  // Sync packageFilter whenever invoice or discipline changes
  useEffect(() => {
    if (isInvoiceSingle) {
      setPackageFilter(PACKAGE_PRESETS[singlePreset]);
      setActivePreset(singlePreset);
    } else if (initialPackageFilter) {
      setPackageFilter(initialPackageFilter);
      setActivePreset('custom');
    }
  }, [invoice.id, invoiceDiscipline, isInvoiceSingle, initialPackageFilter, singlePreset]);

  // Derived filtered invoice & package stats
  const { packages: allPkgSummaries, activeCount, grandTotal } = getPackageSummaries(invoice);
  const { filteredInvoice, bannerTitle, selectedNames, isSinglePackage, singlePackageKey } =
    filterInvoiceForPackages(invoice, packageFilter);
  const currentCalculations = calculateInvoice(filteredInvoice);

  const handleSelectPreset = (preset: PackageFilterPreset) => {
    setActivePreset(preset);
    if (preset !== 'custom') {
      setPackageFilter({ ...PACKAGE_PRESETS[preset] });
    }
  };

  const handleTogglePackage = (pkgKey: keyof PackageSelectionMap) => {
    setActivePreset('custom');
    setPackageFilter((prev) => {
      const updated = { ...prev, [pkgKey]: !prev[pkgKey] };
      // Prevent all from being deselected
      const anySelected = Object.values(updated).some(Boolean);
      if (!anySelected) {
        return prev;
      }
      return updated;
    });
  };

  const [paperHeight, setPaperHeight] = useState<number>(1130);

  // Measure actual unscaled paper element height
  const measurePaperHeight = useCallback(() => {
    const paperEl = document.getElementById('univision-invoice-preview-sheet');
    if (paperEl) {
      const h = Math.max(1130, paperEl.offsetHeight || paperEl.scrollHeight);
      setPaperHeight(h);
      return h;
    }
    return 1130;
  }, []);

  // Update paper height when package selection or invoice changes
  useEffect(() => {
    const timer = setTimeout(() => {
      measurePaperHeight();
    }, 60);
    return () => clearTimeout(timer);
  }, [packageFilter, filteredInvoice, measurePaperHeight]);

  // Reference to track fitMode without triggering useEffect re-runs
  const fitModeRef = useRef(fitMode);
  fitModeRef.current = fitMode;

  // Auto-calculate scale to fit the entire A4 page or width
  const updateFitScale = useCallback((mode: 'page' | 'width') => {
    if (!viewportRef.current) return;
    const container = viewportRef.current;
    const paddingX = 48; // padding margin
    const paddingY = 48;
    const vw = Math.max(280, container.clientWidth - paddingX);
    const vh = Math.max(280, container.clientHeight - paddingY);
    const paperW = 800;
    const paperEl = document.getElementById('univision-invoice-preview-sheet');
    const measuredH = paperEl ? Math.max(1130, paperEl.offsetHeight || paperEl.scrollHeight) : 1130;
    setPaperHeight(measuredH);

    if (mode === 'page') {
      const calculatedScale = Math.min(vw / paperW, vh / measuredH);
      const clamped = Math.min(1.2, Math.max(0.1, Math.round(calculatedScale * 100) / 100));
      setScale(clamped);
      setFitMode('page');
    } else if (mode === 'width') {
      const calculatedScale = vw / paperW;
      const clamped = Math.min(1.5, Math.max(0.35, Math.round(calculatedScale * 100) / 100));
      setScale(clamped);
      setFitMode('width');
    }
  }, []);

  // Run initial fit scale only once upon opening the modal
  const hasInitializedRef = useRef(false);
  useEffect(() => {
    if (!isOpen) {
      hasInitializedRef.current = false;
      return;
    }
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      const timer = setTimeout(() => {
        updateFitScale('page');
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [isOpen, updateFitScale]);

  // Window resize listener that preserves the active fitMode without resetting custom zooms
  useEffect(() => {
    if (!isOpen) return;
    const handleResize = () => {
      if (fitModeRef.current === 'page') {
        updateFitScale('page');
      } else if (fitModeRef.current === 'width') {
        updateFitScale('width');
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, updateFitScale]);

  if (!isOpen) return null;

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    setStatusMessage('Compiling centered A4 PDF...');

    const cleanNames = selectedNames.map((s) => s.replace(/[^a-zA-Z0-9]/g, '_')).join('_');
    const filename = `${invoice.invoiceNumber}_${cleanNames || 'Invoice'}.pdf`;

    const success = await downloadInvoicePDF(filteredInvoice, {
      filename,
      onProgress: (msg) => setStatusMessage(msg),
    });

    setIsGeneratingPDF(false);
    setStatusMessage(success ? 'PDF downloaded!' : 'Download failed');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const handleSystemPrint = async () => {
    setIsPrinting(true);
    setStatusMessage('Preparing fitted A4 print...');
    try {
      const success = await printInvoiceElement('univision-invoice-preview-sheet');
      setStatusMessage(success ? 'A4 print dialog opened.' : 'Unable to prepare the print document.');
      setPrintNotice(success ? 'The preview has been fitted to a single A4 page.' : null);
    } catch (err) {
      console.error('Error preparing print document', err);
      setStatusMessage('Print preparation failed.');
    } finally {
      setIsPrinting(false);
      setTimeout(() => setStatusMessage(''), 5000);
    }
  };

  const handleDownloadHTML = () => {
    downloadPrintableHTML(filteredInvoice);
    setStatusMessage('Standalone HTML downloaded!');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const handleZoomIn = () => {
    setFitMode('custom');
    setScale((s) => Math.min(1.5, Math.round((s + 0.1) * 10) / 10));
  };

  const handleZoomOut = () => {
    setFitMode('custom');
    setScale((s) => Math.max(0.35, Math.round((s - 0.1) * 10) / 10));
  };

  const handleActualSize = () => {
    setFitMode('custom');
    setScale(1.0);
  };

  return (
    <div className="no-print fixed inset-0 z-50 flex flex-col bg-slate-950/90 backdrop-blur-md overflow-hidden animate-fade-in">
      {/* 
        =======================================================================
        TOP CONTROLS & ACTION BAR
        =======================================================================
      */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 md:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-lg">
        {/* Left: Title & Page Specs */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#0b2341] rounded-lg border border-blue-500/30 text-amber-400 shrink-0">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Print Preview: {invoice.invoiceNumber}
              </h3>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/60">
                A4 (210 × 297 mm)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Review centered paper alignment, page fit, and margins before printing.
            </p>
          </div>
        </div>

        {/* Center: Zoom & Fit Controls */}
        <div className="flex items-center gap-1.5 bg-slate-800/90 p-1 rounded-lg border border-slate-700/70 text-xs">
          {/* Fit to Page Button */}
          <button
            type="button"
            onClick={() => updateFitScale('page')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors flex items-center gap-1 cursor-pointer ${
              fitMode === 'page'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
            title="Fit entire A4 page on screen without scrolling"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Fit Page</span>
          </button>

          {/* Fit to Width Button */}
          <button
            type="button"
            onClick={() => updateFitScale('width')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors flex items-center gap-1 cursor-pointer ${
              fitMode === 'width'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
            title="Fit paper width to screen"
          >
            <MoveHorizontal className="w-3.5 h-3.5" />
            <span>Fit Width</span>
          </button>

          {/* 100% Actual Size */}
          <button
            type="button"
            onClick={handleActualSize}
            className={`px-2 py-1 text-[11px] font-mono rounded transition-colors cursor-pointer ${
              scale === 1.0 && fitMode === 'custom'
                ? 'bg-amber-400 text-slate-950 font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
            title="Actual 1:1 scale"
          >
            100%
          </button>

          <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />

          {/* Zoom Out */}
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span className="font-mono text-[11px] px-1.5 text-slate-200 tabular-nums min-w-[42px] text-center">
            {Math.round(scale * 100)}%
          </span>

          {/* Zoom In */}
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />

          {/* Margin Guide Toggle */}
          <button
            type="button"
            onClick={() => setShowMargins((m) => !m)}
            className={`px-2 py-1 text-[11px] rounded transition-colors cursor-pointer ${
              showMargins
                ? 'bg-amber-400 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle 8mm page print boundary guide"
          >
            Margins
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Status Message */}
          {statusMessage && (
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 animate-fade-in mr-2">
              <Check className="w-3.5 h-3.5" />
              {statusMessage}
            </span>
          )}

          {/* Download Standalone HTML */}
          <button
            type="button"
            onClick={handleDownloadHTML}
            className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download standalone HTML with embedded print script"
          >
            <FileCode className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">HTML Print</span>
          </button>

          {/* Download Exact PDF */}
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            title="Download centered A4 PDF document"
          >
            {isGeneratingPDF ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileDown className="w-3.5 h-3.5" />
            )}
            <span>Download A4 PDF</span>
          </button>

          {/* System Print */}
          <button
            type="button"
            onClick={handleSystemPrint}
            disabled={isPrinting || isGeneratingPDF}
            className="px-4 py-1.5 text-xs font-bold text-white bg-[#0b2341] hover:bg-[#133863] border border-blue-500/50 hover:border-amber-400/60 disabled:opacity-60 rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            title="Send directly to printer or system print dialog"
          >
            {isPrinting ? (
              <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            ) : (
              <Printer className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>{isPrinting ? 'Printing...' : 'Print Now'}</span>
          </button>

          {/* Close Modal */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-2 cursor-pointer"
            title="Close Preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 
        =======================================================================
        PACKAGE PRINT SELECTOR & COMBINATION BAR
        Allows printing one package at a time or combining any selection
        =======================================================================
      */}
      {/* 
        =======================================================================
        PACKAGE PRINT SELECTOR & COMBINATION BAR
        For single-discipline invoices: strictly restricted to this invoice's package.
        For multi-package invoices: allows printing one package at a time or combining.
        =======================================================================
      */}
      <div className="bg-slate-900/95 border-b border-slate-800 px-4 md:px-6 py-2 flex flex-wrap items-center justify-between gap-2.5 shrink-0 z-20 shadow-md">
        {isInvoiceSingle ? (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 mr-1">
              <Sparkles className="w-3.5 h-3.5" />
              Discipline Studio:
            </span>
            <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-slate-800/90 border border-amber-500/40 text-xs font-semibold text-white shadow-xs">
              {invoiceDiscipline === 'boq' && (
                <>
                  <span className="flex items-center gap-1.5">
                    <span>📊</span>
                    <span>Bills of Quantities (BOQ) Studio</span>
                  </span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/50 px-2 py-0.5 rounded font-mono font-bold tracking-wide">
                    SINGLE PACKAGE • BOQ SCOPE ONLY
                  </span>
                </>
              )}
              {invoiceDiscipline === 'inspection' && (
                <>
                  <span className="flex items-center gap-1.5">
                    <span>🔍</span>
                    <span>Site Inspection & Technical Consultation</span>
                  </span>
                  <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-500/50 px-2 py-0.5 rounded font-mono font-bold tracking-wide">
                    SINGLE PACKAGE • INSPECTION SCOPE ONLY
                  </span>
                </>
              )}
              {invoiceDiscipline === 'structural' && (
                <>
                  <span className="flex items-center gap-1.5">
                    <span>🏗️</span>
                    <span>Structural Engineering Drawing Studio</span>
                  </span>
                  <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-500/50 px-2 py-0.5 rounded font-mono font-bold tracking-wide">
                    SINGLE PACKAGE • STRUCTURAL SCOPE ONLY
                  </span>
                </>
              )}
              {invoiceDiscipline === 'architectural' && (
                <>
                  <span className="flex items-center gap-1.5">
                    <span>🏛️</span>
                    <span>Architectural Drawing Studio</span>
                  </span>
                  <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-500/50 px-2 py-0.5 rounded font-mono font-bold tracking-wide">
                    SINGLE PACKAGE • ARCHITECTURAL SCOPE ONLY
                  </span>
                </>
              )}
            </div>
            <span className="text-[11px] text-slate-400 italic hidden sm:inline">
              (Preview restricted strictly to this invoice's package deliverables)
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 mr-1">
              <Sparkles className="w-3.5 h-3.5" />
              Print Package:
            </span>

            {/* Preset: All Included Packages */}
            <button
              type="button"
              onClick={() => handleSelectPreset('all')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activePreset === 'all'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-xs ring-1 ring-amber-300'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <span>🌟 All Included ({activeCount})</span>
            </button>

            {/* Preset: Architectural Package */}
            <button
              type="button"
              onClick={() => handleSelectPreset('architectural')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                activePreset === 'architectural'
                  ? 'bg-blue-600 text-white font-bold shadow-xs ring-1 ring-blue-400'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <span>🏛️ Arch Package</span>
            </button>

            {/* Preset: Structural Package */}
            <button
              type="button"
              onClick={() => handleSelectPreset('structural')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                activePreset === 'structural'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs ring-1 ring-indigo-400'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <span>🏗️ Structural Package</span>
            </button>

            {/* Preset: BOQ Package */}
            <button
              type="button"
              onClick={() => handleSelectPreset('boq')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                activePreset === 'boq'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs ring-1 ring-emerald-400'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <span>📊 BOQ Package</span>
            </button>

            {/* Preset: Site Inspection Package */}
            <button
              type="button"
              onClick={() => handleSelectPreset('inspection')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                activePreset === 'inspection'
                  ? 'bg-amber-600 text-white font-bold shadow-xs ring-1 ring-amber-400'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <span>🔍 Inspection Package</span>
            </button>

            {/* Combine / Multi-Select Toggle */}
            <button
              type="button"
              onClick={() => setShowCustomCombine((prev) => !prev)}
              className={`px-2.5 py-1 rounded text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                showCustomCombine || activePreset === 'custom' || activePreset === 'arch_structural' || activePreset === 'arch_boq' || activePreset === 'structural_boq'
                  ? 'bg-purple-900/70 border-purple-400 text-purple-200 ring-1 ring-purple-400/50'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" />
              <span>Combine Packages... {showCustomCombine ? '▲' : '▼'}</span>
            </button>
          </div>
        )}

        {/* Live Filter Summary Badge */}
        <div className="flex items-center gap-2">
          <div className="text-[11px] text-slate-300 hidden sm:flex items-center gap-1.5">
            <span className="text-slate-400">Target Print:</span>
            <span className="font-semibold text-white">{selectedNames.join(' + ') || 'Selected Scope'}</span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-[11px]">
            <span className="text-slate-400 font-mono">Total:</span>
            <span className="font-mono font-bold text-amber-400">
              {formatCurrency(currentCalculations.grandTotal, invoice.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Expandable Custom Combination Panel (Multi-package invoices only) */}
      {showCustomCombine && !isInvoiceSingle && (
        <div className="bg-slate-900 border-b border-purple-500/40 px-4 md:px-6 py-3 shrink-0 z-20 shadow-xl space-y-2.5 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5 uppercase tracking-wide">
              <Layers className="w-4 h-4 text-purple-400" />
              Custom Package Combination (Select Any Two or More to Print Together)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSelectPreset('arch_structural')}
                className="px-2 py-0.5 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded cursor-pointer"
              >
                Arch + Structural
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset('arch_boq')}
                className="px-2 py-0.5 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded cursor-pointer"
              >
                Arch + BOQ
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset('structural_boq')}
                className="px-2 py-0.5 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded cursor-pointer"
              >
                Structural + BOQ
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset('all')}
                className="px-2 py-0.5 text-[11px] bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-500/40 rounded cursor-pointer font-semibold"
              >
                All Packages
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
            {/* Arch Checkbox */}
            <label
              className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                packageFilter.architectural
                  ? 'bg-blue-950/60 border-blue-500 text-white'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <input
                type="checkbox"
                checked={packageFilter.architectural}
                onChange={() => handleTogglePackage('architectural')}
                className="mt-0.5 rounded border-slate-600 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="text-xs font-bold leading-tight">🏛️ Architectural</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {formatCurrency(allPkgSummaries.architectural.subtotal, invoice.currency)}
                </div>
              </div>
            </label>

            {/* Structural Checkbox */}
            <label
              className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                packageFilter.structural
                  ? 'bg-indigo-950/60 border-indigo-500 text-white'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <input
                type="checkbox"
                checked={packageFilter.structural}
                onChange={() => handleTogglePackage('structural')}
                className="mt-0.5 rounded border-slate-600 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <div className="text-xs font-bold leading-tight">🏗️ Structural</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {formatCurrency(allPkgSummaries.structural.subtotal, invoice.currency)}
                </div>
              </div>
            </label>

            {/* BOQ Checkbox */}
            <label
              className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                packageFilter.boq
                  ? 'bg-emerald-950/60 border-emerald-500 text-white'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <input
                type="checkbox"
                checked={packageFilter.boq}
                onChange={() => handleTogglePackage('boq')}
                className="mt-0.5 rounded border-slate-600 text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <div className="text-xs font-bold leading-tight">📊 BOQ Package</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {formatCurrency(allPkgSummaries.boq.subtotal, invoice.currency)}
                </div>
              </div>
            </label>

            {/* Inspection Checkbox */}
            <label
              className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                packageFilter.inspection
                  ? 'bg-amber-950/60 border-amber-500 text-white'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <input
                type="checkbox"
                checked={packageFilter.inspection}
                onChange={() => handleTogglePackage('inspection')}
                className="mt-0.5 rounded border-slate-600 text-amber-500 focus:ring-amber-500"
              />
              <div>
                <div className="text-xs font-bold leading-tight">🔍 Site Inspection</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {formatCurrency(allPkgSummaries.inspection.subtotal, invoice.currency)}
                </div>
              </div>
            </label>

            {/* Addons Checkbox */}
            <label
              className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                packageFilter.addons
                  ? 'bg-purple-950/60 border-purple-500 text-white'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <input
                type="checkbox"
                checked={packageFilter.addons}
                onChange={() => handleTogglePackage('addons')}
                className="mt-0.5 rounded border-slate-600 text-purple-600 focus:ring-purple-500"
              />
              <div>
                <div className="text-xs font-bold leading-tight">⚡ Extra Add-ons</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {formatCurrency(allPkgSummaries.addons.subtotal, invoice.currency)}
                </div>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Print Notice Banner */}
      {printNotice && (
        <div className="bg-emerald-950/95 border-b border-emerald-500/50 px-4 md:px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-200 shrink-0 shadow-md">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{printNotice}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDownloadHTML}
              className="text-emerald-300 hover:text-white underline text-xs cursor-pointer font-semibold"
            >
              HTML Print
            </button>
            <button
              type="button"
              onClick={() => setPrintNotice(null)}
              className="text-emerald-400 hover:text-white px-2 py-0.5 rounded bg-emerald-900/60 hover:bg-emerald-800 text-[11px] cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* 
        =======================================================================
        PAGE VIEWPORT / SCROLL CANVAS
        Renders the centered A4 paper sheet with photorealistic margins
        =======================================================================
      */}
      <main
        ref={viewportRef}
        className="flex-1 overflow-auto p-4 sm:p-6 flex justify-center items-start bg-slate-950/90 w-full min-h-0"
      >
        <div
          style={{
            width: `${Math.round(800 * scale)}px`,
            height: `${Math.round(paperHeight * scale)}px`,
            transition: 'width 120ms ease-out, height 120ms ease-out',
          }}
          className="relative shrink-0 mx-auto my-4"
        >
          {/* Simulated A4 Paper (Standard 210mm x 297mm proportions) */}
          <div
            className={`origin-top-left bg-white text-slate-900 shadow-2xl rounded-xs transition-all ${
              showMargins ? 'ring-2 ring-dashed ring-amber-400/80 ring-offset-4 ring-offset-slate-950' : ''
            }`}
            style={{
              width: '800px', // Standard desktop A4 pixel render width
              minHeight: '1130px', // A4 aspect ratio 1 : 1.4142 (800 * 1.4142 ≈ 1131px)
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              boxSizing: 'border-box',
            }}
          >
            {/* 8mm Margin Guide Indicator */}
            {showMargins && (
              <div
                className="absolute inset-[30px] border border-dashed border-amber-500/60 pointer-events-none z-10 flex items-start justify-end p-2 text-[9px] font-mono text-amber-600"
                aria-hidden="true"
              >
                <span>8mm Print Safety Boundary</span>
              </div>
            )}

            {/* The Live Invoice Paper */}
            <div className="w-full flex justify-center h-full">
              <InvoicePaper
                id="univision-invoice-preview-sheet"
                invoice={filteredInvoice}
                packageFilter={packageFilter}
                isInteractive={false}
                className="shadow-none border-0"
              />
            </div>
          </div>
        </div>
      </main>

      {/* Bottom helper footer */}
      <footer className="bg-slate-900 border-t border-slate-800 px-6 py-2 flex items-center justify-between text-xs text-slate-400 shrink-0">
        <div className="flex items-center gap-2">
          <span>Centered Page Layout</span>
          <span>·</span>
          <span>Margins Balanced (Left & Right)</span>
          <span>·</span>
          <span>Resolution: 300 DPI</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white underline cursor-pointer"
          >
            Return to Editor
          </button>
        </div>
      </footer>
    </div>
  );
};
