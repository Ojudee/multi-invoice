import { CompanyInfo, PackageDefinition } from '../types';

export const DEFAULT_COMPANY: CompanyInfo = {
  name: 'UNIVISION',
  tagline: 'DESIGN AND CONSTRUCTION LTD.',
  slogan: 'Build Your Vision With Us',
  phone: '+220 872104724',
  email: 'univision0111@gmail.com',
  address: 'Sukuta-jabang Highway, Sukuta Dalaba',
  bannerTitle: 'ARCHITECTURAL & STRUCTURAL ENGINEERING SERVICES',
  bannerValues: 'PROFESSIONAL | ACCURATE | RELIABLE | FAST TURNAROUND',
  footerQuote: 'Building Today, Designing Tomorrow',
};

// 01 ARCHITECTURAL DRAWING PACKAGE (from Flyer)
export const ARCHITECTURAL_PACKAGES: Record<'regular' | 'premium', PackageDefinition> = {
  regular: {
    type: 'regular',
    name: 'REGULAR PACKAGE',
    rate: 75,
    color: '#0d284d',
    description: 'Essential complete architectural drawing set for planning & building approval.',
    features: [
      '3D Exterior Visualization',
      'Concept Design',
      'Floor Plans',
      'Elevations',
      'Sections',
      'Roof Plan',
      'Site Plan',
      'Door & Window Schedule',
      'Permit-Ready Drawings',
      'PDF Drawing Set',
    ],
  },
  premium: {
    type: 'premium',
    name: 'PREMIUM PACKAGE',
    rate: 100,
    color: '#b45309',
    description: 'Everything in Regular plus detailed interior architecture, walkthrough, & joinery.',
    features: [
      '3D Exterior Visualization',
      'Interior Layouts',
      'Ceiling & Flooring Plans',
      'Kitchen & Toilet Details',
      'Joinery Details',
      'Detailed Construction Drawings',
      'Additional Design Revisions',
      'Video Walkthrough',
      'Interior Design',
    ],
  },
};

// Default alias for backward compatibility
export const PACKAGES = ARCHITECTURAL_PACKAGES;

// 02 STRUCTURAL DRAWING PACKAGE (from Flyer)
export interface StructuralPackageDef {
  type: 'regular' | 'premium';
  name: string;
  rate: number; // GMD per m²
  color: string;
  description: string;
  features: string[];
}

export const STRUCTURAL_PACKAGES: Record<'regular' | 'premium', StructuralPackageDef> = {
  regular: {
    type: 'regular',
    name: 'REGULAR PACKAGE',
    rate: 65,
    color: '#1e3a8a',
    description: 'Core structural engineering layouts, foundation design, and construction notes.',
    features: [
      'Foundation Design',
      'Column Layout',
      'Beam Layout',
      'Slab Layout',
      'Roof Structure',
      'Structural Notes',
      'Construction Drawings',
    ],
  },
  premium: {
    type: 'premium',
    name: 'PREMIUM PACKAGE',
    rate: 85,
    color: '#047857',
    description: 'Comprehensive structural package including calculations, Bar Bending Schedule, and report.',
    features: [
      'Foundation Design',
      'Column Layout',
      'Beam Layout',
      'Slab Layout',
      'Roof Structure',
      'Structural Notes',
      'Construction Drawings',
      'Structural Calculations',
      'Bar Bending Schedule (BBS)',
      'Connection Details',
      'Stair Reinforcement',
      'Retaining Wall Design',
      'Detailed Structural Sections',
      'Engineering Report',
    ],
  },
};

// 03 BILLS OF QUANTITIES (BOQ) PACKAGES (from Flyer)
export interface BOQPackageTier {
  minArea: number;
  maxArea: number;
  label: string;
  regularFee: number;
  premiumFee: number;
}

