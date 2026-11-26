import { FormEvent, useMemo, useState } from 'react';
import {
  Archive,
  Ban,
  CheckCircle2,
  Pencil,
  Printer,
  Receipt,
  RotateCcw,
  Share2,
  Trash2,
  X,
} from 'lucide-react';
import { Invoice, NewPaymentReceipt, PaymentReceipt } from '../types';
import { calculateInvoice, formatCurrency, formatDateToSlash } from '../utils/calculations';
import {
  getInvoicePaidAmount,
  getPaymentBaselineAmount,
  isActivePaymentReceipt,
} from '../utils/paymentReceiptLedger';
import { createReceiptPdfFile, downloadReceiptPdf } from '../utils/receiptPdf';
import { printInvoiceElement } from '../utils/printHelper';

type ReceiptFilter = 'active' | 'archived' | 'voided' | 'all';

interface ReceiptModalProps {
  invoice: Invoice;
  portalName: string;
  onClose: () => void;
  onRecordPayment: (payment: NewPaymentReceipt) => PaymentReceipt | null;
  onUpdateReceipt: (receipt: PaymentReceipt) => PaymentReceipt | null;
  onArchiveReceipt: (id: string, archived: boolean) => PaymentReceipt | null;
  onVoidReceipt: (id: string, reason: string) => PaymentReceipt | null;
  onDeleteReceipt: (id: string) => boolean;
}

const fieldClass = 'w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20';
const primaryButtonClass = 'inline-flex items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:cursor-not-allowed disabled:opacity-50';
const secondaryButtonClass = 'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:cursor-not-allowed disabled:opacity-50';

