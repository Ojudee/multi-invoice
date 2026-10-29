import {
  Invoice,
  InvoicePackagesConfig,
  PackageSelectionMap,
  PackageFilterPreset,
  FloorItem,
  AddonService,
  PackageType,
} from '../types';
import {
  ARCHITECTURAL_PACKAGES,
  STRUCTURAL_PACKAGES,
  BOQ_PACKAGES,
  SITE_INSPECTION_PACKAGE,
  getBOQPackageFee,
} from '../data/constants';
import { formatCurrency } from './calculations';

/**
 * Standard Presets for printing one package or combining any two or all
 */
export const PACKAGE_PRESETS: Record<PackageFilterPreset, PackageSelectionMap> = {
  all: {
    architectural: true,
    structural: true,
    boq: true,
    inspection: true,
    addons: true,
  },
  architectural: {
    architectural: true,
    structural: false,
    boq: false,
    inspection: false,
    addons: false,
  },
  structural: {
    architectural: false,
    structural: true,
    boq: false,
    inspection: false,
    addons: false,
  },
  boq: {
    architectural: false,
    structural: false,
    boq: true,
    inspection: false,
    addons: false,
  },
  inspection: {
    architectural: false,
    structural: false,
    boq: false,
    inspection: true,
    addons: false,
  },
  addons: {
    architectural: false,
    structural: false,
    boq: false,
    inspection: false,
    addons: true,
  },
  arch_structural: {
    architectural: true,
    structural: true,
    boq: false,
    inspection: false,
    addons: false,
  },
  arch_boq: {
    architectural: true,
    structural: false,
    boq: true,
    inspection: false,
    addons: false,
  },
  structural_boq: {
    architectural: false,
    structural: true,
    boq: true,
    inspection: false,
    addons: false,
  },
  custom: {
    architectural: true,
    structural: false,
    boq: false,
    inspection: false,
    addons: false,
  },
};

/**
 * Helper functions to classify floors by discipline with strict mutual exclusivity
 */
export function isInspectionFloor(f: FloorItem): boolean {
  const id = (f.id || '').toLowerCase();
  const name = (f.floorName || '').toLowerCase();
  const sec = (f.sectionTitle || '').toLowerCase();
  return (
    id.includes('ins') ||
    f.unitLabel === 'Visit' ||
    name.includes('inspection') ||
    name.includes('field visit') ||
    name.includes('site visit') ||
    name.includes('technical consultation') ||
    sec.includes('inspection') ||
    sec.includes('supervision')
  );
}

export function isBOQFloor(f: FloorItem): boolean {
  if (isInspectionFloor(f)) return false;
  const id = (f.id || '').toLowerCase();
  const name = (f.floorName || '').toLowerCase();
  const sec = (f.sectionTitle || '').toLowerCase();
  return (
    id.includes('boq') ||
    f.unitLabel === 'Set' ||
    name.includes('boq') ||
    name.includes('quantities') ||
    name.includes('bill of') ||
    sec.includes('boq') ||
    sec.includes('quantities')
  );
}

export function isStructuralFloor(f: FloorItem): boolean {
  if (isInspectionFloor(f) || isBOQFloor(f)) return false;
  const id = (f.id || '').toLowerCase();
  const name = (f.floorName || '').toLowerCase();
  const sec = (f.sectionTitle || '').toLowerCase();
  return (
    id.includes('str') ||
    name.includes('structural') ||
    name.includes('bbs') ||
    name.includes('framing') ||
    name.includes('reinforced concrete') ||
    name.includes('beams') ||
    name.includes('columns') ||
    (name.includes('foundation') && !name.includes('inspection')) ||
    sec.includes('structural')
  );
}

export function isArchitecturalFloor(f: FloorItem): boolean {
  return !isInspectionFloor(f) && !isBOQFloor(f) && !isStructuralFloor(f);
}

export function applyPackageServicesToInvoice(
  invoice: Invoice,
  category: 'architectural' | 'structural' | 'boq',
  regularServices: string[],
  premiumExtraServices: string[]
): Invoice {
  const config = getInvoicePackagesConfig(invoice);
  const selectedConfig = config[category];
  const deliverables = selectedConfig.tier === 'regular'
    ? [...regularServices]
    : [...regularServices, ...premiumExtraServices];
  const isDedicatedInvoice = getInvoiceDiscipline(invoice) === category;
  const floorMatches: Record<typeof category, (floor: FloorItem) => boolean> = {
    architectural: isArchitecturalFloor,
    structural: isStructuralFloor,
    boq: isBOQFloor,
  };

  return {
    ...invoice,
    packagesConfig: {
      ...config,
      [category]: { ...selectedConfig, deliverables },
    },
    floors: invoice.floors.map((floor) =>
      isDedicatedInvoice || floorMatches[category](floor)
        ? { ...floor, deliverables: [...deliverables] }
        : floor
    ),
  };
}

