import { useState, useEffect, useCallback } from 'react';

export type PackageCategory = 'architectural' | 'structural' | 'boq';

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

const STORAGE_KEYS: Record<PackageCategory, string> = {
  architectural: 'univision_arch_service_packages_v1',
  structural: 'univision_struct_service_packages_v1',
  boq: 'univision_boq_service_packages_v1',
};

const EVENT_NAMES: Record<PackageCategory, string> = {
  architectural: 'univision_arch_services_changed',
  structural: 'univision_struct_services_changed',
  boq: 'univision_boq_services_changed',
};

export function getStoredPackageServices(category: PackageCategory): ServicePackageConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS[category]);
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
    console.error(`Error reading ${category} services from localStorage`, err);
  }
  return {
    regular: [...ALL_PACKAGE_DEFAULTS[category].regular],
    premiumExtra: [...ALL_PACKAGE_DEFAULTS[category].premiumExtra],
  };
}

export function saveStoredPackageServices(category: PackageCategory, config: ServicePackageConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS[category], JSON.stringify(config));
    window.dispatchEvent(new CustomEvent(EVENT_NAMES[category], { detail: config }));
    window.dispatchEvent(new Event('storage'));
  } catch (err) {
    console.error(`Error saving ${category} services to localStorage`, err);
  }
}

export function resetPackageServicesToDefaults(category: PackageCategory): ServicePackageConfig {
  const defaults: ServicePackageConfig = {
    regular: [...ALL_PACKAGE_DEFAULTS[category].regular],
    premiumExtra: [...ALL_PACKAGE_DEFAULTS[category].premiumExtra],
  };
  saveStoredPackageServices(category, defaults);
  return defaults;
}

export function usePackageServices(category: PackageCategory = 'boq') {
  const [config, setConfig] = useState<ServicePackageConfig>(() => getStoredPackageServices(category));

  useEffect(() => {
    setConfig(getStoredPackageServices(category));

    const handleUpdate = () => {
      setConfig(getStoredPackageServices(category));
    };

    const eventName = EVENT_NAMES[category];
    window.addEventListener(eventName, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(eventName, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [category]);

  const updateAllServices = useCallback(
    (newRegular: string[], newPremiumExtra: string[]) => {
      const nextConfig = { regular: newRegular, premiumExtra: newPremiumExtra };
      setConfig(nextConfig);
      saveStoredPackageServices(category, nextConfig);
    },
    [category]
  );

  const updateRegularServices = useCallback(
    (newRegular: string[]) => {
      const nextConfig = { ...config, regular: newRegular };
      setConfig(nextConfig);
      saveStoredPackageServices(category, nextConfig);
    },
    [category, config]
  );

  const updatePremiumExtraServices = useCallback(
    (newPremiumExtra: string[]) => {
      const nextConfig = { ...config, premiumExtra: newPremiumExtra };
      setConfig(nextConfig);
      saveStoredPackageServices(category, nextConfig);
    },
    [category, config]
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

  const resetDefaults = useCallback(() => {
    const defaults = resetPackageServicesToDefaults(category);
    setConfig(defaults);
  }, [category]);

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
