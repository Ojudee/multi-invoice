import { Invoice } from '../types';
import { downloadPixelPerfectPDF, downloadPrintableHTML, PDFExportOptions } from './pixelPerfectPdf';
import { generateUnivisionPDF } from './vectorPdfGenerator';

export type { PDFExportOptions };
export { downloadPrintableHTML };

/**
 * Robust invoice PDF export engine.
 * First generates a pixel-perfect PDF capturing the paper preview at its exact aspect ratio.
 * Seamlessly falls back to vector jsPDF if DOM capture is unavailable.
 */
export async function downloadInvoicePDF(
  invoice: Invoice,
  options: PDFExportOptions = {}
): Promise<boolean> {
  const { onProgress } = options;

  try {
    onProgress?.('Generating pixel-perfect PDF from paper preview...');
    const success = await downloadPixelPerfectPDF(invoice, options);
    if (success) return true;

    // Fallback if DOM element wasn't accessible
    console.warn('Falling back to vector PDF generation...');
    onProgress?.('Generating fallback vector PDF...');
    return generateUnivisionPDF(invoice);
  } catch (error) {
    console.warn('DOM capture error, using vector PDF fallback:', error);
    try {
      return generateUnivisionPDF(invoice);
    } catch {
      return false;
    }
  }
}