export const BOQ_TIERED_PRICING: BOQPackageTier[] = [
  {
    minArea: 100,
    maxArea: 500,
    label: '100 Sq.m - 500 Sq.m',
    regularFee: 18000,
    premiumFee: 30000,
  },
  {
    minArea: 501,
    maxArea: 1000,
    label: '500 Sq.m - 1,000 Sq.m',
    regularFee: 20000,
    premiumFee: 45000,
  },
  {
    minArea: 1001,
    maxArea: Infinity,
    label: '1,000 Sq.m plus',
    regularFee: 25000,
    premiumFee: 65000,
  },
];

export const BOQ_REGULAR_SERVICES: string[] = [
  'Project Feasibility Consultation',
  'Quantity Take-off',
  'Material & Labor Cost Summary',
  'Detailed BOQ',
  'BOQ Report Only',
];

export const BOQ_PREMIUM_EXTRA_SERVICES: string[] = [
  'Material Quantities Breakdown',
  'Labor Cost Break down',
  'Tender Documentation',
  'Procurement Schedule',
  'Cost & Quality Control',
];

export const BOQ_PREMIUM_SERVICES: string[] = [
  ...BOQ_REGULAR_SERVICES,
  ...BOQ_PREMIUM_EXTRA_SERVICES,
];

export interface BOQPackageDef {
  type: 'regular' | 'premium';
  name: string;
  badge: string;
  color: string;
  description: string;
  features: string[];
  extraFeatures?: string[];
  tiers: {
    minArea: number;
    maxArea: number;
    label: string;
    fee: number;
  }[];
}

export const BOQ_PACKAGES: Record<'regular' | 'premium', BOQPackageDef> = {
  regular: {
    type: 'regular',
    name: 'REGULAR PACKAGE',
    badge: 'Standard BOQ',
    color: '#0284c7',
    description: 'Essential bill of quantities, detailed material takeoff, and contractor tendering schedules.',
    features: BOQ_REGULAR_SERVICES,
    tiers: [
      { minArea: 100, maxArea: 500, label: '100 Sq.m - 500 Sq.m', fee: 18000 },
      { minArea: 501, maxArea: 1000, label: '500 Sq.m - 1,000 Sq.m', fee: 20000 },
      { minArea: 1001, maxArea: Infinity, label: '1,000 Sq.m plus', fee: 25000 },
    ],
  },
  premium: {
    type: 'premium',
    name: 'PREMIUM PACKAGE',
    badge: '★ Comprehensive Cost Consultancy',
    color: '#059669',
    description: 'Comprehensive quantity surveying, rate analysis, cash flow projections, tender management, and cost control.',
    features: BOQ_PREMIUM_SERVICES,
    extraFeatures: BOQ_PREMIUM_EXTRA_SERVICES,
    tiers: [
      { minArea: 100, maxArea: 500, label: '100 Sq.m - 500 Sq.m', fee: 30000 },
      { minArea: 501, maxArea: 1000, label: '500 Sq.m - 1,000 Sq.m', fee: 45000 },
      { minArea: 1001, maxArea: Infinity, label: '1,000 Sq.m plus', fee: 65000 },
    ],
  },
};

export function getBOQPackageFee(area: number, tier: 'regular' | 'premium'): number {
  if (area <= 500) {
    return tier === 'premium' ? 30000 : 18000;
  } else if (area <= 1000) {
    return tier === 'premium' ? 45000 : 20000;
  } else {
    return tier === 'premium' ? 65000 : 25000;
  }
}

// 04 SITE INSPECTION & REPORTS PACKAGE (from Flyer)
export const SITE_INSPECTION_PACKAGE = {
  name: 'SITE INSPECTION & REPORTS PACKAGE',
  fixedFee: 3500,
  currency: 'GMD',
  includes: [
    'Site Inspection and Reports',
    'Sketch plans',
    'Professional Consultation',
  ],
  officialDeliverables: [
    'Site layout sketch with boundary coordinates',
    'Soil & topography assessment notes',
    'Municipal planning regulation compliance',
    'Formal certified recommendation letter',
  ],
};

