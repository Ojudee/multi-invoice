import { FormEvent, useMemo, useState } from 'react';
import { CheckCircle2, Printer, Receipt, X } from 'lucide-react';
import { Invoice, NewPaymentReceipt, PaymentReceipt } from '../types';
import { calculateInvoice, formatCurrency, formatDateToSlash } from '../utils/calculations';
import { printInvoiceElement } from '../utils/printHelper';

interface ReceiptModalProps {
  invoice: Invoice;
  portalName: string;
  onClose: () => void;
  onRecordPayment: (payment: NewPaymentReceipt) => PaymentReceipt | null;
}

const fieldClass = 'w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20';
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:cursor-not-allowed disabled:opacity-50';

function getToday(): string {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

export function ReceiptModal({ invoice, portalName, onClose, onRecordPayment }: ReceiptModalProps) {
  const calculations = calculateInvoice(invoice);
  const payments = useMemo(
    () => [...(invoice.payments || [])].sort((a, b) => b.paymentDate.localeCompare(a.paymentDate)),
    [invoice.payments]
  );
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(getToday);
  const [method, setMethod] = useState('Cash');
  const [reference, setReference] = useState(invoice.invoiceNumber);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(payments[0] || null);
  const [error, setError] = useState('');
  const [printing, setPrinting] = useState(false);

  const paidSoFar = Math.max(0, Number(invoice.depositPaidAmount) || 0);
  const remainingBalance = Math.max(0, calculations.grandTotal - paidSoFar);

  const submitPayment = (event: FormEvent) => {
    event.preventDefault();
    setError('');

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

    setSelectedReceipt(receipt);
    setAmount('');
  };

  const printReceipt = async () => {
    if (!selectedReceipt) return;
    setPrinting(true);
    const printed = await printInvoiceElement('univision-payment-receipt', selectedReceipt.receiptNumber);
    setPrinting(false);
    if (!printed) setError('Unable to prepare the receipt for printing. Try again.');
  };

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
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Close payment receipts">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto p-4 sm:p-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-5">
            <form onSubmit={submitPayment} className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <div>
                <h3 className="font-bold text-white">Record payment</h3>
                <p className="mt-1 text-xs text-slate-400">
                  Remaining balance: <strong className="text-slate-200">{formatCurrency(remainingBalance, invoice.currency)}</strong>
                </p>
              </div>
              {remainingBalance > 0 ? (
                <>
                  <label className="block space-y-1.5 text-xs font-semibold text-slate-300">
                    Amount received ({invoice.currency})
                    <input
                      className={fieldClass}
                      type="number"
                      min="0.01"
                      max={remainingBalance}
                      step="0.01"
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      required
                    />
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
                  <button className={`${buttonClass} w-full`} type="submit">Record payment & create receipt</button>
                </>
              ) : (
                <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">
                  This invoice is fully paid. You can reprint any receipt already recorded below.
                </p>
              )}
              {error && <p role="alert" className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-xs leading-relaxed text-rose-100">{error}</p>}
            </form>

            <section>
              <h3 className="mb-2 text-sm font-bold text-white">Receipt history ({payments.length})</h3>
              {payments.length ? (
                <ul className="space-y-2">
                  {payments.map((payment) => (
                    <li key={payment.id}>
                      <button
                        type="button"
                        onClick={() => { setSelectedReceipt(payment); setError(''); }}
                        className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                          selectedReceipt?.id === payment.id
                            ? 'border-amber-400/60 bg-amber-400/10 text-white'
                            : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">{payment.receiptNumber}</span>
                          <span className="block text-xs text-slate-400">{formatDateToSlash(payment.paymentDate)}</span>
                        </span>
                        <span className="shrink-0 font-semibold">{formatCurrency(payment.amount, payment.currency)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-lg border border-dashed border-slate-700 px-3 py-4 text-sm text-slate-400">No payment receipts have been recorded for this invoice.</p>
              )}
            </section>
          </aside>

          <div className="min-w-0">
            {selectedReceipt ? (
              <>
                <div className="mb-3 flex justify-end">
                  <button type="button" onClick={printReceipt} disabled={printing} className={buttonClass}>
                    {printing ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" /> : <Printer className="h-4 w-4" />}
                    {printing ? 'Preparing…' : 'Print / Save PDF'}
                  </button>
                </div>
                <article id="univision-payment-receipt" className="mx-auto w-full max-w-[760px] bg-white p-7 text-slate-900 shadow-lg sm:p-10">
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
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
                    <span>Payment received and recorded. Keep this receipt with your invoice records.</span>
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
