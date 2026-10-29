import { Invoice } from '../types';
import { createDefaultInvoiceByType, INITIAL_INVOICES } from '../data/sampleInvoices';

export type PortalKey = 'general' | 'architectural' | 'structural' | 'boq' | 'inspection';

export interface PortalConfig {
  key: PortalKey;
  title: string;
  shortTitle: string;
  tagline: string;
  codePrefix: string;
  iconName: 'Sparkles' | 'Compass' | 'Building2' | 'FileSpreadsheet' | 'HardHat';
  themeColor: {
    primary: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    glow: string;
    activeTabClass: string;
  };
  defaultRateInfo: string;
  isCombinedMode?: boolean;
}

export interface PortalStorageKeys {
  invoices: string;
  activeId: string;
  archived: string;
}

export function getPortalStorageKeys(portalKey: PortalKey): PortalStorageKeys {
  return {
    invoices: `univision_portal_${portalKey}_invoices_v5`,
    activeId: `univision_portal_${portalKey}_active_id_v5`,
    archived: `univision_portal_${portalKey}_archived_v5`,
  };
}

export const PORTAL_CONFIGS: Record<PortalKey, PortalConfig> = {
  general: {
    key: 'general',
    title: 'General Invoice Studio (Combined Packages)',
    shortTitle: 'General Studio',
    tagline: 'Multi-Discipline Invoice Package Studio — Combine 2, 3, or All 4 Disciplines into One Master Invoice',
    codePrefix: 'INV-PKG',
    iconName: 'Sparkles',
    themeColor: {
      primary: 'purple',
      border: 'border-purple-500/50',
      badgeBg: 'bg-purple-500',
      badgeText: 'text-white font-bold',
      glow: 'shadow-[0_0_20px_rgba(168,85,247,0.15)]',
      activeTabClass: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400 font-bold shadow-md ring-1 ring-purple-400/50',
    },
    defaultRateInfo: 'Multi-discipline combined contract (Customizable scope)',
    isCombinedMode: true,
  },
  architectural: {
    key: 'architectural',
    title: 'Architectural Drawing Portal & Studio',
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
      activeTabClass: 'bg-amber-400 text-slate-950 border-amber-400 font-bold shadow-md ring-1 ring-amber-400/50',
    },
    defaultRateInfo: 'Regular D75/m² • Premium D100/m²',
    isCombinedMode: false,
  },
  structural: {
    key: 'structural',
    title: 'Structural Engineering Portal & Studio',
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
      activeTabClass: 'bg-blue-500 text-white border-blue-400 font-bold shadow-md ring-1 ring-blue-400/50',
    },
    defaultRateInfo: 'Regular D65/m² • Premium D85/m²',
    isCombinedMode: false,
  },
  boq: {
    key: 'boq',
    title: 'Bills of Quantities (BOQ) Portal & Studio',
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
      activeTabClass: 'bg-emerald-500 text-white border-emerald-400 font-bold shadow-md ring-1 ring-emerald-400/50',
    },
    defaultRateInfo: '100–500m²: D30,000 • 500–1000m²: D45,000 Fixed',
    isCombinedMode: false,
  },
  inspection: {
    key: 'inspection',
    title: 'Site Inspection & Supervision Portal & Studio',
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
      activeTabClass: 'bg-orange-500 text-white border-orange-400 font-bold shadow-md ring-1 ring-orange-400/50',
    },
    defaultRateInfo: 'D15,000 / Site Visit & Compliance Audit',
    isCombinedMode: false,
  },
};

/**
 * Loads invoices for a specific portal (1 of 5) from isolated storage
 */
