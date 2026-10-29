import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { Invoice } from '../types';
import { calculateInvoice, formatCurrency, formatDateToSlash } from './calculations';

export interface PDFExportOptions {
  filename?: string;
  onProgress?: (message: string) => void;
}

/**
 * Pixel-perfect PDF generator.
 * Uses browser-native foreignObject rendering via html-to-image to capture
 * the EXACT on-screen paper preview with 100% visual fidelity,
 * then embeds it into an A4 PDF via jsPDF.
 */
export async function downloadPixelPerfectPDF(
  invoice: Invoice,
  options: PDFExportOptions = {}
): Promise<boolean> {
  const { onProgress } = options;
  const filename = options.filename || `${invoice.invoiceNumber}_Univision_Invoice.pdf`;

  // Locate the invoice sheet element
  let targetElement =
    document.getElementById('univision-invoice-preview-sheet') ||
    document.getElementById('univision-invoice-sheet') ||
    document.getElementById('univision-invoice-render-target');

  if (!targetElement) {
    console.error('Invoice sheet render target not found.');
    return false;
  }

  try {
    onProgress?.('Capturing exact paper preview layout...');

    // Wait 50ms to ensure fonts and styles are settled
    await new Promise((r) => setTimeout(r, 60));

    let dataUrl: string;
    try {
      dataUrl = await toPng(targetElement, {
        quality: 1.0,
        pixelRatio: 2.2, // Retina resolution for crisp text, lines & logos
        backgroundColor: '#ffffff',
        cacheBust: true,
        filter: (node) => {
          const el = node as HTMLElement;
          if (el.classList && el.classList.contains('no-print')) {
            return false;
          }
          return true;
        },
      });
    } catch (fontErr) {
      console.warn('Initial capture with web fonts failed, retrying with fallback...', fontErr);
      dataUrl = await toPng(targetElement, {
        quality: 1.0,
        pixelRatio: 2.0,
        backgroundColor: '#ffffff',
        skipFonts: true,
        filter: (node) => {
          const el = node as HTMLElement;
          if (el.classList && el.classList.contains('no-print')) {
            return false;
          }
          return true;
        },
      });
    }

    onProgress?.('Compiling A4 PDF document...');

    // Load image dimensions to maintain exact aspect ratio
    const img = new Image();
    img.src = dataUrl;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    const imgWidthPx = img.naturalWidth || img.width;
    const imgHeightPx = img.naturalHeight || img.height;
    const imgAspectRatio = imgHeightPx / imgWidthPx;

    // Standard A4 dimensions: 210mm wide x 297mm tall
    const pageWidthMm = 210;
    const pageHeightMm = 297;
    const marginMm = 8; // 8mm margin
    const maxUsableWidthMm = pageWidthMm - marginMm * 2; // 194mm
    const maxUsableHeightMm = pageHeightMm - marginMm * 2; // 281mm

    // Calculate proportional dimensions to fit the printable area
    let finalWidthMm = maxUsableWidthMm;
    let finalHeightMm = finalWidthMm * imgAspectRatio;

    if (finalHeightMm > maxUsableHeightMm) {
      finalHeightMm = maxUsableHeightMm;
      finalWidthMm = finalHeightMm / imgAspectRatio;
    }

    // PERFECT HORIZONTAL & VERTICAL CENTERING ON THE A4 SHEET
    const xOffset = (pageWidthMm - finalWidthMm) / 2;
    const yOffset = (pageHeightMm - finalHeightMm) / 2;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    pdf.addImage(
      dataUrl,
      'PNG',
      xOffset,
      yOffset,
      finalWidthMm,
      finalHeightMm,
      undefined,
      'FAST'
    );

    onProgress?.('Saving centered A4 PDF to your device...');
    pdf.save(filename);
    return true;
  } catch (error) {
    console.error('Error generating pixel-perfect PDF:', error);
    return false;
  }
}

/**
 * Generates and downloads a complete, standalone, self-contained HTML invoice.
 * When opened in any browser (Chrome, Edge, Safari, Firefox), it automatically
 * invokes the native browser print dialog, allowing users to print directly
 * to their printer or save via system PDF without iframe sandbox limits!
 */
export function downloadPrintableHTML(invoice: Invoice): boolean {
  const targetElement =
    document.getElementById('univision-invoice-preview-sheet') ||
    document.getElementById('univision-invoice-sheet') ||
    document.getElementById('univision-invoice-render-target');
  if (!targetElement) return false;

  try {
    const invoiceHtml = targetElement.outerHTML;
    const sourceWidth = targetElement.offsetWidth || 800;
    const sourceHeight = targetElement.offsetHeight || targetElement.scrollHeight;
    const printableWidthPx = (194 * 96) / 25.4;
    const printableHeightPx = (281 * 96) / 25.4;
    const scaledHeight = sourceHeight * (printableWidthPx / sourceWidth);
    const fitScale = Math.min(1, printableHeightPx / scaledHeight);

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Univision Invoice - ${invoice.invoiceNumber}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Caveat:wght@600&family=Playfair+Display:ital,wght@1,500;1,700&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @media print {
      body { background: white !important; padding: 0 !important; margin: 0 !important; }
      .no-print { display: none !important; }
      .print-page { width: 194mm; height: 281mm; display: flex; align-items: center; justify-content: center; overflow: hidden; margin: 0 auto; }
      .print-page .invoice-paper-sheet { box-shadow: none !important; border: none !important; margin: 0 !important; padding: 24px !important; max-width: 194mm !important; width: 194mm !important; box-sizing: border-box !important; transform: scale(${fitScale}) !important; transform-origin: center center !important; }
      @page { size: A4 portrait; margin: 8mm; }
    }
    .font-signature { font-family: 'Caveat', cursive; }
    .font-slogan { font-family: 'Playfair Display', serif; }
  </style>
</head>
<body class="bg-slate-100 p-4 md:p-8 flex flex-col items-center">
  <div class="no-print mb-6 p-4 bg-white rounded-lg shadow-md border border-slate-300 w-full max-w-[850px] flex items-center justify-between">
    <div>
      <h1 class="font-bold text-slate-900 text-sm">Univision Architectural Invoice: ${invoice.invoiceNumber}</h1>
      <p class="text-xs text-slate-500">Standalone Print Document (Opens without iframe restrictions)</p>
    </div>
    <button onclick="window.print()" style="background:#0b2341;color:#f59e0b;padding:8px 16px;border-radius:6px;font-weight:bold;font-size:12px;cursor:pointer;">
      Print / Save PDF Now
    </button>
  </div>

  <div class="w-full max-w-[850px] print-page">
    ${invoiceHtml}
  </div>

  <script>
    // Auto-trigger print when opened outside sandbox
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 500);
    });
  </script>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${invoice.invoiceNumber}_Univision_Printable.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('Error generating printable HTML:', err);
    return false;
  }
}
