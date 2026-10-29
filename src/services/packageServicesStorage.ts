import { useState, useEffect, useCallback } from 'react';

export type PackageCategory = 'architectural' | 'structural' | 'boq';
export type PackageStorageScope = 'general' | 'architectural' | 'structural' | 'boq' | 'inspection';

export interface ServicePackageConfig {
  regular: string[];
  premiumExtra: string[];
}

// 01 ARCHITECTURAL DRAWING PACKAGE DEFAULT SERVICES
export const DEFAULT_ARCHITECTURAL_REGULAR_SERVICES: string[] = [
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
];

export const DEFAULT_ARCHITECTURAL_PREMIUM_EXTRA_SERVICES: string[] = [
  'Interior Layouts',
  'Ceiling & Flooring Plans',
  'Kitchen & Toilet Details',
  'Joinery Details',
  'Detailed Construction Drawings',
  'Additional Design Revisions',
  'Video Walkthrough',
  'Interior Design',
  'Photorealistic 3D Renders',
];

// 02 STRUCTURAL DRAWING PACKAGE DEFAULT SERVICES
export const DEFAULT_STRUCTURAL_REGULAR_SERVICES: string[] = [
  'Foundation Design',
  'Column Layout',
  'Beam Layout',
  'Slab Layout',
  'Roof Structure',
  'Structural Notes',
  'Construction Drawings',
];

export const DEFAULT_STRUCTURAL_PREMIUM_EXTRA_SERVICES: string[] = [
  'Structural Calculations',
  'Bar Bending Schedule (BBS)',
  'Connection Details',
  'Stair Reinforcement',
  'Retaining Wall Design',
  'Detailed Structural Sections',
  'Engineering Report & Approval Stamped Set',
];

// 03 BOQ DEFAULT SERVICES (From BQ.png Flyer)
export const DEFAULT_BOQ_REGULAR_SERVICES: string[] = [
  'Project Feasibility Consultation',
  'Quantity Take-off',
  'Material & Labor Cost Summary',
  'Detailed BOQ',
  'BOQ Report Only',
];

export const DEFAULT_BOQ_PREMIUM_EXTRA_SERVICES: string[] = [
  'Material Quantities Breakdown',
  'Labor Cost Break down',
  'Tender Documentation',
  'Procurement Schedule',
  'Cost & Quality Control',
];

export const ALL_PACKAGE_DEFAULTS: Record<PackageCategory, ServicePackageConfig> = {
  architectural: {
    regular: DEFAULT_ARCHITECTURAL_REGULAR_SERVICES,
    premiumExtra: DEFAULT_ARCHITECTURAL_PREMIUM_EXTRA_SERVICES,
  },
  structural: {
    regular: DEFAULT_STRUCTURAL_REGULAR_SERVICES,
    premiumExtra: DEFAULT_STRUCTURAL_PREMIUM_EXTRA_SERVICES,
  },
  boq: {
    regular: DEFAULT_BOQ_REGULAR_SERVICES,
    premiumExtra: DEFAULT_BOQ_PREMIUM_EXTRA_SERVICES,
  },
};

const LEGACY_STORAGE_KEYS: Record<PackageCategory, string> = {
  architectural: 'univision_arch_service_packages_v1',
  structural: 'univision_struct_service_packages_v1',
  boq: 'univision_boq_service_packages_v1',
};

function getStorageKey(category: PackageCategory, scope: PackageStorageScope): string {
  return `univision_${scope}_${category}_service_packages_v2`;
}

function getEventName(category: PackageCategory, scope: PackageStorageScope): string {
  return `univision_${scope}_${category}_services_changed`;
}

export function getStoredPackageServices(
  category: PackageCategory,
  scope: PackageStorageScope = category
): ServicePackageConfig {
  try {
    const raw = localStorage.getItem(getStorageKey(category, scope)) || localStorage.getItem(LEGACY_STORAGE_KEYS[category]);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.regular) && Array.isArray(parsed?.premiumExtra)) {
        return {
          regular: parsed.regular.filter((s: unknown) => typeof s === 'string' && s.trim().length > 0),
          premiumExtra: parsed.premiumExtra.filter((s: unknown) => typeof s === 'string' && s.trim().length > 0),
        };
      }
    }
  } catch (err) {
    console.error(`Error reading ${scope} ${category} services from localStorage`, err);
  }
  return {
    regular: [...ALL_PACKAGE_DEFAULTS[category].regular],
    premiumExtra: [...ALL_PACKAGE_DEFAULTS[category].premiumExtra],
  };
}

export function saveStoredPackageServices(
  category: PackageCategory,
  config: ServicePackageConfig,
  scope: PackageStorageScope = category
): boolean {
  try {
    localStorage.setItem(getStorageKey(category, scope), JSON.stringify(config));
    window.dispatchEvent(new CustomEvent(getEventName(category, scope), { detail: config }));
    return true;
  } catch (err) {
    console.error(`Error saving ${scope} ${category} services to localStorage`, err);
    return false;
  }
}

