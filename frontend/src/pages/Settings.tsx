import React, { useState, useEffect } from "react";
import { 
  Settings as SettingsIcon, 
  ShieldCheck, 
  Clock, 
  Key, 
  Lock, 
  LogOut, 
  Laptop, 
  Database, 
  HardDrive,
  CheckCircle2,
  Trash2
} from "lucide-react";
import { useVaultLock } from "../security/VaultLockContext";

interface SessionItem {
  id: string;
  ip_address: string;
  user_agent?: string;
  created_at: string;
  last_active: string;
  is_active: boolean;
}

const Settings = () => {
  const { lockVault } = useVaultLock();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeoutMinutes, setTimeoutMinutes] = useState(15);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (e) {
      console.error("Failed to fetch sessions", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleTerminateRemote = async () => {
    if (!confirm("Are you sure you want to log out all other active devices/sessions?")) return;
    try {
      const res = await fetch("/api/auth/sessions/terminate-all", { method: "POST" });
      if (res.ok) {
        fetchSessions();
      }
    } catch (e) {
      console.error("Failed to terminate remote sessions", e);
    }
  };

  const handleSaveTimeout = () => {
    localStorage.setItem("vaultops_timeout_minutes", timeoutMinutes.toString());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-cyber-dark/40 border border-cyber-border/40 p-6 rounded-2xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-slate-800 border border-cyber-border rounded-lg text-slate-300">
              <SettingsIcon className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight font-mono">
              SYSTEM SETTINGS & VAULT SECURITY
            </h1>
          </div>
          <p className="text-xs text-cyber-textMuted max-w-xl">
            Configure automatic inactivity lock timers, monitor active user login sessions, manage encryption keys, and review system storage parameters.
          </p>
        </div>

        <button
          onClick={lockVault}
          className="flex items-center gap-2 bg-red-950/60 hover:bg-red-900/60 border border-red-500/40 text-red-300 px-4 py-2.5 rounded-xl font-mono text-xs cursor-pointer shadow-md transition"
        >
          <Lock className="h-4 w-4" />
          <span>Lock Vault Now</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security & Inactivity Timers */}
        <div className="bg-cyber-dark/40 border border-cyber-border/40 p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold text-sm">
            <Clock className="h-4 w-4" />
            <span>VAULT AUTO-LOCK POLICY</span>
          </div>
          <p className="text-xs text-cyber-textMuted">
            Specify the duration of keyboard/mouse inactivity after which the vault screen seals and requires PIN / password re-authentication.
          </p>

          <div className="space-y-2 pt-2">
            <label className="block text-xs font-mono text-slate-300">INACTIVITY TIMEOUT</label>
            <div className="grid grid-cols-4 gap-2">
              {[5, 15, 30, 60].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setTimeoutMinutes(mins)}
                  className={`py-2 px-3 rounded-lg text-xs font-mono transition cursor-pointer ${
                    timeoutMinutes === mins
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50"
                      : "bg-cyber-dark/60 text-slate-400 border border-cyber-border/40 hover:text-slate-200"
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={handleSaveTimeout}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-xs cursor-pointer transition shadow-md"
            >
              Save Policy
            </button>
            {savedSuccess && (
              <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Policy updated!
              </span>
            )}
          </div>
        </div>

        {/* Database & Keyring Info */}
        <div className="bg-cyber-dark/40 border border-cyber-border/40 p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-sm">
            <Database className="h-4 w-4" />
            <span>STORAGE & ENCRYPTION CONFIGURATION</span>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div className="p-3 bg-slate-950/60 border border-cyber-border/40 rounded-xl space-y-1">
              <span className="text-[10px] text-cyber-textMuted uppercase block">Database Engine</span>
              <span className="text-slate-200 font-semibold">SQLite 3 / PostgreSQL 15 Compatible</span>
            </div>

            <div className="p-3 bg-slate-950/60 border border-cyber-border/40 rounded-xl space-y-1">
              <span className="text-[10px] text-cyber-textMuted uppercase block">Encryption Standard</span>
              <span className="text-cyan-400 font-semibold">AES-256-GCM Envelope Encryption</span>
            </div>

            <div className="p-3 bg-slate-950/60 border border-cyber-border/40 rounded-xl space-y-1">
              <span className="text-[10px] text-cyber-textMuted uppercase block">Key Encryption Key (KEK)</span>
              <span className="text-emerald-400 font-semibold">Master KEK Active (Simulated KMS / AWS KMS)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Sessions Management */}
      <div className="bg-cyber-dark/40 border border-cyber-border/40 p-6 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold text-sm">
            <Laptop className="h-4 w-4" />
            <span>ACTIVE LOGIN SESSIONS</span>
          </div>

          <button
            onClick={handleTerminateRemote}
            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-mono cursor-pointer transition"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Terminate All Remote Sessions</span>
          </button>
        </div>

        {loading ? (
          <div className="py-6 text-center text-xs font-mono text-cyber-textMuted">Loading sessions...</div>
        ) : (
          <div className="divide-y divide-cyber-border/30">
            {sessions.map((s) => (
              <div key={s.id} className="py-3 flex items-center justify-between text-xs font-mono">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-200">{s.ip_address}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/30 text-emerald-400">
                      Active
                    </span>
                  </div>
                  <p className="text-[10px] text-cyber-textMuted mt-0.5">
                    Last active: {new Date(s.last_active).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
