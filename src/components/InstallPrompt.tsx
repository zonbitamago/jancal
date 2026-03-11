import React, { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'jancal_install_dismissed';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7日間

function isDismissed(): boolean {
  const raw = localStorage.getItem(DISMISSED_KEY);
  if (!raw) return false;
  const ts = Number(raw);
  if (Date.now() - ts < DISMISS_DURATION_MS) return true;
  localStorage.removeItem(DISMISSED_KEY);
  return false;
}

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);
}

function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
    || ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true);
}

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOS, setShowIOS] = useState(false);
  const [visible, setVisible] = useState(false);

  const handleBeforeInstall = useCallback((e: Event) => {
    e.preventDefault();
    setDeferredPrompt(e as BeforeInstallPromptEvent);
    if (!isDismissed()) setVisible(true);
  }, []);

  useEffect(() => {
    if (isStandalone()) return;

    // Android / Chrome
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // iOS Safari
    if (isIOS() && !isDismissed()) {
      setShowIOS(true);
      setVisible(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, [handleBeforeInstall]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={styles.banner}>
      <div style={styles.content}>
        <div style={styles.textArea}>
          <div style={styles.title}>アプリをインストール</div>
          <div style={styles.desc}>
            {showIOS
              ? <>
                  <span style={styles.icon}>⬆</span> をタップし
                  「ホーム画面に追加」を選択
                </>
              : 'ホーム画面に追加してすぐにアクセス'}
          </div>
        </div>
        <div style={styles.actions}>
          {!showIOS && (
            <button onClick={handleInstall} style={styles.installBtn}>
              インストール
            </button>
          )}
          <button onClick={handleDismiss} style={styles.dismissBtn}>
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  banner: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    padding: '12px 16px',
    paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
    background: 'linear-gradient(180deg, #162032 0%, #0D2847 100%)',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  content: {
    maxWidth: 480,
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  textArea: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: '#ECC94B',
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 2,
  },
  desc: {
    color: '#aaa',
    fontSize: 12,
    lineHeight: 1.4,
  },
  icon: {
    display: 'inline-block',
    fontSize: 14,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  installBtn: {
    background: '#ECC94B',
    color: '#0C1222',
    border: 'none',
    borderRadius: 8,
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  dismissBtn: {
    background: 'transparent',
    border: 'none',
    color: '#666',
    fontSize: 18,
    cursor: 'pointer',
    padding: 4,
    lineHeight: 1,
  },
};
