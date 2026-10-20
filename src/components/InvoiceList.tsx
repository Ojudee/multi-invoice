import React, { useState } from 'react';
import {
  Search,
  Plus,
  Copy,
  Trash2,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  ChevronRight,
  TrendingUp,
  Archive,
  RotateCcw,
  AlertTriangle,
  FolderOpen,
  Sparkles,
} from 'lucide-react';
import { Invoice, InvoiceStatus } from '../types';
import { calculateInvoice, formatCurrency, formatDateToSlash } from '../utils/calculations';

interface InvoiceListProps {
  invoices: Invoice[];
  archivedInvoices: Invoice[];
  activeInvoiceId: string;
  onSelectInvoice: (id: string) => void;
  onCreateNewInvoice: () => void;
  onDuplicateInvoice: (id: string) => void;
  onDeleteInvoice: (id: string) => void;
  onArchiveInvoice: (id: string) => void;
  onArchiveAll: () => void;
  onDeleteAll: () => void;
  onRestoreInvoice: (id: string) => void;
  onRestoreAll: () => void;
  onPermanentDeleteArchived: (id: string) => void;
  onEmptyArchive: () => void;
  onRestoreSampleInvoices?: () => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  archivedInvoices = [],
  activeInvoiceId,
  onSelectInvoice,
  onCreateNewInvoice,
  onDuplicateInvoice,
  onDeleteInvoice,
  onArchiveInvoice,
  onArchiveAll,
  onDeleteAll,
  onRestoreInvoice,
  onRestoreAll,
  onPermanentDeleteArchived,
  onEmptyArchive,
  onRestoreSampleInvoices,
}) => {
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | InvoiceStatus>('all');
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [isArchiveAllModalOpen, setIsArchiveAllModalOpen] = useState(false);
  const [isEmptyArchiveModalOpen, setIsEmptyArchiveModalOpen] = useState(false);

  // Filtered active invoices
  const filteredActiveInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.project.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.project.projectAddress.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered archived invoices
  const filteredArchivedInvoices = archivedInvoices.filter((inv) => {
    return (
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.project.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.project.projectAddress.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Aggregate stats
  const totalInvoiced = invoices.reduce(
    (sum, inv) => sum + calculateInvoice(inv).grandTotal,
    0
  );
  const totalDeposits = invoices.reduce(
    (sum, inv) => sum + (Number(inv.depositPaidAmount) || 0),
    0
  );
  const pendingBalance = totalInvoiced - totalDeposits;

  const totalArchivedAmount = archivedInvoices.reduce(
    (sum, inv) => sum + calculateInvoice(inv).grandTotal,
    0
  );

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> Paid Full
          </span>
        );
      case 'deposit_paid':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <Clock className="w-3 h-3" /> Deposit Paid
          </span>
        );
      case 'issued':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" /> Issued
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/30">
            <AlertCircle className="w-3 h-3" /> Overdue
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-semibold bg-slate-700/50 text-slate-400 border border-slate-600">
            Draft
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col text-slate-100 shadow-xl">
      {/* Directory Mode Switcher (Active Directory vs Archive Vault) */}
      <div className="flex items-center justify-between bg-slate-950 px-4 py-3 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'active'
                ? 'bg-[#0b2341] text-amber-400 border border-blue-500/50 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FolderOpen className="w-4 h-4 text-amber-400" />
            <span>Active Directory</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400/20 text-amber-300 font-mono">
              {invoices.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('archived')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'archived'
                ? 'bg-purple-950/80 text-purple-300 border border-purple-500/50 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Archive className="w-4 h-4 text-purple-400" />
            <span>Archived Invoices</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-500/20 text-purple-300 font-mono">
              {archivedInvoices.length}
            </span>
          </button>
        </div>

        {/* Global Bulk Actions */}
        <div className="flex items-center gap-2">
          {activeTab === 'active' && invoices.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setIsArchiveAllModalOpen(true)}
                className="px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                title="Archive all active invoices (can be restored anytime)"
              >
                <Archive className="w-3.5 h-3.5 text-purple-400" />
                <span>Archive All</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDeleteAllModalOpen(true)}
                className="px-2.5 py-1 text-xs font-semibold bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                title="Delete everything in active directory"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Delete Everything</span>
              </button>
            </>
          )}

          {activeTab === 'archived' && archivedInvoices.length > 0 && (
            <>
              <button
                type="button"
                onClick={onRestoreAll}
                className="px-3 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                title="Restore all archived invoices back to active directory"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore All to Directory</span>
              </button>

              <button
                type="button"
                onClick={() => setIsEmptyArchiveModalOpen(true)}
                className="px-2.5 py-1 text-xs font-semibold bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                title="Permanently empty the archive"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Empty Archive</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Top Banner Stats for Active Directory */}
      {activeTab === 'active' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-slate-800 border-b border-slate-800">
          <div className="bg-slate-900/90 p-4">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Total Active Billings
            </div>
            <div className="font-mono text-lg font-bold text-white mt-1 tabular-nums">
              {formatCurrency(totalInvoiced, 'GMD')}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">{invoices.length} Active Invoices</div>
          </div>

          <div className="bg-slate-900/90 p-4">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Advance Deposits Collected
            </div>
            <div className="font-mono text-lg font-bold text-amber-400 mt-1 tabular-nums">
              {formatCurrency(totalDeposits, 'GMD')}
            </div>
            <div className="text-[10px] text-emerald-400 mt-0.5">Work authorized & started</div>
          </div>

          <div className="bg-slate-900/90 p-4">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Outstanding on Delivery
            </div>
            <div className="font-mono text-lg font-bold text-blue-400 mt-1 tabular-nums">
              {formatCurrency(pendingBalance, 'GMD')}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Payable upon final drawing approval</div>
          </div>
        </div>
      )}

      {/* Top Banner Stats for Archive Vault */}
      {activeTab === 'archived' && (
        <div className="p-4 bg-purple-950/20 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-900/40 border border-purple-500/30 rounded-lg text-purple-300">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Archived Invoices Vault</h4>
              <p className="text-xs text-slate-400">
                Invoices archived here are safely preserved and can be restored back to the directory anytime with 1-click.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Archived Volume:</span>
              <span className="font-mono font-bold text-purple-300 text-sm">
                {formatCurrency(totalArchivedAmount, 'GMD')} ({archivedInvoices.length} items)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Control Bar: Search, Filters, Create Invoice */}
      <div className="p-4 border-b border-slate-800 bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'active'
                ? "Search active invoices by #, client, project..."
                : "Search archived invoices..."
            }
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
          />
        </div>

        {/* Status Filter Buttons (Active Directory Only) */}
        {activeTab === 'active' && (
          <div className="flex items-center gap-1 overflow-x-auto text-xs">
            {(['all', 'draft', 'issued', 'deposit_paid', 'paid'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors whitespace-nowrap capitalize cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#0b2341] text-amber-400 border border-blue-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {st === 'deposit_paid' ? 'Deposit' : st}
              </button>
            ))}
          </div>
        )}

        {/* Create Invoice Button */}
        {activeTab === 'active' && (
          <button
            type="button"
            onClick={onCreateNewInvoice}
            className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Invoice</span>
          </button>
        )}
      </div>

      {/* ================= ACTIVE INVOICES LIST ================= */}
      {activeTab === 'active' && (
        <div className="divide-y divide-slate-800 max-h-[550px] overflow-y-auto">
          {invoices.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-amber-400">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Active Directory is Empty</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  You have deleted or archived all active invoices. You can create a new invoice, restore from archive, or reset sample invoices below.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onCreateNewInvoice}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Invoice</span>
                </button>

                {archivedInvoices.length > 0 && (
                  <button
                    type="button"
                    onClick={onRestoreAll}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Restore {archivedInvoices.length} Invoices from Archive</span>
                  </button>
                )}

                {onRestoreSampleInvoices && (
                  <button
                    type="button"
                    onClick={onRestoreSampleInvoices}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Load Univision Templates</span>
                  </button>
                )}
              </div>
            </div>
          ) : filteredActiveInvoices.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <FileText className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-medium">No invoices match your query.</p>
              <p className="text-xs text-slate-500 mt-1">
                Adjust your search query or status filter.
              </p>
            </div>
          ) : (
            filteredActiveInvoices.map((inv) => {
              const calcs = calculateInvoice(inv);
              const isSelected = inv.id === activeInvoiceId;
              const isBOQ = inv.invoiceCategory === 'boq' || inv.invoiceNumber.includes('BOQ');
              const isInspection = inv.invoiceCategory === 'inspection' || inv.invoiceNumber.includes('INS');
              const isStructural = inv.invoiceCategory === 'structural' || inv.invoiceNumber.includes('STR');
              const isMultiPkg = inv.invoiceCategory === 'multi_package' || inv.invoiceNumber.includes('PKG');

              const totalQty = inv.floors.reduce(
                (sum, f) => sum + (typeof f.quantity === 'number' ? f.quantity : (Number(f.area) || 1)),
                0
              );

              return (
                <div
                  key={inv.id}
                  onClick={() => onSelectInvoice(inv.id)}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-950/20 border-l-4 border-l-amber-400'
                      : 'hover:bg-slate-800/50'
                  }`}
                >
                  {/* Left info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono font-bold text-sm text-white">
                        {inv.invoiceNumber}
                      </span>
                      {getStatusBadge(inv.status)}
                      {isBOQ ? (
                        <span className="text-[11px] font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                          📊 BOQ Studio • Fixed Range
                        </span>
                      ) : isInspection ? (
                        <span className="text-[11px] font-semibold uppercase px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/40">
                          🔍 Inspection Studio • Fixed Fee
                        </span>
                      ) : isStructural ? (
                        <span className="text-[11px] font-semibold uppercase px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-500/40">
                          🏗️ Structural • {inv.packageRate} {inv.currency}/{inv.unit}
                        </span>
                      ) : isMultiPkg ? (
                        <span className="text-[11px] font-semibold uppercase px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-500/40">
                          📦 Multi-Package Studio
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-500/40">
                          🏛️ Arch • {inv.packageRate} {inv.currency}/{inv.unit}
                        </span>
                      )}
                    </div>

                    <div className="text-sm font-semibold text-slate-200 mt-1 truncate">
                      {inv.client.name || 'Unnamed Client'}
                      {inv.project.projectName && (
                        <span className="text-slate-400 font-normal ml-2">
                          · {inv.project.projectName}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-400 flex items-center gap-3 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {formatDateToSlash(inv.date)}
                      </span>
                      <span>·</span>
                      <span>
                        {isBOQ
                          ? `${totalQty} ${totalQty === 1 ? 'Set' : 'Sets'} (Fixed Range)`
                          : isInspection
                          ? `${totalQty} ${totalQty === 1 ? 'Visit' : 'Visits'} (Fixed Fee)`
                          : `${calcs.totalArea} ${inv.unit} (${inv.floors.length} levels)`}
                      </span>
                      {inv.project.cityProvince && (
                        <>
                          <span>·</span>
                          <span>{inv.project.cityProvince}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right financial & actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <div className="text-right">
                      <div className="font-mono font-black text-base text-amber-400 tabular-nums">
                        {formatCurrency(calcs.grandTotal, inv.currency)}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Dep: {formatCurrency(calcs.depositRequiredAmount, inv.currency)}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => onArchiveInvoice(inv.id)}
                        className="p-1.5 text-slate-400 hover:text-purple-300 hover:bg-slate-700/80 rounded transition-colors cursor-pointer"
                        title="Archive this invoice (safe storage, can restore anytime)"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDuplicateInvoice(inv.id)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors cursor-pointer"
                        title="Duplicate this invoice"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteInvoice(inv.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700 rounded transition-colors cursor-pointer"
                        title="Delete invoice"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectInvoice(inv.id)}
                        className="p-1.5 text-amber-400 hover:text-amber-300 cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ================= ARCHIVED INVOICES LIST ================= */}
      {activeTab === 'archived' && (
        <div className="divide-y divide-slate-800 max-h-[550px] overflow-y-auto">
          {archivedInvoices.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <Archive className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <h4 className="text-sm font-bold text-white">Archive Storage is Empty</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No invoices have been archived yet. When you archive invoices from the Active Directory, they will be preserved safely here and can be restored back anytime.
              </p>
            </div>
          ) : filteredArchivedInvoices.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <p className="text-sm font-medium">No archived invoices match your search query.</p>
            </div>
          ) : (
            filteredArchivedInvoices.map((inv) => {
              const calcs = calculateInvoice(inv);
              const formattedArchivedDate = inv.archivedAt
                ? new Date(inv.archivedAt).toLocaleDateString()
                : 'Recently';

              return (
                <div
                  key={inv.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 hover:bg-purple-950/20 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono font-bold text-sm text-purple-300">
                        {inv.invoiceNumber}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-900/60 text-purple-200 border border-purple-600/40">
                        ARCHIVED
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Archived: {formattedArchivedDate}
                      </span>
                    </div>

                    <div className="text-sm font-semibold text-slate-200 mt-1 truncate">
                      {inv.client.name || 'Unnamed Client'}
                      {inv.project.projectName && (
                        <span className="text-slate-400 font-normal ml-2">
                          · {inv.project.projectName}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-400 flex items-center gap-3 mt-1 flex-wrap">
                      <span className="font-mono text-[11px]">Date: {formatDateToSlash(inv.date)}</span>
                      <span>·</span>
                      <span>{calcs.totalArea} {inv.unit}</span>
                      {inv.project.projectAddress && (
                        <>
                          <span>·</span>
                          <span className="truncate">{inv.project.projectAddress}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <div className="text-right">
                      <div className="font-mono font-bold text-base text-amber-400 tabular-nums">
                        {formatCurrency(calcs.grandTotal, inv.currency)}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Archived Copy
                      </div>
                    </div>

                    {/* Restore & Delete Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onRestoreInvoice(inv.id)}
                        className="px-3 py-1 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                        title="Restore this invoice back to active directory"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPermanentDeleteArchived(inv.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                        title="Delete permanently from archive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ================= MODAL: CONFIRM DELETE ALL ================= */}
      {isDeleteAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-rose-500/50 rounded-xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 bg-rose-950/80 border border-rose-500/40 rounded-lg">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete All Invoices?</h3>
                <p className="text-xs text-rose-300">This action will remove all {invoices.length} active invoices.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              If you want to clear your active directory while keeping a safe backup, you can click <strong className="text-purple-300">Archive All</strong> instead. Invoices in the archive can be restored anytime with 1-click.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800 flex-wrap">
              <button
                type="button"
                onClick={() => setIsDeleteAllModalOpen(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsDeleteAllModalOpen(false);
                  onArchiveAll();
                }}
                className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Archive All Instead</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsDeleteAllModalOpen(false);
                  onDeleteAll();
                }}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete Everything</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CONFIRM ARCHIVE ALL ================= */}
      {isArchiveAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-purple-500/50 rounded-xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-purple-400">
              <div className="p-2 bg-purple-950/80 border border-purple-500/40 rounded-lg">
                <Archive className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Archive All Active Invoices?</h3>
                <p className="text-xs text-purple-300">Moves all {invoices.length} active invoices into safe archive storage.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Your active directory will be cleared, and all invoices will be stored in the <strong>Archived Invoices</strong> tab. You can restore individual invoices or click <strong>Restore All</strong> whenever you need them back.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsArchiveAllModalOpen(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsArchiveAllModalOpen(false);
                  onArchiveAll();
                }}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Archive All</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CONFIRM EMPTY ARCHIVE ================= */}
      {isEmptyArchiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-rose-500/50 rounded-xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 bg-rose-950/80 border border-rose-500/40 rounded-lg">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Permanently Empty Archive?</h3>
                <p className="text-xs text-rose-300">This will permanently delete all {archivedInvoices.length} archived invoices.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This action cannot be undone. Invoices permanently deleted from the archive will no longer be recoverable.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsEmptyArchiveModalOpen(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsEmptyArchiveModalOpen(false);
                  onEmptyArchive();
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Empty Archive Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