export function getInvoiceDiscipline(
  invoice?: Invoice | null
): 'architectural' | 'structural' | 'boq' | 'inspection' | 'multi_package' {
  if (!invoice) return 'architectural';
  if (invoice.invoiceCategory) return invoice.invoiceCategory;
  const num = (invoice.invoiceNumber || '').toUpperCase();
  if (num.includes('BOQ')) return 'boq';
  if (num.includes('INS')) return 'inspection';
  if (num.includes('STR')) return 'structural';
  if (num.includes('PKG')) return 'multi_package';
  if (num.includes('ARC')) return 'architectural';

  const floors = invoice.floors || [];
  if (floors.length > 0) {
    if (floors.every(isBOQFloor)) return 'boq';
    if (floors.every(isInspectionFloor)) return 'inspection';
    if (floors.every(isStructuralFloor)) return 'structural';
  }
  return 'architectural';
}

export function isSinglePackageInvoice(invoice?: Invoice | null): boolean {
  return getInvoiceDiscipline(invoice) !== 'multi_package';
}

/**
 * Extracts or synthesizes a complete InvoicePackagesConfig for any invoice
 */
export function getInvoicePackagesConfig(invoice?: Invoice | null): InvoicePackagesConfig {
  if (!invoice) {
    return {
      architectural: {
        enabled: true,
        tier: 'premium',
        rate: 100,
        area: 150,
        notes: '',
        deliverables: ARCHITECTURAL_PACKAGES.premium.features,
      },
      structural: {
        enabled: false,
        tier: 'premium',
        rate: 85,
        area: 150,
        notes: '',
        deliverables: STRUCTURAL_PACKAGES.premium.features,
      },
      boq: {
        enabled: false,
        tier: 'regular',
        fee: 30000,
        areaRange: '100 Sq.m - 500 Sq.m',
        notes: '',
        deliverables: BOQ_PACKAGES.regular.features,
      },
      inspection: {
        enabled: false,
        tier: 'standard',
        fee: SITE_INSPECTION_PACKAGE.fixedFee,
        consultationTitle: 'SITE INSPECTION & TECHNICAL CONSULTATION',
        inspectionScope: 'On-Site Field Visit & Terrain Assessment',
        servicesList: [...SITE_INSPECTION_PACKAGE.includes],
        officialDeliverables: [...SITE_INSPECTION_PACKAGE.officialDeliverables],
        notes: '',
        deliverables: [
          ...SITE_INSPECTION_PACKAGE.includes,
          ...SITE_INSPECTION_PACKAGE.officialDeliverables,
        ],
      },
    };
  }

  const discipline = getInvoiceDiscipline(invoice);
  const isDedicatedBOQ = discipline === 'boq';
  const isDedicatedInspection = discipline === 'inspection';
  const isDedicatedStructural = discipline === 'structural';
  const isDedicatedArchitectural = discipline === 'architectural';

  const totalFloorArea = (invoice.floors || []).reduce((sum, f) => sum + (Number(f.area) || 0), 0) || 150;

  const boqFeatures =
    invoice.packagesConfig?.boq?.tier === 'premium'
      ? BOQ_PACKAGES.premium.features
      : BOQ_PACKAGES.regular.features;
  const inspectionFeatures = SITE_INSPECTION_PACKAGE.includes;

  const defaultBoqRange =
    totalFloorArea <= 500
      ? '100 Sq.m - 500 Sq.m'
      : totalFloorArea <= 1000
      ? '500 Sq.m - 1,000 Sq.m'
      : '1,000 Sq.m plus';

  // Check if existing config is present
  if (invoice.packagesConfig) {
    const archEnabled = isDedicatedBOQ || isDedicatedInspection || isDedicatedStructural
      ? false
      : (invoice.packagesConfig.architectural?.enabled ?? true);
    const structEnabled = isDedicatedBOQ || isDedicatedInspection || isDedicatedArchitectural
      ? false
      : (invoice.packagesConfig.structural?.enabled ?? isDedicatedStructural);
    const boqEnabled = isDedicatedInspection || isDedicatedStructural || isDedicatedArchitectural
      ? false
      : (invoice.packagesConfig.boq?.enabled ?? isDedicatedBOQ);
    const inspectEnabled = isDedicatedBOQ || isDedicatedStructural || isDedicatedArchitectural
      ? false
      : (invoice.packagesConfig.inspection?.enabled ?? isDedicatedInspection);

    return {
      architectural: {
        enabled: archEnabled,
        tier: invoice.packagesConfig.architectural?.tier ?? invoice.packageType ?? 'premium',
        rate: invoice.packagesConfig.architectural?.rate ?? invoice.packageRate ?? 100,
        area: invoice.packagesConfig.architectural?.area ?? totalFloorArea,
        notes: invoice.packagesConfig.architectural?.notes ?? '',
        deliverables:
          invoice.packagesConfig.architectural?.deliverables ??
          (invoice.packagesConfig.architectural?.tier === 'regular'
            ? ARCHITECTURAL_PACKAGES.regular.features
            : ARCHITECTURAL_PACKAGES.premium.features),
      },
      structural: {
        enabled: structEnabled,
        tier: invoice.packagesConfig.structural?.tier ?? 'premium',
        rate: invoice.packagesConfig.structural?.rate ?? 85,
        area: invoice.packagesConfig.structural?.area ?? totalFloorArea,
        notes: invoice.packagesConfig.structural?.notes ?? '',
        deliverables:
          invoice.packagesConfig.structural?.deliverables ??
          (invoice.packagesConfig.structural?.tier === 'regular'
            ? STRUCTURAL_PACKAGES.regular.features
            : STRUCTURAL_PACKAGES.premium.features),
      },
      boq: {
        enabled: boqEnabled,
        tier: invoice.packagesConfig.boq?.tier ?? 'regular',
        fee: invoice.packagesConfig.boq?.fee ?? getBOQPackageFee(totalFloorArea, 'regular'),
        areaRange: invoice.packagesConfig.boq?.areaRange ?? defaultBoqRange,
        notes: invoice.packagesConfig.boq?.notes ?? '',
        deliverables: invoice.packagesConfig.boq?.deliverables ?? boqFeatures,
      },
      inspection: {
        enabled: inspectEnabled,
        tier: invoice.packagesConfig.inspection?.tier ?? 'standard',
        fee: invoice.packagesConfig.inspection?.fee ?? SITE_INSPECTION_PACKAGE.fixedFee,
        consultationTitle:
          invoice.packagesConfig.inspection?.consultationTitle ?? 'SITE INSPECTION & TECHNICAL CONSULTATION',
        inspectionScope:
          invoice.packagesConfig.inspection?.inspectionScope ?? 'On-Site Field Visit & Terrain Assessment',
        servicesList:
          invoice.packagesConfig.inspection?.servicesList ?? [...SITE_INSPECTION_PACKAGE.includes],
        officialDeliverables:
          invoice.packagesConfig.inspection?.officialDeliverables ?? [...SITE_INSPECTION_PACKAGE.officialDeliverables],
        notes: invoice.packagesConfig.inspection?.notes ?? '',
        deliverables: invoice.packagesConfig.inspection?.deliverables ?? [
          ...SITE_INSPECTION_PACKAGE.includes,
          ...SITE_INSPECTION_PACKAGE.officialDeliverables,
        ],
      },
    };
  }

  // Auto-detect packages from floors & addons if legacy invoice
  const hasStructuralFloor = (invoice.floors || []).some(isStructuralFloor);
  const boqAddon = (invoice.addons || []).find(
    (a) => a.enabled && (a.name.toLowerCase().includes('boq') || a.name.toLowerCase().includes('quantities'))
  );
  const inspectionAddon = (invoice.addons || []).find(
    (a) => a.enabled && a.name.toLowerCase().includes('inspection')
  );

  const archEnabled = isDedicatedArchitectural || (!isDedicatedBOQ && !isDedicatedInspection && !isDedicatedStructural);

  return {
    architectural: {
      enabled: archEnabled,
      tier: invoice.packageType || 'premium',
      rate: invoice.packageRate || 100,
      area: totalFloorArea,
      notes: '',
      deliverables:
        (invoice.packageType || 'premium') === 'regular'
          ? [...ARCHITECTURAL_PACKAGES.regular.features]
          : [...ARCHITECTURAL_PACKAGES.premium.features],
    },
    structural: {
      enabled: isDedicatedStructural || (!isDedicatedBOQ && !isDedicatedInspection && hasStructuralFloor),
      tier: 'premium',
      rate: 85,
      area: totalFloorArea,
      notes: '',
      deliverables: [...STRUCTURAL_PACKAGES.premium.features],
    },
    boq: {
      enabled: isDedicatedBOQ || (!isDedicatedStructural && !isDedicatedInspection && !isDedicatedArchitectural && !!boqAddon),
      tier: 'regular',
      fee: boqAddon ? boqAddon.amount : getBOQPackageFee(totalFloorArea, 'regular'),
      areaRange: defaultBoqRange,
      notes: '',
      deliverables: [...boqFeatures],
    },
    inspection: {
      enabled: isDedicatedInspection || (!isDedicatedBOQ && !isDedicatedStructural && !isDedicatedArchitectural && !!inspectionAddon),
      tier: 'standard',
      fee: inspectionAddon ? inspectionAddon.amount : SITE_INSPECTION_PACKAGE.fixedFee,
      consultationTitle: 'SITE INSPECTION & TECHNICAL CONSULTATION',
      inspectionScope: 'On-Site Field Visit & Terrain Assessment',
      servicesList: [...SITE_INSPECTION_PACKAGE.includes],
      officialDeliverables: [...SITE_INSPECTION_PACKAGE.officialDeliverables],
      notes: '',
      deliverables: [
        ...SITE_INSPECTION_PACKAGE.includes,
        ...SITE_INSPECTION_PACKAGE.officialDeliverables,
      ],
    },
  };
}

