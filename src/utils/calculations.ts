import { Invoice, CurrencyCode } from '../types';

export interface InvoiceCalculations {
  totalArea: number;
  drawingPackageTotal: number;
  addonsTotal: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  depositRequiredAmount: number;
  balanceDue: number;
}

export function calculateInvoice(invoice: Invoice): InvoiceCalculations {
  // 1. Total Area
  const totalArea = invoice.floors.reduce((sum, floor) => {
    const a = Number(floor.area) || 0;
    return sum + a;
  }, 0);

  // 2. Drawing package / service schedule total
  const drawingPackageTotal = invoice.floors.reduce((sum, floor) => {
    if (typeof floor.amountOverride === 'number') {
      return sum + floor.amountOverride;
    }
    const multiplier = typeof floor.quantity === 'number' ? floor.quantity : (Number(floor.area) || 0);
    const rate = Number(floor.customRate ?? invoice.packageRate) || 0;
    return sum + (multiplier * rate);
  }, 0);

  // 3. Addon services total
  const addonsTotal = (invoice.addons || [])
    .filter(a => a.enabled)
    .reduce((sum, a) => sum + (Number(a.amount) || 0), 0);

  // 4. Subtotal
  const subtotal = drawingPackageTotal + addonsTotal;

  // 5. Discount
  const discountPercent = Math.max(0, Math.min(100, Number(invoice.discountPercent) || 0));
  const discountAmount = (subtotal * discountPercent) / 100;
  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);

  // 6. Tax
  const taxPercent = Math.max(0, Number(invoice.taxPercent) || 0);
  const taxAmount = (subtotalAfterDiscount * taxPercent) / 100;

  // 7. Grand Total
  const grandTotal = Math.round(subtotalAfterDiscount + taxAmount);

  // 8. Deposit required (agreed advance commencement deposit)
  const depositPercent = Math.max(0, Math.min(100, Number(invoice.depositPercent) || 0));
  const depositRequiredAmount = Math.round((grandTotal * depositPercent) / 100);

  // 9. Balance Due
  // In Univision's fee schedule, Balance Due is the remaining amount payable upon project completion/delivery:
  // Grand Total - Advance Deposit Required. (Advance + Balance Due = 100% of Grand Total).
  // If the invoice is marked 'paid' or payment in full is recorded, balance due is 0.
  const depositPaid = Number(invoice.depositPaidAmount) || 0;
  let balanceDue: number;
  if (invoice.status === 'paid' || (depositPaid > 0 && depositPaid >= grandTotal)) {
    balanceDue = 0;
  } else {
    balanceDue = Math.max(0, grandTotal - depositRequiredAmount);
  }

  return {
    totalArea: Number(totalArea.toFixed(2)),
    drawingPackageTotal: Math.round(drawingPackageTotal),
    addonsTotal: Math.round(addonsTotal),
    subtotal: Math.round(subtotal),
    discountAmount: Math.round(discountAmount),
    taxAmount: Math.round(taxAmount),
    grandTotal,
    depositRequiredAmount,
    balanceDue: Math.round(balanceDue),
  };
}

export function formatCurrency(amount: number, currency: CurrencyCode = 'GMD'): string {
  const rounded = Math.round(amount || 0);
  const formattedNumber = new Intl.NumberFormat('en-US').format(rounded);

  switch (currency) {
    case 'GMD':
      return `GMD ${formattedNumber}`;
    case 'USD':
      return `$${formattedNumber}`;
    case 'EUR':
      return `€${formattedNumber}`;
    case 'GBP':
      return `£${formattedNumber}`;
    case 'XOF':
      return `${formattedNumber} CFA`;
    default:
      return `${currency} ${formattedNumber}`;
  }
}

export function formatDateToSlash(dateStr: string): string {
  if (!dateStr) return 'mm/dd/yyyy';
  try {
    // If already mm/dd/yyyy
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  } catch {
    return dateStr;
  }
}
