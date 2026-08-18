import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Plus, 
  Search, 
  Eye, 
  Copy, 
  Trash2, 
  Check, 
  Star, 
  Lock, 
  X, 
  Folder, 
  Layers, 
  ShieldCheck
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  environments: { id: string; name: string }[];
}

interface Tag {
  id: string;
  name: string;
}

interface NoteItem {
  id: string;
  title: string;
  is_favorite: boolean;
  project_id?: string;
  environment_id?: string;
  tags: Tag[];
  created_at: string;
  updated_at: string;
  content_masked?: boolean;
  decryptedContent?: string;
}

const Notes = () => {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Creation State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedEnvId, setSelectedEnvId] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Selected Detail Modal
  const [activeNote, setActiveNote] = useState<NoteItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notes");
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch (e) {
      console.warn("Failed to fetch notes.", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (e) {
      console.warn("Failed to fetch projects.", e);
    }
  };

  useEffect(() => {
    fetchNotes();
    fetchProjects();
  }, []);

  const handleOpenDetail = async (note: NoteItem) => {
    try {
      setDetailLoading(true);
      setActiveNote(note);
      const res = await fetch(`/api/notes/${note.id}`);
      if (res.ok) {
        const fullData = await res.json();
        setActiveNote({ ...note, decryptedContent: fullData.content });
      }
    } catch (e) {
      console.error("Failed to decrypt note detail:", e);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    try {
      setSubmitting(true);
      const payload = {
        title,
        content,
        is_favorite: isFavorite,
        project_id: selectedProjectId || null,
        environment_id: selectedEnvId || null,
        tags
      };

      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        resetForm();
        fetchNotes();
      }
    } catch (e) {
      console.error("Failed to create note:", e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this secure note?")) return;
    try {
      const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      if (res.ok) {
        setNotes(prev => prev.filter(n => n.id !== id));
        if (activeNote?.id === id) setActiveNote(null);
      }
    } catch (e) {
      console.error("Failed to delete note:", e);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setIsFavorite(false);
    setSelectedProjectId("");
    setSelectedEnvId("");
    setTags([]);
    setTagInput("");
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredNotes = notes.filter(n => {
    const matchesSearch = 
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.tags && n.tags.some(t => t.name.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesSearch;
  });

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-cyber-dark/40 border border-cyber-border/40 p-6 rounded-2xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-emerald-950/60 border border-emerald-500/30 rounded-lg text-emerald-400">
              <FileText className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight font-mono">
              SECURE NOTES & RUNBOOKS
            </h1>
          </div>
          <p className="text-xs text-cyber-textMuted max-w-xl">
            AES-256-GCM authenticated server configurations, emergency disaster recovery runbooks, deployment protocols, and cloud layout notes stored safely without server clearance.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition duration-200 cursor-pointer text-sm"
        >
          <Plus className="h-4 w-4" />
          <span>New Secure Note</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-cyber-textMuted" />
          <input
            type="text"
            placeholder="Search notes by title or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-cyber-dark/60 border border-cyber-border/50 rounded-xl text-xs text-slate-200 placeholder-cyber-textMuted focus:outline-none focus:border-emerald-500/60 transition"
          />
        </div>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed border-cyber-border/50 rounded-2xl bg-cyber-dark/20 text-center">
          <div className="p-4 bg-emerald-950/30 rounded-full text-emerald-400 mb-3">
            <FileText className="h-8 w-8 opacity-60" />
          </div>
          <h3 className="text-base font-semibold text-slate-200">No Secure Notes Found</h3>
          <p className="text-xs text-cyber-textMuted mt-1 max-w-sm">
            {searchQuery
              ? "No notes match your search."
              : "Create your first encrypted markdown note, recovery guide, or secret configuration."}
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs font-medium transition cursor-pointer"
          >
            + Create First Note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((n) => (
            <div
              key={n.id}
              className="bg-cyber-dark/50 hover:bg-cyber-dark/80 border border-cyber-border/40 hover:border-emerald-500/40 rounded-xl p-5 transition flex flex-col justify-between group relative shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-slate-100 text-sm line-clamp-1 group-hover:text-emerald-300 transition">
                    {n.title}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    {n.is_favorite && (
                      <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                    )}
                    <button
                      onClick={() => handleDeleteNote(n.id)}
                      className="text-cyber-textMuted hover:text-red-400 transition p-1 cursor-pointer"
                      title="Delete Note"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-emerald-400/80 font-mono mb-3">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Encrypted Note Payload</span>
                </div>

                {/* Tags */}
                {n.tags && n.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {n.tags.map((t) => (
                      <span
                        key={t.id}
                        className="text-[10px] bg-cyber-dark/80 border border-cyber-border/60 text-slate-400 px-2 py-0.5 rounded"
                      >
                        #{t.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-cyber-border/30 flex items-center justify-between mt-2">
                <span className="text-[10px] text-cyber-textMuted font-mono">
                  {new Date(n.created_at).toLocaleDateString()}
                </span>

                <button
                  onClick={() => handleOpenDetail(n)}
                  className="flex items-center gap-1.5 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-3 py-1 rounded-lg transition font-mono cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Decrypt & Read</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE NOTE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-cyber-dark border border-cyber-border rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-cyber-border/50 pb-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <FileText className="h-5 w-5" />
                <h2 className="text-lg font-bold font-mono text-slate-100">CREATE SECURE NOTE</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-cyber-textMuted hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNote} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">NOTE TITLE *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Disaster Recovery Runbook & Secondary Failover IP"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-cyber-dark/80 border border-cyber-border rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">LINKED PROJECT (OPTIONAL)</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => {
                      setSelectedProjectId(e.target.value);
                      setSelectedEnvId("");
                    }}
                    className="w-full px-3.5 py-2 bg-cyber-dark/80 border border-cyber-border rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">No Project Linked</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">ENVIRONMENT</label>
                  <select
                    disabled={!selectedProjectId}
                    value={selectedEnvId}
                    onChange={(e) => setSelectedEnvId(e.target.value)}
                    className="w-full px-3.5 py-2 bg-cyber-dark/80 border border-cyber-border rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500 disabled:opacity-40"
                  >
                    <option value="">Select Environment</option>
                    {selectedProject?.environments.map(env => (
                      <option key={env.id} value={env.id}>{env.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Note Content */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-mono text-slate-300">CONFIDENTIAL NOTE CONTENT (ENCRYPTED) *</label>
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Envelope Encrypted
                  </span>
                </div>
                <textarea
                  required
                  rows={8}
                  placeholder="Write your secret notes, architecture plans, SSH keys, recovery sequences..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3.5 py-2 bg-cyber-dark/80 border border-cyber-border rounded-lg text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Tags & Favorite */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <div className="flex-1">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add tag (e.g. Runbook, Prod)..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                      className="px-3 py-1.5 bg-cyber-dark/80 border border-cyber-border rounded-lg text-xs text-slate-100 flex-1 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-3 py-1.5 bg-cyber-border/60 hover:bg-cyber-border text-slate-200 rounded-lg text-xs font-mono cursor-pointer"
                    >
                      + Tag
                    </button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {tags.map(t => (
                        <span key={t} className="text-[10px] bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded flex items-center gap-1">
                          #{t}
                          <button type="button" onClick={() => handleRemoveTag(t)} className="hover:text-red-400">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-slate-300">
                  <input
                    type="checkbox"
                    checked={isFavorite}
                    onChange={(e) => setIsFavorite(e.target.checked)}
                    className="accent-emerald-500 rounded"
                  />
                  <span>Pin as Favorite ⭐</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-cyber-border/40">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-cyber-border/60 text-slate-300 rounded-xl text-xs hover:bg-cyber-border/30 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  {submitting ? "Encrypting & Storing..." : "Seal & Save Note"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL DECRYPTED MODAL */}
      {activeNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-cyber-dark border border-emerald-500/40 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-start justify-between border-b border-cyber-border/50 pb-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-100">
                  {activeNote.title}
                </h2>
                <p className="text-xs text-cyber-textMuted font-mono mt-0.5">
                  Created: {new Date(activeNote.created_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setActiveNote(null)}
                className="text-cyber-textMuted hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" /> DECRYPTED NOTE CONTENT
                </span>
                {activeNote.decryptedContent && (
                  <button
                    onClick={() => copyToClipboard(activeNote.decryptedContent!, "note-copy")}
                    className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-emerald-300 bg-cyber-dark/80 border border-cyber-border px-2.5 py-1 rounded cursor-pointer transition font-mono"
                  >
                    {copiedId === "note-copy" ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy Note</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="p-4 bg-slate-950/80 border border-cyber-border/80 rounded-xl max-h-80 overflow-y-auto">
                {detailLoading ? (
                  <div className="flex items-center justify-center py-8 text-xs font-mono text-emerald-400">
                    <Lock className="h-4 w-4 animate-spin mr-2" /> Unwrapping key and decrypting content...
                  </div>
                ) : (
                  <pre className="text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed">
                    {activeNote.decryptedContent || "No content available."}
                  </pre>
                )}
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex justify-between items-center pt-3 border-t border-cyber-border/40">
              <button
                onClick={() => handleDeleteNote(activeNote.id)}
                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-mono cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Note</span>
              </button>

              <button
                onClick={() => setActiveNote(null)}
                className="px-4 py-1.5 bg-cyber-border/60 hover:bg-cyber-border text-slate-200 rounded-lg text-xs font-mono cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notes;
