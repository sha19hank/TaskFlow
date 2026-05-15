import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const statusLabel = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' };
const statusClass = { TODO: 'badge-todo', IN_PROGRESS: 'badge-progress', DONE: 'badge-done' };
const priorityClass = { HIGH: 'badge-high', MEDIUM: 'badge-medium', LOW: 'badge-low' };

function fmt(d) { return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null; }

function StatCard({ label, value, icon, color, border }) {
  return (
    <div className={`card p-5 border-t-2 ${border}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
          <p className={`text-3xl font-bold mt-1 ${color}`}>{value ?? '—'}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color === 'text-cyan-400' ? 'bg-cyan-500/10' : color === 'text-emerald-400' ? 'bg-emerald-500/10' : color === 'text-amber-400' ? 'bg-amber-500/10' : 'bg-red-500/10'}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.dashboard.get().then(setData).finally(() => setLoading(false)); }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const { totalProjects, totalTasks, completedTasks, overdueTasks, tasksByStatus, recentTasks, myTasks } = data || {};
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-slate-500 mt-1 text-sm">Here's what's happening across your projects</p>
        </div>
        <div className="flex items-center gap-2 text-slate-500 text-xs">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Projects" value={totalProjects} color="text-cyan-400" border="border-cyan-500"
          icon={<svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
        />
        <StatCard label="Total Tasks" value={totalTasks} color="text-slate-300" border="border-slate-600"
          icon={<svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
        />
        <StatCard label="Completed" value={completedTasks} color="text-emerald-400" border="border-emerald-500"
          icon={<svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard label="Overdue" value={overdueTasks} color="text-red-400" border="border-red-500"
          icon={<svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      {/* Progress bar */}
      {totalTasks > 0 && (
        <div className="card p-5 mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-white text-sm">Overall Progress</h2>
            <span className="text-xs text-slate-500">{completedTasks}/{totalTasks} tasks done</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden bg-[#21262d] flex">
            {tasksByStatus?.TODO > 0 && <div className="bg-slate-600 transition-all" style={{ width: `${(tasksByStatus.TODO / totalTasks) * 100}%` }} />}
            {tasksByStatus?.IN_PROGRESS > 0 && <div className="bg-blue-500 transition-all" style={{ width: `${(tasksByStatus.IN_PROGRESS / totalTasks) * 100}%` }} />}
            {tasksByStatus?.DONE > 0 && <div className="bg-cyan-500 transition-all" style={{ width: `${(tasksByStatus.DONE / totalTasks) * 100}%` }} />}
          </div>
          <div className="flex gap-5 mt-3">
            {[['To Do', tasksByStatus?.TODO, 'bg-slate-600'], ['In Progress', tasksByStatus?.IN_PROGRESS, 'bg-blue-500'], ['Done', tasksByStatus?.DONE, 'bg-cyan-500']].map(([l, c, col]) => (
              <div key={l} className="flex items-center gap-1.5 text-xs text-slate-500">
                <div className={`w-2 h-2 rounded-full ${col}`} />
                {l} ({c || 0})
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent tasks */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#21262d]">
            <h2 className="font-bold text-white text-sm">Recent Tasks</h2>
            <Link to="/projects" className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition">View all →</Link>
          </div>
          <div className="divide-y divide-[#21262d]">
            {!recentTasks?.length ? (
              <p className="text-slate-600 text-sm text-center py-10">No tasks yet. Create a project to get started!</p>
            ) : recentTasks.map(task => (
              <div key={task.id} className="px-5 py-3.5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-200 truncate">{task.title}</p>
                  <Link to={`/projects/${task.project?.id}`} className="text-xs text-slate-500 hover:text-cyan-400 transition mt-0.5 block">
                    {task.project?.name}
                  </Link>
                </div>
                <span className={statusClass[task.status]}>{statusLabel[task.status]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* My pending tasks */}
        <div className="card">
          <div className="px-5 py-4 border-b border-[#21262d]">
            <h2 className="font-bold text-white text-sm">My Pending Tasks</h2>
          </div>
          <div className="divide-y divide-[#21262d]">
            {!myTasks?.length ? (
              <p className="text-slate-600 text-sm text-center py-10">No tasks assigned to you.</p>
            ) : myTasks.map(task => (
              <div key={task.id} className="px-5 py-3.5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-200 truncate">{task.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Link to={`/projects/${task.project?.id}`} className="text-xs text-slate-500 hover:text-cyan-400 transition">
                      {task.project?.name}
                    </Link>
                    {task.dueDate && (
                      <span className={`text-xs font-medium ${new Date(task.dueDate) < new Date() ? 'text-red-400' : 'text-slate-600'}`}>
                        · Due {fmt(task.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
                <span className={priorityClass[task.priority]}>{task.priority}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
