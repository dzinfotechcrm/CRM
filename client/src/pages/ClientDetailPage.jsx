import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit3, MapPin, Phone, Mail, Calendar, FolderKanban, Trash2 } from 'lucide-react';
import api from '../utils/api';
import { formatDate, formatCurrency } from '../utils/formatCurrency';
import { useToast } from '../context/ToastContext';
import ClientForm from '../components/clients/ClientForm';
import ProjectForm from '../components/projects/ProjectForm'; // We'll create this next

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditClient, setShowEditClient] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const toast = useToast();

  const fetchClientDetails = async () => {
    try {
      const res = await api.get(`/clients/${id}`);
      setData(res.data);
    } catch (err) {
      if (err.response?.status === 404) {
        navigate('/clients', { replace: true });
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientDetails();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this client and ALL associated data? This cannot be undone.')) return;
    try {
      await api.delete(`/clients/${id}`);
      toast.success('Client deleted');
      navigate('/clients');
    } catch (err) {
      toast.error('Failed to delete client');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading details...</div>;
  }

  if (!data || !data.client) return null;

  const { client, projects, subscriptions, payments } = data;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <button onClick={() => navigate('/clients')} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{client.name}</h1>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
              {client.client_type}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${client.status === 'Active' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-slate-400 bg-slate-500/10 border-slate-500/20'}`}>
              {client.status}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowEditClient(true)} className="btn-secondary flex items-center gap-2">
            <Edit3 size={16} /> Edit
          </button>
          <button onClick={handleDelete} className="btn-secondary text-rose-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-5 space-y-4 md:col-span-1">
          <h3 className="font-semibold text-white border-b border-slate-700 pb-2">Contact Details</h3>
          <div className="space-y-3 text-sm">
            <p className="flex items-center gap-3 text-slate-300"><Phone size={16} className="text-slate-500"/> {client.phone}</p>
            {client.email && <p className="flex items-center gap-3 text-slate-300"><Mail size={16} className="text-slate-500"/> {client.email}</p>}
            <p className="flex items-center gap-3 text-slate-300"><MapPin size={16} className="text-slate-500"/> {client.city}</p>
            <p className="flex items-center gap-3 text-slate-400"><Calendar size={16} className="text-slate-600"/> Added {formatDate(client.created_at)}</p>
          </div>
          {client.notes && (
            <div className="mt-4 pt-4 border-t border-slate-700/50">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Notes</p>
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{client.notes}</p>
            </div>
          )}
        </div>

        {/* Projects Summary Area */}
        <div className="glass-card p-0 md:col-span-2 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/30">
            <h3 className="font-semibold text-white flex items-center gap-2"><FolderKanban size={18} className="text-accent-light" /> Projects</h3>
            <button onClick={() => { setEditingProject(null); setShowProjectForm(true); }} className="text-sm font-medium text-accent-light hover:text-accent flex items-center gap-1">
              <Plus size={16} /> Add Project
            </button>
          </div>
          <div className="flex-1 overflow-auto p-0">
            {projects.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No projects yet for this client.</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-800/50 text-slate-400">
                    <th className="p-3 pl-5 font-medium">Name</th>
                    <th className="p-3 font-medium">Value</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 pr-5 text-right font-medium">Start Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {projects.map(p => (
                    <tr key={p.project_id} className="hover:bg-slate-800/30 cursor-pointer" onClick={() => { setEditingProject(p); setShowProjectForm(true); }}>
                      <td className="p-3 pl-5 font-medium text-slate-200">{p.project_name}</td>
                      <td className="p-3 text-slate-300">{formatCurrency(p.total_value)}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs ${p.project_status === 'Completed & Paid' ? 'bg-emerald-500/20 text-emerald-400' : p.project_status === 'Delivered' ? 'bg-amber-500/20 text-amber-400' : 'bg-sky-500/20 text-sky-400'}`}>
                          {p.project_status}
                        </span>
                      </td>
                      <td className="p-3 pr-5 text-right text-slate-400">{formatDate(p.start_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {showEditClient && (
        <ClientForm 
          client={client} 
          onClose={() => setShowEditClient(false)} 
          onSaved={(isEdit) => { setShowEditClient(false); fetchClientDetails(); toast.success(isEdit ? 'Client updated' : 'Client added'); }} 
        />
      )}

      {showProjectForm && (
        <ProjectForm
          project={editingProject}
          prefilledClientId={client.client_id}
          onClose={() => { setShowProjectForm(false); setEditingProject(null); }}
          onSaved={(isEdit) => { setShowProjectForm(false); setEditingProject(null); fetchClientDetails(); toast.success(isEdit ? 'Project updated' : 'Project created'); }}
        />
      )}
    </div>
  );
}

// Temporary placeholder Plus icon until we import it at top if missing.
import { Plus } from 'lucide-react';
