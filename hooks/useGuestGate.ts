'use client';

import { useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/stores/useAuthStore';

interface UseGuestGateOptions {
  title?: string;
  subtitle?: string;
  defaultIsRegister?: boolean;
}

export function useGuestGate() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [gateConfig, setGateConfig] = useState<UseGuestGateOptions>({});

  const requireAuth = useCallback(
    (actionCallback: () => void, options?: UseGuestGateOptions) => {
      if (!isAuthenticated) {
        setGateConfig(options || {});
        setIsAuthModalOpen(true);
        return false;
      }
      actionCallback();
      return true;
    },
    [isAuthenticated]
  );

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  return {
    isGuest: !isAuthenticated,
    isAuthModalOpen,
    requireAuth,
    closeAuthModal,
    gateConfig,
  };
}
