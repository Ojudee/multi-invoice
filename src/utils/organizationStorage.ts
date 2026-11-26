import { requireSupabase } from '../services/supabaseClient';

const ACTIVE_ORGANIZATION_KEY = 'univision_auth_active_org';
const AUTH_STORAGE_KEY = 'univision_auth_v1';
const DATA_SYNC_EVENT = 'organization_data_sync_status';
const writeQueues = new Map<string, Promise<void>>();
const syncFailures = new Map<string, Map<string, string>>();

export function getActiveOrganizationId(): string | null {
  try {
    return sessionStorage.getItem(ACTIVE_ORGANIZATION_KEY);
  } catch {
    return null;
  }
}

export function setActiveOrganizationId(organizationId: string): void {
  sessionStorage.setItem(ACTIVE_ORGANIZATION_KEY, organizationId);
}

export function getOrganizationStorageKey(key: string, organizationId = getActiveOrganizationId()): string {
  return organizationId ? `org_${organizationId}_${key}` : key;
}

export function migrateLegacyOrganizationData(organizationId: string): void {
  let oldUnivisionOrganizationId: string | null = null;
  try {
    const rawAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (rawAuth) {
      const localAuth = JSON.parse(rawAuth) as {
        organizations?: Array<{ id?: string; name?: string }>;
      };
      oldUnivisionOrganizationId =
        localAuth.organizations?.find((organization) =>
          organization.name?.toLowerCase().includes('univision')
        )?.id || null;
    }
  } catch (error) {
    console.warn('Unable to inspect browser account metadata during Univision data migration.', error);
  }

  const keysToMigrate: string[] = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (
      (key?.startsWith('univision_') && !key.startsWith('univision_auth_')) ||
      (oldUnivisionOrganizationId &&
        key?.startsWith(`org_${oldUnivisionOrganizationId}_univision_`))
    ) {
      keysToMigrate.push(key);
    }
  }

  keysToMigrate.forEach((key) => {
    const legacyKey = oldUnivisionOrganizationId
      ? key.replace(`org_${oldUnivisionOrganizationId}_`, '')
      : key;
    const scopedKey = getOrganizationStorageKey(legacyKey, organizationId);
    if (localStorage.getItem(scopedKey) === null) {
      const value = localStorage.getItem(key);
      if (value !== null) localStorage.setItem(scopedKey, value);
    }
  });
}

function dispatchSyncStatus(
  organizationId: string,
  status: 'pending' | 'saved' | 'error',
  message?: string
): void {
  window.dispatchEvent(
    new CustomEvent(DATA_SYNC_EVENT, {
      detail: { organizationId, status, message },
    })
  );
}

export async function hydrateOrganizationStorage(
  organizationId: string,
  importLegacyUnivisionData = false
): Promise<void> {
  setActiveOrganizationId(organizationId);
  if (importLegacyUnivisionData) migrateLegacyOrganizationData(organizationId);

  const client = requireSupabase();
  const { data: rows, error } = await client
    .from('organization_data')
    .select('storage_key,value')
    .eq('organization_id', organizationId);
  if (error) throw new Error(`Unable to load organization data: ${error.message}`);

  const remoteValues = new Map((rows || []).map((row) => [row.storage_key, row.value]));
  if (importLegacyUnivisionData) {
    const prefix = `org_${organizationId}_`;
    const localEntries: Array<{ key: string; value: string }> = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key?.startsWith(prefix)) continue;
      const storageKey = key.slice(prefix.length);
      if (!storageKey.startsWith('univision_')) continue;
      const value = localStorage.getItem(key);
      if (value !== null && !remoteValues.has(storageKey)) localEntries.push({ key: storageKey, value });
    }

    if (localEntries.length > 0) {
      const { error: importError } = await client.from('organization_data').upsert(
        localEntries.map((entry) => ({
          organization_id: organizationId,
          storage_key: entry.key,
          value: entry.value,
        })),
        { onConflict: 'organization_id,storage_key', ignoreDuplicates: true }
      );
      if (importError) throw new Error(`Unable to import existing Univision data: ${importError.message}`);
      localEntries.forEach((entry) => remoteValues.set(entry.key, entry.value));
    }
  }

  const prefix = `org_${organizationId}_`;
  const cachedKeys: string[] = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key?.startsWith(prefix) && key.slice(prefix.length).startsWith('univision_')) {
      cachedKeys.push(key);
    }
  }
  cachedKeys.forEach((key) => {
    const storageKey = key.slice(prefix.length);
    if (!remoteValues.has(storageKey)) localStorage.removeItem(key);
  });

  remoteValues.forEach((value, storageKey) => {
    localStorage.setItem(`${prefix}${storageKey}`, value);
  });
}

export function persistOrganizationValue(storageKey: string, value: string): void {
  const match = storageKey.match(/^org_([0-9a-f-]+)_(univision_.+)$/i);
  if (!match) return;

  const [, organizationId, key] = match;
  dispatchSyncStatus(organizationId, 'pending');
  const previous = writeQueues.get(`${organizationId}:${key}`) || Promise.resolve();
  const write = previous
    .catch(() => undefined)
    .then(async () => {
      const { error } = await requireSupabase()
        .from('organization_data')
        .upsert(
          { organization_id: organizationId, storage_key: key, value },
          { onConflict: 'organization_id,storage_key' }
        );
      if (error) throw new Error(error.message);
    });

  writeQueues.set(`${organizationId}:${key}`, write);
  void write.then(() => {
    const organizationFailures = syncFailures.get(organizationId);
    organizationFailures?.delete(key);
    if (organizationFailures?.size) {
      dispatchSyncStatus(organizationId, 'error', [...organizationFailures.values()][0]);
    } else {
      syncFailures.delete(organizationId);
      dispatchSyncStatus(organizationId, 'saved');
    }
  }, (error: unknown) => {
    let organizationFailures = syncFailures.get(organizationId);
    if (!organizationFailures) {
      organizationFailures = new Map();
      syncFailures.set(organizationId, organizationFailures);
    }
    organizationFailures.set(
      key,
      error instanceof Error ? error.message : 'Unable to save organization data to the server.'
    );
    dispatchSyncStatus(organizationId, 'error', [...organizationFailures.values()][0]);
  });
}
