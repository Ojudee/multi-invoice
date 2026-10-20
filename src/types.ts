export type InvoiceStatus = 'draft' | 'issued' | 'deposit_paid' | 'paid' | 'overdue';

export type PackageType = 'regular' | 'premium' | 'custom';

export type CurrencyCode = 'GMD' | 'USD' | 'EUR' | 'GBP' | 'XOF';

export type MeasurementUnit = 'm²' | 'sq ft';

export interface FloorItem {
  id: string;
  floorName: string;
  area: number; // in m² or sq ft
  quantity?: number; // QTY for BOQ / inspection / fixed-rate items
  unitLabel?: string; // e.g. "Sets", "Visits", "Bills", "m²"
  customRate?: number; // optional custom rate override
  areaLabel?: string; // e.g. "100 - 500 m² (Fixed Range)" or "1 Visit"
  rateLabel?: string; // custom rate label
  amountOverride?: number; // optional explicit amount
  sectionTitle?: string; // optional section header for package schedule
  deliverables?: string[]; // optional key deliverables list
}

export interface AddonService {
  id: string;
  name: string;
  description: string;
  amount: number;
  enabled: boolean;
}

export interface ClientInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
}

export interface ProjectInfo {
  projectName: string;
  projectAddress: string;
  cityProvince: string;
  postalCode: string;
}

export interface PaymentDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  reference: string;
  swiftCode?: string;
  branch?: string;
  mobileMoneyProvider?: string;
  mobileMoneyNumber?: string;
}

export interface CompanyInfo {
  name: string;
  tagline: string;
  slogan: string;
  phone: string;
  email: string;
  address: string;
  bannerTitle: string;
  bannerValues: string;
  footerQuote: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate?: string;
  status: InvoiceStatus;
  
  // Parties
  company: CompanyInfo;
  client: ClientInfo;
  project: ProjectInfo;
  
  // Floor Drawing Package
  floors: FloorItem[];
  packageType: PackageType;
  packageRate: number; // e.g. 75 for regular, 100 for premium
  additionalNotes: string;
  
  // Addon services
  addons: AddonService[];
  
  // Calculations & currency
  currency: CurrencyCode;
  unit: MeasurementUnit;
  discountPercent: number;
  taxPercent: number; // e.g. 0% or 15% VAT
  depositPercent: number; // e.g. 50% advance deposit
  depositPaidAmount: number;
  
  // Legal & Financial
  terms: string[];
  paymentDetails: PaymentDetails;
  
  // Signature
  clientSignature: string; // base64 or text
  clientSignatureType: 'draw' | 'type' | 'none';
  clientSignDate: string;
  contractorSigned: boolean;
  contractorSignDate?: string;
  
  // Metadata & Archival
  createdAt: string;
  updatedAt: string;
  isArchived?: boolean;
  archivedAt?: string;

  // Separate Packages Configuration in Invoice Studio
  packagesConfig?: InvoicePackagesConfig;
  activePrintFilter?: PackageSelectionMap;
  invoiceCategory?: 'architectural' | 'structural' | 'boq' | 'inspection' | 'multi_package';
}

export interface PackageSelectionMap {
  architectural: boolean;
  structural: boolean;
  boq: boolean;
  inspection: boolean;
  addons: boolean;
}

export type PackageFilterPreset =
  | 'all'
  | 'architectural'
  | 'structural'
  | 'boq'
  | 'inspection'
  | 'addons'
  | 'arch_structural'
  | 'arch_boq'
  | 'structural_boq'
  | 'custom';

export interface InvoicePackagesConfig {
  architectural: {
    enabled: boolean;
    tier: PackageType;
    rate: number;
    area?: number;
    notes?: string;
    deliverables?: string[];
  };
  structural: {
    enabled: boolean;
    tier: PackageType;
    rate: number;
    area?: number;
    notes?: string;
    deliverables?: string[];
  };
  boq: {
    enabled: boolean;
    tier: PackageType;
    fee: number;
    areaRange?: string; // e.g. "100 Sq.m - 500 Sq.m" fixed range tier
    notes?: string;
    deliverables?: string[];
  };
  inspection: {
    enabled: boolean;
    tier?: string;
    fee: number;
    consultationTitle?: string; // e.g. "SITE INSPECTION & TECHNICAL CONSULTATION"
    inspectionScope?: string; // e.g. "Fixed Range / On-Site Physical Inspection"
    servicesList?: string[]; // Editable Included Services list
    officialDeliverables?: string[]; // Editable Official Deliverables list
    notes?: string;
    deliverables?: string[];
  };
}

export interface PackageDefinition {
  type: PackageType;
  name: string;
  rate: number;
  color: string;
  description: string;
  features: string[];
}

