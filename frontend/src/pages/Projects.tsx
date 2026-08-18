import React, { useState, useEffect } from "react";
import { 
  Package, 
  FolderPlus, 
  Trash2, 
  Layers, 
  Key, 
  Mail, 
  FileText, 
  Star, 
  CheckCircle, 
  Calendar,
  X
} from "lucide-react";

interface Environment {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  is_favorite: boolean;
  created_at: string;
  environments: Environment[];
  credentials_count: number;
  emails_count: number;
  notes_count: number;
}

const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      } else {
        throw new Error("API error");
      }
    } catch (e) {
      console.warn("Failed to fetch projects. Using mock fallbacks.", e);
      // Fallback mocks
      setProjects([
        {
          id: "1",
          name: "E-Commerce System",
          description: "Core retail store databases, payment gateways, and AWS pipelines.",
          is_favorite: true,
          created_at: new Date().toISOString(),
          environments: [
            { id: "e1", name: "Development" },
            { id: "e2", name: "Staging" },
            { id: "e3", name: "Production" }
          ],
          credentials_count: 5,
          emails_count: 3,
          notes_count: 2
        },
        {
          id: "2",
          name: "Internal DevOps",
          description: "CI/CD server, logging metrics dashboards, and orchestration keys.",
          is_favorite: false,
          created_at: new Date().toISOString(),
          environments: [
            { id: "e4", name: "Development" },
            { id: "e5", name: "Production" }
          ],
          credentials_count: 7,
          emails_count: 0,
          notes_count: 4
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, is_favorite: isFavorite })
      });
      if (res.ok) {
        setIsModalOpen(false);
        setName("");
        setDescription("");
        setIsFavorite(false);
        fetchProjects();
      }
    } catch (err) {
      console.error(err);
      // Mock creation locally for preview
      const newProj: Project = {
        id: Math.random().toString(),
        name,
        description,
        is_favorite: isFavorite,
        created_at: new Date().toISOString(),
        environments: [
          { id: Math.random().toString(), name: "Development" },
          { id: Math.random().toString(), name: "Staging" },
          { id: Math.random().toString(), name: "Production" }
        ],
        credentials_count: 0,
        emails_count: 0,
        notes_count: 0
      };
      setProjects([...projects, newProj]);
      setIsModalOpen(false);
      setName("");
      setDescription("");
      setIsFavorite(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project? All associated credentials, environments, notes, and emails will be permanently deleted.")) {
      return;
    }

    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchProjects();
      }
    } catch (e) {
      // Mock delete locally
      setProjects(projects.filter(p => p.id !== id));
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b border-cyber-border/40 pb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-wider text-slate-100 font-mono flex items-center gap-2">
            <Package className="h-6 w-6 text-cyber-accent" />
            PROJECT NAMESPACES
          </h2>
          <p className="text-xs text-cyber-textMuted mt-1">Organize and segment credentials, secrets, notes, and emails by secure environment workspaces</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-cyber-accent hover:bg-cyan-400 text-slate-950 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
        >
          <FolderPlus className="h-4 w-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Grid List */}
      {loading ? (
        <p className="text-xs text-cyber-textMuted font-mono">RETRIEVING SECURITY SEGMENTS...</p>
      ) : projects.length === 0 ? (
        <div className="p-8 rounded-xl border border-dashed border-cyber-border text-center">
          <p className="text-sm text-cyber-textMuted">No projects configured. Create a new segment namespace to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((proj) => (
            <div 
              key={proj.id} 
              className="p-6 rounded-xl border border-cyber-border bg-[#0d1422]/60 hover:bg-cyber-cardHover transition-all flex flex-col justify-between shadow-cyber-glow group relative"
            >
              <div>
                {/* Project Header */}
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold text-slate-100 tracking-wide font-mono flex items-center gap-2">
                    {proj.name}
                    {proj.is_favorite && <Star className="h-4 w-4 text-cyber-accent fill-cyber-accent" />}
                  </h3>
                  <button 
                    onClick={() => handleDeleteProject(proj.id)}
                    className="p-1 text-cyber-textMuted hover:text-red-400 hover:border-red-950/40 rounded transition-colors"
                    title="Delete project segment"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Description */}
                <p className="text-xs text-cyber-textMuted leading-relaxed mb-4 min-h-[36px]">
                  {proj.description || "No description provided."}
                </p>

                {/* Environments Badges */}
                <div className="mb-6 flex flex-wrap items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-cyber-accent/60 mr-1" />
                  {proj.environments.map((env) => (
                    <span 
                      key={env.id} 
                      className="text-[9px] font-mono font-semibold uppercase tracking-wider bg-cyan-950/40 border border-cyber-accent/30 text-cyber-accent px-2 py-0.5 rounded"
                    >
                      {env.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Counts Diagnostics */}
              <div className="border-t border-cyber-border/40 pt-4 grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div className="p-2 rounded bg-cyber-dark/40 border border-cyber-border/20">
                  <Key className="h-3.5 w-3.5 text-cyber-accent mx-auto mb-1" />
                  <span className="text-[10px] text-cyber-textMuted uppercase block">Keys</span>
                  <span className="font-bold text-slate-200 mt-0.5 block">{proj.credentials_count}</span>
                </div>
                <div className="p-2 rounded bg-cyber-dark/40 border border-cyber-border/20">
                  <Mail className="h-3.5 w-3.5 text-cyber-accent mx-auto mb-1" />
                  <span className="text-[10px] text-cyber-textMuted uppercase block">Emails</span>
                  <span className="font-bold text-slate-200 mt-0.5 block">{proj.emails_count}</span>
                </div>
                <div className="p-2 rounded bg-cyber-dark/40 border border-cyber-border/20">
                  <FileText className="h-3.5 w-3.5 text-cyber-accent mx-auto mb-1" />
                  <span className="text-[10px] text-cyber-textMuted uppercase block">Notes</span>
                  <span className="font-bold text-slate-200 mt-0.5 block">{proj.notes_count}</span>
                </div>
              </div>
              
              <div className="absolute top-0 right-0 h-[1px] w-0 bg-cyber-accent group-hover:w-full transition-all duration-300" />
            </div>
          ))}
        </div>
      )}

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#060a12]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-xl border border-cyber-border bg-[#0d1422] shadow-cyber-glow-strong relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-cyber-textMuted hover:text-slate-100"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-100 tracking-wide font-mono mb-2">NEW SECURITY NAMESPACE</h3>
            <p className="text-xs text-cyber-textMuted mb-4">Create an isolated workspace segment for organizing related configuration systems.</p>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="text-[10px] text-cyber-textMuted uppercase font-mono block mb-1">Project Name</label>
                <input
                  type="text"
                  placeholder="e.g. Payment Pipeline"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-cyber-dark border border-cyber-border/60 hover:border-cyber-border focus:border-cyber-accent rounded-lg py-2 px-3.5 text-xs text-slate-100 placeholder-cyber-textMuted outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-cyber-textMuted uppercase font-mono block mb-1">Description</label>
                <textarea
                  placeholder="Summarize the infrastructure or project scope..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-cyber-dark border border-cyber-border/60 hover:border-cyber-border focus:border-cyber-accent rounded-lg py-2 px-3.5 text-xs text-slate-100 placeholder-cyber-textMuted outline-none min-h-[80px]"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="favorite-check"
                  checked={isFavorite}
                  onChange={(e) => setIsFavorite(e.target.checked)}
                  className="h-3.5 w-3.5 accent-cyber-accent"
                />
                <label htmlFor="favorite-check" className="text-[10px] text-cyber-textMuted uppercase font-mono select-none cursor-pointer">
                  Pin to favorites
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-cyber-accent hover:bg-cyan-400 text-slate-950 text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Create Segment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
