import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, User, Phone, MapPin, ExternalLink, Filter } from 'lucide-react';
import api from '../utils/api';
import ClientForm from '../components/clients/ClientForm';
import { formatDate } from '../utils/formatCurrency';
import { useToast } from '../context/ToastContext';

export default function ClientsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // Modal state
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterType) params.append('client_type', filterType);
      if (filterStatus) params.append('status', filterStatus);

      const { data } = await api.get(`/clients?${params.toString()}`);
      setClients(data.clients || []);
    } catch (err) {
      console.error('Failed to load clients:', err);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => fetchClients(), 300);
    return () => clearTimeout(timer);
  }, [search, filterType, filterStatus]);

  const handleSaved = (isEdit) => {
    setShowForm(false);
    setEditingClient(null);
    fetchClients();
    toast.success(isEdit ? 'Client updated successfully' : 'Client added successfully');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Lead': return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
      case 'Active': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'Inactive': return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
      case 'Lost': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your customer database and leads.</p>
        </div>
        <button
          onClick={() => { setEditingClient(null); setShowForm(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} /> New Client
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, phone, email, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-dark pl-10"
          />
        </div>
        
        <div className="flex gap-4">
          <div className="relative">
            <Filter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input-dark pl-10 pr-8 appearance-none bg-slate-800"
            >
              <option value="">All Types</option>
              <option value="Project Client">Project Client</option>
              <option value="Subscription Client">Subscription Client</option>
              <option value="Both">Both</option>
            </select>
          </div>
          <div className="relative">
            <Filter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-dark pl-10 pr-8 appearance-none bg-slate-800"
            >
              <option value="">All Statuses</option>
              <option value="Lead">Lead</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/50 border-b border-slate-700/50">
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Client</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Contact</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Location / Type</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Added On</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400">Loading clients...</td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400">No clients found.</td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.client_id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 text-slate-400 group-hover:text-accent-light group-hover:border-accent-light/30 transition-colors">
                          <User size={18} />
                        </div>
                        <div>
                          <p className="font-medium text-slate-200">{client.name}</p>
                          <p className="text-xs text-slate-500 truncate max-w-[150px]">{client.source}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-slate-300 flex items-center gap-1.5"><Phone size={14} className="text-slate-500" /> {client.phone}</p>
                      {client.email && <p className="text-xs text-slate-500 mt-1">{client.email}</p>}
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-slate-300 flex items-center gap-1.5"><MapPin size={14} className="text-slate-500" /> {client.city}</p>
                      <span className="text-xs font-medium text-slate-500 mt-1 block">{client.client_type}</span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(client.status)}`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-400">
                      {formatDate(client.created_at)}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => navigate(`/clients/${client.client_id}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg transition-colors border border-slate-700"
                      >
                        View <ExternalLink size={14} />
                      </button>
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
        <ClientForm
          client={editingClient}
          onClose={() => { setShowForm(false); setEditingClient(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
