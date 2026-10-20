import React, { useState } from 'react';
import {
  X,
  Printer,
  Mail,
  Share2,
  Copy,
  Check,
  Download,
  Upload,
  MessageSquare,
  FileDown,
  Loader2,
} from 'lucide-react';
import { Invoice } from '../types';
import { calculateInvoice, formatCurrency, formatDateToSlash } from '../utils/calculations';
import { downloadInvoicePDF, downloadPrintableHTML } from '../utils/pdfExport';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  onImportInvoice?: (imported: Invoice) => void;
  onOpenPrintPreview?: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onImportInvoice,
  onOpenPrintPreview,
}) => {
  const [copiedText, setCopiedText] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfStatusMessage, setPdfStatusMessage] = useState<string>('');
  const calculations = calculateInvoice(invoice);

  if (!isOpen) return null;

  // Direct vector & pixel-perfect PDF generation
  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    setPdfStatusMessage('Capturing exact paper preview to PDF...');

    const success = await downloadInvoicePDF(invoice, {
      filename: `${invoice.invoiceNumber}_Univision_Invoice.pdf`,
      onProgress: (msg) => setPdfStatusMessage(msg),
    });

    setIsGeneratingPDF(false);
    setPdfStatusMessage('');
    if (success) {
      setCopiedText(false);
    }
  };

  // Safe system print: automatically ensures PDF is downloaded even if iframe blocks print dialog
  const handlePrint = async () => {
    onClose();
    // Generate and download the exact PDF document
    await handleDownloadPDF();
    setTimeout(() => {
      try {
        window.print();
      } catch (err) {
        console.warn('System print blocked by sandbox', err);
      }
    }, 200);
  };

  const handleDownloadHtml = () => {
    downloadPrintableHTML(invoice);
  };

  // Generate plain-text client summary
  const generateSummaryText = () => {
    return `
========================================
UNIVISION DESIGN AND CONSTRUCTION LTD.
ARCHITECTURAL SERVICES PACKAGE INVOICE
========================================
Invoice #: ${invoice.invoiceNumber}
Date: ${formatDateToSlash(invoice.date)}
Due Date: ${invoice.dueDate ? formatDateToSlash(invoice.dueDate) : 'On Presentation'}

CLIENT:
${invoice.client.name}
Phone: ${invoice.client.phone}
Email: ${invoice.client.email}
Address: ${invoice.client.address}

PROJECT:
${invoice.project.projectName}
Site: ${invoice.project.projectAddress}, ${invoice.project.cityProvince}

PACKAGE:
Tier: ${invoice.packageType.toUpperCase()} PACKAGE (${invoice.packageRate} ${invoice.currency}/${invoice.unit})
Total Covered Area: ${calculations.totalArea} ${invoice.unit}
Drawing Package Cost: ${formatCurrency(calculations.drawingPackageTotal, invoice.currency)}

FLOOR BREAKDOWN:
${invoice.floors.map((f) => `- ${f.floorName}: ${f.area} ${invoice.unit}`).join('\n')}

FINANCIAL BREAKDOWN:
Grand Total: ${formatCurrency(calculations.grandTotal, invoice.currency)}
Advance Deposit Required (${invoice.depositPercent}%): ${formatCurrency(calculations.depositRequiredAmount, invoice.currency)}
Remaining Balance Due: ${formatCurrency(calculations.balanceDue, invoice.currency)}

PAYMENT DETAILS:
Bank: ${invoice.paymentDetails.bankName}
Account Name: ${invoice.paymentDetails.accountName}
Account #: ${invoice.paymentDetails.accountNumber}
Reference: ${invoice.paymentDetails.reference || invoice.invoiceNumber}
${invoice.paymentDetails.mobileMoneyNumber ? `Mobile Money: ${invoice.paymentDetails.mobileMoneyProvider} (${invoice.paymentDetails.mobileMoneyNumber})` : ''}

Terms: Work commences upon receipt of agreed advance deposit. All drawings provided in PDF format.
========================================
"Your Dream | Our Design | Built Together"
Univision Design & Construction Ltd.
Sukuta-jabang Highway, Sukuta Dalaba | +220 872104724
    `.trim();
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(generateSummaryText());
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // WhatsApp Share Link
  const getWhatsAppUrl = () => {
    const text = encodeURIComponent(
      `Hello ${invoice.client.name},\nHere is your official Architectural Package Invoice ${invoice.invoiceNumber} from UNIVISION DESIGN AND CONSTRUCTION LTD.\n\nProject: ${invoice.project.projectName || 'Architectural Drawings'}\nTotal Area: ${calculations.totalArea} ${invoice.unit}\nTotal: ${formatCurrency(calculations.grandTotal, invoice.currency)}\nAdvance Deposit (${invoice.depositPercent}%): ${formatCurrency(calculations.depositRequiredAmount, invoice.currency)}\n\nBank: ${invoice.paymentDetails.bankName} (Acc: ${invoice.paymentDetails.accountNumber}, Ref: ${invoice.invoiceNumber})\n\nThank you!`
    );
    const phone = invoice.client.phone.replace(/[^0-9]/g, '');
    return phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
  };

  // Mailto link
  const getMailtoUrl = () => {
    const subject = encodeURIComponent(
      `Univision Architectural Services Invoice: ${invoice.invoiceNumber} - ${invoice.project.projectName || invoice.client.name}`
    );
    const body = encodeURIComponent(generateSummaryText());
    return `mailto:${invoice.client.email}?subject=${subject}&body=${body}`;
  };

  // JSON export
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(invoice, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${invoice.invoiceNumber}_Univision_Invoice.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // JSON import
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed && parsed.invoiceNumber && onImportInvoice) {
            onImportInvoice(parsed);
            onClose();
          }
        } catch {
          alert('Invalid invoice JSON format.');
        }
      };
    }
  };

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0b2341] border-b border-blue-500/20">
          <div className="flex items-center gap-2.5">
            <Share2 className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">
              Export & Print Invoice: {invoice.invoiceNumber}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* PRIMARY ACTION: Download Direct PDF */}
          <div className="p-4 bg-gradient-to-r from-blue-950/60 to-slate-950 border border-blue-500/40 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <FileDown className="w-4 h-4 text-amber-400" />
                  Direct PDF Download (.pdf)
                </div>
                <div className="text-xs text-slate-300 mt-0.5">
                  Generates an exact high-res vector A4 document file directly.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="w-full py-2.5 px-4 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:bg-amber-400/50 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>{pdfStatusMessage || 'Generating PDF...'}</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>Download {invoice.invoiceNumber}.pdf</span>
                </>
              )}
            </button>
          </div>

          {/* PRINT PREVIEW ACTION */}
          {onOpenPrintPreview && (
            <div className="p-4 bg-gradient-to-r from-blue-900/40 to-indigo-950/40 border border-blue-500/50 rounded-xl flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  Centered A4 Print Preview
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5">
                  Inspect page margins, scale, and centered document layout before printing.
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenPrintPreview}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Preview & Print
              </button>
            </div>
          )}

          {/* SECONDARY ACTION: Browser Print Dialog */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <Printer className="w-3.5 h-3.5 text-slate-400" />
                Browser Print (Direct Print Dialog)
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Sends full-bleed A4 sheet directly to printer or system PDF printer.
              </div>
            </div>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-all cursor-pointer whitespace-nowrap"
            >
              Print Now
            </button>
          </div>

          {/* STANDALONE PRINTABLE HTML (100% immune to sandbox restrictions) */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <Printer className="w-3.5 h-3.5 text-blue-400" />
                Standalone Printable HTML (.html)
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Opens in any browser outside iframe sandbox and triggers print instantly.
              </div>
            </div>
            <button
              type="button"
              onClick={handleDownloadHtml}
              className="px-3.5 py-1.5 text-xs font-semibold text-blue-300 hover:text-white bg-blue-950/70 hover:bg-blue-900 rounded-lg border border-blue-700/50 transition-all cursor-pointer whitespace-nowrap"
            >
              Get HTML
            </button>
          </div>

          {/* Quick Communication Shares */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* WhatsApp */}
            <a
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-lg flex items-center gap-3 transition-colors group"
            >
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-md group-hover:bg-emerald-500/20">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Send WhatsApp</div>
                <div className="text-[10px] text-slate-400">Direct client message</div>
              </div>
            </a>

            {/* Email Draft */}
            <a
              href={getMailtoUrl()}
              className="p-3 bg-slate-950 border border-slate-800 hover:border-blue-500/50 rounded-lg flex items-center gap-3 transition-colors group"
            >
              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-md group-hover:bg-blue-500/20">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Email Proposal</div>
                <div className="text-[10px] text-slate-400">Prefilled email body</div>
              </div>
            </a>
          </div>

          {/* Clipboard & JSON Backup */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Data Backup & Summary
              </span>
              <button
                type="button"
                onClick={handleCopySummary}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold cursor-pointer"
              >
                {copiedText ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied to Clipboard
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy Text Summary
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleExportJSON}
                className="flex-1 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Export JSON
              </button>

              <label className="flex-1 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 flex items-center justify-center gap-2 transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5" /> Import JSON
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
