import React from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Building,
  User,
  Home,
  FileSpreadsheet,
  Check,
  FileText,
  CreditCard,
  Calendar,
  PenTool,
  ShieldCheck,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Invoice, PackageSelectionMap } from '../types';
import {
  PACKAGES,
  STRUCTURAL_PACKAGES,
  BOQ_PACKAGES,
  SITE_INSPECTION_PACKAGE,
} from '../data/constants';
import { UnivisionLogo } from './UnivisionLogo';
import { calculateInvoice, formatCurrency, formatDateToSlash } from '../utils/calculations';
import {
  filterInvoiceForPackages,
  getPackageSummaries,
  getInvoicePackagesConfig,
} from '../utils/packageManager';

interface InvoicePaperProps {
  invoice: Invoice;
  id?: string;
  className?: string;
  onOpenSignatureModal?: () => void;
  onSelectPackage?: (type: 'regular' | 'premium') => void;
  isInteractive?: boolean;
  packageFilter?: PackageSelectionMap;
}

export const InvoicePaper: React.FC<InvoicePaperProps> = ({
  invoice,
  id = 'univision-invoice-sheet',
  className = '',
  onOpenSignatureModal,
  onSelectPackage,
  isInteractive = true,
  packageFilter,
}) => {
  // Resolve effective package filter:
  // If packageFilter is explicitly provided (e.g. from Print Preview), use it;
  // otherwise, include all packages that are currently active in this invoice so the schedule and totals reflect the complete scope.
  const effectiveFilter = React.useMemo<PackageSelectionMap>(() => {
    if (packageFilter) return packageFilter;
    if (!invoice) {
      return { architectural: true, structural: false, boq: false, inspection: false, addons: false };
    }
    const cfg = getInvoicePackagesConfig(invoice);
    return {
      architectural: Boolean(cfg.architectural.enabled),
      structural: Boolean(cfg.structural.enabled),
      boq: Boolean(cfg.boq.enabled),
      inspection: Boolean(cfg.inspection.enabled),
      addons: (invoice.addons || []).some((a) => a.enabled),
    };
  }, [packageFilter, invoice]);

  if (!invoice) return null;

  const filterResult = filterInvoiceForPackages(invoice, effectiveFilter);
  const activeInvoice = filterResult.filteredInvoice;
  const isSinglePackage = filterResult.isSinglePackage;
  const singlePackageKey = filterResult.singlePackageKey;
  const selectedNames = filterResult.selectedNames;

  const calculations = calculateInvoice(activeInvoice);
  const formattedDate = formatDateToSlash(activeInvoice.date);
  const formattedDueDate = activeInvoice.dueDate ? formatDateToSlash(activeInvoice.dueDate) : '';
  const { packages: allPkgSummaries } = getPackageSummaries(invoice);

  return (
    <div
      id={id}
      className={`invoice-paper-sheet bg-white text-slate-800 shadow-xl border border-slate-200 mx-auto w-full max-w-[800px] font-sans p-5 sm:p-6 rounded-none sm:rounded-md transition-all select-text box-border ${className}`}
    >
      {/* 1. TOP HEADER SECTION */}
      <div className="grid grid-cols-12 items-center gap-2 pb-2.5 w-full">
        {/* Brand & Logo (Left, 5 cols) */}
        <div className="col-span-12 sm:col-span-5 shrink-0">
          <UnivisionLogo size="md" />
        </div>

        {/* Company Contact Details (Center, 4 cols) */}
        <div className="col-span-12 sm:col-span-4 flex flex-col text-[10px] sm:text-[10.5px] text-slate-600 gap-0.5 leading-tight px-1">
          <div className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="font-medium text-slate-700">{activeInvoice.company.phone}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="font-medium text-slate-700">{activeInvoice.company.email}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="text-slate-700 truncate">{activeInvoice.company.address}</span>
          </div>
        </div>

        {/* Right Gold Slogan (Right, 3 cols) */}
        <div className="col-span-12 sm:col-span-3 text-right pr-1">
          <div className="font-slogan italic text-sm sm:text-base font-medium text-[#c27803] leading-tight whitespace-nowrap">
            Build Your
            <br />
            <span className="text-base sm:text-lg font-bold">Vision</span>
            <br />
            With Us
          </div>
        </div>
      </div>

      {/* Decorative hairline */}
      <div className="h-[2px] bg-slate-900 w-full mb-2.5" />

      {/* 2. BLUE BANNER: ARCHITECTURAL SERVICES PACKAGE / INVOICE */}
      <div className="bg-[#0b2341] text-white px-3.5 py-2 rounded-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 shadow-xs mb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-[#133863] rounded border border-blue-400/30">
            <Building className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-[9.5px] uppercase tracking-[0.2em] text-blue-200 font-semibold leading-none">
              {activeInvoice.company.bannerTitle}
            </div>
            <div className="text-lg md:text-xl font-black tracking-wider text-amber-400 leading-tight flex items-center gap-2">
              <span>INVOICE</span>
              {isSinglePackage && singlePackageKey && (
                <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-500/50 px-2 py-0.5 rounded tracking-normal uppercase">
                  Standalone: {allPkgSummaries[singlePackageKey]?.title || singlePackageKey}
                </span>
              )}
              {selectedNames.length > 1 && selectedNames.length < 5 && (
                <span className="text-[10px] font-bold text-blue-200 bg-blue-900/80 border border-blue-400/40 px-2 py-0.5 rounded tracking-normal uppercase">
                  Combined ({selectedNames.length} Packages)
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="text-[10px] tracking-[0.2em] uppercase font-semibold text-blue-100 flex items-center gap-2">
          <span>PROFESSIONAL</span>
          <span className="text-amber-400">|</span>
          <span>ACCURATE</span>
          <span className="text-amber-400">|</span>
          <span>RELIABLE</span>
        </div>
      </div>

      {/* 3. CLIENT INFORMATION & PROJECT INFORMATION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mb-2.5">
        {/* Client Box */}
        <div className="border border-slate-300 rounded-sm overflow-hidden flex flex-col bg-slate-50/40">
          <div className="bg-[#0b2341] text-white px-3 py-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
            <User className="w-3 h-3 text-amber-400" />
            <span>CLIENT INFORMATION</span>
          </div>
          <div className="p-2 text-xs space-y-1 flex-1 bg-white">
            <div className="flex items-baseline">
              <span className="w-18 text-slate-500 font-semibold shrink-0 text-[11px]">Name:</span>
              <span className="font-semibold text-slate-900 flex-1 border-b border-slate-200 pb-0.5 min-h-[18px]">
                {activeInvoice.client.name || <span className="text-slate-300 italic">Not specified</span>}
              </span>
            </div>
            <div className="flex items-baseline">
              <span className="w-18 text-slate-500 font-semibold shrink-0 text-[11px]">Phone:</span>
              <span className="text-slate-800 flex-1 border-b border-slate-200 pb-0.5 min-h-[18px]">
                {activeInvoice.client.phone || <span className="text-slate-300 italic">--</span>}
              </span>
            </div>
            <div className="flex items-baseline">
              <span className="w-18 text-slate-500 font-semibold shrink-0 text-[11px]">Email:</span>
              <span className="text-slate-800 flex-1 border-b border-slate-200 pb-0.5 min-h-[18px] break-all">
                {activeInvoice.client.email || <span className="text-slate-300 italic">--</span>}
              </span>
            </div>
            <div className="flex items-baseline">
              <span className="w-18 text-slate-500 font-semibold shrink-0 text-[11px]">Address:</span>
              <span className="text-slate-800 flex-1 border-b border-slate-200 pb-0.5 min-h-[18px]">
                {activeInvoice.client.address || <span className="text-slate-300 italic">--</span>}
              </span>
            </div>
          </div>
        </div>

        {/* Project Box */}
        <div className="border border-slate-300 rounded-sm overflow-hidden flex flex-col bg-slate-50/40">
          <div className="bg-[#0b2341] text-white px-3 py-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
            <Home className="w-3 h-3 text-amber-400" />
            <span>PROJECT INFORMATION</span>
          </div>
          <div className="p-2 text-xs space-y-1 flex-1 bg-white">
            <div className="flex items-baseline">
              <span className="w-24 text-slate-500 font-semibold shrink-0 text-[11px]">Project Address:</span>
              <span className="font-medium text-slate-900 flex-1 border-b border-slate-200 pb-0.5 min-h-[18px]">
                {activeInvoice.project.projectAddress || <span className="text-slate-300 italic">--</span>}
              </span>
            </div>
            <div className="flex items-baseline">
              <span className="w-24 text-slate-500 font-semibold shrink-0 text-[11px]">City / Province:</span>
              <span className="text-slate-800 flex-1 border-b border-slate-200 pb-0.5 min-h-[18px]">
                {activeInvoice.project.cityProvince || <span className="text-slate-300 italic">--</span>}
              </span>
            </div>
            <div className="flex items-baseline">
              <span className="w-24 text-slate-500 font-semibold shrink-0 text-[11px]">Postal Code:</span>
              <span className="text-slate-800 flex-1 border-b border-slate-200 pb-0.5 min-h-[18px]">
                {activeInvoice.project.postalCode || <span className="text-slate-300 italic">--</span>}
              </span>
            </div>
            <div className="flex items-center gap-3 pt-0.5">
              <div className="flex-1 flex items-baseline border-b border-slate-200 pb-0.5">
                <span className="text-slate-500 font-semibold mr-1 text-[11px]">Date:</span>
                <span className="font-mono font-medium text-slate-900 text-[11px]">
                  {formattedDate}
                </span>
              </div>
              <div className="flex-1 flex items-baseline border-b border-slate-200 pb-0.5">
                <span className="text-slate-500 font-semibold mr-1 text-[11px]">Invoice #:</span>
                <span className="font-mono font-bold text-[#0b2341] text-[11px]">
                  {activeInvoice.invoiceNumber}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. DRAWING / SERVICE PACKAGE SCHEDULE TABLE */}
      {(() => {
        const isDedicatedBOQ = isSinglePackage && singlePackageKey === 'boq';
        const isDedicatedInspection = isSinglePackage && singlePackageKey === 'inspection';
        const isBOQInvoice = activeInvoice.invoiceCategory === 'boq' || activeInvoice.invoiceNumber.includes('BOQ');
        const isInspectionInvoice = activeInvoice.invoiceCategory === 'inspection' || activeInvoice.invoiceNumber.includes('INS');
        const isQuantitySchedule = isDedicatedBOQ || isDedicatedInspection || isBOQInvoice || isInspectionInvoice;

        const totalQty = activeInvoice.floors.reduce(
          (sum, f) => sum + (typeof f.quantity === 'number' ? f.quantity : (Number(f.area) || 1)),
          0
        );

        return (
          <div className="border border-slate-300 rounded-sm overflow-hidden mb-2.5 bg-white">
            {/* Table Title Bar with orange tag */}
            <div className="bg-[#c27803] text-white px-3 py-1 flex items-center justify-between text-xs font-bold uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-100" />
                <span>
                  {isDedicatedBOQ || isBOQInvoice
                    ? 'BILLS OF QUANTITIES (BOQ) SCHEDULE'
                    : isDedicatedInspection || isInspectionInvoice
                    ? 'SITE INSPECTION & REPORTS SCHEDULE'
                    : isSinglePackage && singlePackageKey === 'structural'
                    ? 'STRUCTURAL ENGINEERING DRAWING SCHEDULE'
                    : selectedNames.length > 1
                    ? `PACKAGE SCHEDULE & SPECIFICATIONS (${selectedNames.length} PACKAGES)`
                    : 'PACKAGE SCHEDULE & SPECIFICATIONS'}
                </span>
              </div>
              <span className="text-[10px] tracking-normal font-medium text-amber-100 bg-[#a35e02] px-2 py-0.5 rounded-xs">
                {isDedicatedBOQ || isBOQInvoice
                  ? 'FIXED RANGE PRICE'
                  : isDedicatedInspection || isInspectionInvoice
                  ? 'FIXED FEE / VISIT'
                  : `(RATE PER ${activeInvoice.unit})`}
              </span>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 bg-[#0b2341] text-white text-[10.5px] font-bold py-1.5 px-3 uppercase tracking-wider">
              <div className="col-span-5 text-left">ITEM / DELIVERABLE SCOPE</div>
              <div className="col-span-2 text-right">
                {isQuantitySchedule ? 'QTY' : 'AREA / SCOPE'}
              </div>
              <div className="col-span-2 text-right">
                {isDedicatedBOQ || isBOQInvoice
                  ? `FIXED RATE (${activeInvoice.currency})`
                  : isDedicatedInspection || isInspectionInvoice
                  ? `RATE / VISIT (${activeInvoice.currency})`
                  : `RATE (${activeInvoice.currency})`}
              </div>
              <div className="col-span-3 text-right">AMOUNT ({activeInvoice.currency})</div>
            </div>

            {/* Floor / Item Rows */}
            <div className="divide-y divide-slate-200 text-xs">
              {activeInvoice.floors.map((floor, idx) => {
                const multiplier = typeof floor.quantity === 'number' ? floor.quantity : (Number(floor.area) || 0);
                const floorRate = floor.customRate ?? activeInvoice.packageRate;
                const floorAmount = typeof floor.amountOverride === 'number'
                  ? floor.amountOverride
                  : multiplier * floorRate;

                let areaOrQtyDisplay: string;
                if (floor.areaLabel) {
                  areaOrQtyDisplay = floor.areaLabel;
                } else if (isQuantitySchedule) {
                  const q = typeof floor.quantity === 'number' ? floor.quantity : (floor.area > 0 ? floor.area : 1);
                  const u = floor.unitLabel ? ` ${floor.unitLabel}` : (isInspectionInvoice || isDedicatedInspection ? ` ${q === 1 ? 'Visit' : 'Visits'}` : ` ${q === 1 ? 'Set' : 'Sets'}`);
                  areaOrQtyDisplay = `${q}${u}`;
                } else {
                  areaOrQtyDisplay = floor.area > 0 ? `${Number(floor.area).toFixed(1)} ${activeInvoice.unit}` : '--';
                }

                const rateDisplay = floor.rateLabel || (floorRate > 0 ? floorRate.toLocaleString() : '--');

                return (
                  <React.Fragment key={floor.id || `fl-row-${idx}`}>
                    {floor.sectionTitle && (
                      <div className="bg-slate-100 text-slate-800 font-bold px-3 py-1 text-[10px] uppercase tracking-wider border-t border-slate-300 flex items-center justify-between">
                        <span>{floor.sectionTitle}</span>
                      </div>
                    )}
                    <div
                      className="grid grid-cols-12 py-1.5 px-3 items-start hover:bg-slate-50/70 transition-colors text-[11px]"
                    >
                      <div className="col-span-5 font-medium text-slate-900 pr-2">
                        <div>{floor.floorName}</div>
                        {floor.deliverables && floor.deliverables.length > 0 && (
                          <ul className="mt-1 space-y-0.5 text-[9.5px] text-slate-600 pl-1">
                            {floor.deliverables.slice(0, 4).map((del, dIdx) => (
                              <li key={dIdx} className="flex items-start gap-1 leading-tight">
                                <span className="text-amber-600 font-bold">•</span>
                                <span>{del}</span>
                              </li>
                            ))}
                            {floor.deliverables.length > 4 && (
                              <li className="text-[9px] text-slate-400 italic">
                                + {floor.deliverables.length - 4} more detailed deliverables included
                              </li>
                            )}
                          </ul>
                        )}
                      </div>
                      <div className="col-span-2 text-right font-mono tabular-nums text-slate-700 text-[10.5px]">
                        {areaOrQtyDisplay}
                      </div>
                      <div className="col-span-2 text-right font-mono tabular-nums text-slate-600 text-[10.5px]">
                        {rateDisplay}
                      </div>
                      <div className="col-span-3 text-right font-mono font-semibold tabular-nums text-slate-900">
                        {formatCurrency(floorAmount, activeInvoice.currency)}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}

              {/* Table Sub-sum */}
              <div className="grid grid-cols-12 py-1.5 px-3 bg-slate-50 font-semibold text-xs border-t-2 border-slate-300">
                <div className="col-span-5 text-slate-700 uppercase tracking-wide text-[10.5px]">
                  {isQuantitySchedule ? 'Schedule Total' : 'Package Subtotal'}
                </div>
                <div className="col-span-2 text-right font-mono tabular-nums text-slate-800 text-[11px]">
                  {isQuantitySchedule
                    ? `${totalQty} ${isInspectionInvoice || isDedicatedInspection ? (totalQty === 1 ? 'Visit' : 'Visits') : (totalQty === 1 ? 'Item' : 'Items')}`
                    : calculations.totalArea > 0
                    ? `${calculations.totalArea.toFixed(1)} ${activeInvoice.unit}`
                    : '--'}
                </div>
                <div className="col-span-2 text-right text-slate-400">--</div>
                <div className="col-span-3 text-right font-mono font-bold tabular-nums text-[#0b2341] text-[11.5px]">
                  {formatCurrency(calculations.drawingPackageTotal, activeInvoice.currency)}
                </div>
              </div>
            </div>

            {/* Additional notes container */}
            <div className="p-2 border-t border-slate-200 bg-slate-50/50 text-xs">
              <div className="font-semibold text-slate-600 text-[10.5px] uppercase tracking-wide mb-0.5">
                ADDITIONAL NOTES & SPECIFICATIONS:
              </div>
              <div className="min-h-[20px] text-slate-700 border border-slate-200 bg-white rounded-xs p-1.5 leading-relaxed text-[10.5px]">
                {activeInvoice.additionalNotes || (
                  <span className="text-slate-300 italic">No additional notes provided.</span>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* 5. PACKAGES & TOTAL SUMMARY SECTION (3 COLUMNS) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 mb-2.5">
        {/* ================= COLUMN 1 & 2 DYNAMIC RENDERING ================= */}
        {isSinglePackage && singlePackageKey === 'structural' ? (
          <>
            {/* Structural Col 1: Regular */}
            <div
              className={`col-span-12 md:col-span-4 border rounded-sm overflow-hidden flex flex-col text-xs transition-all ${
                activeInvoice.packageType === 'regular'
                  ? 'border-blue-600 shadow-sm ring-1 ring-blue-500'
                  : 'border-slate-300 opacity-90'
              }`}
            >
              <div className="bg-[#1e3a8a] text-white px-2.5 py-1.5 text-center">
                <div className="font-bold text-[10.5px] tracking-wider uppercase">STRUCTURAL REGULAR</div>
                <div className="text-amber-400 font-extrabold text-xs sm:text-sm tracking-wide">
                  {activeInvoice.currency} 65 /{activeInvoice.unit}
                </div>
              </div>
              <div className="p-2 bg-white flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-[9.5px] font-bold text-slate-600 uppercase tracking-wide mb-1 pb-0.5 border-b border-slate-100">
                    INCLUDES:
                  </div>
                  <ul className="space-y-0.5 text-[9.5px] text-slate-700">
                    {STRUCTURAL_PACKAGES.regular.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-1 leading-tight">
                        <Check className="w-2.5 h-2.5 text-blue-700 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Structural Col 2: Premium */}
            <div
              className={`col-span-12 md:col-span-4 border rounded-sm overflow-hidden flex flex-col text-xs transition-all ${
                activeInvoice.packageType === 'premium'
                  ? 'border-emerald-600 shadow-sm ring-1 ring-emerald-500'
                  : 'border-slate-300 opacity-90'
              }`}
            >
              <div className="bg-[#047857] text-white px-2.5 py-1.5 text-center">
                <div className="font-bold text-[10.5px] tracking-wider uppercase">STRUCTURAL PREMIUM</div>
                <div className="text-white font-extrabold text-xs sm:text-sm tracking-wide">
                  {activeInvoice.currency} 85 /{activeInvoice.unit}
                </div>
              </div>
              <div className="p-2 bg-white flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-[9.5px] font-bold text-slate-600 uppercase tracking-wide mb-1 pb-0.5 border-b border-slate-100">
                    EVERYTHING IN REGULAR PLUS:
                  </div>
                  <ul className="space-y-0.5 text-[9.5px] text-slate-700">
                    {STRUCTURAL_PACKAGES.premium.features.slice(7).map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-1 leading-tight">
                        <Check className="w-2.5 h-2.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </>
        ) : isSinglePackage && singlePackageKey === 'boq' ? (
          <>
            {/* BOQ Col 1: Regular */}
            <div className="col-span-12 md:col-span-4 border border-slate-300 rounded-sm overflow-hidden flex flex-col text-xs">
              <div className="bg-[#0284c7] text-white px-2.5 py-1.5 text-center">
                <div className="font-bold text-[10.5px] tracking-wider uppercase">BOQ REGULAR PACKAGE</div>
                <div className="text-amber-300 font-extrabold text-xs sm:text-sm tracking-wide">
                  {activeInvoice.currency} 18,000 – 25,000
                </div>
              </div>
              <div className="p-2 bg-white flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-[9.5px] font-bold text-slate-600 uppercase tracking-wide mb-1 pb-0.5 border-b border-slate-100">
                    DELIVERABLES:
                  </div>
                  <ul className="space-y-0.5 text-[9.5px] text-slate-700">
                    {BOQ_PACKAGES.regular.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-1 leading-tight">
                        <Check className="w-2.5 h-2.5 text-blue-700 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* BOQ Col 2: Premium */}
            <div className="col-span-12 md:col-span-4 border border-emerald-500 rounded-sm overflow-hidden flex flex-col text-xs shadow-xs">
              <div className="bg-[#059669] text-white px-2.5 py-1.5 text-center">
                <div className="font-bold text-[10.5px] tracking-wider uppercase">BOQ PREMIUM PACKAGE</div>
                <div className="text-white font-extrabold text-xs sm:text-sm tracking-wide">
                  {activeInvoice.currency} 30,000 – 65,000
                </div>
              </div>
              <div className="p-2 bg-white flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-[9.5px] font-bold text-slate-600 uppercase tracking-wide mb-1 pb-0.5 border-b border-slate-100">
                    COMPREHENSIVE COST CONSULTANCY:
                  </div>
                  <ul className="space-y-0.5 text-[9.5px] text-slate-700">
                    {BOQ_PACKAGES.premium.features.slice(5).map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-1 leading-tight">
                        <Check className="w-2.5 h-2.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </>
        ) : isSinglePackage && singlePackageKey === 'inspection' ? (
          <>
            {/* Site Inspection Col 1 & 2 */}
            <div className="col-span-12 md:col-span-8 border border-slate-300 rounded-sm overflow-hidden flex flex-col text-xs">
              <div className="bg-[#0b2341] text-white px-2.5 py-1.5 flex items-center justify-between">
                <span className="font-bold text-[10.5px] tracking-wider uppercase">
                  {activeInvoice.packagesConfig?.inspection?.consultationTitle || 'SITE INSPECTION & TECHNICAL CONSULTATION'}
                </span>
                <span className="text-amber-400 font-extrabold text-xs">
                  {activeInvoice.currency} {(activeInvoice.packagesConfig?.inspection?.fee ?? SITE_INSPECTION_PACKAGE.fixedFee).toLocaleString()} FIXED
                </span>
              </div>
              <div className="p-2.5 bg-white flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="text-[9.5px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                    INCLUDED SERVICES:
                  </div>
                  <ul className="space-y-1 text-[9.5px] text-slate-700">
                    {(activeInvoice.packagesConfig?.inspection?.servicesList || SITE_INSPECTION_PACKAGE.includes).map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-1">
                        <Check className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="text-[9.5px] text-slate-600 border-l border-slate-200 pl-3 space-y-1">
                  <div className="font-bold text-slate-700 uppercase">OFFICIAL DELIVERABLES:</div>
                  {(activeInvoice.packagesConfig?.inspection?.officialDeliverables || SITE_INSPECTION_PACKAGE.officialDeliverables).map((del, idx) => (
                    <p key={idx} className="leading-tight">• {del}</p>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : selectedNames.length > 1 ? (
          <>
            {/* Combined Packages Breakdown */}
            <div className="col-span-12 md:col-span-8 border border-slate-300 rounded-sm overflow-hidden flex flex-col text-xs bg-white">
              <div className="bg-[#0b2341] text-white px-2.5 py-1.5 flex items-center justify-between">
                <span className="font-bold text-[10.5px] tracking-wider uppercase flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>CONSOLIDATED PACKAGES ({selectedNames.length} SELECTED)</span>
                </span>
                <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">
                  TURNKEY SCOPE
                </span>
              </div>
              <div className="p-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                <div className="space-y-1.5 pr-2 border-r border-slate-200">
                  <span className="font-bold text-slate-700 uppercase tracking-wide block border-b border-slate-100 pb-0.5">
                    Included Packages & Tiers:
                  </span>
                  {selectedNames.map((name, i) => {
                    const key = (Object.keys(allPkgSummaries) as (keyof typeof allPkgSummaries)[]).find(
                      (k) => allPkgSummaries[k].title === name
                    );
                    const summary = key ? allPkgSummaries[key] : undefined;
                    return (
                      <div key={i} className="flex items-center justify-between text-slate-800 py-0.5 border-b border-slate-100 last:border-b-0">
                        <span className="flex items-center gap-1 font-medium">
                          <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{name}</span>
                        </span>
                        {summary && (
                          <span className="font-mono text-[9px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                            {summary.badge}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="space-y-1 text-slate-600 pl-1">
                  <span className="font-bold text-slate-700 uppercase tracking-wide block border-b border-slate-100 pb-0.5">
                    Standards & Deliverables:
                  </span>
                  <p>• Full permit-ready drawing set & specifications</p>
                  <p>• Certified compliance with national building codes</p>
                  <p>• Direct submission support for municipal councils</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Standard Architectural Regular Package */}
            <div
              className={`col-span-12 md:col-span-4 border rounded-sm overflow-hidden flex flex-col text-xs transition-all ${
                activeInvoice.packageType === 'regular'
                  ? 'border-blue-600 shadow-sm ring-1 ring-blue-500'
                  : 'border-slate-300 opacity-90'
              }`}
            >
              <div className="bg-[#0b2341] text-white px-2.5 py-1.5 text-center">
                <div className="font-bold text-[10.5px] tracking-wider uppercase">REGULAR PACKAGE</div>
                <div className="text-amber-400 font-extrabold text-xs sm:text-sm tracking-wide">
                  {activeInvoice.currency} 75 /{activeInvoice.unit}
                </div>
              </div>
              <div className="p-2 bg-white flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-[9.5px] font-bold text-slate-600 uppercase tracking-wide mb-1 pb-0.5 border-b border-slate-100">
                    INCLUDES:
                  </div>
                  <ul className="space-y-0.5 text-[9.5px] text-slate-700">
                    {PACKAGES.regular.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-1 leading-tight">
                        <Check className="w-2.5 h-2.5 text-blue-700 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {isInteractive && onSelectPackage && (
                  <button
                    type="button"
                    onClick={() => onSelectPackage('regular')}
                    className={`mt-2 w-full py-0.5 text-[9.5px] font-bold rounded-xs transition-colors cursor-pointer ${
                      activeInvoice.packageType === 'regular'
                        ? 'bg-[#0b2341] text-white'
                        : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {activeInvoice.packageType === 'regular' ? 'Selected Package' : 'Select Regular'}
                  </button>
                )}
              </div>
            </div>

            {/* Standard Architectural Premium Package */}
            <div
              className={`col-span-12 md:col-span-4 border rounded-sm overflow-hidden flex flex-col text-xs transition-all ${
                activeInvoice.packageType === 'premium'
                  ? 'border-amber-600 shadow-sm ring-1 ring-amber-500'
                  : 'border-slate-300 opacity-90'
              }`}
            >
              <div className="bg-[#c27803] text-white px-2.5 py-1.5 text-center">
                <div className="font-bold text-[10.5px] tracking-wider uppercase">PREMIUM PACKAGE</div>
                <div className="text-white font-extrabold text-xs sm:text-sm tracking-wide">
                  {activeInvoice.currency} 100 /{activeInvoice.unit}
                </div>
              </div>
              <div className="p-2 bg-white flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-[9.5px] font-bold text-slate-600 uppercase tracking-wide mb-1 pb-0.5 border-b border-slate-100">
                    EVERYTHING IN REGULAR PLUS:
                  </div>
                  <ul className="space-y-0.5 text-[9.5px] text-slate-700">
                    {PACKAGES.premium.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-1 leading-tight">
                        <Check className="w-2.5 h-2.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {isInteractive && onSelectPackage && (
                  <button
                    type="button"
                    onClick={() => onSelectPackage('premium')}
                    className={`mt-2 w-full py-0.5 text-[9.5px] font-bold rounded-xs transition-colors cursor-pointer ${
                      activeInvoice.packageType === 'premium'
                        ? 'bg-[#c27803] text-white'
                        : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {activeInvoice.packageType === 'premium' ? 'Selected Package' : 'Select Premium'}
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* Column 3: PACKAGE PRICE & SELECTED PACKAGE CARDS */}
        <div className="col-span-12 md:col-span-4 flex flex-col gap-2">
          {/* Card A: PACKAGE PRICE */}
          <div className="border border-amber-500 rounded-sm overflow-hidden bg-white shadow-xs">
            <div className="bg-[#c27803] text-white px-2.5 py-0.5 text-center font-bold text-[11px] uppercase tracking-wider">
              PACKAGE PRICE
            </div>
            <div className="p-2 text-center bg-amber-50/30">
              <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wide mb-0.5">
                TOTAL ({activeInvoice.currency})
              </div>
              <div className="font-mono text-lg sm:text-xl font-black text-[#0b2341] tracking-tight tabular-nums">
                {formatCurrency(calculations.grandTotal, activeInvoice.currency)}
              </div>
              {calculations.discountAmount > 0 && (
                <div className="text-[9.5px] text-emerald-700 font-medium mt-0.5">
                  Discount: -{formatCurrency(calculations.discountAmount, activeInvoice.currency)}
                </div>
              )}
            </div>
          </div>

          {/* Card B: SELECTED PACKAGE RADIO & ADVANCE */}
          <div className="border border-slate-300 rounded-sm overflow-hidden bg-white flex-1">
            <div className="bg-[#0b2341] text-white px-2.5 py-0.5 text-center font-bold text-[11px] uppercase tracking-wider">
              {isSinglePackage ? 'SELECTED TIER' : 'PACKAGE SCHEDULE'}
            </div>
            <div className="p-2 space-y-1.5 text-xs">
              <div className="text-[10.5px] font-bold text-slate-800 flex items-center justify-between">
                <span>Scope:</span>
                <span className="text-[#0b2341]">{selectedNames.length > 0 ? selectedNames.join(', ') : 'Custom Package'}</span>
              </div>

              {/* Advance Deposit Schedule Indicator */}
              <div className="mt-1.5 pt-1.5 border-t border-slate-100 text-[9.5px] space-y-0.5">
                <div className="flex justify-between text-slate-600">
                  <span>Advance ({activeInvoice.depositPercent}%):</span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {formatCurrency(calculations.depositRequiredAmount, activeInvoice.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Balance Due:</span>
                  <span className="font-mono font-semibold text-slate-800 tabular-nums">
                    {activeInvoice.status === 'paid' ? (
                      <span className="text-emerald-700 font-bold">PAID IN FULL</span>
                    ) : (
                      formatCurrency(calculations.balanceDue, activeInvoice.currency)
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. ARCHITECTURAL ADD-ONS TABLE (IF APPLICABLE) */}
      {calculations.addonsTotal > 0 && (
        <div className="border border-slate-300 rounded-sm overflow-hidden mb-2.5 bg-white text-xs">
          <div className="bg-slate-800 text-white px-3 py-1 flex items-center justify-between font-bold uppercase tracking-wider text-[10.5px]">
            <span>ADDITIONAL ARCHITECTURAL & ENGINEERING SERVICES</span>
            <span className="font-mono tabular-nums text-amber-300">
              +{formatCurrency(calculations.addonsTotal, activeInvoice.currency)}
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {activeInvoice.addons
              .filter((a) => a.enabled)
              .map((addon) => (
                <div key={addon.id} className="py-1 px-3 flex justify-between items-center text-[10.5px]">
                  <div>
                    <span className="font-semibold text-slate-900">{addon.name}</span>
                    <span className="text-slate-500 ml-2 text-[9.5px]">({addon.description})</span>
                  </div>
                  <div className="font-mono font-medium text-slate-800 tabular-nums">
                    {formatCurrency(addon.amount, activeInvoice.currency)}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 7. TERMS & CONDITIONS and PAYMENT DETAILS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mb-2.5">
        {/* Terms & Conditions Box */}
        <div className="border border-slate-300 rounded-sm overflow-hidden flex flex-col bg-white">
          <div className="bg-[#0b2341] text-white px-3 py-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
            <FileText className="w-3 h-3 text-amber-400" />
            <span>TERMS & CONDITIONS</span>
          </div>
          <div className="p-2 text-[10px] text-slate-700 leading-normal flex-1">
            <ul className="list-disc pl-3.5 space-y-0.5">
              {activeInvoice.terms.map((term, idx) => (
                <li key={idx} className="marker:text-slate-400">
                  {term}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Payment Details Box */}
        <div className="border border-slate-300 rounded-sm overflow-hidden flex flex-col bg-white">
          <div className="bg-[#0b2341] text-white px-3 py-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
            <CreditCard className="w-3 h-3 text-amber-400" />
            <span>PAYMENT DETAILS</span>
          </div>
          <div className="p-2 text-xs space-y-1 flex-1">
            <div className="flex items-baseline">
              <span className="w-24 text-slate-500 font-semibold shrink-0 text-[11px]">Bank:</span>
              <span className="font-medium text-slate-900 flex-1 border-b border-slate-200 pb-0.5 min-h-[18px] text-[11px]">
                {activeInvoice.paymentDetails.bankName || <span className="text-slate-300 italic">--</span>}
              </span>
            </div>
            <div className="flex items-baseline">
              <span className="w-24 text-slate-500 font-semibold shrink-0 text-[11px]">Account Name:</span>
              <span className="text-slate-900 font-medium flex-1 border-b border-slate-200 pb-0.5 min-h-[18px] text-[11px]">
                {activeInvoice.paymentDetails.accountName || <span className="text-slate-300 italic">--</span>}
              </span>
            </div>
            <div className="flex items-baseline">
              <span className="w-24 text-slate-500 font-semibold shrink-0 text-[11px]">Account #:</span>
              <span className="font-mono font-bold text-[#0b2341] flex-1 border-b border-slate-200 pb-0.5 min-h-[18px] text-[11px]">
                {activeInvoice.paymentDetails.accountNumber || <span className="text-slate-300 italic">--</span>}
              </span>
            </div>
            <div className="flex items-baseline">
              <span className="w-24 text-slate-500 font-semibold shrink-0 text-[11px]">Reference:</span>
              <span className="font-mono text-slate-800 flex-1 border-b border-slate-200 pb-0.5 min-h-[18px] text-[11px]">
                {activeInvoice.paymentDetails.reference || activeInvoice.invoiceNumber}
              </span>
            </div>
            {activeInvoice.paymentDetails.mobileMoneyNumber && (
              <div className="flex items-baseline pt-0.5 text-[10px]">
                <span className="w-24 text-amber-700 font-semibold shrink-0">Mobile Money:</span>
                <span className="text-slate-700">
                  {activeInvoice.paymentDetails.mobileMoneyProvider}: {activeInvoice.paymentDetails.mobileMoneyNumber}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 8. CLIENT SIGNATURE & DATE */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pb-2 mb-2.5 items-end">
        {/* Signature Area */}
        <div className="sm:col-span-8 flex flex-col">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
            <div className="flex items-center gap-1.5">
              <PenTool className="w-3.5 h-3.5 text-amber-600" />
              <span>CLIENT SIGNATURE</span>
            </div>
            {isInteractive && (
              <button
                type="button"
                onClick={onOpenSignatureModal}
                className="text-[10px] text-blue-700 hover:text-blue-900 font-medium underline cursor-pointer no-print"
              >
                {activeInvoice.clientSignature ? 'Change signature' : 'Click to sign'}
              </button>
            )}
          </div>

          <div
            onClick={isInteractive ? onOpenSignatureModal : undefined}
            className={`border-b-2 border-slate-800 min-h-[40px] flex items-center justify-center p-1 bg-slate-50/40 ${
              isInteractive ? 'cursor-pointer hover:bg-slate-100/70 transition-colors' : ''
            }`}
          >
            {activeInvoice.clientSignature ? (
              activeInvoice.clientSignatureType === 'draw' ? (
                <img
                  src={activeInvoice.clientSignature}
                  alt="Client Signature"
                  className="max-h-[36px] object-contain"
                />
              ) : (
                <span className="font-signature text-xl text-[#0b2341] tracking-wide">
                  {activeInvoice.clientSignature}
                </span>
              )
            ) : (
              <span className="text-xs text-slate-400 italic">
                Sign here or type name
              </span>
            )}
          </div>
        </div>

        {/* Date Field */}
        <div className="sm:col-span-4 flex flex-col">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            <span>DATE</span>
          </div>
          <div className="border-b-2 border-slate-800 min-h-[40px] flex items-center justify-start px-2 bg-slate-50/40">
            <span className="font-mono text-xs text-slate-800 font-medium">
              {activeInvoice.clientSignDate ? formatDateToSlash(activeInvoice.clientSignDate) : formattedDate}
            </span>
          </div>
        </div>
      </div>

      {/* 9. BOTTOM FOOTER BAR */}
      <div className="bg-[#0b2341] text-white px-3.5 py-1.5 rounded-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1 shadow-xs">
        <div className="flex items-center gap-2">
          <UnivisionLogo size="sm" light showSubtitle={true} />
        </div>
        <div className="font-slogan italic text-amber-300 text-xs sm:text-[13px] tracking-wide text-right">
          {activeInvoice.company.footerQuote}
        </div>
      </div>
    </div>
  );
};
