import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const STATUS_COLS = [
  { key: 'TODO', label: 'To Do', dot: 'bg-slate-500', header: 'bg-slate-500/10 border-slate-500/30' },
  { key: 'IN_PROGRESS', label: 'In Progress', dot: 'bg-blue-500', header: 'bg-blue-500/10 border-blue-500/30' },
  { key: 'DONE', label: 'Done', dot: 'bg-cyan-500', header: 'bg-cyan-500/10 border-cyan-500/30' },
];
const PRIORITY = { HIGH: { cls: 'badge-high', label: 'High' }, MEDIUM: { cls: 'badge-medium', label: 'Med' }, LOW: { cls: 'badge-low', label: 'Low' } };
function fmt(d) { return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null; }
function isOverdue(d) { return d && new Date(d) < new Date(); }

function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const p = PRIORITY[task.priority];
  return (
    <div className="bg-[#1c2128] border border-[#30363d] rounded-xl p-4 group hover:border-[#484f58] transition-all">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-semibold text-slate-200 leading-snug">{task.title}</p>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
          <button onClick={() => onEdit(task)} className="text-slate-500 hover:text-cyan-400 p-0.5 transition">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </button>
          <button onClick={() => onDelete(task.id)} className="text-slate-500 hover:text-red-400 p-0.5 transition">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>
      {task.description && <p className="text-xs text-slate-500 mb-3 line-clamp-2">{task.description}</p>}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={p.cls}>{p.label}</span>
          {task.dueDate && (
            <span className={`text-xs font-medium ${isOverdue(task.dueDate) && task.status !== 'DONE' ? 'text-red-400' : 'text-slate-600'}`}>
              {isOverdue(task.dueDate) && task.status !== 'DONE' ? '⚠ ' : ''}{fmt(task.dueDate)}
            </span>
          )}
        </div>
        {task.assignee && (
          <div title={task.assignee.name} className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-xs font-bold text-cyan-400 shrink-0">
            {task.assignee.name[0].toUpperCase()}
          </div>
        )}
      </div>
      <div className="mt-3 pt-3 border-t border-[#30363d]/50 flex gap-1 flex-wrap">
        {STATUS_COLS.map(s => s.key !== task.status && (
          <button key={s.key} onClick={() => onStatusChange(task.id, s.key)}
            className="text-xs text-slate-600 hover:text-slate-300 transition px-1.5 py-0.5 rounded hover:bg-[#30363d]">
            → {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function TaskModal({ task, projectId, members, onClose, onSave }) {
  const [form, setForm] = useState({
    title: task?.title || '', description: task?.description || '',
    status: task?.status || 'TODO', priority: task?.priority || 'MEDIUM',
    dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : '',
    assigneeId: task?.assigneeId || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const payload = { ...form, projectId, assigneeId: form.assigneeId || null };
      const saved = task ? await api.tasks.update(task.id, payload) : await api.tasks.create(payload);
      onSave(saved, !!task); onClose();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#30363d] sticky top-0 bg-[#161b22] rounded-t-2xl">
          <h2 className="font-bold text-white">{task ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">{error}</div>}
          <div>
            <label className="label">Title *</label>
            <input className="input" value={form.title} onChange={set('title')} placeholder="Task title" required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={3} value={form.description} onChange={set('description')} placeholder="Optional details..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={set('status')}>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={set('priority')}>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Due Date</label>
              <input className="input" type="date" value={form.dueDate} onChange={set('dueDate')} />
            </div>
            <div>
              <label className="label">Assign To</label>
              <select className="input" value={form.assigneeId} onChange={set('assigneeId')}>
                <option value="">Unassigned</option>
                {members?.map(m => <option key={m.user.id} value={m.user.id}>{m.user.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <><div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />Saving...</> : task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MemberModal({ projectId, onClose, onAdd }) {
  const [form, setForm] = useState({ email: '', role: 'MEMBER' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const m = await api.projects.addMember(projectId, form);
      onAdd(m); onClose();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#30363d]">
          <h2 className="font-bold text-white">Add Member</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">{error}</div>}
          <div>
            <label className="label">User Email</label>
            <input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="member@example.com" required />
            <p className="text-xs text-slate-600 mt-1">The user must already have a TaskFlow account</p>
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Adding...' : 'Add Member'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [taskModal, setTaskModal] = useState(null);
  const [memberModal, setMemberModal] = useState(false);
  const [tab, setTab] = useState('board');

  const load = useCallback(() => {
    api.projects.get(id).then(setProject).catch(() => navigate('/projects')).finally(() => setLoading(false));
  }, [id, navigate]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!project) return null;

  const isAdmin = project.userRole === 'ADMIN';
  const tasks = project.tasks || [];
  const tasksByStatus = STATUS_COLS.reduce((acc, s) => { acc[s.key] = tasks.filter(t => t.status === s.key); return acc; }, {});

  const handleTaskSave = (saved, isEdit) => {
    setProject(p => ({ ...p, tasks: isEdit ? p.tasks.map(t => t.id === saved.id ? saved : t) : [saved, ...p.tasks] }));
  };
  const handleTaskDelete = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    await api.tasks.delete(taskId);
    setProject(p => ({ ...p, tasks: p.tasks.filter(t => t.id !== taskId) }));
  };
  const handleStatusChange = async (taskId, status) => {
    const updated = await api.tasks.update(taskId, { status });
    setProject(p => ({ ...p, tasks: p.tasks.map(t => t.id === taskId ? { ...t, ...updated } : t) }));
  };
  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    await api.projects.removeMember(id, userId);
    setProject(p => ({ ...p, members: p.members.filter(m => m.userId !== userId) }));
  };
  const handleDeleteProject = async () => {
    if (!confirm('Delete this project and all its tasks?')) return;
    await api.projects.delete(id);
    navigate('/projects');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-[#161b22] border-b border-[#21262d] px-8 py-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-600 mb-1">
              <Link to="/projects" className="hover:text-cyan-400 transition">Projects</Link>
              <span>/</span>
              <span className="text-slate-400">{project.name}</span>
            </div>
            <h1 className="text-xl font-bold text-white">{project.name}</h1>
            {project.description && <p className="text-slate-500 mt-0.5 text-sm">{project.description}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isAdmin && (
              <>
                <button onClick={() => setMemberModal(true)} className="btn-secondary text-xs py-2">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                  Add Member
                </button>
                <button onClick={handleDeleteProject} className="btn-danger text-xs py-2">Delete</button>
              </>
            )}
            <button onClick={() => setTaskModal('new')} className="btn-primary text-xs py-2">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Task
            </button>
          </div>
        </div>

        <div className="flex gap-1">
          {[{ key: 'board', label: 'Board' }, { key: 'members', label: `Members (${project.members?.length || 0})` }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${tab === t.key ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-500 hover:text-slate-300'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-8 bg-[#0d1117]">
        {tab === 'board' ? (
          <div className="grid grid-cols-3 gap-5 h-full" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
            {STATUS_COLS.map(col => (
              <div key={col.key} className="flex flex-col min-h-0">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border mb-3 ${col.header}`}>
                  <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                  <span className="text-sm font-bold text-slate-300">{col.label}</span>
                  <span className="ml-auto text-xs font-semibold text-slate-500 bg-[#161b22] px-2 py-0.5 rounded-full border border-[#30363d]">
                    {tasksByStatus[col.key]?.length || 0}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
                  {tasksByStatus[col.key]?.map(task => (
                    <TaskCard key={task.id} task={task}
                      onEdit={t => setTaskModal(t)}
                      onDelete={handleTaskDelete}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                  {tasksByStatus[col.key]?.length === 0 && (
                    <div className="text-center py-10 text-slate-700 text-sm border border-dashed border-[#21262d] rounded-xl">
                      Empty
                    </div>
                  )}
                </div>
                <button onClick={() => setTaskModal('new')}
                  className="mt-3 w-full text-left text-xs text-slate-600 hover:text-slate-400 px-3 py-2 rounded-xl hover:bg-[#161b22] transition flex items-center gap-2">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add task
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="max-w-lg">
            <div className="card divide-y divide-[#21262d]">
              {project.members?.map(m => (
                <div key={m.id} className="flex items-center gap-3 px-5 py-4">
                  <div className="w-9 h-9 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-sm shrink-0">
                    {m.user?.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">{m.user?.name}</p>
                      {m.userId === project.ownerId && <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full font-semibold">Owner</span>}
                    </div>
                    <p className="text-xs text-slate-500">{m.user?.email}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${m.role === 'ADMIN' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-slate-700/50 text-slate-400'}`}>
                    {m.role}
                  </span>
                  {isAdmin && m.userId !== user.id && m.userId !== project.ownerId && (
                    <button onClick={() => handleRemoveMember(m.userId)} className="text-slate-600 hover:text-red-400 transition ml-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {(taskModal === 'new' || (taskModal && typeof taskModal === 'object')) && (
        <TaskModal task={taskModal === 'new' ? null : taskModal} projectId={id}
          members={project.members} onClose={() => setTaskModal(null)} onSave={handleTaskSave} />
      )}
      {memberModal && (
        <MemberModal projectId={id} onClose={() => setMemberModal(false)}
          onAdd={m => setProject(p => ({ ...p, members: [...p.members, m] }))} />
      )}
    </div>
  );
}
