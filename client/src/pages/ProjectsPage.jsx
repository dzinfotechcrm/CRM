import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, FolderKanban, IndianRupee, PieChart, Filter } from 'lucide-react';
import api from '../utils/api';
import ProjectForm from '../components/projects/ProjectForm';
import { formatDate, formatCurrency, formatPercent } from '../utils/formatCurrency';
import { useToast } from '../context/ToastContext';

export default function ProjectsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modal state
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);

      const { data } = await api.get(`/projects?${params.toString()}`);
      setProjects(data.projects || []);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [statusFilter]);

  const handleSaved = (isEdit) => {
    setShowForm(false);
    setEditingProject(null);
    fetchProjects();
    toast.success(isEdit ? 'Project updated successfully' : 'Project created successfully');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Progress': return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
      case 'Delivered': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'Completed & Paid': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="text-slate-400 text-sm mt-1">Manage project milestones and financial splits.</p>
        </div>
        <button
          onClick={() => { setEditingProject(null); setShowForm(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} /> New Project
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-col sm:flex-row gap-4">
        <div className="flex gap-4">
          <div className="relative">
            <Filter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-dark pl-10 pr-8 appearance-none bg-slate-800"
            >
              <option value="">All Statuses</option>
              <option value="In Progress">In Progress</option>
              <option value="Delivered">Delivered</option>
              <option value="Completed & Paid">Completed & Paid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-800/50 border-b border-slate-700/50">
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Project / Client</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Timeline</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Financials (Value / Collected)</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Splits (Res / Prof / Dues)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-400">Loading projects...</td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-400">No projects found.</td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr key={project.project_id} className="hover:bg-slate-800/30 transition-colors group cursor-pointer" onClick={() => { setEditingProject(project); setShowForm(true); }}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 text-slate-400 group-hover:text-accent-light group-hover:border-accent-light/30 transition-colors">
                          <FolderKanban size={18} />
                        </div>
                        <div>
                          <p className="font-medium text-slate-200 group-hover:text-accent-light transition-colors">{project.project_name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{project.client_name} • {project.service_type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-slate-300">Start: {formatDate(project.start_date)}</p>
                      {project.delivery_date && <p className="text-xs text-slate-500 mt-1">Due: {formatDate(project.delivery_date)}</p>}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.project_status)}`}>
                        {project.project_status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">Value:</span>
                          <span className="font-medium text-slate-200">{formatCurrency(project.total_value)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">Collected:</span>
                          <span className="font-medium text-emerald-400">{formatCurrency(project.amount_collected)}</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${project.collection_percent}%` }} />
                        </div>
                        <p className="text-[10px] text-right text-slate-500">{project.collection_percent}% collected</p>
                      </div>
                    </td>
                    <td className="p-4 bg-slate-800/10">
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Reserve:</span>
                          <span className="text-blue-400">{formatCurrency(project.reserve_alloc)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Profit:</span>
                          <span className="text-purple-400">{formatCurrency(project.profit_alloc)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Dues:</span>
                          <span className="text-rose-400">{formatCurrency(project.dues_alloc)}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Form */}
      {showForm && (
        <ProjectForm
          project={editingProject}
          onClose={() => { setShowForm(false); setEditingProject(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
