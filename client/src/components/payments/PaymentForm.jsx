import { useState, useEffect } from 'react';
import { X, AlertTriangle, Check } from 'lucide-react';
import api from '../../utils/api';

export default function PaymentForm({ onClose, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);

  const getLocalDateString = (dateInput) => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [formData, setFormData] = useState({
    payment_source: 'Project',
    client_id: '',
    project_id: '',
    subscription_id: '',
    amount: '',
    payment_type: 'Advance',
    payment_date: getLocalDateString(new Date()),
    payment_method: 'UPI',
    notes: '',
  });

  useEffect(() => {
    api.get('/clients').then(res => setClients(res.data.clients)).catch(console.error);
  }, []);

  // Fetch projects or subscriptions when client changes
  useEffect(() => {
    if (!formData.client_id) {
      setProjects([]);
      setSubscriptions([]);
      return;
    }

    if (formData.payment_source === 'Project') {
      api.get(`/projects?client_id=${formData.client_id}`)
        .then(res => setProjects(res.data.projects || []))
        .catch(console.error);
    } else {
      api.get(`/subscriptions?client_id=${formData.client_id}`)
        .then(res => setSubscriptions(res.data.subscriptions || []))
        .catch(console.error);
    }
  }, [formData.client_id, formData.payment_source]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      // Reset FK when source changes
      if (name === 'payment_source') {
        next.project_id = '';
        next.subscription_id = '';
        // Update payment_type defaults
        if (value === 'Subscription') {
          next.payment_type = 'Subscription Renewal';
        } else {
          next.payment_type = 'Advance';
        }
      }
      // Reset project/subscription when client changes
      if (name === 'client_id') {
        next.project_id = '';
        next.subscription_id = '';
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await api.post('/payments', formData);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save payment');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      <div className="relative w-full max-w-md bg-surface-dark border-l border-slate-800 shadow-2xl h-full flex flex-col animate-slide-up sm:animate-none">
        <div className="flex items-center justify-between p-6 border-b border-slate-800/60 bg-slate-900/50">
          <h2 className="text-lg font-semibold text-white">Record Payment</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="payment-form" onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-start gap-2 text-rose-400 text-sm">
                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Payment Source Toggle */}
            <div>
              <label className="label-text">Payment Source *</label>
              <div className="grid grid-cols-2 gap-2">
                {['Project', 'Subscription'].map(src => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => handleChange({ target: { name: 'payment_source', value: src } })}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                      formData.payment_source === src
                        ? 'bg-accent/20 border-accent text-accent-light'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    {src}
                  </button>
                ))}
              </div>
            </div>

            {/* Client */}
            <div>
              <label className="label-text">Client *</label>
              <select required name="client_id" value={formData.client_id} onChange={handleChange} className="input-dark bg-slate-800">
                <option value="">Select a client...</option>
                {clients
                  .filter(c => {
                    if (formData.payment_source === 'Project') return c.client_type === 'Project Client' || c.client_type === 'Both';
                    if (formData.payment_source === 'Subscription') return c.client_type === 'Subscription Client' || c.client_type === 'Both';
                    return true;
                  })
                  .map(c => <option key={c.client_id} value={c.client_id}>{c.name}</option>)}
              </select>
            </div>

            {/* Project or Subscription selector */}
            {formData.payment_source === 'Project' ? (
              <div>
                <label className="label-text">Project *</label>
                <select required name="project_id" value={formData.project_id} onChange={handleChange} className="input-dark bg-slate-800">
                  <option value="">Select a project...</option>
                  {projects.map(p => (
                    <option key={p.project_id} value={p.project_id}>
                      {p.project_name} (Pending: ₹{p.amount_pending})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="label-text">Subscription *</label>
                <select required name="subscription_id" value={formData.subscription_id} onChange={handleChange} className="input-dark bg-slate-800">
                  <option value="">Select a subscription...</option>
                  {subscriptions.map(s => (
                    <option key={s.subscription_id} value={s.subscription_id}>
                      {s.client_name} — {s.plan_type} plan
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-text">Amount (₹) *</label>
                <input required type="number" min="1" step="1" name="amount" value={formData.amount} onChange={handleChange} className="input-dark" placeholder="0" />
              </div>
              <div>
                <label className="label-text">Payment Method *</label>
                <select required name="payment_method" value={formData.payment_method} onChange={handleChange} className="input-dark bg-slate-800">
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-text">Payment Type *</label>
                <select required name="payment_type" value={formData.payment_type} onChange={handleChange} className="input-dark bg-slate-800">
                  {formData.payment_source === 'Project' ? (
                    <>
                      <option value="Advance">Advance</option>
                      <option value="Partial">Partial</option>
                      <option value="Final Payment">Final Payment</option>
                    </>
                  ) : (
                    <option value="Subscription Renewal">Subscription Renewal</option>
                  )}
                </select>
              </div>
              <div>
                <label className="label-text">Payment Date *</label>
                <input required type="date" name="payment_date" value={formData.payment_date} onChange={handleChange} className="input-dark" />
              </div>
            </div>

            <div>
              <label className="label-text">Notes</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} className="input-dark min-h-[80px] resize-y" placeholder="Reference number, details..." />
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex gap-3">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" form="payment-form" disabled={saving} className="btn-primary flex-1 flex justify-center items-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={16} />}
            {saving ? 'Saving...' : 'Record Payment'}
          </button>
        </div>
      </div>
    </div>
  );
}