export function resetPackageServicesToDefaults(
  category: PackageCategory,
  scope: PackageStorageScope = category
): boolean {
  const defaults: ServicePackageConfig = {
    regular: [...ALL_PACKAGE_DEFAULTS[category].regular],
    premiumExtra: [...ALL_PACKAGE_DEFAULTS[category].premiumExtra],
  };
  return saveStoredPackageServices(category, defaults, scope);
}

export function usePackageServices(
  category: PackageCategory = 'boq',
  scope: PackageStorageScope = category
) {
  const [storedState, setStoredState] = useState(() => ({
    category,
    scope,
    config: getStoredPackageServices(category, scope),
  }));
  const config =
    storedState.category === category && storedState.scope === scope
      ? storedState.config
      : getStoredPackageServices(category, scope);

  useEffect(() => {
    setStoredState({ category, scope, config: getStoredPackageServices(category, scope) });

    const handleCustomUpdate = () => {
      setStoredState({ category, scope, config: getStoredPackageServices(category, scope) });
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.storageArea === localStorage && event.key === getStorageKey(category, scope)) {
        setStoredState({ category, scope, config: getStoredPackageServices(category, scope) });
      }
    };

    const eventName = getEventName(category, scope);
    window.addEventListener(eventName, handleCustomUpdate);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(eventName, handleCustomUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, [category, scope]);

  const updateAllServices = useCallback(
    (newRegular: string[], newPremiumExtra: string[]): boolean => {
      const nextConfig = { regular: newRegular, premiumExtra: newPremiumExtra };
      if (!saveStoredPackageServices(category, nextConfig, scope)) return false;
      setStoredState({ category, scope, config: nextConfig });
      return true;
    },
    [category, scope]
  );

  const updateRegularServices = useCallback(
    (newRegular: string[]): boolean => {
      const nextConfig = { ...config, regular: newRegular };
      if (!saveStoredPackageServices(category, nextConfig, scope)) return false;
      setStoredState({ category, scope, config: nextConfig });
      return true;
    },
    [category, config, scope]
  );

  const updatePremiumExtraServices = useCallback(
    (newPremiumExtra: string[]): boolean => {
      const nextConfig = { ...config, premiumExtra: newPremiumExtra };
      if (!saveStoredPackageServices(category, nextConfig, scope)) return false;
      setStoredState({ category, scope, config: nextConfig });
      return true;
    },
    [category, config, scope]
  );

  const addRegularService = useCallback(
    (serviceName: string) => {
      const trimmed = serviceName.trim();
      if (!trimmed) return;
      const nextRegular = [...config.regular, trimmed];
      updateRegularServices(nextRegular);
    },
    [config.regular, updateRegularServices]
  );

  const editRegularService = useCallback(
    (index: number, newName: string) => {
      const trimmed = newName.trim();
      if (!trimmed) return;
      const nextRegular = [...config.regular];
      nextRegular[index] = trimmed;
      updateRegularServices(nextRegular);
    },
    [config.regular, updateRegularServices]
  );

  const deleteRegularService = useCallback(
    (index: number) => {
      const nextRegular = config.regular.filter((_, i) => i !== index);
      updateRegularServices(nextRegular);
    },
    [config.regular, updateRegularServices]
  );

  const addPremiumExtraService = useCallback(
    (serviceName: string) => {
      const trimmed = serviceName.trim();
      if (!trimmed) return;
      const nextPremium = [...config.premiumExtra, trimmed];
      updatePremiumExtraServices(nextPremium);
    },
    [config.premiumExtra, updatePremiumExtraServices]
  );

  const editPremiumExtraService = useCallback(
    (index: number, newName: string) => {
      const trimmed = newName.trim();
      if (!trimmed) return;
      const nextPremium = [...config.premiumExtra];
      nextPremium[index] = trimmed;
      updatePremiumExtraServices(nextPremium);
    },
    [config.premiumExtra, updatePremiumExtraServices]
  );

  const deletePremiumExtraService = useCallback(
    (index: number) => {
      const nextPremium = config.premiumExtra.filter((_, i) => i !== index);
      updatePremiumExtraServices(nextPremium);
    },
    [config.premiumExtra, updatePremiumExtraServices]
  );

  const resetDefaults = useCallback((): boolean => {
    const saved = resetPackageServicesToDefaults(category, scope);
    if (!saved) return false;
    const defaults = {
      regular: [...ALL_PACKAGE_DEFAULTS[category].regular],
      premiumExtra: [...ALL_PACKAGE_DEFAULTS[category].premiumExtra],
    };
    setStoredState({ category, scope, config: defaults });
    return true;
  }, [category, scope]);

  const premiumAllServices = [...config.regular, ...config.premiumExtra];

  return {
    category,
    regularServices: config.regular,
    premiumExtraServices: config.premiumExtra,
    premiumAllServices,
    updateAllServices,
    updateRegularServices,
    updatePremiumExtraServices,
    addRegularService,
    editRegularService,
    deleteRegularService,
    addPremiumExtraService,
    editPremiumExtraService,
    deletePremiumExtraService,
    resetDefaults,
  };
}

// Backward-compatible hook for BOQ
export function useBOQServices() {
  return usePackageServices('boq');
}
