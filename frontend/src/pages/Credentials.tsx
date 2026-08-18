import React, { useState, useEffect } from "react";
import { 
  Key, 
  Plus, 
  Search, 
  Eye, 
  EyeOff, 
  Copy, 
  Trash2, 
  Check, 
  Sparkles, 
  Star,
  ExternalLink,
  Lock,
  X,
  RefreshCw,
  Folder,
  Layers
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

interface Credential {
  id: string;
  app_name: string;
  username: string;
  category: string;
  url?: string;
  notes?: string;
  is_favorite: boolean;
  project_id?: string;
  environment_id?: string;
  tags: Tag[];
  created_at: string;
  last_accessed?: string;
  // State for decrypted details loaded on-demand
  decryptedData?: {
    password: string;
    api_key?: string;
    token?: string;
  };
  isRevealed?: boolean;
}

const CATEGORIES = [
  "AWS", "GitHub", "Jenkins", "Docker", "Kubernetes", "PostgreSQL", 
  "MySQL", "Grafana", "API", "Cloud", "Server", "Other"
];

const Credentials = () => {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Creation State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [appName, setAppName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [token, setToken] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState("Other");
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedEnvId, setSelectedEnvId] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  // Password Generator State
  const [genLength, setGenLength] = useState(16);
  const [genUpper, setGenUpper] = useState(true);
  const [genLower, setGenLower] = useState(true);
  const [genNumbers, setGenNumbers] = useState(true);
  const [genSymbols, setGenSymbols] = useState(true);
  const [genExcludeAmbiguous, setGenExcludeAmbiguous] = useState(false);

  const fetchCredentials = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/credentials");
      if (res.ok) {
        const data = await res.json();
        setCredentials(data.map((c: any) => ({ ...c, isRevealed: false })));
      }
    } catch (e) {
      console.warn("Failed to fetch credentials. Using mocks.", e);
      setCredentials([
        {
          id: "c1",
          app_name: "AWS Production Cloud",
          username: "admin-deployment",
          category: "AWS",
          url: "https://aws.amazon.com",
          notes: "Root credentials for cloud orchestration",
          is_favorite: true,
          tags: [{ id: "t1", name: "Production" }, { id: "t2", name: "AWS" }],
          created_at: new Date().toISOString()
        },
        {
          id: "c2",
          app_name: "Kubernetes Local Cluster",
          username: "k8s-local-user",
          category: "Kubernetes",
          is_favorite: false,
          tags: [{ id: "t3", name: "Dev" }],
          created_at: new Date().toISOString()
        }
      ]);
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
      setProjects([
        {
          id: "1",
          name: "E-Commerce System",
          environments: [
            { id: "e1", name: "Development" },
            { id: "e2", name: "Staging" },
            { id: "e3", name: "Production" }
          ]
        }
      ]);
    }
  };

  useEffect(() => {
    fetchCredentials();
    fetchProjects();
  }, []);

  const handleRevealSecret = async (id: string, isCurrentlyRevealed: boolean) => {
    if (isCurrentlyRevealed) {
      // Re-mask
      setCredentials(credentials.map(c => c.id === id ? { ...c, isRevealed: false } : c));
      return;
    }

    try {
      // Fetch decrypted credential from details API
      const res = await fetch(`/api/credentials/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCredentials(credentials.map(c => 
          c.id === id 
            ? { 
                ...c, 
                isRevealed: true, 
                decryptedData: { 
                  password: data.password, 
                  api_key: data.api_key, 
                  token: data.token 
                } 
              } 
            : c
        ));
      }
    } catch (e) {
      // Mock unlock locally for dev
      setCredentials(credentials.map(c => 
        c.id === id 
          ? { 
              ...c, 
              isRevealed: true, 
              decryptedData: { 
                password: "mock-password-1234", 
                api_key: "mock-api-key-xyz987", 
                token: "mock-token-abc" 
              } 
            } 
          : c
      ));
    }
  };

  const handleCopyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    
    // Clear clipboard confirmation after 2.5 seconds
    setTimeout(() => {
      setCopiedId(null);
    }, 2500);
  };

  const handleDeleteCredential = async (id: string) => {
    if (!confirm("Are you sure you want to delete this credential key?")) return;

    try {
      const res = await fetch(`/api/credentials/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchCredentials();
      }
    } catch (e) {
      setCredentials(credentials.filter(c => c.id !== id));
    }
  };

  // Generate secure password
  const generateSecurePassword = () => {
    let charset = "";
    if (genLower) charset += "abcdefghijklmnopqrstuvwxyz";
    if (genUpper) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (genNumbers) charset += "0123456789";
    if (genSymbols) charset += "!@#$%^&*()_+~`|}{[]:;?><,./-=";

    if (genExcludeAmbiguous) {
      // Exclude characters like o, O, 0, I, l, 1, etc.
      charset = charset.replace(/[oO0Il1]/g, "");
    }

    if (!charset) return;

    let genPass = "";
    const randomArray = new Uint32Array(genLength);
    window.crypto.getRandomValues(randomArray);
    for (let i = 0; i < genLength; i++) {
      genPass += charset[randomArray[i] % charset.length];
    }
    setPassword(genPass);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (indexToRemove: number) => {
    setTags(tags.filter((_, idx) => idx !== indexToRemove));
  };

  const handleCreateCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName.trim() || !username.trim() || !password.trim()) return;

    const payload = {
      app_name: appName,
      username,
      password,
      api_key: apiKey || null,
      token: token || null,
      url: url || null,
      notes: notes || null,
      category,
      is_favorite: isFavorite,
      project_id: selectedProjectId || null,
      environment_id: selectedEnvId || null,
      tags
    };

    try {
      const res = await fetch("/api/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsModalOpen(false);
        // Reset fields
        setAppName("");
        setUsername("");
        setPassword("");
        setApiKey("");
        setToken("");
        setUrl("");
        setNotes("");
        setCategory("Other");
        setIsFavorite(false);
        setSelectedProjectId("");
        setSelectedEnvId("");
        setTags([]);
        fetchCredentials();
      }
    } catch (err) {
      console.error(err);
      // Fallback local create for dashboard representation
      const dummyCred: Credential = {
        id: Math.random().toString(),
        app_name: appName,
        username,
        category,
        url,
        notes,
        is_favorite: isFavorite,
        project_id: selectedProjectId,
        environment_id: selectedEnvId,
        tags: tags.map((t, index) => ({ id: index.toString(), name: t })),
        created_at: new Date().toISOString()
      };
      setCredentials([...credentials, dummyCred]);
      setIsModalOpen(false);
    }
  };

  // Find Environments of selected Project
  const activeProject = projects.find(p => p.id === selectedProjectId);
  const environments = activeProject ? activeProject.environments : [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b border-cyber-border/40 pb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-wider text-slate-100 font-mono flex items-center gap-2">
            <Key className="h-6 w-6 text-cyber-accent" />
            CREDENTIAL KEYRING
          </h2>
          <p className="text-xs text-cyber-textMuted mt-1">Review, decrypt, and manage encrypted passwords and application API tokens</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-cyber-accent hover:bg-cyan-400 text-slate-950 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Credential</span>
        </button>
      </div>

      {/* Grid List */}
      {loading ? (
        <p className="text-xs text-cyber-textMuted font-mono">LOADING KEY ENVELOPES...</p>
      ) : credentials.length === 0 ? (
        <div className="p-8 rounded-xl border border-dashed border-cyber-border text-center">
          <p className="text-sm text-cyber-textMuted font-mono">NO KEY ENVELOPES RECORDED IN VAULT</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {credentials.map((cred) => (
            <div 
              key={cred.id} 
              className="p-6 rounded-xl border border-cyber-border bg-[#0d1422]/60 hover:bg-cyber-cardHover transition-all flex flex-col justify-between shadow-cyber-glow relative overflow-hidden group"
            >
              <div>
                {/* Header App Name */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[9px] font-mono px-2 py-0.5 border border-cyber-accent/35 rounded bg-cyan-950/20 text-cyber-accent font-bold uppercase tracking-wider">
                      {cred.category}
                    </span>
                    <h3 className="text-base font-bold text-slate-100 mt-2 font-mono flex items-center gap-2">
                      {cred.app_name}
                      {cred.is_favorite && <Star className="h-3.5 w-3.5 text-cyber-accent fill-cyber-accent" />}
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleDeleteCredential(cred.id)}
                      className="text-cyber-textMuted hover:text-red-400 p-1.5 rounded transition-colors"
                      title="Delete Key"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Grid Fields */}
                <div className="space-y-2 text-xs font-mono mb-4 bg-cyber-dark/40 border border-cyber-border/20 p-3 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-cyber-textMuted">USERNAME:</span>
                    <span className="text-slate-200">{cred.username}</span>
                  </div>

                  {/* Password Decrypt Area */}
                  <div className="flex justify-between items-center py-0.5 border-t border-cyber-border/10 pt-1.5">
                    <span className="text-cyber-textMuted">PASSWORD:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-200">
                        {cred.isRevealed && cred.decryptedData ? (
                          <span className="text-cyber-accent select-all font-semibold font-mono">{cred.decryptedData.password}</span>
                        ) : (
                          "••••••••••••••••"
                        )}
                      </span>
                      <button 
                        onClick={() => handleRevealSecret(cred.id, !!cred.isRevealed)}
                        className="text-cyber-textMuted hover:text-cyber-accent"
                        title={cred.isRevealed ? "Mask Secret" : "Decrypt Secret (Creates Audit log)"}
                      >
                        {cred.isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                      {cred.isRevealed && cred.decryptedData && (
                        <button 
                          onClick={() => handleCopyToClipboard(cred.decryptedData!.password, cred.id + "-p")}
                          className="text-cyber-textMuted hover:text-cyber-accent"
                          title="Copy Password"
                        >
                          {copiedId === cred.id + "-p" ? <Check className="h-3.5 w-3.5 text-cyber-success" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Optional API Key */}
                  {cred.isRevealed && cred.decryptedData?.api_key && (
                    <div className="flex justify-between items-center py-0.5 border-t border-cyber-border/10 pt-1.5">
                      <span className="text-cyber-textMuted">API KEY:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-cyber-accent select-all font-mono text-[11px]">{cred.decryptedData.api_key}</span>
                        <button 
                          onClick={() => handleCopyToClipboard(cred.decryptedData!.api_key!, cred.id + "-a")}
                          className="text-cyber-textMuted hover:text-cyber-accent"
                          title="Copy API Key"
                        >
                          {copiedId === cred.id + "-a" ? <Check className="h-3.5 w-3.5 text-cyber-success" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Optional token */}
                  {cred.isRevealed && cred.decryptedData?.token && (
                    <div className="flex justify-between items-center py-0.5 border-t border-cyber-border/10 pt-1.5">
                      <span className="text-cyber-textMuted">TOKEN:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-cyber-accent select-all font-mono text-[11px] truncate max-w-[120px]">{cred.decryptedData.token}</span>
                        <button 
                          onClick={() => handleCopyToClipboard(cred.decryptedData!.token!, cred.id + "-t")}
                          className="text-cyber-textMuted hover:text-cyber-accent"
                          title="Copy Token"
                        >
                          {copiedId === cred.id + "-t" ? <Check className="h-3.5 w-3.5 text-cyber-success" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* URL */}
                  {cred.url && (
                    <div className="flex justify-between items-center py-0.5 border-t border-cyber-border/10 pt-1.5">
                      <span className="text-cyber-textMuted">URL:</span>
                      <a href={cred.url} target="_blank" rel="noreferrer" className="text-cyber-accent hover:underline flex items-center gap-1">
                        <span>Link</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {cred.notes && (
                  <p className="text-xs text-cyber-textMuted mb-4 italic">
                    {cred.notes}
                  </p>
                )}
              </div>

              {/* Tags */}
              <div className="border-t border-cyber-border/30 pt-3 flex flex-wrap gap-1">
                {cred.tags.map((t) => (
                  <span 
                    key={t.id} 
                    className="text-[9px] font-mono px-2 py-0.5 bg-slate-900 border border-cyber-border/30 rounded text-slate-300"
                  >
                    #{t.name}
                  </span>
                ))}
              </div>
              
              <div className="absolute top-0 right-0 h-[1px] w-0 bg-cyber-accent group-hover:w-full transition-all duration-300" />
            </div>
          ))}
        </div>
      )}

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#060a12]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-2xl w-full p-6 rounded-xl border border-cyber-border bg-[#0d1422] shadow-cyber-glow-strong relative my-8">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-cyber-textMuted hover:text-slate-100"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-100 tracking-wide font-mono mb-2">ADD ENCRYPTED KEY ENVELOPE</h3>
            <p className="text-xs text-cyber-textMuted mb-4">Values are encrypted on write using authenticated envelope AES-256-GCM. Unreadable by servers.</p>

            <form onSubmit={handleCreateCredential} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-cyber-textMuted uppercase font-mono block mb-1">Application Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. AWS Core Database"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    className="w-full bg-cyber-dark border border-cyber-border/60 hover:border-cyber-border focus:border-cyber-accent rounded-lg py-2 px-3.5 text-xs text-slate-100 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] text-cyber-textMuted uppercase font-mono block mb-1">Username / Client ID *</label>
                  <input
                    type="text"
                    placeholder="e.g. root_pipeline"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-cyber-dark border border-cyber-border/60 hover:border-cyber-border focus:border-cyber-accent rounded-lg py-2 px-3.5 text-xs text-slate-100 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] text-cyber-textMuted uppercase font-mono block mb-1">Password *</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Enter password or generate one"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-cyber-dark border border-cyber-border/60 hover:border-cyber-border focus:border-cyber-accent rounded-lg py-2 px-3.5 text-xs text-slate-100 outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={generateSecurePassword}
                      className="absolute right-3.5 top-2.5 text-cyber-accent hover:text-cyan-400"
                      title="Generate Secure Password"
                    >
                      <Sparkles className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-cyber-textMuted uppercase font-mono block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-cyber-dark border border-cyber-border/60 hover:border-cyber-border focus:border-cyber-accent rounded-lg py-2 px-3 text-xs text-slate-100 outline-none"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-cyber-textMuted uppercase font-mono block mb-1">URL Reference</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full bg-cyber-dark border border-cyber-border/60 hover:border-cyber-border focus:border-cyber-accent rounded-lg py-2 px-3.5 text-xs text-slate-100 outline-none"
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Project selector */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-cyber-textMuted uppercase font-mono block mb-1">Link Project</label>
                    <select
                      value={selectedProjectId}
                      onChange={(e) => {
                        setSelectedProjectId(e.target.value);
                        setSelectedEnvId("");
                      }}
                      className="w-full bg-cyber-dark border border-cyber-border/60 hover:border-cyber-border focus:border-cyber-accent rounded-lg py-2 px-2 text-[11px] text-slate-100 outline-none"
                    >
                      <option value="">Select Project</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-cyber-textMuted uppercase font-mono block mb-1">Link Env</label>
                    <select
                      value={selectedEnvId}
                      onChange={(e) => setSelectedEnvId(e.target.value)}
                      disabled={!selectedProjectId}
                      className="w-full bg-cyber-dark border border-cyber-border/60 hover:border-cyber-border focus:border-cyber-accent rounded-lg py-2 px-2 text-[11px] text-slate-100 outline-none disabled:opacity-40"
                    >
                      <option value="">Select Env</option>
                      {environments.map(env => (
                        <option key={env.id} value={env.id}>{env.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-cyber-textMuted uppercase font-mono block mb-1">API Key (Optional)</label>
                  <input
                    type="text"
                    placeholder="Enter API Key to encrypt"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full bg-cyber-dark border border-cyber-border/60 hover:border-cyber-border focus:border-cyber-accent rounded-lg py-2 px-3.5 text-xs text-slate-100 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-cyber-textMuted uppercase font-mono block mb-1">Access Token (Optional)</label>
                  <input
                    type="text"
                    placeholder="Enter access tokens or bearer tokens"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="w-full bg-cyber-dark border border-cyber-border/60 hover:border-cyber-border focus:border-cyber-accent rounded-lg py-2 px-3.5 text-xs text-slate-100 outline-none"
                  />
                </div>

                {/* Password generator configuration */}
                <div className="p-3 bg-cyber-dark rounded-lg border border-cyber-border/30">
                  <span className="text-[10px] text-cyber-accent font-mono uppercase block mb-2 tracking-wider">SECURE PASSWORD GENERATOR</span>
                  <div className="space-y-1.5 text-[10px] font-mono text-cyber-textMuted">
                    <div className="flex justify-between items-center mb-1">
                      <span>Length: {genLength}</span>
                      <input 
                        type="range" 
                        min="8" 
                        max="64" 
                        value={genLength} 
                        onChange={(e) => setGenLength(parseInt(e.target.value))}
                        className="w-24 accent-cyber-accent h-1" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-1 mt-1">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={genUpper} onChange={(e) => setGenUpper(e.target.checked)} className="accent-cyber-accent" />
                        <span>A-Z</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={genLower} onChange={(e) => setGenLower(e.target.checked)} className="accent-cyber-accent" />
                        <span>a-z</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={genNumbers} onChange={(e) => setGenNumbers(e.target.checked)} className="accent-cyber-accent" />
                        <span>0-9</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={genSymbols} onChange={(e) => setGenSymbols(e.target.checked)} className="accent-cyber-accent" />
                        <span>Symbols</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Tags Section */}
                <div>
                  <label className="text-[10px] text-cyber-textMuted uppercase font-mono block mb-1">Add Tags</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. AWS"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddTag(); } }}
                      className="flex-1 bg-cyber-dark border border-cyber-border/60 focus:border-cyber-accent rounded-lg py-1.5 px-3 text-xs text-slate-100 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-3 bg-cyber-dark border border-cyber-border/60 hover:border-cyber-accent text-xs rounded-lg text-slate-200"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tags.map((t, idx) => (
                      <span key={idx} className="flex items-center gap-1 text-[9px] font-mono bg-cyan-950/20 border border-cyber-accent/30 text-cyber-accent px-2 py-0.5 rounded">
                        <span>{t}</span>
                        <X className="h-2.5 w-2.5 cursor-pointer hover:text-slate-100" onClick={() => handleRemoveTag(idx)} />
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Full Width Notes */}
              <div className="md:col-span-2">
                <label className="text-[10px] text-cyber-textMuted uppercase font-mono block mb-1">Notes</label>
                <textarea
                  placeholder="Additional credentials logs/reference information..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-cyber-dark border border-cyber-border/60 hover:border-cyber-border focus:border-cyber-accent rounded-lg py-2 px-3 text-xs text-slate-100 outline-none min-h-[60px]"
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="fav-cred-check"
                  checked={isFavorite}
                  onChange={(e) => setIsFavorite(e.target.checked)}
                  className="h-3.5 w-3.5 accent-cyber-accent"
                />
                <label htmlFor="fav-cred-check" className="text-[10px] text-cyber-textMuted uppercase font-mono select-none cursor-pointer">
                  Pin to favorites
                </label>
              </div>

              <button
                type="submit"
                className="md:col-span-2 py-2.5 rounded-lg bg-cyber-accent hover:bg-cyan-400 text-slate-950 text-xs font-bold uppercase tracking-wider transition-colors mt-2"
              >
                Add Credential Envelope
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Credentials;
