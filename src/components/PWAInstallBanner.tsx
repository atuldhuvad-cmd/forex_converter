import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, CheckCircle, Share, PlusSquare } from 'lucide-react';

interface PWAInstallBannerProps {
  canInstall: boolean;
  onInstall: () => void;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ canInstall, onInstall }) => {
  const [dismissed, setDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running inside installed standalone PWA
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(isPWA);

    // Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const isDismissed = localStorage.getItem('forex_pwa_install_dismissed');
    if (isDismissed) setDismissed(true);
  }, []);

  if (dismissed || isStandalone) return null;
  if (!canInstall && !isIOS) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('forex_pwa_install_dismissed', 'true');
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xs text-xs sm:text-sm text-slate-300 flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <Smartphone className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-white text-sm sm:text-base">
            Install ForexTracker for Offline Access
          </h4>
          <p className="text-slate-400 text-xs">
            {isIOS ? (
              <span className="flex items-center gap-1">
                Tap <Share className="w-3.5 h-3.5 text-blue-400 inline" /> Share, then{' '}
                <PlusSquare className="w-3.5 h-3.5 text-blue-400 inline" /> 'Add to Home Screen'
              </span>
            ) : (
              'Install as a native standalone app on Mobile or Desktop with full offline support.'
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {canInstall && (
          <button
            onClick={onInstall}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Install App
          </button>
        )}
        <button
          onClick={handleDismiss}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
