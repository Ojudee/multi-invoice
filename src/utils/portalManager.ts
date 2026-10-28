import { Invoice } from '../types';
import { createDefaultInvoiceByType, INITIAL_INVOICES } from '../data/sampleInvoices';

export type DisciplineKey = 'architectural' | 'structural' | 'boq' | 'inspection';

export interface PortalConfig {
  key: DisciplineKey;
  title: string;
  shortTitle: string;
  tagline: string;
  codePrefix: string;
  iconName: 'Compass' | 'Building2' | 'FileSpreadsheet' | 'HardHat';
  themeColor: {
    primary: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    glow: string;
    headerGradient: string;
  };
  defaultRateInfo: string;
}

export const PORTAL_CONFIGS: Record<DisciplineKey, PortalConfig> = {
  architectural: {
    key: 'architectural',
    title: 'Architectural Drawing Portal',
    shortTitle: 'Architectural',
    tagline: 'Concept Planning, Working Drawings, Fenestration & Municipal Permit Sets',
    codePrefix: 'INV-ARC',
    iconName: 'Compass',
    themeColor: {
      primary: 'amber',
      border: 'border-amber-500/50',
      badgeBg: 'bg-amber-400',
      badgeText: 'text-slate-950 font-bold',
      glow: 'shadow-[0_0_20px_rgba(251,191,36,0.15)]',
      headerGradient: 'from-slate-950 via-slate-900 to-indigo-950',
    },
    defaultRateInfo: 'Regular D75/m² • Premium D100/m²',
  },
  structural: {
    key: 'structural',
    title: 'Structural Engineering Portal',
    shortTitle: 'Structural',
    tagline: 'Foundation Systems, Columns & Beams, Suspended Slabs, BBS & Calculations',
    codePrefix: 'INV-STR',
    iconName: 'Building2',
    themeColor: {
      primary: 'blue',
      border: 'border-blue-500/50',
      badgeBg: 'bg-blue-500',
      badgeText: 'text-white font-bold',
      glow: 'shadow-[0_0_20px_rgba(59,130,246,0.15)]',
      headerGradient: 'from-slate-950 via-slate-900 to-blue-950',
    },
    defaultRateInfo: 'Regular D65/m² • Premium D85/m²',
  },
  boq: {
    key: 'boq',
    title: 'Bills of Quantities (BOQ) Portal',
    shortTitle: 'BOQ Studio',
    tagline: 'Comprehensive Material Takeoffs, Trade Breakdowns & Fixed Range Brackets',
    codePrefix: 'INV-BOQ',
    iconName: 'FileSpreadsheet',
    themeColor: {
      primary: 'emerald',
      border: 'border-emerald-500/50',
      badgeBg: 'bg-emerald-500',
      badgeText: 'text-white font-bold',
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]',
      headerGradient: 'from-slate-950 via-slate-900 to-emerald-950',
    },
    defaultRateInfo: '100–500m²: D30,000 • 500–1000m²: D45,000 Fixed',
  },
  inspection: {
    key: 'inspection',
    title: 'Site Inspection & Supervision Portal',
    shortTitle: 'Site Inspection',
    tagline: 'On-Site Quality Audits, Rebar Pre-Pour Checks & Compliance Certification',
    codePrefix: 'INV-INS',
    iconName: 'HardHat',
    themeColor: {
      primary: 'orange',
      border: 'border-orange-500/50',
      badgeBg: 'bg-orange-500',
      badgeText: 'text-white font-bold',
      glow: 'shadow-[0_0_20px_rgba(249,115,22,0.15)]',
      headerGradient: 'from-slate-950 via-slate-900 to-amber-950',
    },
    defaultRateInfo: 'D15,000 / Site Visit & Compliance Audit',
  },
};

/**
 * Loads invoices for a specific discipline from isolated storage
 */
export function loadDisciplineInvoices(discipline: DisciplineKey): Invoice[] {
  try {
    const storageKey = `univision_portal_${discipline}_invoices_v4`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }

    // Attempt migration from legacy storage if exists
    const legacySaved =
      localStorage.getItem('univision_invoices_v3') ||
      localStorage.getItem('univision_invoices_v2') ||
      localStorage.getItem('univision_invoices_v1');
    if (legacySaved) {
      const parsedLegacy = JSON.parse(legacySaved);
      if (Array.isArray(parsedLegacy)) {
        const matches = parsedLegacy.filter((inv) => {
          if (!inv) return false;
          if (inv.invoiceCategory === discipline) return true;
          const num = String(inv.invoiceNumber || '').toUpperCase();
          if (discipline === 'architectural' && (num.includes('ARC') || num.includes('001'))) return true;
          if (discipline === 'structural' && (num.includes('STR') || num.includes('002'))) return true;
          if (discipline === 'boq' && (num.includes('BOQ') || num.includes('003'))) return true;
          if (discipline === 'inspection' && (num.includes('INS') || num.includes('004'))) return true;
          return false;
        });

        if (matches.length > 0) {
          saveDisciplineInvoices(discipline, matches);
          return matches;
        }
      }
    }
  } catch (e) {
    console.error(`Error loading ${discipline} portal invoices`, e);
  }

  // Fallback to official default invoice for this discipline
  const defaultInvoice = createDefaultInvoiceByType(discipline, 1);
  return [defaultInvoice];
}

/**
 * Saves invoices for a specific discipline to isolated storage
 */
export function saveDisciplineInvoices(discipline: DisciplineKey, invoices: Invoice[]): void {
  try {
    const storageKey = `univision_portal_${discipline}_invoices_v4`;
    localStorage.setItem(storageKey, JSON.stringify(invoices));
  } catch (e) {
    console.warn(`Failed to save ${discipline} invoices to storage`, e);
  }
}

/**
 * Loads active invoice ID for a specific discipline
 */
export function loadDisciplineActiveId(discipline: DisciplineKey, defaultId: string): string {
  try {
    const key = `univision_portal_${discipline}_active_id`;
    const saved = localStorage.getItem(key);
    if (saved) return saved;
  } catch {}
  return defaultId;
}

/**
 * Saves active invoice ID for a specific discipline
 */
export function saveDisciplineActiveId(discipline: DisciplineKey, id: string): void {
  try {
    const key = `univision_portal_${discipline}_active_id`;
    localStorage.setItem(key, id);
  } catch {}
}

/**
 * Loads archived invoices for a specific discipline
 */
export function loadDisciplineArchived(discipline: DisciplineKey): Invoice[] {
  try {
    const key = `univision_portal_${discipline}_archived_v1`;
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

/**
 * Saves archived invoices for a specific discipline
 */
export function saveDisciplineArchived(discipline: DisciplineKey, archived: Invoice[]): void {
  try {
    const key = `univision_portal_${discipline}_archived_v1`;
    localStorage.setItem(key, JSON.stringify(archived));
  } catch {}
}