export function loadPortalInvoices(portalKey: PortalKey): Invoice[] {
  try {
    const storageKey = getPortalStorageKeys(portalKey).invoices;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }

    // Attempt migration from v4 or legacy storage if exists
    const v4Saved = localStorage.getItem(`univision_portal_${portalKey}_invoices_v4`);
    if (v4Saved) {
      const parsedV4 = JSON.parse(v4Saved);
      if (Array.isArray(parsedV4) && parsedV4.length > 0) {
        savePortalInvoices(portalKey, parsedV4);
        return parsedV4;
      }
    }

    const legacySaved =
      localStorage.getItem('univision_invoices_v3') ||
      localStorage.getItem('univision_invoices_v2') ||
      localStorage.getItem('univision_invoices_v1');
    if (legacySaved) {
      const parsedLegacy = JSON.parse(legacySaved);
      if (Array.isArray(parsedLegacy)) {
        const matches = parsedLegacy.filter((inv) => {
          if (!inv) return false;
          if (portalKey === 'general') {
            return (
              inv.invoiceCategory === 'multi_package' ||
              String(inv.invoiceNumber || '').includes('PKG') ||
              String(inv.invoiceNumber || '').includes('GEN')
            );
          }
          if (inv.invoiceCategory === portalKey) return true;
          const num = String(inv.invoiceNumber || '').toUpperCase();
          if (portalKey === 'architectural' && num.includes('ARC')) return true;
          if (portalKey === 'structural' && num.includes('STR')) return true;
          if (portalKey === 'boq' && num.includes('BOQ')) return true;
          if (portalKey === 'inspection' && num.includes('INS')) return true;
          return false;
        });

        if (matches.length > 0) {
          savePortalInvoices(portalKey, matches);
          return matches;
        }
      }
    }
  } catch (e) {
    console.error(`Error loading ${portalKey} portal invoices`, e);
  }

  // Fallback to sample default invoice for this portal
  const categoryType = portalKey === 'general' ? 'multi_package' : portalKey;
  const defaultInvoice = createDefaultInvoiceByType(categoryType, 1);
  return [defaultInvoice];
}

/**
 * Saves invoices for a specific portal to isolated storage
 */
export function savePortalInvoices(portalKey: PortalKey, invoices: Invoice[]): boolean {
  try {
    const storageKey = getPortalStorageKeys(portalKey).invoices;
    const serialized = JSON.stringify(invoices);
    if (localStorage.getItem(storageKey) !== serialized) {
      localStorage.setItem(storageKey, serialized);
    }
    return true;
  } catch (e) {
    console.warn(`Failed to save ${portalKey} invoices to storage`, e);
    return false;
  }
}

/**
 * Loads active invoice ID for a specific portal
 */
export function loadPortalActiveId(portalKey: PortalKey, defaultId: string): string {
  try {
    const key = getPortalStorageKeys(portalKey).activeId;
    const saved = localStorage.getItem(key);
    if (saved) return saved;
  } catch (e) {
    console.error(`Failed to load ${portalKey} active invoice ID`, e);
  }
  return defaultId;
}

/**
 * Saves active invoice ID for a specific portal
 */
export function savePortalActiveId(portalKey: PortalKey, id: string): boolean {
  try {
    const key = getPortalStorageKeys(portalKey).activeId;
    if (localStorage.getItem(key) !== id) localStorage.setItem(key, id);
    return true;
  } catch (e) {
    console.warn(`Failed to save ${portalKey} active invoice ID`, e);
    return false;
  }
}

/**
 * Loads archived invoices for a specific portal
 */
export function loadPortalArchived(portalKey: PortalKey): Invoice[] {
  try {
    const key = getPortalStorageKeys(portalKey).archived;
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error(`Failed to load ${portalKey} archived invoices`, e);
  }
  return [];
}

/**
 * Saves archived invoices for a specific portal
 */
export function savePortalArchived(portalKey: PortalKey, archived: Invoice[]): boolean {
  try {
    const key = getPortalStorageKeys(portalKey).archived;
    const serialized = JSON.stringify(archived);
    if (localStorage.getItem(key) !== serialized) localStorage.setItem(key, serialized);
    return true;
  } catch (e) {
    console.warn(`Failed to save ${portalKey} archived invoices`, e);
    return false;
  }
}
