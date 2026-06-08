import { useState, useEffect } from 'react';
import { X, AlertTriangle, Check } from 'lucide-react';
import api from '../../utils/api';

export default function ClientForm({ client, onClose, onSaved }) {
  const isEdit = !!client;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    source: 'Referral',
    client_type: 'Project Client',
    status: 'Lead',
    notes: '',
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        phone: client.phone || '',
        email: client.email || '',
        city: client.city || '',
        source: client.source || 'Referral',
        client_type: client.client_type || 'Project Client',
        status: client.status || 'Lead',
        notes: client.notes || '',
      });
    }
  }, [client]);

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
        await api.put(`/clients/${client.client_id}`, formData);
      } else {
        await api.post('/clients', formData);
      }
      onSaved(isEdit);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save client');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Slide-over panel */}
      <div className="relative w-full max-w-md bg-surface-dark border-l border-slate-800 shadow-2xl h-full flex flex-col animate-slide-up sm:animate-none">
        <div className="flex items-center justify-between p-6 border-b border-slate-800/60 bg-slate-900/50">
          <h2 className="text-lg font-semibold text-white">{isEdit ? 'Edit Client' : 'New Client'}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="client-form" onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-start gap-2 text-rose-400 text-sm">
                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div>
              <label className="label-text">Client Name *</label>
              <input required name="name" value={formData.name} onChange={handleChange} className="input-dark" placeholder="Business or individual name" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-text">Phone *</label>
                <input required name="phone" value={formData.phone} onChange={handleChange} className="input-dark" placeholder="10-digit number" />
              </div>
              <div>
                <label className="label-text">City *</label>
                <input required name="city" value={formData.city} onChange={handleChange} className="input-dark" placeholder="e.g. Pune" />
              </div>
            </div>

            <div>
              <label className="label-text">Email Address</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-dark" placeholder="Optional" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-text">Client Type</label>
                <select name="client_type" value={formData.client_type} onChange={handleChange} className="input-dark bg-slate-800">
                  <option value="Project Client">Project Client</option>
                  <option value="Subscription Client">Subscription Client</option>
                  <option value="Both">Both</option>
                </select>
              </div>
              <div>
                <label className="label-text">Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className="input-dark bg-slate-800">
                  <option value="Lead">Lead</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label-text">Source</label>
              <select name="source" value={formData.source} onChange={handleChange} className="input-dark bg-slate-800">
                <option value="Referral">Referral</option>
                <option value="Cold Call">Cold Call</option>
                <option value="Walk-in">Walk-in</option>
                <option value="Instagram">Instagram</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="label-text">Notes</label>
              <textarea 
                name="notes" 
                value={formData.notes} 
                onChange={handleChange} 
                className="input-dark min-h-[100px] resize-y" 
                placeholder="Background context, requirements..."
              />
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex gap-3">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" form="client-form" disabled={saving} className="btn-primary flex-1 flex justify-center items-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={16} />}
            {saving ? 'Saving...' : 'Save Client'}
          </button>
        </div>
      </div>
    </div>
  );
}
