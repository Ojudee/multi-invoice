// Re-export from centralized packageServicesStorage for backward compatibility
export {
  DEFAULT_BOQ_REGULAR_SERVICES,
  DEFAULT_BOQ_PREMIUM_EXTRA_SERVICES,
  getStoredPackageServices as getStoredBOQServices,
  saveStoredPackageServices as saveStoredBOQServices,
  resetPackageServicesToDefaults as resetBOQServicesToDefaults,
  usePackageServices,
  useBOQServices,
} from './packageServicesStorage';

export type { ServicePackageConfig as BOQServicesConfig } from './packageServicesStorage';