export const getDefaultPackagesConfig = getInvoicePackagesConfig;

export interface PackageSummary {
  key: keyof PackageSelectionMap;
  title: string;
  icon: string;
  enabled: boolean;
  tier?: string;
  rateOrFeeLabel: string;
  areaOrQtyLabel?: string;
  subtotal: number;
  badge: string;
  deliverables: string[];
}

/**
 * Calculates current values and subtotals for each package in the invoice
 */
export function getPackageSummaries(invoice?: Invoice | null): {
  packages: Record<keyof PackageSelectionMap, PackageSummary>;
  activeCount: number;
  grandTotal: number;
  totalArea: number;
} {
  const config = getInvoicePackagesConfig(invoice);
  const floors = Array.isArray(invoice?.floors) ? invoice.floors : [];
  const addons = Array.isArray(invoice?.addons) ? invoice.addons : [];
  const totalFloorArea = floors.reduce((sum, f) => sum + (Number(f.area) || 0), 0) || 150;

  // Architectural
  const archArea = config.architectural.area ?? totalFloorArea;
  const archRate = config.architectural.rate || 100;
  const archSubtotal = config.architectural.enabled ? Math.round(archArea * archRate) : 0;
  const archFeatures =
    config.architectural.tier === 'regular'
      ? ARCHITECTURAL_PACKAGES.regular.features
      : ARCHITECTURAL_PACKAGES.premium.features;

  // Structural
  const structArea = config.structural.area ?? totalFloorArea;
  const structRate = config.structural.rate || 85;
  const structSubtotal = config.structural.enabled ? Math.round(structArea * structRate) : 0;
  const structFeatures =
    config.structural.tier === 'regular'
      ? STRUCTURAL_PACKAGES.regular.features
      : STRUCTURAL_PACKAGES.premium.features;

  // BOQ
  const boqFee = config.boq.fee || getBOQPackageFee(totalFloorArea, config.boq.tier === 'premium' ? 'premium' : 'regular');
  const boqSubtotal = config.boq.enabled ? boqFee : 0;
  const boqFeatures =
    config.boq.tier === 'premium'
      ? BOQ_PACKAGES.premium.features
      : BOQ_PACKAGES.regular.features;

  // Inspection
  const inspectionFee = config.inspection.fee || SITE_INSPECTION_PACKAGE.fixedFee;
  const inspectionSubtotal = config.inspection.enabled ? inspectionFee : 0;
  const inspectionFeatures = SITE_INSPECTION_PACKAGE.includes;

  // Addons (excluding boq & inspection if configured separately)
  const otherAddons = addons.filter((a) => {
    if (!a.enabled) return false;
    const n = a.name.toLowerCase();
    if (n.includes('boq') || n.includes('quantities')) return false;
    if (n.includes('inspection')) return false;
    return true;
  });
  const addonsSubtotal = otherAddons.reduce((s, a) => s + (Number(a.amount) || 0), 0);

  const currency = invoice?.currency || 'GMD';
  const unit = invoice?.unit || 'm²';

  const summaries: Record<keyof PackageSelectionMap, PackageSummary> = {
    architectural: {
      key: 'architectural',
      title: 'Architectural Drawing Package',
      icon: '🏛️',
      enabled: config.architectural.enabled,
      tier: config.architectural.tier.toUpperCase(),
      rateOrFeeLabel: `${currency} ${archRate} / ${unit}`,
      areaOrQtyLabel: `${archArea.toFixed(1)} ${unit}`,
      subtotal: archSubtotal,
      badge: `${config.architectural.tier.toUpperCase()} TIER`,
      deliverables: archFeatures,
    },
    structural: {
      key: 'structural',
      title: 'Structural Engineering Package',
      icon: '🏗️',
      enabled: config.structural.enabled,
      tier: config.structural.tier.toUpperCase(),
      rateOrFeeLabel: `${currency} ${structRate} / ${unit}`,
      areaOrQtyLabel: `${structArea.toFixed(1)} ${unit}`,
      subtotal: structSubtotal,
      badge: `${config.structural.tier.toUpperCase()} TIER`,
      deliverables: structFeatures,
    },
    boq: {
      key: 'boq',
      title: 'Bills of Quantities (BOQ) Package',
      icon: '📊',
      enabled: config.boq.enabled,
      tier: config.boq.tier.toUpperCase(),
      rateOrFeeLabel: `${currency} ${boqFee.toLocaleString()}`,
      areaOrQtyLabel: `${totalFloorArea.toFixed(1)} ${unit} Scope`,
      subtotal: boqSubtotal,
      badge: `${config.boq.tier.toUpperCase()} PACKAGE`,
      deliverables: boqFeatures,
    },
    inspection: {
      key: 'inspection',
      title: 'Site Inspection & Reports Package',
      icon: '🔍',
      enabled: config.inspection.enabled,
      rateOrFeeLabel: `${currency} ${inspectionFee.toLocaleString()}`,
      areaOrQtyLabel: 'Site Assessment & Consultation',
      subtotal: inspectionSubtotal,
      badge: 'FIXED RATE',
      deliverables: inspectionFeatures,
    },
    addons: {
      key: 'addons',
      title: 'Additional Deliverables & Add-ons',
      icon: '⚡',
      enabled: otherAddons.length > 0,
      rateOrFeeLabel: `${currency} ${addonsSubtotal.toLocaleString()}`,
      areaOrQtyLabel: `${otherAddons.length} item(s)`,
      subtotal: addonsSubtotal,
      badge: 'CUSTOM ADD-ONS',
      deliverables: otherAddons.map((a) => a.name),
    },
  };

  const activeCount = Object.values(summaries).filter((s) => s.enabled).length;
  const grandTotal =
    archSubtotal + structSubtotal + boqSubtotal + inspectionSubtotal + addonsSubtotal;

  return {
    packages: summaries,
    activeCount,
    grandTotal,
    totalArea: totalFloorArea,
  };
}

