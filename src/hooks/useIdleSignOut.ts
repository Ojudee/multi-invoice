import { useEffect, useRef } from 'react';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const ACTIVITY_WRITE_INTERVAL_MS = 10 * 1000;

function activityStorageKey(userId: string): string {
  return `saq_last_activity_v1_${userId}`;
}

export function resetIdleActivity(userId: string): void {
  try {
    localStorage.setItem(activityStorageKey(userId), String(Date.now()));
  } catch (error) {
    console.error('Unable to persist the sign-in activity timestamp.', error);
  }
}

export function useIdleSignOut(userId: string | undefined, onIdle: () => Promise<void>): void {
  const onIdleRef = useRef(onIdle);

  useEffect(() => {
    onIdleRef.current = onIdle;
  }, [onIdle]);

  useEffect(() => {
    if (!userId) return;

    const key = activityStorageKey(userId);
    let lastKnownActivity = Date.now();
    let lastPersistedActivity = 0;
    let timeoutStarted = false;
    let storageErrorReported = false;

    const readActivity = (): number => {
      try {
        const stored = Number(localStorage.getItem(key));
        return Number.isFinite(stored) && stored > 0 ? stored : lastKnownActivity;
      } catch (error) {
        if (!storageErrorReported) {
          storageErrorReported = true;
          console.error('Unable to read the sign-in activity timestamp.', error);
        }
        return lastKnownActivity;
      }
    };

    const writeActivity = (timestamp: number): void => {
      try {
        localStorage.setItem(key, String(timestamp));
        lastPersistedActivity = timestamp;
      } catch (error) {
        if (!storageErrorReported) {
          storageErrorReported = true;
          console.error('Unable to synchronize sign-in activity across tabs.', error);
        }
      }
    };

    const signOutForInactivity = (): void => {
      if (timeoutStarted) return;
      timeoutStarted = true;
      void onIdleRef.current().catch((error: unknown) => {
        console.error('Automatic sign-out after inactivity failed.', error);
      });
    };

    const checkInactivity = (): void => {
      if (Date.now() - readActivity() >= IDLE_TIMEOUT_MS) {
        signOutForInactivity();
      }
    };

    const recordActivity = (): void => {
      if (document.visibilityState !== 'visible' || timeoutStarted) return;
      const now = Date.now();
      if (now - readActivity() >= IDLE_TIMEOUT_MS) {
        signOutForInactivity();
        return;
      }

      lastKnownActivity = now;
      if (now - lastPersistedActivity >= ACTIVITY_WRITE_INTERVAL_MS) {
        writeActivity(now);
      }
    };

    const initialActivity = readActivity();
    if (initialActivity === lastKnownActivity) {
      writeActivity(lastKnownActivity);
    } else {
      lastKnownActivity = initialActivity;
      lastPersistedActivity = initialActivity;
    }

    checkInactivity();
    const intervalId = window.setInterval(checkInactivity, 5000);
    const activityEvents: Array<keyof DocumentEventMap> = [
      'pointerdown',
      'pointermove',
      'keydown',
      'scroll',
      'touchstart',
    ];
    activityEvents.forEach((eventName) =>
      document.addEventListener(eventName, recordActivity, { passive: true })
    );
    document.addEventListener('visibilitychange', checkInactivity);

    return () => {
      window.clearInterval(intervalId);
      activityEvents.forEach((eventName) =>
        document.removeEventListener(eventName, recordActivity)
      );
      document.removeEventListener('visibilitychange', checkInactivity);
    };
  }, [userId]);
}
