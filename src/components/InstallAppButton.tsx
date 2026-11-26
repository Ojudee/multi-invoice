import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface InstallAppButtonProps {
  compact?: boolean;
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

function isAppInstalled(): boolean {
  const navigatorWithStandalone = navigator as NavigatorWithStandalone;
  return window.matchMedia('(display-mode: standalone)').matches || navigatorWithStandalone.standalone === true;
}

export function InstallAppButton({ compact = false }: InstallAppButtonProps) {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isAppInstalled);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const handleInstallAvailable = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      setShowInstructions(false);
    };

    window.addEventListener('beforeinstallprompt', handleInstallAvailable);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallAvailable);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) {
      setShowInstructions(true);
      return;
    }

    const prompt = installPrompt;
    setInstallPrompt(null);
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === 'accepted') setInstalled(true);
      else setShowInstructions(true);
    } catch (error) {
      console.error('The browser could not start app installation.', error);
      setShowInstructions(true);
    }
  };

  return (
    <>
      {!installed && (
        <button
          type="button"
          onClick={() => void install()}
          className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          aria-label="Install SAQ Multi-Invoice"
          title="Install SAQ Multi-Invoice on this device"
        >
          <Download className="h-4 w-4 text-amber-300" />
          {!compact && <span>Install app</span>}
        </button>
      )}

      {showInstructions && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="install-app-title"
        >
          <section className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-700 bg-slate-900 p-5 text-slate-100 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="install-app-title" className="text-lg font-bold text-white">Install SAQ Multi-Invoice</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-300">
                  Add the app to this device for a dedicated window and home-screen icon.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowInstructions(false)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                aria-label="Close installation instructions"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-200">
              <li>On Windows, macOS, or Android, open your browser menu and choose <strong>Install app</strong> or <strong>Add to Home Screen</strong>.</li>
              <li>On iPhone or iPad, tap <strong>Share</strong> in Safari, then choose <strong>Add to Home Screen</strong>.</li>
            </ol>
            <p className="text-xs leading-relaxed text-slate-400">
              An internet connection is required to sign in and sync organization data.
            </p>
          </section>
        </div>
      )}
    </>
  );
}
