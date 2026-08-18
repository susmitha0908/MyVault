import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  Package, 
  Key, 
  Mail, 
  FileText, 
  Star, 
  Activity, 
  ShieldCheck, 
  RotateCcw, 
  Settings, 
  Lock, 
  User,
  ShieldAlert
} from "lucide-react";
import { useVaultLock } from "../security/VaultLockContext";

const Sidebar = () => {
  const location = useLocation();
  const { lockVault } = useVaultLock();

  const menuItems = [
    { name: "Dashboard", path: "/", icon: Home },
    { name: "Projects", path: "/projects", icon: Package },
    { name: "Credentials", path: "/credentials", icon: Key },
    { name: "Important Emails", path: "/emails", icon: Mail },
    { name: "Secure Notes", path: "/notes", icon: FileText },
    { name: "Favorites", path: "/favorites", icon: Star },
    { name: "Recent Activity", path: "/activity", icon: Activity },
    { name: "Security Center", path: "/security", icon: ShieldCheck },
    { name: "Recovery Center", path: "/recovery", icon: RotateCcw },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-cyber-dark border-r border-cyber-border flex flex-col justify-between h-screen text-slate-300">
      {/* Top Section - Logo & Branding */}
      <div>
        <div className="p-6 border-b border-cyber-border relative overflow-hidden group">
          {/* Subtle scanning glow back-drop */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-950/20 to-transparent group-hover:from-cyan-950/40 transition-colors pointer-events-none" />
          <h1 className="text-xl font-bold tracking-wider text-slate-100 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-cyber-accent animate-pulse" />
            <span className="bg-gradient-to-r from-white via-slate-100 to-cyber-accent bg-clip-text text-transparent">
              VAULTOPS
            </span>
          </h1>
          <p className="text-[10px] text-cyber-textMuted uppercase tracking-widest mt-1 font-mono">
            COMMAND CENTER
          </p>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-220px)]">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 border ${
                  isActive
                    ? "bg-cyan-950/40 border-cyber-accent/30 text-cyber-accent shadow-cyber-glow"
                    : "border-transparent hover:bg-slate-900/50 hover:text-slate-100 hover:border-cyber-border/40"
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? "text-cyber-accent" : "text-cyber-textMuted group-hover:text-slate-100"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section - Active Session & Lock */}
      <div className="p-4 border-t border-cyber-border bg-slate-950/40">
        <div className="flex items-center justify-between p-2 rounded-lg bg-cyber-dark border border-cyber-border/40 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-cyan-950 border border-cyber-accent/30 flex items-center justify-center">
              <User className="h-4 w-4 text-cyber-accent" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-slate-200 truncate">demo@vaultops.io</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-cyber-success animate-ping" />
                <span className="text-[9px] font-mono text-cyber-success uppercase">SECURE SESSION</span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={lockVault}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-red-950/40 bg-red-950/20 hover:bg-red-950/40 hover:border-red-500/50 text-red-400 hover:text-red-200 text-xs font-semibold tracking-wider uppercase transition-all duration-200"
        >
          <Lock className="h-3.5 w-3.5" />
          <span>Lock Vault</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
