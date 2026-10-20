import { Invoice } from '../types';
import {
  DEFAULT_COMPANY,
  DEFAULT_TERMS,
  BANK_PRESETS,
  ARCHITECTURAL_PACKAGES,
  STRUCTURAL_PACKAGES,
  BOQ_PACKAGES,
  SITE_INSPECTION_PACKAGE,
} from './constants';

export function createDefaultInvoiceByType(
  category: 'architectural' | 'structural' | 'boq' | 'inspection' | 'multi_package',
  seq = 1
): Invoice {
  const padded = String(seq).padStart(3, '0');
  const now = new Date().toISOString();
  const dateStr = now.split('T')[0];
  const dueStr = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

  const baseInvoice: Omit<Invoice, 'invoiceNumber' | 'floors' | 'packageType' | 'packageRate' | 'additionalNotes' | 'packagesConfig' | 'invoiceCategory'> = {
    id: `inv-${category}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    date: dateStr,
    dueDate: dueStr,
    status: 'draft',
    company: DEFAULT_COMPANY,
    client: {
      name: '',
      phone: '+220 ',
      email: '',
      address: '',
    },
    project: {
      projectName:
        category === 'architectural'
          ? 'Architectural Drawing Project'
          : category === 'structural'
          ? 'Structural Engineering Design Project'
          : category === 'boq'
          ? 'Bills of Quantities & Cost Estimation'
          : category === 'inspection'
          ? 'Site Inspection & Technical Supervision'
          : 'Full Multi-Discipline Engineering Package',
      projectAddress: 'Plot Site, The Gambia',
      cityProvince: 'West Coast Region',
      postalCode: 'WCR',
    },
    addons: [],
    currency: 'GMD',
    unit: 'm²',
    discountPercent: 0,
    taxPercent: 0,
    depositPercent: 50,
    depositPaidAmount: 0,
    terms: [...DEFAULT_TERMS],
    paymentDetails: {
      ...BANK_PRESETS[0],
      reference: '',
    },
    clientSignature: '',
    clientSignatureType: 'none',
    clientSignDate: '',
    contractorSigned: true,
    contractorSignDate: dateStr,
    createdAt: now,
    updatedAt: now,
  };

  switch (category) {
    case 'architectural': {
      const invNum = `INV-ARC-${padded}`;
      return {
        ...baseInvoice,
        invoiceNumber: invNum,
        invoiceCategory: 'architectural',
        paymentDetails: { ...baseInvoice.paymentDetails, reference: invNum },
        packageType: 'premium',
        packageRate: 100,
        additionalNotes:
          'Official Univision Architectural Drawings package. Includes full permit set, 3D visualizations, floor layouts, sections, elevations, and municipal submission compliance.',
        floors: [
          {
            id: `fl-arc-1`,
            floorName: 'Ground Floor Architectural Layout & Permit Drawings',
            area: 150.0,
            deliverables: [...ARCHITECTURAL_PACKAGES.premium.features.slice(0, 6)],
          },
        ],
        packagesConfig: {
          architectural: {
            enabled: true,
            tier: 'premium',
            rate: 100,
            area: 150.0,
            deliverables: [...ARCHITECTURAL_PACKAGES.premium.features],
          },
          structural: { enabled: false, tier: 'regular', rate: 65 },
          boq: { enabled: false, tier: 'regular', fee: 18000 },
          inspection: { enabled: false, fee: 15000 },
        },
      };
    }

    case 'structural': {
      const invNum = `INV-STR-${padded}`;
      return {
        ...baseInvoice,
        invoiceNumber: invNum,
        invoiceCategory: 'structural',
        paymentDetails: { ...baseInvoice.paymentDetails, reference: invNum },
        packageType: 'premium',
        packageRate: 85,
        additionalNotes:
          'Official Univision Structural Engineering Package. Includes foundation layout, reinforced concrete column & beam schedules, slab details, Bar Bending Schedule (BBS), and calculation report.',
        floors: [
          {
            id: `fl-str-1`,
            floorName: 'Foundation, Columns & Superstructure Framing Scope',
            area: 150.0,
            customRate: 85,
            deliverables: [...STRUCTURAL_PACKAGES.premium.features.slice(0, 6)],
          },
        ],
        packagesConfig: {
          architectural: { enabled: false, tier: 'regular', rate: 75 },
          structural: {
            enabled: true,
            tier: 'premium',
            rate: 85,
            area: 150.0,
            deliverables: [...STRUCTURAL_PACKAGES.premium.features],
          },
          boq: { enabled: false, tier: 'regular', fee: 18000 },
          inspection: { enabled: false, fee: 15000 },
        },
      };
    }

    case 'boq': {
      const invNum = `INV-BOQ-${padded}`;
      return {
        ...baseInvoice,
        invoiceNumber: invNum,
        invoiceCategory: 'boq',
        paymentDetails: { ...baseInvoice.paymentDetails, reference: invNum },
        packageType: 'premium',
        packageRate: 30000,
        additionalNotes:
          'Fixed range fee for professional Bill of Quantities (BOQ). Charged by building bracket size, NOT per sq.m. Covers comprehensive material takeoff, labor schedules, trade summaries, and tender documentation.',
        floors: [
          {
            id: `fl-boq-1`,
            floorName: 'Full Bill of Quantities (BOQ) - 100 to 500 m² Fixed Range',
            quantity: 1,
            unitLabel: 'Set',
            area: 1,
            customRate: 30000,
            areaLabel: '1 Set (100–500 m² Fixed Scope)',
            rateLabel: '30,000 Fixed',
            amountOverride: 30000,
            deliverables: [...BOQ_PACKAGES.premium.features],
          },
        ],
        packagesConfig: {
          architectural: { enabled: false, tier: 'regular', rate: 75 },
          structural: { enabled: false, tier: 'regular', rate: 65 },
          boq: {
            enabled: true,
            tier: 'premium',
            fee: 30000,
            areaRange: '100 Sq.m - 500 Sq.m',
            deliverables: [...BOQ_PACKAGES.premium.features],
          },
          inspection: { enabled: false, fee: 15000 },
        },
      };
    }

    case 'inspection': {
      const invNum = `INV-INS-${padded}`;
      return {
        ...baseInvoice,
        invoiceNumber: invNum,
        invoiceCategory: 'inspection',
        paymentDetails: { ...baseInvoice.paymentDetails, reference: invNum },
        packageType: 'custom',
        packageRate: 15000,
        additionalNotes:
          'Fixed fee professional on-site engineering field inspection and quality compliance verification. Includes physical site inspection, foundation & reinforcement audit, photographic report, and Univision certificate.',
        floors: [
          {
            id: `fl-ins-1`,
            floorName: 'On-Site Technical Field Inspection & Compliance Audit',
            quantity: 1,
            unitLabel: 'Visit',
            area: 1,
            customRate: 15000,
            areaLabel: '1 On-Site Session / Field Visit',
            rateLabel: '15,000 / Visit',
            amountOverride: 15000,
            deliverables: [
              ...SITE_INSPECTION_PACKAGE.includes,
              ...SITE_INSPECTION_PACKAGE.officialDeliverables,
            ],
          },
        ],
        packagesConfig: {
          architectural: { enabled: false, tier: 'regular', rate: 75 },
          structural: { enabled: false, tier: 'regular', rate: 65 },
          boq: { enabled: false, tier: 'regular', fee: 18000 },
          inspection: {
            enabled: true,
            tier: 'standard',
            fee: 15000,
            consultationTitle: 'SITE INSPECTION & TECHNICAL CONSULTATION',
            inspectionScope: 'On-Site Field Visit & Terrain Assessment',
            servicesList: [...SITE_INSPECTION_PACKAGE.includes],
            officialDeliverables: [...SITE_INSPECTION_PACKAGE.officialDeliverables],
            deliverables: [
              ...SITE_INSPECTION_PACKAGE.includes,
              ...SITE_INSPECTION_PACKAGE.officialDeliverables,
            ],
          },
        },
      };
    }

    case 'multi_package':
    default: {
      const invNum = `INV-PKG-${padded}`;
      return {
        ...baseInvoice,
        invoiceNumber: invNum,
        invoiceCategory: 'multi_package',
        paymentDetails: { ...baseInvoice.paymentDetails, reference: invNum },
        packageType: 'premium',
        packageRate: 100,
        additionalNotes:
          'Comprehensive multi-discipline design, structural engineering, BOQ cost analysis, and site supervision contract with UNIVISION DESIGN AND CONSTRUCTION LTD.',
        floors: [
          {
            id: `fl-mp-arc`,
            sectionTitle: '01. ARCHITECTURAL DESIGN SCOPE (PER M²)',
            floorName: 'Ground Floor Architectural Permit Drawings',
            area: 150.0,
            customRate: 100,
            deliverables: [...ARCHITECTURAL_PACKAGES.premium.features.slice(0, 4)],
          },
          {
            id: `fl-mp-str`,
            sectionTitle: '02. STRUCTURAL ENGINEERING SCOPE (PER M²)',
            floorName: 'Reinforced Concrete Framing, BBS & Structural Calculations',
            area: 150.0,
            customRate: 85,
            deliverables: [...STRUCTURAL_PACKAGES.premium.features.slice(0, 4)],
          },
          {
            id: `fl-mp-boq`,
            sectionTitle: '03. BILLS OF QUANTITIES (FIXED RANGE BRACKET)',
            floorName: 'Bills of Quantities (BOQ) - 100 to 500 m² Fixed Scope',
            quantity: 1,
            unitLabel: 'Set',
            area: 1,
            customRate: 30000,
            areaLabel: '1 Set (Fixed Range)',
            rateLabel: '30,000 Fixed',
            amountOverride: 30000,
            deliverables: [...BOQ_PACKAGES.premium.features.slice(0, 4)],
          },
          {
            id: `fl-mp-ins`,
            sectionTitle: '04. SITE INSPECTION & SUPERVISION (FIXED PER VISIT)',
            floorName: 'Technical Foundation & Pre-Pour Field Inspection',
            quantity: 1,
            unitLabel: 'Visit',
            area: 1,
            customRate: 15000,
            areaLabel: '1 Field Visit',
            rateLabel: '15,000 / Visit',
            amountOverride: 15000,
            deliverables: [...SITE_INSPECTION_PACKAGE.includes.slice(0, 4)],
          },
        ],
        packagesConfig: {
          architectural: {
            enabled: true,
            tier: 'premium',
            rate: 100,
            area: 150.0,
            deliverables: [...ARCHITECTURAL_PACKAGES.premium.features],
          },
          structural: {
            enabled: true,
            tier: 'premium',
            rate: 85,
            area: 150.0,
            deliverables: [...STRUCTURAL_PACKAGES.premium.features],
          },
          boq: {
            enabled: true,
            tier: 'premium',
            fee: 30000,
            areaRange: '100 Sq.m - 500 Sq.m',
            deliverables: [...BOQ_PACKAGES.premium.features],
          },
          inspection: {
            enabled: true,
            tier: 'standard',
            fee: 15000,
            consultationTitle: 'SITE INSPECTION & TECHNICAL CONSULTATION',
            inspectionScope: 'On-Site Field Visit & Terrain Assessment',
            servicesList: [...SITE_INSPECTION_PACKAGE.includes],
            officialDeliverables: [...SITE_INSPECTION_PACKAGE.officialDeliverables],
            deliverables: [
              ...SITE_INSPECTION_PACKAGE.includes,
              ...SITE_INSPECTION_PACKAGE.officialDeliverables,
            ],
          },
        },
      };
    }
  }
}

export const INITIAL_INVOICES: Invoice[] = [
  createDefaultInvoiceByType('architectural', 1),
  createDefaultInvoiceByType('structural', 2),
  createDefaultInvoiceByType('boq', 3),
  createDefaultInvoiceByType('inspection', 4),
  createDefaultInvoiceByType('multi_package', 5),
];
