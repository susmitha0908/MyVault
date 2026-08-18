import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import { useVaultLock } from "../security/VaultLockContext";
import { ShieldAlert, Unlock, ShieldAlert as LockIcon, RefreshCw, KeyRound, Search, Bell, Lock } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  onSearch?: (query: string) => void;
}

const DashboardLayout = ({ children, onSearch }: DashboardLayoutProps) => {
  const { isLocked, unlockVault } = useVaultLock();
  const [password, setPassword] = useState("");
  const [unlockError, setUnlockError] = useState(false);
  const [searchVal, setSearchVal] = useState("");

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "password123" || password === "1234") {
      unlockVault();
      setPassword("");
      setUnlockError(false);
    } else {
      setUnlockError(true);
      // Automatically clear error after 3 seconds
      setTimeout(() => setUnlockError(false), 3000);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchVal);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-cyber-bg text-slate-200">
      {/* 1. Main Navigation Sidebar */}
      <Sidebar />

      {/* 2. Content Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Topbar */}
        <header className="h-16 border-b border-cyber-border/80 bg-cyber-dark/40 backdrop-blur-cyber flex items-center justify-between px-8 z-10">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative w-96">
            <input
              type="text"
              placeholder="Search credentials, projects, notes, tags..."
              value={searchVal}
              onChange={(e) => {
                setSearchVal(e.target.value);
                if (onSearch) onSearch(e.target.value);
              }}
              className="w-full bg-[#0d1420]/80 border border-cyber-border/60 hover:border-cyber-border focus:border-cyber-accent rounded-lg py-1.5 pl-10 pr-4 text-xs text-slate-100 placeholder-cyber-textMuted outline-none transition-all duration-200"
            />
            <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-cyber-textMuted" />
          </form>

          {/* User Operations */}
          <div className="flex items-center gap-6">
            {/* Status Shield */}
            <div className="flex items-center gap-2 bg-[#0c1e28] border border-cyan-950 px-3 py-1 rounded-full text-[10px] text-cyber-accent font-mono">
              <ShieldAlert className="h-3 w-3 animate-pulse" />
              <span>ENVELOPE ENCRYPTION ENABLED</span>
            </div>

            {/* Notifications */}
            <button className="relative p-1.5 rounded-lg border border-cyber-border/40 hover:bg-slate-900/60 hover:text-cyber-accent transition-colors">
              <Bell className="h-4 w-4 text-cyber-textMuted" />
              <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-cyber-warning" />
            </button>
            
            {/* Profile Avatar */}
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-cyber-accent/10 border border-cyber-accent/40 flex items-center justify-center font-bold text-xs text-cyber-accent">
                OP
              </div>
            </div>
          </div>
        </header>

        {/* Inner Content Dashboard Pane */}
        <main className="flex-1 overflow-y-auto bg-cyber-bg/95 p-8 relative">
          {children}
        </main>

        {/* 3. Glassmorphic Security Locked Screen Overlay */}
        {isLocked && (
          <div className="absolute inset-0 bg-[#060a12]/95 backdrop-blur-cyber z-50 flex items-center justify-center">
            <div className="max-w-md w-full p-8 rounded-xl border border-red-950/40 bg-[#0e1422] shadow-cyber-glow-strong text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-red-600" />
              <div className="flex justify-center mb-6">
                <div className="h-16 w-16 rounded-full bg-red-950/30 border border-red-500/30 flex items-center justify-center shadow-lg">
                  <Lock className="h-7 w-7 text-red-500 animate-pulse" />
                </div>
              </div>
              
              <h2 className="text-xl font-bold text-slate-100 tracking-wider">VAULT LOCKED</h2>
              <p className="text-xs text-cyber-textMuted mt-2 font-mono">
                VAULTOPS ENVELOPE IS CURRENTLY SEALED
              </p>
              
              <form onSubmit={handleUnlock} className="mt-6 space-y-4">
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Enter security key or password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full bg-cyber-dark/80 border ${
                      unlockError ? "border-red-500" : "border-cyber-border/80"
                    } focus:border-cyber-accent rounded-lg py-2.5 pl-10 pr-4 text-sm text-center text-slate-100 placeholder-cyber-textMuted outline-none transition-all duration-200`}
                    autoFocus
                  />
                  <KeyRound className="absolute left-3 top-3 h-4 w-4 text-cyber-textMuted" />
                </div>

                {unlockError && (
                  <p className="text-xs text-red-400 font-semibold uppercase tracking-wider animate-bounce">
                    Decryption key mismatch! ACCESS DENIED.
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-cyber-accent hover:bg-cyan-400 text-slate-950 text-xs font-bold uppercase tracking-widest transition-all duration-200"
                >
                  <Unlock className="h-3.5 w-3.5" />
                  <span>Decrypt & Unlock</span>
                </button>
              </form>
              
              <div className="mt-6 text-[10px] text-cyber-textMuted border-t border-cyber-border/40 pt-4 flex justify-between font-mono">
                <span>TIMEOUT SECURE</span>
                <span>DEMO PIN: password123</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardLayout;
