import React, { useState, useEffect } from "react";
import { 
  Activity as ActivityIcon, 
  ShieldCheck, 
  Clock, 
  Search, 
  Key, 
  Lock, 
  User, 
  Globe, 
  FileText,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Info,
  Monitor
} from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  ip_address?: string;
  user_agent?: string;
  details?: Record<string, any> | string | null;
  created_at: string;
}

const Activity = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/audit-logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Failed to fetch audit logs", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionBadge = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes("FAIL") || act.includes("DELETE") || act.includes("TERMINAT")) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-red-950/80 border border-red-500/40 text-red-400">
          {action}
        </span>
      );
    }
    if (act.includes("CREATE") || act.includes("LOGIN_SUCCESS") || act.includes("REGISTER")) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
          {action}
        </span>
      );
    }
    if (act.includes("ACCESSED") || act.includes("RESTORE") || act.includes("READ")) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
          {action}
        </span>
      );
    }
    if (act.includes("LOGOUT")) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-950/80 border border-amber-500/40 text-amber-300">
          {action}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-800 border border-slate-700 text-slate-300">
        {action}
      </span>
    );
  };

  const renderDetails = (details: Record<string, any> | string | null | undefined) => {
    if (!details) {
      return <span className="text-slate-500 italic">—</span>;
    }

    if (typeof details === "string") {
      return <span>{details}</span>;
    }

    if (typeof details === "object") {
      const entries = Object.entries(details);
      if (entries.length === 0) return <span className="text-slate-500 italic">—</span>;

      return (
        <div className="flex flex-wrap items-center gap-1.5 max-w-xl">
          {entries.map(([k, v]) => {
            const isId = k.toLowerCase().includes("id");
            const valStr = typeof v === "object" ? JSON.stringify(v) : String(v);
            return (
              <span 
                key={k} 
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900/80 border border-cyber-border/60 text-[11px] font-mono"
              >
                <span className="text-cyan-400/80 font-semibold">{k}:</span>
                <span className={isId ? "text-slate-400 truncate max-w-[120px]" : "text-slate-200"}>
                  {valStr}
                </span>
              </span>
            );
          })}
        </div>
      );
    }

    return <span>{String(details)}</span>;
  };

  const filteredLogs = logs.filter((l) => {
    let matchesFilter = true;
    if (actionFilter === "AUTH") {
      matchesFilter = l.action.includes("LOGIN") || l.action.includes("LOGOUT") || l.action.includes("REGISTER") || l.action.includes("SESSION");
    } else if (actionFilter === "ACCESSED") {
      matchesFilter = l.action.includes("ACCESSED") || l.action.includes("READ");
    } else if (actionFilter === "CREATED") {
      matchesFilter = l.action.includes("CREATED") || l.action.includes("REGISTER");
    } else if (actionFilter === "DELETED") {
      matchesFilter = l.action.includes("DELETED") || l.action.includes("TERMINAT");
    } else if (actionFilter !== "ALL") {
      matchesFilter = l.action.toUpperCase().includes(actionFilter.toUpperCase());
    }

    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesFilter;

    const detailsStr = l.details 
      ? (typeof l.details === "string" ? l.details : JSON.stringify(l.details)) 
      : "";

    const matchesSearch = 
      (l.action && l.action.toLowerCase().includes(q)) ||
      (l.ip_address && l.ip_address.toLowerCase().includes(q)) ||
      (l.user_agent && l.user_agent.toLowerCase().includes(q)) ||
      detailsStr.toLowerCase().includes(q);

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-cyber-dark/40 border border-cyber-border/40 p-6 rounded-2xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-blue-950/60 border border-blue-500/30 rounded-lg text-blue-400">
              <ActivityIcon className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight font-mono">
              SURVEILLANCE & SYSTEM HISTORY
            </h1>
          </div>
          <p className="text-xs text-cyber-textMuted max-w-xl">
            Real-time immutable audit trail. Tracks authentication attempts, encrypted secret read operations, configuration modifications, and disaster recovery validations.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-4 py-2 bg-cyber-dark/80 hover:bg-cyber-dark border border-cyber-border rounded-xl text-xs font-mono text-cyan-300 transition cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-cyber-textMuted" />
          <input
            type="text"
            placeholder="Filter by IP, action, or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-cyber-dark/60 border border-cyber-border/50 rounded-xl text-xs text-slate-200 placeholder-cyber-textMuted focus:outline-none focus:border-blue-500/60 transition"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { label: "ALL", key: "ALL" },
            { label: "AUTH", key: "AUTH" },
            { label: "ACCESSED", key: "ACCESSED" },
            { label: "CREATED", key: "CREATED" },
            { label: "DELETED", key: "DELETED" }
          ].map(({ label, key }) => (
            <button
              key={key}
              onClick={() => setActionFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition cursor-pointer ${
                actionFilter === key
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/40 font-semibold"
                  : "bg-cyber-dark/40 text-cyber-textMuted hover:text-slate-200 border border-cyber-border/30"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed border-cyber-border/50 rounded-2xl bg-cyber-dark/20 text-center">
          <ActivityIcon className="h-8 w-8 text-cyber-textMuted mb-2" />
          <h3 className="text-sm font-semibold text-slate-300">No activity records found</h3>
          <p className="text-xs text-cyber-textMuted mt-1">
            {logs.length > 0 ? "No records match your active search / filter." : "Actions taken in the system will automatically appear in this immutable trail."}
          </p>
        </div>
      ) : (
        <div className="bg-cyber-dark/60 border border-cyber-border/40 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-cyber-border/60 text-cyber-textMuted font-mono uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Event Action</th>
                  <th className="py-3 px-4">Source IP & Device</th>
                  <th className="py-3 px-4">Event Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-border/30 font-mono">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-cyan-950/10 transition">
                    <td className="py-3 px-4 text-cyber-textMuted whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span>{log.ip_address || "127.0.0.1"}</span>
                        {log.user_agent && (
                          <span className="text-[10px] text-cyber-textMuted truncate max-w-[180px]" title={log.user_agent}>
                            {log.user_agent}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {renderDetails(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Activity;