/**
 * Filter an invoice to ONLY the selected package(s) for viewing, printing, or PDF export.
 * Dynamically computes line items, banner titles, and totals.
 */
export function filterInvoiceForPackages(
  invoice: Invoice,
  selection: PackageSelectionMap
): {
  filteredInvoice: Invoice;
  bannerTitle: string;
  selectedNames: string[];
  isSinglePackage: boolean;
  singlePackageKey?: keyof PackageSelectionMap;
} {
  if (!invoice) {
    return {
      filteredInvoice: {} as Invoice,
      bannerTitle: '',
      selectedNames: [],
      isSinglePackage: true,
      singlePackageKey: undefined,
    };
  }

  const config = getInvoicePackagesConfig(invoice);
  const { packages, totalArea } = getPackageSummaries(invoice);
  const invoiceDiscipline = getInvoiceDiscipline(invoice);
  const isInvoiceSingle = isSinglePackageInvoice(invoice);

  // If the invoice is a single package invoice, strictly restrict selection to its own package
  let effectiveSelection = { ...selection };
  if (isInvoiceSingle) {
    effectiveSelection = {
      architectural: invoiceDiscipline === 'architectural',
      structural: invoiceDiscipline === 'structural',
      boq: invoiceDiscipline === 'boq',
      inspection: invoiceDiscipline === 'inspection',
      addons: false,
    };
  }

  const selectedKeys = (Object.keys(effectiveSelection) as (keyof PackageSelectionMap)[]).filter(
    (k) => effectiveSelection[k]
  );

  const isSinglePackage = isInvoiceSingle || selectedKeys.length === 1;
  const singlePackageKey: keyof PackageSelectionMap | undefined = isInvoiceSingle
    ? invoiceDiscipline === 'multi_package' ? undefined : invoiceDiscipline
    : selectedKeys.length === 1 ? selectedKeys[0] : undefined;

  const selectedNames = isInvoiceSingle && singlePackageKey
    ? [packages[singlePackageKey].title]
    : selectedKeys.map((k) => packages[k].title);

  // Determine banner title
  let bannerTitle = invoice.company.bannerTitle || 'ARCHITECTURAL & ENGINEERING SERVICES';
  if (isSinglePackage && singlePackageKey) {
    if (singlePackageKey === 'architectural') {
      bannerTitle = 'ARCHITECTURAL DRAWING PACKAGE';
    } else if (singlePackageKey === 'structural') {
      bannerTitle = 'STRUCTURAL ENGINEERING DRAWING PACKAGE';
    } else if (singlePackageKey === 'boq') {
      bannerTitle = 'BILLS OF QUANTITIES (BOQ) PACKAGE';
    } else if (singlePackageKey === 'inspection') {
      bannerTitle = 'SITE INSPECTION & REPORTS PACKAGE';
    } else if (singlePackageKey === 'addons') {
      bannerTitle = 'ADDITIONAL ENGINEERING DELIVERABLES';
    }
  } else if (selectedKeys.length === 2) {
    if (effectiveSelection.architectural && effectiveSelection.structural) {
      bannerTitle = 'ARCHITECTURAL & STRUCTURAL ENGINEERING SERVICES';
    } else if (effectiveSelection.architectural && effectiveSelection.boq) {
      bannerTitle = 'ARCHITECTURAL DESIGN & BOQ SERVICES';
    } else if (effectiveSelection.structural && effectiveSelection.boq) {
      bannerTitle = 'STRUCTURAL ENGINEERING & BOQ SERVICES';
    } else {
      bannerTitle = `${packages[selectedKeys[0]].title.split(' ')[0]} & ${packages[selectedKeys[1]].title.split(' ')[0]} SERVICES`;
    }
  } else if (selectedKeys.length > 2) {
    bannerTitle = 'UNIVISION COMPREHENSIVE DESIGN & ENGINEERING PACKAGES';
  }

  // Build floors table for selected packages
  const newFloors: FloorItem[] = [];
  const newAddons: AddonService[] = [];

  // CASE 1: Single package invoice — directly preserve invoice's own line items
  if (isInvoiceSingle && singlePackageKey) {
    if (invoice.floors && invoice.floors.length > 0) {
      invoice.floors.forEach((f) => {
        if (singlePackageKey === 'inspection') {
          newFloors.push({
            ...f,
            floorName: config.inspection.consultationTitle ?? f.floorName,
            areaLabel: config.inspection.inspectionScope === undefined
              ? f.areaLabel
              : config.inspection.inspectionScope
              ? `${config.inspection.inspectionScope} (Fixed Scope)`
              : '',
          });
        } else {
          newFloors.push({ ...f });
        }
      });
    } else {
      // Fallback synthesis if floors empty
      if (singlePackageKey === 'boq') {
        const boqFee = config.boq.fee || getBOQPackageFee(totalArea, 'regular');
        newFloors.push({
          id: 'boq-default-item',
          floorName: `Full Bill of Quantities (BOQ) - ${config.boq.areaRange || '100 Sq.m - 500 Sq.m'}`,
          quantity: 1,
          unitLabel: 'Set',
          area: 1,
          customRate: boqFee,
          areaLabel: `1 Set (${config.boq.areaRange || 'Fixed Tier'})`,
          rateLabel: `${boqFee.toLocaleString()} Fixed`,
          amountOverride: boqFee,
          deliverables: config.boq.deliverables,
        });
      } else if (singlePackageKey === 'inspection') {
        const inspectFee = config.inspection.fee || SITE_INSPECTION_PACKAGE.fixedFee;
        newFloors.push({
          id: 'inspect-default-item',
          floorName: config.inspection.consultationTitle ?? 'Site Inspection & Technical Consultation',
          quantity: 1,
          unitLabel: 'Visit',
          area: 1,
          customRate: inspectFee,
          areaLabel: config.inspection.inspectionScope
            ? `${config.inspection.inspectionScope} (Fixed Scope)`
            : '',
          rateLabel: `${inspectFee.toLocaleString()} / Visit`,
          amountOverride: inspectFee,
          deliverables: config.inspection.deliverables,
        });
      } else if (singlePackageKey === 'structural') {
        newFloors.push({
          id: 'struct-default-item',
          floorName: `Structural Engineering Scope (${config.structural.tier.toUpperCase()})`,
          area: totalArea,
          customRate: config.structural.rate,
          areaLabel: `${totalArea.toFixed(1)} ${invoice.unit}`,
          rateLabel: `${config.structural.rate} / ${invoice.unit}`,
          amountOverride: Math.round(totalArea * config.structural.rate),
          deliverables: config.structural.deliverables,
        });
      } else {
        newFloors.push({
          id: 'arch-default-item',
          floorName: `Architectural Design Scope (${config.architectural.tier.toUpperCase()})`,
          area: totalArea,
          customRate: config.architectural.rate,
          areaLabel: `${totalArea.toFixed(1)} ${invoice.unit}`,
          rateLabel: `${config.architectural.rate} / ${invoice.unit}`,
          amountOverride: Math.round(totalArea * config.architectural.rate),
          deliverables: config.architectural.deliverables,
        });
      }
    }
  } else {
    // CASE 2: Multi-package invoice — filter selectively by discipline

    // 1. Architectural floors (strictly exclude structural, BOQ, and inspection)
    if (effectiveSelection.architectural) {
      const archFloors = (invoice.floors || []).filter(isArchitecturalFloor);

      if (archFloors.length > 0) {
        archFloors.forEach((f, idx) => {
          newFloors.push({
            id: f.id,
            sectionTitle: selectedKeys.length > 1 && idx === 0 ? 'ARCHITECTURAL DRAWING PACKAGE SCHEDULE' : f.sectionTitle,
            floorName: f.floorName.replace(/^\[Architectural\]\s*/i, ''),
            area: Number(f.area) || 0,
            quantity: f.quantity,
            unitLabel: f.unitLabel,
            customRate: f.customRate ?? config.architectural.rate,
            areaLabel: f.areaLabel || `${(Number(f.area) || 0).toFixed(1)} ${invoice.unit}`,
            rateLabel: f.rateLabel || `${f.customRate ?? config.architectural.rate} / ${invoice.unit}`,
            amountOverride: f.amountOverride,
            deliverables: f.deliverables,
          });
        });
      } else {
        newFloors.push({
          id: 'arch-default-floor',
          sectionTitle: selectedKeys.length > 1 ? 'ARCHITECTURAL DRAWING PACKAGE SCHEDULE' : undefined,
          floorName: selectedKeys.length > 1 ? 'Covered Floor Area' : 'Architectural Floor Design Scope',
          area: totalArea,
          customRate: config.architectural.rate,
          areaLabel: `${totalArea.toFixed(1)} ${invoice.unit}`,
          rateLabel: `${config.architectural.rate} / ${invoice.unit}`,
          deliverables: config.architectural.deliverables,
        });
      }
    }

    // 2. Structural floors
    if (effectiveSelection.structural) {
      const structArea = config.structural.area ?? totalArea;
      const structRate = config.structural.rate || 85;
      const structFeatures =
        config.structural.tier === 'premium'
          ? STRUCTURAL_PACKAGES.premium.features
          : STRUCTURAL_PACKAGES.regular.features;

      const existingStructFloors = (invoice.floors || []).filter(isStructuralFloor);

      if (existingStructFloors.length > 0) {
        existingStructFloors.forEach((f, idx) => {
          newFloors.push({
            id: f.id,
            sectionTitle: selectedKeys.length > 1 && idx === 0 ? 'STRUCTURAL ENGINEERING DRAWING SCHEDULE' : f.sectionTitle,
            floorName: selectedKeys.length > 1 && !f.floorName.startsWith('[Structural]') ? `[Structural] ${f.floorName}` : f.floorName,
            area: Number(f.area) || structArea,
            quantity: f.quantity,
            unitLabel: f.unitLabel,
            customRate: f.customRate ?? structRate,
            areaLabel: f.areaLabel || `${(Number(f.area) || structArea).toFixed(1)} ${invoice.unit}`,
            rateLabel: f.rateLabel || `${f.customRate ?? structRate} / ${invoice.unit}`,
            amountOverride: f.amountOverride,
            deliverables: f.deliverables,
          });
        });
      } else {
        newFloors.push({
          id: 'struct-scope-floor',
          sectionTitle: selectedKeys.length > 1 ? 'STRUCTURAL ENGINEERING DRAWING SCHEDULE' : undefined,
          floorName:
            selectedKeys.length > 1
              ? `[Structural Engineering] Layouts, Foundation, Columns, Beams & BBS (${config.structural.tier.toUpperCase()})`
              : `Structural Engineering Scope - Foundation, Beams, Columns, Slabs & BBS (${config.structural.tier.toUpperCase()})`,
          area: structArea,
          customRate: structRate,
          areaLabel: `${structArea.toFixed(1)} ${invoice.unit}`,
          rateLabel: `${structRate} / ${invoice.unit}`,
          amountOverride: Math.round(structArea * structRate),
          deliverables: config.structural.deliverables || structFeatures,
        });
      }
    }

    // 3. BOQ Schedule Item
    if (effectiveSelection.boq) {
      const existingBOQFloors = (invoice.floors || []).filter(isBOQFloor);
      if (existingBOQFloors.length > 0) {
        existingBOQFloors.forEach((f, idx) => {
          newFloors.push({
            ...f,
            sectionTitle: selectedKeys.length > 1 && idx === 0 ? 'BILLS OF QUANTITIES (BOQ) SCHEDULE' : f.sectionTitle,
            floorName: selectedKeys.length > 1 && !f.floorName.startsWith('[BOQ]') ? `[BOQ] ${f.floorName}` : f.floorName,
          });
        });
      } else {
        const boqFee = config.boq.fee || getBOQPackageFee(totalArea, config.boq.tier === 'premium' ? 'premium' : 'regular');
        const defaultBoqRange =
          totalArea <= 500
            ? '100 Sq.m - 500 Sq.m'
            : totalArea <= 1000
            ? '500 Sq.m - 1,000 Sq.m'
            : '1,000 Sq.m plus';
        const boqRange = config.boq.areaRange || defaultBoqRange;
        const boqFeatures =
          config.boq.tier === 'premium'
            ? BOQ_PACKAGES.premium.features
            : BOQ_PACKAGES.regular.features;
        const deliverables = config.boq.deliverables || boqFeatures;

        newFloors.push({
          id: 'boq-schedule-item',
          sectionTitle: selectedKeys.length > 1 ? 'BILLS OF QUANTITIES (BOQ) SCHEDULE' : undefined,
          floorName: `Bills of Quantities (BOQ) - ${config.boq.tier.toUpperCase()} PACKAGE`,
          quantity: 1,
          unitLabel: 'Set',
          area: 1,
          areaLabel: `${boqRange} (Fixed Range Tier)`,
          customRate: boqFee,
          rateLabel: `${formatCurrency(boqFee, invoice.currency)} Fixed Tier Rate`,
          amountOverride: boqFee,
          deliverables,
        });
      }
    }

    // 4. Site Inspection Schedule Item
    if (effectiveSelection.inspection) {
      const existingInspectFloors = (invoice.floors || []).filter(isInspectionFloor);
      if (existingInspectFloors.length > 0) {
        existingInspectFloors.forEach((f, idx) => {
          const scope = config.inspection.inspectionScope;
          newFloors.push({
            ...f,
            sectionTitle: selectedKeys.length > 1 && idx === 0 ? 'SITE INSPECTION & REPORTS SCHEDULE' : f.sectionTitle,
            floorName: f.floorName,
            areaLabel: scope === undefined ? f.areaLabel : scope ? `${scope} (Fixed Scope)` : '',
          });
        });
      } else {
        const fee = config.inspection.fee || SITE_INSPECTION_PACKAGE.fixedFee;
        const title = config.inspection.consultationTitle ?? 'Site Inspection & Technical Consultation';
        const scope = config.inspection.inspectionScope ?? 'On-Site Field Visit & Terrain Assessment';
        const services = config.inspection.servicesList || SITE_INSPECTION_PACKAGE.includes;
        const officialDeliverables = config.inspection.officialDeliverables || SITE_INSPECTION_PACKAGE.officialDeliverables;

        newFloors.push({
          id: 'inspect-schedule-item',
          sectionTitle: selectedKeys.length > 1 ? 'SITE INSPECTION & REPORTS SCHEDULE' : undefined,
          floorName: title,
          quantity: 1,
          unitLabel: 'Visit',
          area: 1,
          areaLabel: scope ? `${scope} (Fixed Scope)` : '',
          customRate: fee,
          rateLabel: `${formatCurrency(fee, invoice.currency)} Fixed Rate`,
          amountOverride: fee,
          deliverables: [...services, ...officialDeliverables],
        });
      }
    }

    // 5. Other Addon services
    if (effectiveSelection.addons) {
      const otherAddons = (invoice.addons || []).filter((a) => {
        if (!a.enabled) return false;
        const n = a.name.toLowerCase();
        if (n.includes('boq') || n.includes('quantities')) return false;
        if (n.includes('inspection')) return false;
        return true;
      });

      otherAddons.forEach((a) => {
        newAddons.push({ ...a });
      });
    }
  }

  // Ensure at least one line item exists
  if (newFloors.length === 0 && newAddons.length === 0) {
    newFloors.push({
      id: 'empty-scope',
      floorName: 'No packages selected for this invoice view',
      area: 0,
      customRate: 0,
    });
  }

  // Primary rate & type for single package view
  const primaryRate =
    singlePackageKey === 'structural'
      ? config.structural.rate
      : singlePackageKey === 'architectural'
      ? config.architectural.rate
      : singlePackageKey === 'boq'
      ? config.boq.fee
      : singlePackageKey === 'inspection'
      ? config.inspection.fee
      : invoice.packageRate;

  const primaryType =
    singlePackageKey === 'structural'
      ? config.structural.tier
      : singlePackageKey === 'architectural'
      ? config.architectural.tier
      : singlePackageKey === 'boq'
      ? config.boq.tier
      : singlePackageKey === 'inspection'
      ? config.inspection.tier
      : invoice.packageType;

  // Custom notes tailored to selected packages
  let notes = invoice.additionalNotes || '';
  if (isSinglePackage) {
    if (singlePackageKey === 'architectural') {
      notes =
        invoice.additionalNotes ||
        config.architectural.notes ||
        `Architectural Drawing Package (${config.architectural.tier.toUpperCase()}). Includes 3D Exterior Visualization, floor plans, elevations, sections, and permit-ready municipal drawing sets.`;
    } else if (singlePackageKey === 'structural') {
      notes =
        invoice.additionalNotes ||
        config.structural.notes ||
        `Structural Engineering Package (${config.structural.tier.toUpperCase()}). Includes foundation design, column/beam schedules, structural calculations, and Bar Bending Schedule (BBS).`;
    } else if (singlePackageKey === 'boq') {
      notes =
        invoice.additionalNotes ||
        config.boq.notes ||
        `Bills of Quantities (BOQ) - ${config.boq.tier.toUpperCase()} Package. Includes quantity takeoff, material breakdown, labor cost estimates, and municipal tender schedules.`;
    } else if (singlePackageKey === 'inspection') {
      notes =
        invoice.additionalNotes ||
        config.inspection.notes ||
        'Site Inspection & Technical Consultation. Includes on-site field assessment, soil/site notes, sketch plans, and formal engineering report.';
    }
  }

  // Deduplicate and ensure guaranteed unique IDs for every floor item
  const seenFloorIds = new Set<string>();
  const sanitizedFloors = newFloors.map((f, idx) => {
    let finalId = f.id || `fl-pkg-${idx}`;
    if (seenFloorIds.has(finalId)) {
      finalId = `${finalId}-${idx}`;
    }
    seenFloorIds.add(finalId);
    return {
      ...f,
      id: finalId,
    };
  });

  const filteredInvoice: Invoice = {
    ...invoice,
    company: {
      ...invoice.company,
      bannerTitle,
    },
    floors: sanitizedFloors,
    addons: newAddons,
    packageRate: primaryRate,
    packageType: (primaryType as PackageType) || invoice.packageType || 'regular',
    additionalNotes: notes,
  };

  return {
    filteredInvoice,
    bannerTitle,
    selectedNames,
    isSinglePackage,
    singlePackageKey,
  };
}
