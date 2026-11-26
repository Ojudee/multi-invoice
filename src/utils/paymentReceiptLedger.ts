import { Invoice, PaymentReceipt } from '../types';
import { calculateInvoice } from './calculations';

export function getPaymentBaselineAmount(invoice: Invoice): number {
  if (Number.isFinite(invoice.paymentBaselineAmount)) {
    return Math.max(0, Number(invoice.paymentBaselineAmount));
  }

  const firstPayment = invoice.payments?.[0];
  if (firstPayment) {
    return Math.max(0, Number(firstPayment.totalPaidAfter) - Number(firstPayment.amount));
  }

  return Math.max(0, Number(invoice.depositPaidAmount) || 0);
}

export function isActivePaymentReceipt(receipt: PaymentReceipt): boolean {
  return receipt.status !== 'voided';
}

export function getInvoicePaidAmount(invoice: Invoice): number {
  return getPaymentBaselineAmount(invoice) +
    (invoice.payments || []).reduce(
      (total, receipt) => total + (isActivePaymentReceipt(receipt) ? Number(receipt.amount) || 0 : 0),
      0
    );
}

export function recalculatePaymentLedger(
  invoice: Invoice,
  payments: PaymentReceipt[],
  baselineAmount = getPaymentBaselineAmount(invoice)
): Pick<Invoice, 'payments' | 'depositPaidAmount' | 'paymentBaselineAmount' | 'status'> {
  const { grandTotal, depositRequiredAmount: requiredDeposit } = calculateInvoice(invoice);
  let runningTotal = Math.max(0, baselineAmount);
  const updatedById = new Map<string, PaymentReceipt>();
  const chronologicalPayments = [...payments].sort((a, b) => a.paymentDate.localeCompare(b.paymentDate));
  chronologicalPayments.forEach((receipt) => {
    if (!isActivePaymentReceipt(receipt)) return;
    runningTotal += Math.max(0, Number(receipt.amount) || 0);
    updatedById.set(receipt.id, {
      ...receipt,
      totalPaidAfter: runningTotal,
      balanceAfter: Math.max(0, grandTotal - runningTotal),
    });
  });
  const normalizedPayments = payments.map((receipt) => updatedById.get(receipt.id) || receipt);

  const paidAmount = runningTotal;
  const balance = Math.max(0, grandTotal - paidAmount);
  const status =
    balance === 0
      ? 'paid'
      : requiredDeposit > 0 && paidAmount >= requiredDeposit
      ? 'deposit_paid'
      : invoice.status === 'overdue'
      ? 'overdue'
      : 'issued';

  return {
    payments: normalizedPayments,
    depositPaidAmount: paidAmount,
    paymentBaselineAmount: Math.max(0, baselineAmount),
    status,
  };
}
