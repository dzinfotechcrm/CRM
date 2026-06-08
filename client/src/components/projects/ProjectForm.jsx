import { useState, useEffect } from 'react';
import { X, AlertTriangle, Check } from 'lucide-react';
import api from '../../utils/api';

export default function ProjectForm({ project, prefilledClientId, onClose, onSaved }) {
  const isEdit = !!project;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [clients, setClients] = useState([]);
  
  // Helper to format JS Date into YYYY-MM-DD local time string for input[type=date]
  const getLocalDateString = (dateInput) => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [formData, setFormData] = useState({
    client_id: prefilledClientId || '',
    project_name: '',
    service_type: 'Website',
    total_value: '',
    amount_collected: '0',
    project_status: 'In Progress',
    start_date: getLocalDateString(new Date()),
    delivery_date: '',
    notes: '',
  });

  useEffect(() => {
    // Fetch clients for the dropdown if not editing from client detail
    api.get('/clients').then(res => setClients(res.data.clients)).catch(console.error);

    if (project) {
      setFormData({
        client_id: project.client_id || '',
        project_name: project.project_name || '',
        service_type: project.service_type || 'Website',
        total_value: project.total_value || '',
        amount_collected: project.amount_collected || '0',
        project_status: project.project_status || 'In Progress',
        start_date: getLocalDateString(project.start_date),
        delivery_date: getLocalDateString(project.delivery_date),
        notes: project.notes || '',
      });
    }
  }, [project]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (isEdit) {
        await api.put(`/projects/${project.project_id}`, formData);
      } else {
        await api.post('/projects', formData);
      }
      onSaved(isEdit);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save project');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      
      {/* Slide-over panel */}
      <div className="relative w-full max-w-md bg-surface-dark border-l border-slate-800 shadow-2xl h-full flex flex-col animate-slide-up sm:animate-none">
        <div className="flex items-center justify-between p-6 border-b border-slate-800/60 bg-slate-900/50">
          <h2 className="text-lg font-semibold text-white">{isEdit ? 'Edit Project' : 'New Project'}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="project-form" onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-start gap-2 text-rose-400 text-sm">
                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {!prefilledClientId && !isEdit && (
              <div>
                <label className="label-text">Client *</label>
                <select required name="client_id" value={formData.client_id} onChange={handleChange} className="input-dark bg-slate-800">
                  <option value="">Select a client...</option>
                  {clients
                    .filter(c => c.client_type === 'Project Client' || c.client_type === 'Both')
                    .map(c => <option key={c.client_id} value={c.client_id}>{c.name}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="label-text">Project Name *</label>
              <input required name="project_name" value={formData.project_name} onChange={handleChange} className="input-dark" placeholder="e.g. E-commerce Website" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-text">Service Type *</label>
                <select required name="service_type" value={formData.service_type} onChange={handleChange} className="input-dark bg-slate-800">
                  <option value="Website">Website</option>
                  <option value="Web App">Web App</option>
                  <option value="Custom Software">Custom Software</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="label-text">Status *</label>
                <select required name="project_status" value={formData.project_status} onChange={handleChange} className="input-dark bg-slate-800">
                  <option value="In Progress">In Progress</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Completed & Paid">Completed & Paid</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-text">Total Value (₹) *</label>
                <input required type="number" min="0" step="1" name="total_value" value={formData.total_value} onChange={handleChange} className="input-dark" placeholder="0" />
              </div>
              <div>
                <label className="label-text">Amount Collected (₹) *</label>
                <input required type="number" min="0" step="1" name="amount_collected" value={formData.amount_collected} onChange={handleChange} className="input-dark" placeholder="0" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-text">Start Date *</label>
                <input required type="date" name="start_date" value={formData.start_date} onChange={handleChange} className="input-dark" />
              </div>
              <div>
                <label className="label-text">Delivery Date</label>
                <input type="date" name="delivery_date" value={formData.delivery_date} onChange={handleChange} className="input-dark" />
              </div>
            </div>

            <div>
              <label className="label-text">Notes</label>
              <textarea 
                name="notes" 
                value={formData.notes} 
                onChange={handleChange} 
                className="input-dark min-h-[100px] resize-y" 
                placeholder="Scope, deliverables, etc."
              />
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex gap-3">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" form="project-form" disabled={saving} className="btn-primary flex-1 flex justify-center items-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={16} />}
            {saving ? 'Saving...' : 'Save Project'}
          </button>
        </div>
      </div>
    </div>
  );
}
