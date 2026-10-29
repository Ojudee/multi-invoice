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
 * then embeds it into a PDF page with the same aspect ratio.
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

    onProgress?.('Compiling preview-matched PDF document...');

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

    const pageWidthMm = 210;
    const pageHeightMm = pageWidthMm * imgAspectRatio;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [pageWidthMm, pageHeightMm],
      compress: true,
    });

    pdf.addImage(
      dataUrl,
      'PNG',
      0,
      0,
      pageWidthMm,
      pageHeightMm,
      undefined,
      'FAST'
    );

    onProgress?.('Saving the preview-matched PDF to your device...');
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
export async function downloadPrintableHTML(invoice: Invoice): Promise<boolean> {
  const targetElement =
    document.getElementById('univision-invoice-preview-sheet') ||
    document.getElementById('univision-invoice-sheet') ||
    document.getElementById('univision-invoice-render-target');
  if (!targetElement) {
    console.error('Invoice preview render target not found.');
    return false;
  }

  try {
    await new Promise((resolve) => setTimeout(resolve, 60));
    const invoiceImage = await toPng(targetElement, {
      quality: 1,
      pixelRatio: 3,
      backgroundColor: '#ffffff',
      cacheBust: true,
      filter: (node) => {
        const el = node as HTMLElement;
        return !el.classList?.contains('no-print');
      },
    });

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Univision Invoice - ${invoice.invoiceNumber}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    html, body { width: 100%; height: 100%; margin: 0; padding: 0; background: #fff; }
    body { display: flex; align-items: center; justify-content: center; overflow: hidden; }
    img { display: block; width: auto; height: auto; max-width: 100vw; max-height: 100vh; object-fit: contain; }
    @media print {
      html, body { width: 100%; height: 100%; }
      img { max-width: 100%; max-height: 100%; }
      @page { size: auto; margin: 0; }
    }
  </style>
</head>
<body>
  <img alt="Univision invoice preview" src="${invoiceImage}">
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() { window.print(); }, 500);
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
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch (err) {
    console.error('Error generating printable HTML:', err);
    return false;
  }
}
