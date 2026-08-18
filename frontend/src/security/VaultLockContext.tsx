import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

interface VaultLockContextType {
  isLocked: boolean;
  lockTimeout: number; // in minutes
  setLockTimeout: (mins: number) => void;
  lockVault: () => void;
  unlockVault: () => boolean;
  setUnlockPin: (pin: string) => void;
}

const VaultLockContext = createContext<VaultLockContextType | undefined>(undefined);

export const VaultLockProvider = ({ children }: { children: ReactNode }) => {
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [lockTimeout, setLockTimeout] = useState<number>(15); // Default 15 minutes
  const [pin, setPin] = useState<string>("1234"); // Simple local pin for demo unlocking

  const lockVault = useCallback(() => {
    setIsLocked(true);
  }, []);

  const unlockVault = useCallback(() => {
    // Demo unlocking (in production, verifies session/password)
    setIsLocked(false);
    return true;
  }, []);

  const setUnlockPin = (newPin: string) => {
    setPin(newPin);
  };

  // Activity listener for Auto-Lock after inactivity
  useEffect(() => {
    if (isLocked) return;

    let timer: any;

    const resetTimer = () => {
      clearTimeout(timer);
      if (lockTimeout > 0) {
        timer = setTimeout(() => {
          lockVault();
        }, lockTimeout * 60 * 1000);
      }
    };

    // Track user activity events
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    events.forEach(event => window.addEventListener(event, resetTimer));

    resetTimer(); // Initialize

    return () => {
      clearTimeout(timer);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [isLocked, lockTimeout, lockVault]);

  return (
    <VaultLockContext.Provider value={{ isLocked, lockTimeout, setLockTimeout, lockVault, unlockVault, setUnlockPin }}>
      {children}
    </VaultLockContext.Provider>
  );
};

export const useVaultLock = () => {
  const context = useContext(VaultLockContext);
  if (!context) {
    throw new Error("useVaultLock must be used within a VaultLockProvider");
  }
  return context;
};
