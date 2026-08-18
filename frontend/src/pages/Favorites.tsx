import React, { useState, useEffect } from "react";
import { 
  Star, 
  Key, 
  Mail, 
  FileText, 
  Folder, 
  ExternalLink, 
  Eye, 
  Copy, 
  Check, 
  ShieldCheck 
} from "lucide-react";
import { Link } from "react-router-dom";

const Favorites = () => {
  const [loading, setLoading] = useState(true);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setLoading(true);
        const [credRes, emailRes, noteRes, projRes] = await Promise.all([
          fetch("/api/credentials").then(r => r.ok ? r.json() : []),
          fetch("/api/emails").then(r => r.ok ? r.json() : []),
          fetch("/api/notes").then(r => r.ok ? r.json() : []),
          fetch("/api/projects").then(r => r.ok ? r.json() : [])
        ]);

        setCredentials(credRes.filter((c: any) => c.is_favorite));
        setEmails(emailRes.filter((e: any) => e.is_favorite));
        setNotes(noteRes.filter((n: any) => n.is_favorite));
        setProjects(projRes.filter((p: any) => p.is_favorite));
      } catch (err) {
        console.error("Failed to load favorites", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  const totalFavorites = credentials.length + emails.length + notes.length + projects.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-cyber-dark/40 border border-cyber-border/40 p-6 rounded-2xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-amber-950/60 border border-amber-500/30 rounded-lg text-amber-400">
              <Star className="h-6 w-6 fill-amber-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight font-mono">
              PINNED FAVORITES
            </h1>
          </div>
          <p className="text-xs text-cyber-textMuted max-w-xl">
            Quick-access command center hub for all your starred credentials, sensitive emails, emergency runbooks, and active deployment projects.
          </p>
        </div>

        <div className="px-4 py-2 bg-cyber-dark/80 border border-cyber-border rounded-xl text-xs font-mono text-slate-300">
          Total Pinned: <span className="text-amber-400 font-bold">{totalFavorites}</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
        </div>
      ) : totalFavorites === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed border-cyber-border/50 rounded-2xl bg-cyber-dark/20 text-center">
          <div className="p-4 bg-amber-950/30 rounded-full text-amber-400 mb-3">
            <Star className="h-8 w-8 opacity-60" />
          </div>
          <h3 className="text-base font-semibold text-slate-200">No Favorites Pinned</h3>
          <p className="text-xs text-cyber-textMuted mt-1 max-w-sm">
            Star important credentials, emails, notes, or projects anywhere in the vault to quickly access them here.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Pinned Credentials */}
          {credentials.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-mono font-bold text-cyan-400 flex items-center gap-2">
                  <Key className="h-4 w-4" /> PINNED CREDENTIALS ({credentials.length})
                </h2>
                <Link to="/credentials" className="text-xs text-cyber-textMuted hover:text-cyan-300 transition font-mono">
                  View all →
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {credentials.map((c) => (
                  <div key={c.id} className="bg-cyber-dark/50 border border-cyber-border/40 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300">
                          {c.category}
                        </span>
                        <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                      </div>
                      <h3 className="font-semibold text-slate-100 text-sm">{c.app_name}</h3>
                      <p className="text-xs text-cyber-textMuted font-mono mt-0.5">User: {c.username}</p>
                    </div>
                    <div className="pt-3 mt-3 border-t border-cyber-border/30 flex justify-end">
                      <Link to="/credentials" className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1">
                        Open in Vault <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pinned Emails */}
          {emails.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-mono font-bold text-cyan-400 flex items-center gap-2">
                  <Mail className="h-4 w-4" /> PINNED COMMUNICATIONS ({emails.length})
                </h2>
                <Link to="/emails" className="text-xs text-cyber-textMuted hover:text-cyan-300 transition font-mono">
                  View all →
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {emails.map((em) => (
                  <div key={em.id} className="bg-cyber-dark/50 border border-cyber-border/40 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300">
                          {em.category}
                        </span>
                        <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                      </div>
                      <h3 className="font-semibold text-slate-100 text-sm">{em.subject}</h3>
                      <p className="text-xs text-cyber-textMuted font-mono mt-0.5">From: {em.sender}</p>
                    </div>
                    <div className="pt-3 mt-3 border-t border-cyber-border/30 flex justify-end">
                      <Link to="/emails" className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1">
                        Open in Emails <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pinned Notes */}
          {notes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-mono font-bold text-emerald-400 flex items-center gap-2">
                  <FileText className="h-4 w-4" /> PINNED RUNBOOKS & NOTES ({notes.length})
                </h2>
                <Link to="/notes" className="text-xs text-cyber-textMuted hover:text-emerald-300 transition font-mono">
                  View all →
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {notes.map((n) => (
                  <div key={n.id} className="bg-cyber-dark/50 border border-cyber-border/40 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-300">
                          Encrypted
                        </span>
                        <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                      </div>
                      <h3 className="font-semibold text-slate-100 text-sm">{n.title}</h3>
                    </div>
                    <div className="pt-3 mt-3 border-t border-cyber-border/30 flex justify-end">
                      <Link to="/notes" className="text-xs text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1">
                        Open in Notes <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pinned Projects */}
          {projects.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-mono font-bold text-blue-400 flex items-center gap-2">
                  <Folder className="h-4 w-4" /> PINNED PROJECTS ({projects.length})
                </h2>
                <Link to="/projects" className="text-xs text-cyber-textMuted hover:text-blue-300 transition font-mono">
                  View all →
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((p) => (
                  <div key={p.id} className="bg-cyber-dark/50 border border-cyber-border/40 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/80 border border-blue-500/30 text-blue-300">
                          Project
                        </span>
                        <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                      </div>
                      <h3 className="font-semibold text-slate-100 text-sm">{p.name}</h3>
                      <p className="text-xs text-cyber-textMuted mt-1 line-clamp-2">{p.description || "No description."}</p>
                    </div>
                    <div className="pt-3 mt-3 border-t border-cyber-border/30 flex justify-end">
                      <Link to="/projects" className="text-xs text-blue-400 hover:text-blue-300 font-mono flex items-center gap-1">
                        Open Projects <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Favorites;
