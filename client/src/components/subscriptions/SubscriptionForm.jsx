import { useState, useEffect } from 'react';
import { X, AlertTriangle, Check } from 'lucide-react';
import api from '../../utils/api';
import { useSettings } from '../../context/SettingsContext';

export default function SubscriptionForm({ subscription, prefilledClientId, onClose, onSaved }) {
  const isEdit = !!subscription;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [clients, setClients] = useState([]);
  const { settingsFlat } = useSettings();

  // Derive available plan types from settings
  const planTypes = [];
  if (settingsFlat) {
    if (settingsFlat.plan_monthly_price !== undefined && settingsFlat.plan_monthly_price !== null) planTypes.push({ value: 'monthly', label: 'Monthly' });
    if (settingsFlat.plan_annual_price !== undefined && settingsFlat.plan_annual_price !== null) planTypes.push({ value: 'annual', label: 'Annual' });
  }

  const getLocalDateString = (dateInput) => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [formData, setFormData] = useState({
    client_id: prefilledClientId || '',
    plan_type: planTypes.length > 0 ? planTypes[0].value : 'monthly',
    subscription_start: getLocalDateString(new Date()),
    next_renewal_date: '',
    status: 'Active',
    notes: '',
  });

  useEffect(() => {
    api.get('/clients').then(res => setClients(res.data.clients)).catch(console.error);

    if (subscription) {
      setFormData({
        client_id: subscription.client_id || '',
        plan_type: subscription.plan_type || 'monthly',
        subscription_start: getLocalDateString(subscription.subscription_start),
        next_renewal_date: getLocalDateString(subscription.next_renewal_date),
        status: subscription.status || 'Active',
        notes: subscription.notes || '',
      });
    }
  }, [subscription]);

  // Auto-calculate next_renewal_date when plan_type or subscription_start changes
  useEffect(() => {
    if (formData.subscription_start && !isEdit) {
      const start = new Date(formData.subscription_start);
      if (!isNaN(start.getTime())) {
        const renewal = new Date(start);
        if (formData.plan_type === 'monthly') {
          renewal.setMonth(renewal.getMonth() + 1);
        } else if (formData.plan_type === 'annual') {
          renewal.setFullYear(renewal.getFullYear() + 1);
        }
        setFormData(prev => ({ ...prev, next_renewal_date: getLocalDateString(renewal) }));
      }
    }
  }, [formData.subscription_start, formData.plan_type]);

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
        await api.put(`/subscriptions/${subscription.subscription_id}`, formData);
      } else {
        await api.post('/subscriptions', formData);
      }
      onSaved(isEdit);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save subscription');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-surface-dark border-l border-slate-800 shadow-2xl h-full flex flex-col animate-slide-up sm:animate-none">
        <div className="flex items-center justify-between p-6 border-b border-slate-800/60 bg-slate-900/50">
          <h2 className="text-lg font-semibold text-white">{isEdit ? 'Edit Subscription' : 'New Subscription'}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="subscription-form" onSubmit={handleSubmit} className="space-y-5">
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
                    .filter(c => c.client_type === 'Subscription Client' || c.client_type === 'Both')
                    .map(c => <option key={c.client_id} value={c.client_id}>{c.name}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="label-text">Plan Type *</label>
              <select required name="plan_type" value={formData.plan_type} onChange={handleChange} className="input-dark bg-slate-800">
                {planTypes.map(pt => (
                  <option key={pt.value} value={pt.value}>{pt.label}</option>
                ))}
              </select>
              {settingsFlat && (
                <p className="text-xs text-slate-500 mt-1.5">
                  Plan types are configured in Settings → Subscription Plans
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-text">Start Date *</label>
                <input required type="date" name="subscription_start" value={formData.subscription_start} onChange={handleChange} className="input-dark" />
              </div>
              <div>
                <label className="label-text">Next Renewal *</label>
                <input required type="date" name="next_renewal_date" value={formData.next_renewal_date} onChange={handleChange} className="input-dark" />
              </div>
            </div>

            <div>
              <label className="label-text">Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className="input-dark bg-slate-800">
                <option value="Active">Active</option>
                <option value="Expired">Expired</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="label-text">Notes</label>
              <textarea 
                name="notes" 
                value={formData.notes} 
                onChange={handleChange} 
                className="input-dark min-h-[100px] resize-y" 
                placeholder="Additional details..."
              />
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex gap-3">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" form="subscription-form" disabled={saving} className="btn-primary flex-1 flex justify-center items-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={16} />}
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
