import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

function CreateModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const p = await api.projects.create(form);
      onCreate(p); onClose();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#30363d]">
          <h2 className="font-bold text-white">New Project</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">{error}</div>}
          <div>
            <label className="label">Project Name *</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Website Redesign" required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What's this project about?" />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <><div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />Creating...</> : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const ACCENT = ['border-cyan-500/40 text-cyan-400 bg-cyan-500/10', 'border-violet-500/40 text-violet-400 bg-violet-500/10', 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10', 'border-amber-500/40 text-amber-400 bg-amber-500/10', 'border-rose-500/40 text-rose-400 bg-rose-500/10', 'border-blue-500/40 text-blue-400 bg-blue-500/10'];

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => { api.projects.list().then(setProjects).finally(() => setLoading(false)); }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-slate-500 mt-1 text-sm">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-cyan-500/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          </div>
          <h3 className="text-lg font-bold text-white">No projects yet</h3>
          <p className="text-slate-500 mt-1 mb-6 text-sm">Create your first project to get started</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">Create Project</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p, i) => {
            const ac = ACCENT[i % ACCENT.length];
            const taskCount = p._count?.tasks || 0;
            return (
              <Link key={p.id} to={`/projects/${p.id}`}
                className="card hover:border-[#30363d] hover:bg-[#1c2128] transition-all group p-5 flex flex-col">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-sm shrink-0 ${ac}`}>
                    {p.name[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-white truncate group-hover:text-cyan-400 transition-colors text-sm">{p.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">by {p.owner?.name}</p>
                  </div>
                </div>
                {p.description && <p className="text-xs text-slate-500 mb-4 line-clamp-2 flex-1">{p.description}</p>}
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    {taskCount} task{taskCount !== 1 ? 's' : ''}
                  </div>
                  <div className="flex -space-x-1.5">
                    {p.members?.slice(0, 4).map(m => (
                      <div key={m.id} title={m.user?.name}
                        className="w-6 h-6 rounded-full bg-[#21262d] border-2 border-[#161b22] flex items-center justify-center text-xs font-bold text-slate-400">
                        {m.user?.name?.[0]?.toUpperCase()}
                      </div>
                    ))}
                    {p.members?.length > 4 && <div className="w-6 h-6 rounded-full bg-[#21262d] border-2 border-[#161b22] flex items-center justify-center text-xs text-slate-500">+{p.members.length - 4}</div>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {showModal && <CreateModal onClose={() => setShowModal(false)} onCreate={p => setProjects(prev => [p, ...prev])} />}
    </div>
  );
}