// FLYER BADGES & VALUES
export const FLYER_VALUE_PROPOSITIONS = [
  { title: 'PROFESSIONAL & RELIABLE', desc: 'Licensed experts delivering standard-compliant work.' },
  { title: 'ACCURATE & DETAILED', desc: 'Precision drawings and verified billings.' },
  { title: 'FAST TURNAROUND', desc: 'Prompt delivery without compromising quality.' },
  { title: 'CLIENT-FOCUSED SOLUTIONS', desc: 'Tailored designs matching budget & vision.' },
  { title: 'COMPETITIVE PRICING', desc: 'Transparent tiered packages with no hidden costs.' },
  { title: 'PERMIT & CONSTRUCTION READY', desc: 'Full compliance with municipality guidelines.' },
];

export const DEFAULT_TERMS: string[] = [
  'Payment terms: As agreed in the project proposal.',
  'This invoice covers the agreed design/engineering package only.',
  'Revisions beyond agreed scope may incur additional charges.',
  'Work will commence upon receipt of payment or agreed deposit.',
  'All drawings and schedules provided in official PDF format.',
];

export const BANK_PRESETS = [
  {
    bankName: 'Trust Bank Ltd (The Gambia)',
    accountName: 'UNIVISION DESIGN AND CONSTRUCTION LTD',
    accountNumber: '110-384920-01',
    branch: 'Sukuta / Senegambia Branch',
    swiftCode: 'TBLGGMB1',
    mobileMoneyProvider: 'Wave & QMoney',
    mobileMoneyNumber: '+220 872104724',
  },
  {
    bankName: 'Ecobank The Gambia',
    accountName: 'UNIVISION DESIGN AND CONSTRUCTION LTD',
    accountNumber: '003-012948-22',
    branch: 'Kairaba Avenue Branch',
    swiftCode: 'ECOCGMGM',
    mobileMoneyProvider: 'Afrimoney',
    mobileMoneyNumber: '+220 7712390',
  },
  {
    bankName: 'Guaranty Trust Bank (Gambia) Ltd',
    accountName: 'UNIVISION DESIGN AND CONSTRUCTION LTD',
    accountNumber: '204-108745-110',
    branch: 'Brusubi Roundabout Branch',
    swiftCode: 'GTBKGMB1',
    mobileMoneyProvider: 'Wave',
    mobileMoneyNumber: '+220 872104724',
  },
];

export const ARCHITECTURAL_ADDONS_PRESETS = [
  {
    id: 'addon-structural-reg',
    name: 'Structural Drawing Package (Regular)',
    description: 'Foundation, column, beam, slab layouts and structural notes.',
    amount: 15000,
  },
  {
    id: 'addon-structural-prem',
    name: 'Structural Drawing Package (Premium)',
    description: 'Includes BBS, structural calculations, connection details, and engineering report.',
    amount: 22000,
  },
  {
    id: 'addon-boq-reg',
    name: 'Bills of Quantities (BOQ) - Regular Package',
    description: 'Project Feasibility Consultation, Quantity Take-off, Material & Labor Cost Summary, Detailed BOQ, BOQ Report Only.',
    amount: 18000,
  },
  {
    id: 'addon-boq-prem',
    name: 'Bills of Quantities (BOQ) - Premium Package',
    description: 'Everything in Regular plus: Material Quantities Breakdown, Labor Cost Break down, Tender Documentation, Procurement Schedule, Cost & Quality Control.',
    amount: 30000,
  },
  {
    id: 'addon-boq',
    name: 'Bills of Quantities (BOQ)',
    description: 'Complete material takeoff, measured trade rates, and cost estimation.',
    amount: 18000,
  },
  {
    id: 'addon-inspection',
    name: 'Site Inspection & Reports Package',
    description: 'Physical site visit, condition inspection report, sketch plans & consultation.',
    amount: 3500,
  },
  {
    id: 'addon-vr',
    name: '3D VR Interactive Walkthrough',
    description: 'Immersive 360-degree virtual reality tour compatible with web and mobile.',
    amount: 12500,
  },
];
