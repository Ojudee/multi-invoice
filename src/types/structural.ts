import { CurrencyCode } from '../types';

export type BuildingTypology =
  | 'bungalow'
  | 'two_storey'
  | 'multi_storey'
  | 'commercial'
  | 'industrial'
  | 'boundary_wall';

export type DesignCodeStandard =
  | 'Eurocode 2 (EN 1992-1-1)'
  | 'British Standard (BS 8110:1997)'
  | 'American Concrete Institute (ACI 318-19)';

export type FoundationType =
  | 'Isolated Pad Footings'
  | 'Strip Footings & Plinth Beam'
  | 'Raft / Mat Foundation'
  | 'Pile Foundations & Caps';

export type ConcreteGrade = 'C20/25' | 'C25/30' | 'C30/37' | 'C35/45';
export type SteelGrade = 'Grade 500 (B500B / High Yield)' | 'Grade 460 (BS 4449)' | 'Mild Steel (250 N/mm²)';

export interface StructuralMember {
  id: string;
  memberType: 'Footing' | 'Column' | 'Ground Beam' | 'Suspended Beam' | 'Floor Slab' | 'Staircase' | 'Roof Truss';
  mark: string; // e.g. "F1", "C1", "B1", "S1"
  description: string;
  dimensions: string; // e.g. "1200 x 1200 x 300 mm" or "230 x 230 mm"
  mainBars: string; // e.g. "4Y16" or "Y12 @ 150mm c/c B&T"
  linksOrShear: string; // e.g. "Y8 @ 150mm c/c" or "Y10 @ 200mm c/c"
  concreteGrade: string; // e.g. "C25/30"
  quantity: number;
}

export interface BarBendingItem {
  id: string;
  barMark: string;
  member: string; // e.g. "Columns C1-C12"
  diameterMm: 8 | 10 | 12 | 16 | 20 | 25 | 32;
  numberOfMembers: number;
  barsPerMember: number;
  cutLengthM: number;
  totalLengthM: number;
  unitWeightKgM: number;
  totalWeightKg: number;
  shapeCode: string; // e.g. "Shape 00 (Straight)", "Shape 21 (L-Bar)", "Shape 51 (Link/Stirrup)"
}

export interface StructuralDeliverable {
  id: string;
  drawingNumber: string;
  title: string;
  scale: string;
  status: 'Ready' | 'In Progress' | 'Reviewed';
}

export interface StructuralProject {
  id: string;
  projectNumber: string;
  title: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  siteLocation: string;
  cityRegion: string;
  engineerName: string;
  engineerTitle: string;
  engineerRegNo: string;
  date: string;
  revision: string;
  
  // Design Parameters
  typology: BuildingTypology;
  totalFloorArea: number; // in m²
  designCode: DesignCodeStandard;
  soilBearingCapacity: number; // in kN/m² (e.g. 150)
  foundationType: FoundationType;
  concreteGrade: ConcreteGrade;
  steelGrade: SteelGrade;
  coverFoundationMm: number; // default 50mm
  coverBeamsMm: number; // default 30mm
  coverColumnsMm: number; // default 30mm
  coverSlabsMm: number; // default 20mm
  
  // Load Assumptions (kN/m²)
  deadLoadFinishes: number; // default 1.5 kN/m²
  deadLoadPartitions: number; // default 1.0 kN/m²
  liveLoadFloor: number; // default 1.5 for residential, 3.0 for commercial
  liveLoadRoof: number; // default 0.75 kN/m²
  basicWindSpeed: number; // default 28 m/s (West Africa coastal)
  
  // Members & BBS
  members: StructuralMember[];
  bbsItems: BarBendingItem[];
  deliverables: StructuralDeliverable[];
  
  // Fee & Billing Structure
  pricingModel: 'rate_per_sqm' | 'lump_sum' | 'percentage';
  ratePerSqm: number; // default GMD 65 or 75
  lumpSumAmount: number;
  percentageOfEstCost: number; // default 2.5%
  estimatedConstructionCost: number;
  supervisionIncluded: boolean;
  supervisionVisits: number;
  ratePerSupervisionVisit: number; // e.g. GMD 2,500
  currency: CurrencyCode;
  
  // Approvals & Verification
  engineerApproved: boolean;
  approvalDate: string;
  licenseStampText: string;
  notes: string;
  updatedAt: string;
}
