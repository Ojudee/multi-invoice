import { Dispatch, SetStateAction, useEffect, useState } from 'react';

export type PortalSaveStatus = 'saved' | 'error';

export function usePortalStorage<T>(
  key: string,
  initialValue: T,
  isValid: (value: unknown) => value is T
): [T, Dispatch<SetStateAction<T>>, PortalSaveStatus] {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) {
        const parsed: unknown = JSON.parse(saved);
        if (isValid(parsed)) return parsed;
        console.warn(`Ignoring invalid saved portal data for ${key}`);
      }
    } catch (error) {
      console.error(`Unable to load saved portal data for ${key}`, error);
    }
    return initialValue;
  });
  const [saveStatus, setSaveStatus] = useState<PortalSaveStatus>('saved');

  useEffect(() => {
    try {
      const serialized = JSON.stringify(value);
      if (localStorage.getItem(key) !== serialized) {
        localStorage.setItem(key, serialized);
      }
      setSaveStatus('saved');
    } catch (error) {
      console.error(`Unable to save portal data for ${key}`, error);
      setSaveStatus('error');
    }
  }, [key, value]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.storageArea !== localStorage || event.key !== key || event.newValue === null) return;
      try {
        const parsed: unknown = JSON.parse(event.newValue);
        if (!isValid(parsed)) {
          console.warn(`Ignoring invalid portal data update for ${key}`);
          return;
        }
        setValue((current) => JSON.stringify(current) === event.newValue ? current : parsed);
      } catch (error) {
        console.error(`Unable to read portal data update for ${key}`, error);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [key, isValid]);

  return [value, setValue, saveStatus];
}
