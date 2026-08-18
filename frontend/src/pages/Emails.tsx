import React, { useState, useEffect } from "react";
import { 
  Mail, 
  Plus, 
  Search, 
  Eye, 
  EyeOff, 
  Copy, 
  Trash2, 
  Check, 
  Star, 
  Lock, 
  X, 
  Folder, 
  Layers, 
  Calendar,
  User,
  Tag as TagIcon,
  ShieldCheck,
  Filter,
  FileText
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

interface EmailItem {
  id: string;
  subject: string;
  sender: string;
  sent_date: string;
  category: string;
  notes?: string;
  is_favorite: boolean;
  project_id?: string;
  environment_id?: string;
  tags: Tag[];
  created_at: string;
  body_masked?: boolean;
  decryptedBody?: string;
  isRevealed?: boolean;
}

const CATEGORIES = [
  "All",
  "Banking & Financial",
  "Cloud & Hosting",
  "Domain & DNS",
  "Security Alert",
  "Server Notice",
  "Client Communication",
  "Other"
];

const Emails = () => {
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Creation State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [sender, setSender] = useState("");
  const [sentDate, setSentDate] = useState(new Date().toISOString().split("T")[0]);
  const [body, setBody] = useState("");
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState("Cloud & Hosting");
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedEnvId, setSelectedEnvId] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Selected Detail Modal
  const [activeEmail, setActiveEmail] = useState<EmailItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/emails");
      if (res.ok) {
        const data = await res.json();
        setEmails(data.map((em: any) => ({ ...em, isRevealed: false })));
      }
    } catch (e) {
      console.warn("Failed to fetch emails.", e);
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
    fetchEmails();
    fetchProjects();
  }, []);

  const handleOpenDetail = async (email: EmailItem) => {
    try {
      setDetailLoading(true);
      setActiveEmail(email);
      const res = await fetch(`/api/emails/${email.id}`);
      if (res.ok) {
        const fullData = await res.json();
        setActiveEmail({ ...email, decryptedBody: fullData.body, isRevealed: true });
      }
    } catch (e) {
      console.error("Failed to decrypt email detail:", e);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !sender || !body) return;

    try {
      setSubmitting(true);
      const payload = {
        subject,
        sender,
        sent_date: sentDate ? new Date(sentDate).toISOString() : new Date().toISOString(),
        body,
        notes: notes || null,
        category,
        is_favorite: isFavorite,
        project_id: selectedProjectId || null,
        environment_id: selectedEnvId || null,
        tags
      };

      const res = await fetch("/api/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        resetForm();
        fetchEmails();
      }
    } catch (e) {
      console.error("Failed to create email:", e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEmail = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this secure email?")) return;
    try {
      const res = await fetch(`/api/emails/${id}`, { method: "DELETE" });
      if (res.ok) {
        setEmails(prev => prev.filter(e => e.id !== id));
        if (activeEmail?.id === id) setActiveEmail(null);
      }
    } catch (e) {
      console.error("Failed to delete email:", e);
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
    setSubject("");
    setSender("");
    setSentDate(new Date().toISOString().split("T")[0]);
    setBody("");
    setNotes("");
    setCategory("Cloud & Hosting");
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

  const filteredEmails = emails.filter(em => {
    const matchesCategory = selectedCategory === "All" || em.category === selectedCategory;
    const matchesSearch = 
      em.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      em.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (em.tags && em.tags.some(t => t.name.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesCategory && matchesSearch;
  });

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-cyber-dark/40 border border-cyber-border/40 p-6 rounded-2xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-cyan-950/60 border border-cyan-500/30 rounded-lg text-cyan-400">
              <Mail className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight font-mono">
              SECURE IMPORTANT EMAILS
            </h1>
          </div>
          <p className="text-xs text-cyber-textMuted max-w-xl">
            Envelope-encrypted communications vault (AES-256-GCM). Safely store banking notices, cloud warnings, domain transfers, and incident emails with zero-leak protection.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 transition duration-200 cursor-pointer text-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Secure New Email</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-cyber-textMuted" />
          <input
            type="text"
            placeholder="Search emails by subject, sender, tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-cyber-dark/60 border border-cyber-border/50 rounded-xl text-xs text-slate-200 placeholder-cyber-textMuted focus:outline-none focus:border-cyan-500/60 transition"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "bg-cyber-dark/40 text-cyber-textMuted hover:text-slate-200 border border-cyber-border/30"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Email Grid / List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
        </div>
      ) : filteredEmails.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed border-cyber-border/50 rounded-2xl bg-cyber-dark/20 text-center">
          <div className="p-4 bg-cyan-950/30 rounded-full text-cyan-400 mb-3">
            <Mail className="h-8 w-8 opacity-60" />
          </div>
          <h3 className="text-base font-semibold text-slate-200">No Secure Emails Found</h3>
          <p className="text-xs text-cyber-textMuted mt-1 max-w-sm">
            {searchQuery || selectedCategory !== "All"
              ? "No communications match your search filters."
              : "Store and encrypt your first sensitive communication, recovery email, or hosting alert."}
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-lg text-xs font-medium transition cursor-pointer"
          >
            + Store First Email
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmails.map((em) => (
            <div
              key={em.id}
              className="bg-cyber-dark/50 hover:bg-cyber-dark/80 border border-cyber-border/40 hover:border-cyan-500/40 rounded-xl p-5 transition flex flex-col justify-between group relative shadow-md"
            >
              <div>
                {/* Header info */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-cyan-950/80 border border-cyan-500/30 text-cyan-300">
                    {em.category}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {em.is_favorite && (
                      <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                    )}
                    <button
                      onClick={() => handleDeleteEmail(em.id)}
                      className="text-cyber-textMuted hover:text-red-400 transition p-1 cursor-pointer"
                      title="Delete Email"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Subject & Sender */}
                <h3 className="font-semibold text-slate-100 text-sm line-clamp-1 mb-1 group-hover:text-cyan-300 transition">
                  {em.subject}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-cyber-textMuted font-mono mb-3">
                  <User className="h-3 w-3" />
                  <span className="truncate">{em.sender}</span>
                </div>

                {/* Tags */}
                {em.tags && em.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {em.tags.map((t) => (
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

              {/* Card Footer */}
              <div className="pt-3 border-t border-cyber-border/30 flex items-center justify-between mt-2">
                <span className="text-[10px] text-cyber-textMuted font-mono">
                  {new Date(em.sent_date).toLocaleDateString()}
                </span>

                <button
                  onClick={() => handleOpenDetail(em)}
                  className="flex items-center gap-1.5 text-xs bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 px-3 py-1 rounded-lg transition font-mono cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Decrypt & View</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE EMAIL MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-cyber-dark border border-cyber-border rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-cyber-border/50 pb-3">
              <div className="flex items-center gap-2 text-cyan-400">
                <Mail className="h-5 w-5" />
                <h2 className="text-lg font-bold font-mono text-slate-100">STORE SECURE EMAIL</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-cyber-textMuted hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEmail} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Subject */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono text-slate-300 mb-1">EMAIL SUBJECT *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AWS Root Account Closure Warning & Verification PIN"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2 bg-cyber-dark/80 border border-cyber-border rounded-lg text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Sender */}
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">SENDER / FROM *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. no-reply-aws@amazon.com"
                    value={sender}
                    onChange={(e) => setSender(e.target.value)}
                    className="w-full px-3.5 py-2 bg-cyber-dark/80 border border-cyber-border rounded-lg text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">CATEGORY</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2 bg-cyber-dark/80 border border-cyber-border rounded-lg text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    {CATEGORIES.filter(c => c !== "All").map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Project */}
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">LINKED PROJECT (OPTIONAL)</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => {
                      setSelectedProjectId(e.target.value);
                      setSelectedEnvId("");
                    }}
                    className="w-full px-3.5 py-2 bg-cyber-dark/80 border border-cyber-border rounded-lg text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">No Project Linked</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Environment */}
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">ENVIRONMENT</label>
                  <select
                    disabled={!selectedProjectId}
                    value={selectedEnvId}
                    onChange={(e) => setSelectedEnvId(e.target.value)}
                    className="w-full px-3.5 py-2 bg-cyber-dark/80 border border-cyber-border rounded-lg text-xs text-slate-100 focus:outline-none focus:border-cyan-500 disabled:opacity-40"
                  >
                    <option value="">Select Environment</option>
                    {selectedProject?.environments.map(env => (
                      <option key={env.id} value={env.id}>{env.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Email Body / Content */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-mono text-slate-300">CONFIDENTIAL EMAIL BODY (ENCRYPTED) *</label>
                  <span className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> AES-256-GCM Envelope Sealed
                  </span>
                </div>
                <textarea
                  required
                  rows={5}
                  placeholder="Paste confidential message body, tokens, emergency instructions, or codes here..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full px-3.5 py-2 bg-cyber-dark/80 border border-cyber-border rounded-lg text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Secure Notes */}
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">INTERNAL REMARKS / NOTES (OPTIONAL)</label>
                <input
                  type="text"
                  placeholder="e.g. Action required before end of month"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-cyber-dark/80 border border-cyber-border rounded-lg text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Tags & Favorite */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <div className="flex-1">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add tag (e.g. Critical, Renewal)..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                      className="px-3 py-1.5 bg-cyber-dark/80 border border-cyber-border rounded-lg text-xs text-slate-100 flex-1 focus:outline-none focus:border-cyan-500"
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
                        <span key={t} className="text-[10px] bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 px-2 py-0.5 rounded flex items-center gap-1">
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
                    className="accent-cyan-500 rounded"
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
                  className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-cyan-500/20 cursor-pointer"
                >
                  {submitting ? "Encrypting & Storing..." : "Seal & Save to Vault"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL DECRYPTED MODAL */}
      {activeEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-cyber-dark border border-cyan-500/40 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-start justify-between border-b border-cyber-border/50 pb-3">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  {activeEmail.category}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-slate-100 mt-1.5">
                  {activeEmail.subject}
                </h2>
                <p className="text-xs text-cyber-textMuted font-mono">
                  From: <span className="text-slate-200">{activeEmail.sender}</span> • Sent: {new Date(activeEmail.sent_date).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setActiveEmail(null)}
                className="text-cyber-textMuted hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Decrypted Content Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-cyan-400 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" /> DECRYPTED PAYLOAD
                </span>
                {activeEmail.decryptedBody && (
                  <button
                    onClick={() => copyToClipboard(activeEmail.decryptedBody!, "body-copy")}
                    className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-cyan-300 bg-cyber-dark/80 border border-cyber-border px-2.5 py-1 rounded cursor-pointer transition font-mono"
                  >
                    {copiedId === "body-copy" ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy Body</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="p-4 bg-slate-950/80 border border-cyber-border/80 rounded-xl max-h-72 overflow-y-auto">
                {detailLoading ? (
                  <div className="flex items-center justify-center py-8 text-xs font-mono text-cyan-400">
                    <Lock className="h-4 w-4 animate-spin mr-2" /> Unwrapping DEK and decrypting payload...
                  </div>
                ) : (
                  <pre className="text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed font-sans">
                    {activeEmail.decryptedBody || "No body content available."}
                  </pre>
                )}
              </div>
            </div>

            {/* Notes if any */}
            {activeEmail.notes && (
              <div className="p-3 bg-cyber-dark/60 border border-cyber-border/40 rounded-lg text-xs">
                <span className="text-[10px] font-mono text-cyber-textMuted block mb-0.5">NOTES:</span>
                <p className="text-slate-300">{activeEmail.notes}</p>
              </div>
            )}

            {/* Footer actions */}
            <div className="flex justify-between items-center pt-3 border-t border-cyber-border/40">
              <button
                onClick={() => handleDeleteEmail(activeEmail.id)}
                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-mono cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Email</span>
              </button>

              <button
                onClick={() => setActiveEmail(null)}
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

export default Emails;