function getToday(): string {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function filterReceipts(payments: PaymentReceipt[], filter: ReceiptFilter): PaymentReceipt[] {
  return payments.filter((payment) => {
    if (filter === 'archived') return Boolean(payment.archivedAt);
    if (filter === 'voided') return !isActivePaymentReceipt(payment);
    if (filter === 'active') return isActivePaymentReceipt(payment) && !payment.archivedAt;
    return true;
  });
}

export function ReceiptModal({
  invoice,
  portalName,
  onClose,
  onRecordPayment,
  onUpdateReceipt,
  onArchiveReceipt,
  onVoidReceipt,
  onDeleteReceipt,
}: ReceiptModalProps) {
  const calculations = calculateInvoice(invoice);
  const payments = useMemo(
    () => [...(invoice.payments || [])].sort((a, b) => b.paymentDate.localeCompare(a.paymentDate)),
    [invoice.payments]
  );
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(getToday);
  const [method, setMethod] = useState('Cash');
  const [reference, setReference] = useState(invoice.invoiceNumber);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(
    () => filterReceipts(payments, 'active')[0]?.id || null
  );
  const [filter, setFilter] = useState<ReceiptFilter>('active');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [printing, setPrinting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [confirmingVoid, setConfirmingVoid] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const visiblePayments = useMemo(
    () => filterReceipts(payments, filter).filter((payment) => {
      const query = search.trim().toLowerCase();
      return !query || [
        payment.receiptNumber,
        payment.invoiceNumber,
        payment.reference,
        payment.method,
        payment.clientName,
      ].some((value) => value.toLowerCase().includes(query));
    }),
    [payments, filter, search]
  );
  const selectedReceipt =
    payments.find((payment) => payment.id === selectedReceiptId) ||
    filterReceipts(payments, filter)[0] ||
    null;
  const paidSoFar = getInvoicePaidAmount(invoice);
  const remainingBalance = Math.max(0, calculations.grandTotal - paidSoFar);
  const editMaximum = selectedReceipt && isActivePaymentReceipt(selectedReceipt)
    ? Math.max(
        0,
        calculations.grandTotal -
          getPaymentBaselineAmount(invoice) -
          payments.reduce(
            (total, payment) => total + (
              payment.id !== selectedReceipt.id && isActivePaymentReceipt(payment)
                ? Math.max(0, Number(payment.amount) || 0)
                : 0
            ),
            0
          )
      )
    : 0;

  const clearFeedback = () => {
    setError('');
    setNotice('');
  };

  const selectFilter = (nextFilter: ReceiptFilter) => {
    setFilter(nextFilter);
    const first = filterReceipts(payments, nextFilter)[0];
    setSelectedReceiptId(first?.id || null);
    setEditing(false);
    setConfirmingVoid(false);
    setConfirmingDelete(false);
    clearFeedback();
  };

  const submitPayment = (event: FormEvent) => {
    event.preventDefault();
    clearFeedback();

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Enter an amount greater than zero.');
      return;
    }
    if (numericAmount > remainingBalance) {
      setError(`The payment cannot exceed the remaining balance of ${formatCurrency(remainingBalance, invoice.currency)}.`);
      return;
    }
    if (!paymentDate) {
      setError('Choose the date the payment was received.');
      return;
    }

    const receipt = onRecordPayment({
      amount: numericAmount,
      paymentDate,
      method,
      reference: reference.trim() || invoice.invoiceNumber,
    });
    if (!receipt) {
      setError('The payment could not be recorded. Check the invoice balance and try again.');
      return;
    }

    setSelectedReceiptId(receipt.id);
    setAmount('');
    setNotice(`${receipt.receiptNumber} saved.`);
  };

  const beginEdit = (receipt: PaymentReceipt) => {
    setSelectedReceiptId(receipt.id);
    setAmount(String(receipt.amount));
    setPaymentDate(receipt.paymentDate);
    setMethod(receipt.method);
    setReference(receipt.reference);
    setEditing(true);
    setConfirmingVoid(false);
    setConfirmingDelete(false);
    clearFeedback();
  };

  const cancelEdit = () => {
    setEditing(false);
    setAmount('');
    setPaymentDate(getToday());
    setMethod('Cash');
    setReference(invoice.invoiceNumber);
    clearFeedback();
  };

  const saveEdit = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedReceipt) return;
    clearFeedback();

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0 || numericAmount > editMaximum) {
      setError(`Enter an amount greater than zero and no more than ${formatCurrency(editMaximum, invoice.currency)}.`);
      return;
    }
    if (!paymentDate) {
      setError('Choose the date the payment was received.');
      return;
    }

    const updated = onUpdateReceipt({
      ...selectedReceipt,
      amount: numericAmount,
      paymentDate,
      method: method.trim() || 'Other',
      reference: reference.trim(),
    });
    if (!updated) {
      setError('The receipt could not be saved. Check that the invoice balance remains valid.');
      return;
    }
    setEditing(false);
    setSelectedReceiptId(updated.id);
    setNotice(`${updated.receiptNumber} updated.`);
  };

  const toggleArchive = () => {
    if (!selectedReceipt) return;
    clearFeedback();
    const archived = !selectedReceipt.archivedAt;
    const updated = onArchiveReceipt(selectedReceipt.id, archived);
    if (!updated) {
      setError('The receipt archive could not be updated. Try again.');
      return;
    }
    setSelectedReceiptId(updated.id);
    setFilter(archived ? 'archived' : 'active');
    setEditing(false);
    setNotice(archived ? 'Receipt archived. Its payment remains on the invoice.' : 'Receipt restored to active receipts.');
  };

  const voidSelectedReceipt = () => {
    if (!selectedReceipt) return;
    clearFeedback();
    const updated = onVoidReceipt(selectedReceipt.id, voidReason);
    if (!updated) {
      setError('Enter a reason to void this receipt, then try again.');
      return;
    }
    setSelectedReceiptId(updated.id);
    setFilter('voided');
    setVoidReason('');
    setConfirmingVoid(false);
    setEditing(false);
    setNotice(`${updated.receiptNumber} voided. The paid balance has been adjusted.`);
  };

  const deleteSelectedReceipt = () => {
    if (!selectedReceipt) return;
    clearFeedback();
    const removedId = selectedReceipt.id;
    if (!onDeleteReceipt(removedId)) {
      setError('The receipt could not be deleted. It may already have been removed.');
      return;
    }
    const next = payments.find((payment) => payment.id !== removedId && filterReceipts(payments, filter).some((item) => item.id === payment.id));
    setSelectedReceiptId(next?.id || null);
    setEditing(false);
    setConfirmingDelete(false);
    setNotice('Receipt permanently deleted.');
  };

  const printReceipt = async () => {
    if (!selectedReceipt) return;
    clearFeedback();
    setPrinting(true);
    try {
      const printed = await printInvoiceElement('univision-payment-receipt', selectedReceipt.receiptNumber);
      if (!printed) setError('Unable to prepare the receipt for printing. Try again.');
    } finally {
      setPrinting(false);
    }
  };

  const shareReceipt = async () => {
    if (!selectedReceipt) return;
    clearFeedback();
    const element = document.getElementById('univision-payment-receipt');
    if (!element) {
      setError('The receipt preview is unavailable. Reopen the receipt and try again.');
      return;
    }

    setSharing(true);
    try {
      const file = await createReceiptPdfFile(element, selectedReceipt.receiptNumber);
      const shareData: ShareData = {
        files: [file],
        title: `Receipt ${selectedReceipt.receiptNumber}`,
        text: `${selectedReceipt.clientName || 'Client'} · ${formatCurrency(selectedReceipt.amount, selectedReceipt.currency)}`,
      };
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share(shareData);
        setNotice('Receipt shared.');
      } else {
        downloadReceiptPdf(file);
        setNotice('Receipt PDF downloaded. Attach the file to your message to share it.');
      }
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === 'AbortError') return;
      console.error('Unable to share payment receipt', shareError);
      setError('Unable to prepare the receipt PDF. Try downloading it or printing the receipt.');
    } finally {
      setSharing(false);
    }
  };

  const receiptCount = (value: ReceiptFilter) => filterReceipts(payments, value).length;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="receipt-modal-title">
      <section className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        <header className="flex items-center justify-between gap-4 border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-400/10 p-2 text-amber-300"><Receipt className="h-5 w-5" /></div>
            <div>
              <h2 id="receipt-modal-title" className="text-lg font-bold text-white">Payment receipts</h2>
              <p className="text-xs text-slate-400">{portalName} · {invoice.invoiceNumber}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-amber-400" aria-label="Close payment receipts">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto p-4 sm:p-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-5">
            <form onSubmit={editing ? saveEdit : submitPayment} className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <div>
                <h3 className="font-bold text-white">{editing ? 'Edit payment' : 'Record payment'}</h3>
                <p className="mt-1 text-xs text-slate-400">
                  {editing
                    ? <>Maximum valid amount: <strong className="text-slate-200">{formatCurrency(editMaximum, invoice.currency)}</strong></>
                    : <>Remaining balance: <strong className="text-slate-200">{formatCurrency(remainingBalance, invoice.currency)}</strong></>}
                </p>
              </div>
              {editing || remainingBalance > 0 ? (
                <>
                  <label className="block space-y-1.5 text-xs font-semibold text-slate-300">
                    Amount received ({invoice.currency})
                    <input className={fieldClass} type="number" min="0.01" max={editing ? editMaximum : remainingBalance} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required />
                  </label>
                  <label className="block space-y-1.5 text-xs font-semibold text-slate-300">
                    Date received
                    <input className={fieldClass} type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} required />
                  </label>
                  <label className="block space-y-1.5 text-xs font-semibold text-slate-300">
                    Payment method
                    <select className={fieldClass} value={method} onChange={(event) => setMethod(event.target.value)}>
                      <option>Cash</option>
                      <option>Bank transfer</option>
                      <option>Mobile money</option>
                      <option>Cheque</option>
                      <option>Card</option>
                      <option>Other</option>
                    </select>
                  </label>
                  <label className="block space-y-1.5 text-xs font-semibold text-slate-300">
                    Transaction reference
                    <input className={fieldClass} value={reference} onChange={(event) => setReference(event.target.value)} />
                  </label>
                  <div className="flex gap-2">
                    <button className={`${primaryButtonClass} flex-1`} type="submit">{editing ? 'Save changes' : 'Save payment & create receipt'}</button>
                    <button className={secondaryButtonClass} type="button" onClick={cancelEdit}>Cancel</button>
                  </div>
                </>
              ) : (
                <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">
                  This invoice is fully paid. Select a receipt to manage, print, or share it.
                </p>
              )}
              {error && <p role="alert" className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-xs leading-relaxed text-rose-100">{error}</p>}
              {notice && <p role="status" aria-live="polite" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs leading-relaxed text-emerald-100">{notice}</p>}
            </form>

            <section aria-labelledby="receipt-history-title">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 id="receipt-history-title" className="text-sm font-bold text-white">Receipt history ({payments.length})</h3>
                <label className="sr-only" htmlFor="receipt-filter">Filter receipts</label>
                <select id="receipt-filter" className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400" value={filter} onChange={(event) => selectFilter(event.target.value as ReceiptFilter)}>
                  <option value="active">Active ({receiptCount('active')})</option>
                  <option value="archived">Archived ({receiptCount('archived')})</option>
                  <option value="voided">Voided ({receiptCount('voided')})</option>
                  <option value="all">All receipts ({receiptCount('all')})</option>
                </select>
              </div>
              {payments.length > 0 && (
                <label className="mb-2 block">
                  <span className="sr-only">Search receipts</span>
                  <input className={fieldClass} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search number, method or reference" />
                </label>
              )}
              {visiblePayments.length ? (
                <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  {visiblePayments.map((payment) => (
                    <li key={payment.id}>
                      <button
                        type="button"
                        onClick={() => { setSelectedReceiptId(payment.id); setEditing(false); setConfirmingVoid(false); setConfirmingDelete(false); clearFeedback(); }}
                        aria-pressed={selectedReceipt?.id === payment.id}
                        className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                          selectedReceipt?.id === payment.id
                            ? 'border-amber-400/60 bg-amber-400/10 text-white'
                            : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">{payment.receiptNumber}</span>
                          <span className="block text-xs text-slate-400">{formatDateToSlash(payment.paymentDate)} · {payment.method}</span>
                          <span className="mt-1 inline-flex rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                            {!isActivePaymentReceipt(payment) ? 'Voided' : payment.archivedAt ? 'Archived' : 'Active'}
                          </span>
                        </span>
                        <span className="shrink-0 font-semibold">{formatCurrency(payment.amount, payment.currency)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-lg border border-dashed border-slate-700 px-3 py-4 text-sm text-slate-400">
                  {search ? 'No receipts match your search.' : filter === 'active' && payments.length === 0
                    ? 'No payment receipts have been recorded for this invoice.'
                    : `No ${filter} receipts for this invoice.`}
                </p>
              )}
            </section>
          </aside>

          <div className="min-w-0">
            {selectedReceipt ? (
              <>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-2">
                    {isActivePaymentReceipt(selectedReceipt) && (
                      <button type="button" onClick={() => beginEdit(selectedReceipt)} disabled={editing} className={secondaryButtonClass} aria-label={`Edit ${selectedReceipt.receiptNumber}`}>
                        <Pencil className="h-4 w-4" />Edit
                      </button>
                    )}
                    <button type="button" onClick={toggleArchive} className={secondaryButtonClass}>
                      {selectedReceipt.archivedAt ? <RotateCcw className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                      {selectedReceipt.archivedAt ? 'Restore' : 'Archive'}
                    </button>
                    {isActivePaymentReceipt(selectedReceipt) && (
                      <button type="button" onClick={() => { setConfirmingVoid(true); setConfirmingDelete(false); setVoidReason(''); clearFeedback(); }} className={secondaryButtonClass}>
                        <Ban className="h-4 w-4" />Cancel / void
                      </button>
                    )}
                    <button type="button" onClick={() => { setConfirmingDelete(true); setConfirmingVoid(false); clearFeedback(); }} className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-500/40 bg-rose-950/50 px-3 py-2 text-sm font-semibold text-rose-100 hover:bg-rose-900/70 focus:outline-none focus:ring-2 focus:ring-rose-400">
                      <Trash2 className="h-4 w-4" />Delete permanently
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={shareReceipt} disabled={sharing} className={secondaryButtonClass}>
                      {sharing ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-transparent" /> : <Share2 className="h-4 w-4" />}
                      {sharing ? 'Preparing…' : 'Share PDF'}
                    </button>
                    <button type="button" onClick={printReceipt} disabled={printing} className={primaryButtonClass}>
                      {printing ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" /> : <Printer className="h-4 w-4" />}
                      {printing ? 'Preparing…' : 'Print / Save PDF'}
                    </button>
                  </div>
                </div>

                {confirmingVoid && (
                  <div className="mb-3 space-y-3 rounded-lg border border-amber-500/40 bg-amber-950/30 p-4">
                    <p className="text-sm font-semibold text-amber-100">Canceling this payment voids its receipt and reverses the amount from the invoice balance. The receipt and reason remain in the audit history.</p>
                    <label className="block space-y-1.5 text-xs font-semibold text-amber-100">
                      Reason for voiding
                      <textarea className={fieldClass} rows={2} value={voidReason} onChange={(event) => setVoidReason(event.target.value)} placeholder="Explain why this receipt is being voided" />
                    </label>
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setConfirmingVoid(false)} className={secondaryButtonClass}>Cancel</button>
                      <button type="button" onClick={voidSelectedReceipt} disabled={!voidReason.trim()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50">Confirm cancellation</button>
                    </div>
                  </div>
                )}
                {confirmingDelete && (
                  <div className="mb-3 space-y-3 rounded-lg border border-rose-500/40 bg-rose-950/40 p-4">
                    <p className="text-sm font-semibold text-rose-100">Permanently delete {selectedReceipt.receiptNumber}? This cannot be undone. If it is an active receipt, the invoice paid balance will be reduced.</p>
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setConfirmingDelete(false)} className={secondaryButtonClass}>Cancel</button>
                      <button type="button" onClick={deleteSelectedReceipt} className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-500">Delete receipt</button>
                    </div>
                  </div>
                )}

                <article id="univision-payment-receipt" className="mx-auto w-full max-w-[760px] bg-white p-7 text-slate-900 shadow-lg sm:p-10">
                  {!isActivePaymentReceipt(selectedReceipt) && (
                    <div className="mb-5 border-2 border-rose-700 px-4 py-3 text-center text-lg font-black uppercase tracking-widest text-rose-800">
                      Voided receipt
                    </div>
                  )}
                  <div className="flex flex-col justify-between gap-5 border-b-2 border-slate-900 pb-5 sm:flex-row">
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-wide">{selectedReceipt.company.name}</h3>
                      <p className="mt-1 text-sm font-semibold text-slate-700">{selectedReceipt.company.tagline}</p>
                      <p className="mt-3 text-xs leading-relaxed text-slate-600">
                        {selectedReceipt.company.address}<br />
                        {selectedReceipt.company.phone}{selectedReceipt.company.email ? ` · ${selectedReceipt.company.email}` : ''}
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{portalName} · Payment received</p>
                      <h4 className="mt-1 text-2xl font-black">RECEIPT</h4>
                      <p className="mt-2 text-sm font-bold">{selectedReceipt.receiptNumber}</p>
                      <p className="text-sm text-slate-600">{formatDateToSlash(selectedReceipt.paymentDate)}</p>
                    </div>
                  </div>

                  <div className="grid gap-4 py-6 sm:grid-cols-2">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Received from</p>
                      <p className="mt-1 text-base font-bold">{selectedReceipt.clientName || 'Client name not provided'}</p>
                      {selectedReceipt.clientPhone && <p className="text-sm text-slate-600">{selectedReceipt.clientPhone}</p>}
                      {selectedReceipt.clientEmail && <p className="text-sm text-slate-600">{selectedReceipt.clientEmail}</p>}
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Invoice / project</p>
                      <p className="mt-1 text-base font-bold">{selectedReceipt.invoiceNumber}</p>
                      <p className="text-sm text-slate-600">{selectedReceipt.projectName || portalName}</p>
                    </div>
                  </div>

                  <div className="overflow-hidden border border-slate-300">
                    <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-slate-300 bg-slate-100 px-4 py-3 text-xs font-bold uppercase tracking-wide">
                      <span>Payment details</span><span>Amount</span>
                    </div>
                    <div className="grid grid-cols-[1fr_auto] gap-3 px-4 py-4 text-sm">
                      <span>{selectedReceipt.method}{selectedReceipt.reference ? ` · Ref: ${selectedReceipt.reference}` : ''}</span>
                      <strong>{formatCurrency(selectedReceipt.amount, selectedReceipt.currency)}</strong>
                    </div>
                  </div>

                  <div className="ml-auto mt-5 w-full max-w-sm space-y-2 text-sm">
                    <div className="flex justify-between gap-4 text-slate-600"><span>Invoice total</span><span>{formatCurrency(selectedReceipt.invoiceTotal, selectedReceipt.currency)}</span></div>
                    <div className="flex justify-between gap-4 text-slate-600"><span>Total received after this payment</span><span>{formatCurrency(selectedReceipt.totalPaidAfter, selectedReceipt.currency)}</span></div>
                    <div className="flex justify-between gap-4 border-t border-slate-300 pt-2 text-base font-black"><span>Balance remaining</span><span>{formatCurrency(selectedReceipt.balanceAfter, selectedReceipt.currency)}</span></div>
                  </div>

                  <div className="mt-8 flex items-center gap-2 border-t border-slate-200 pt-4 text-xs text-slate-500">
                    {isActivePaymentReceipt(selectedReceipt)
                      ? <><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" /><span>Payment received and recorded. Keep this receipt with your invoice records.</span></>
                      : <><Ban className="h-4 w-4 shrink-0 text-rose-700" /><span>This receipt has been voided and is not proof of an active payment. Reason: {selectedReceipt.voidReason || 'Not provided'}.</span></>}
                  </div>
                  <div className="mt-9 grid grid-cols-2 gap-10 text-center text-xs text-slate-500">
                    <div className="border-t border-slate-400 pt-2">Received by</div>
                    <div className="border-t border-slate-400 pt-2">Client acknowledgment</div>
                  </div>
                </article>
              </>
            ) : (
              <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
                Record a payment to create a printable receipt, or select a receipt from the history.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
