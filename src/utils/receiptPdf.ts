import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

export async function createReceiptPdfFile(element: HTMLElement, receiptNumber: string): Promise<File> {
  const imageData = await toPng(element, {
    backgroundColor: '#ffffff',
    cacheBust: true,
    pixelRatio: 2,
  });
  const image = new Image();
  image.src = imageData;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Could not render the receipt image.'));
  });

  const pageWidth = 210;
  const pageHeight = pageWidth * (image.naturalHeight / image.naturalWidth);
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [pageWidth, pageHeight],
    compress: true,
  });
  pdf.addImage(imageData, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');

  const safeNumber = receiptNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
  return new File([pdf.output('blob')], `${safeNumber}.pdf`, { type: 'application/pdf' });
}

export function downloadReceiptPdf(file: File): void {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
