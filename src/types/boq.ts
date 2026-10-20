import { CurrencyCode } from '../types';

export type BOQSectionCode =
  | 'SEC-01' // Substructure & Earthworks
  | 'SEC-02' // Reinforced Concrete Superstructure Frame
  | 'SEC-03' // Walling, Blockwork & Masonry
  | 'SEC-04' // Roofing & Rainwater Drainage
  | 'SEC-05' // Doors, Windows & Glazing
  | 'SEC-06' // Wall, Floor & Ceiling Finishes
  | 'SEC-07' // Plumbing & Drainage Installations
  | 'SEC-08' // Electrical Installations & Fittings
  | 'SEC-09'; // Preliminaries, Site Management & Safety

export interface BOQItem {
  id: string;
  sectionCode: BOQSectionCode;
  itemNumber: string; // e.g. "1.01", "1.02", "2.05"
  description: string;
  unit: 'm' | 'm²' | 'm³' | 'kg' | 'Tons' | 'Nr' | 'Item' | 'Sum' | 'Bags' | 'Trips';
  quantity: number;
  unitRate: number; // in specified currency
  totalAmount: number; // quantity * unitRate
  specificationNotes?: string;
}

export interface BOQSectionMeta {
  code: BOQSectionCode;
  title: string;
  description: string;
  color: string;
}

export interface BOQProject {
  id: string;
  boqNumber: string;
  title: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  projectAddress: string;
  cityRegion: string;
  preparedBy: string;
  date: string;
  version: string;
  
  // Building metrics
  grossFloorArea: number; // in m²
  buildingType: string;
  currency: CurrencyCode;
  
  // Items
  items: BOQItem[];
  
  // Percentages & Adjustments
  contingencyPercent: number; // e.g. 5%
  contractorMarginPercent: number; // e.g. 10%
  taxPercent: number; // e.g. 0% or 15%
  discountPercent: number; // e.g. 0%
  
  // Summary Notes & Terms
  notes: string[];
  preparedByTitle: string;
  qsRegNumber: string;
  signedDate: string;
  isApproved: boolean;
  updatedAt: string;
}

export interface BOQCalculationSummary {
  subtotal: number;
  contingencyAmount: number;
  contractorMarginAmount: number;
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
  costPerSqm: number;
  sectionTotals: Record<BOQSectionCode, number>;
  sectionPercentages: Record<BOQSectionCode, number>;
}
