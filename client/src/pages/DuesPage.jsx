import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Check, X, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import api from '../utils/api';
import { formatCurrency, formatDate } from '../utils/formatCurrency';
import { useToast } from '../context/ToastContext';

// ── Status Badge ──────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    Pending:          'bg-amber-500/15 text-amber-400 border-amber-500/30',
    'Partially Paid': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    Cleared:          'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  };
  const icons = {
    Pending:          <Clock size={11} />,
    'Partially Paid': <AlertTriangle size={11} />,
    Cleared:          <CheckCircle2 size={11} />,
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${map[status] || ''}`}>
      {icons[status]} {status}
    </span>
  );
}

// ── Due Form (modal slide-in) ─────────────────────────────────
function DueForm({ due, onClose, onSaved }) {
  const isEdit = !!due;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    person_vendor: due?.person_vendor || '',
    role_work:     due?.role_work     || '',
    total_owed:    due?.total_owed    || '',
    amount_paid:   due?.amount_paid   || '0',
    payment_date:  due?.payment_date  ? due.payment_date.split('T')[0] : '',
    notes:         due?.notes         || '',
  });

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        await api.put(`/dues/${due.due_id}`, form);
      } else {
        await api.post('/dues', form);
      }
      onSaved(isEdit);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface-dark border-l border-slate-800 shadow-2xl h-full flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-800/60 bg-slate-900/50">
          <h2 className="text-lg font-semibold text-white">{isEdit ? 'Edit Due' : 'Add Pending Due'}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="due-form" onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-2 text-rose-400 text-sm">
                <AlertTriangle size={16} /> {error}
              </div>
            )}

            <div>
              <label className="label-text">Person / Vendor *</label>
              <input required name="person_vendor" value={form.person_vendor} onChange={handleChange} className="input-dark" placeholder="Name of person or vendor" />
            </div>

            <div>
              <label className="label-text">Role / Work *</label>
              <input required name="role_work" value={form.role_work} onChange={handleChange} className="input-dark" placeholder="e.g. Freelancer, Designer, Vendor" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-text">Total Owed (₹) *</label>
                <input required type="number" min="0" step="1" name="total_owed" value={form.total_owed} onChange={handleChange} className="input-dark" placeholder="0" />
              </div>
              <div>
                <label className="label-text">Amount Paid (₹)</label>
                <input type="number" min="0" step="1" name="amount_paid" value={form.amount_paid} onChange={handleChange} className="input-dark" placeholder="0" />
              </div>
            </div>

            {/* Live balance preview */}
            {form.total_owed !== '' && (
              <div className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/30">
                <span className="text-slate-400">Balance remaining:</span>
                <span className={`font-semibold ${(parseFloat(form.total_owed) - parseFloat(form.amount_paid || 0)) > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {formatCurrency(Math.max(0, parseFloat(form.total_owed || 0) - parseFloat(form.amount_paid || 0)))}
                </span>
              </div>
            )}

            <div>
              <label className="label-text">Payment Date</label>
              <input type="date" name="payment_date" value={form.payment_date} onChange={handleChange} className="input-dark" />
            </div>

            <div>
              <label className="label-text">Notes</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} className="input-dark min-h-[80px] resize-y" placeholder="Work details, reference..." />
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex gap-3">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" form="due-form" disabled={saving} className="btn-primary flex-1 flex justify-center items-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={16} />}
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Inline Pay Row ────────────────────────────────────────────
function InlinePayRow({ due, onUpdated }) {
  const [paying, setPaying] = useState(false);
  const [val, setVal] = useState(String(parseFloat(due.total_owed) - parseFloat(due.amount_paid)));
  const [saving, setSaving] = useState(false);

  if (!paying) {
    return (
      <button
        onClick={() => setPaying(true)}
        className="text-xs text-accent-light hover:text-accent border border-accent/30 hover:border-accent px-2 py-1 rounded transition-colors"
      >
        + Record Payment
      </button>
    );
  }

  const handle = async () => {
    const newPaid = parseFloat(due.amount_paid) + parseFloat(val || 0);
    if (isNaN(newPaid) || newPaid < 0) return;
    setSaving(true);
    try {
      await api.put(`/dues/${due.due_id}`, { amount_paid: String(Math.min(newPaid, parseFloat(due.total_owed))) });
      setPaying(false);
      onUpdated();
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-slate-400">Pay ₹</span>
      <input
        type="number"
        min="0"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="w-24 text-xs px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white outline-none focus:border-accent"
      />
      <button onClick={handle} disabled={saving} className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded">
        <Check size={14} />
      </button>
      <button onClick={() => setPaying(false)} className="p-1 text-slate-500 hover:bg-slate-700 rounded">
        <X size={14} />
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function DuesPage() {
  const [dues, setDues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDue, setEditingDue] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const toast = useToast();

  const fetchDues = async () => {
    try {
      const params = filterStatus ? `?status=${filterStatus}` : '';
      const res = await api.get(`/dues${params}`);
      setDues(res.data.dues || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDues(); }, [filterStatus]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this due entry?')) return;
    try {
      await api.delete(`/dues/${id}`);
      toast.success('Due entry deleted');
      fetchDues();
    } catch {
      toast.error('Failed to delete');
    }
  };

  // Summary totals
  const totalOwed     = dues.reduce((s, d) => s + parseFloat(d.total_owed), 0);
  const totalPaid     = dues.reduce((s, d) => s + parseFloat(d.amount_paid), 0);
  const totalBalance  = dues.reduce((s, d) => s + parseFloat(d.balance_remaining), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Pending Dues</h1>
          <p className="text-slate-400 text-sm mt-1">Track outstanding payments to freelancers and vendors.</p>
        </div>
        <button onClick={() => { setEditingDue(null); setShowForm(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Add Due
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Owed',   val: totalOwed,    color: 'text-rose-400' },
          { label: 'Total Paid',   val: totalPaid,    color: 'text-emerald-400' },
          { label: 'Still Owed',   val: totalBalance, color: 'text-amber-400' },
        ].map((c) => (
          <div key={c.label} className="glass-card p-4 text-center">
            <p className="text-xs text-slate-500">{c.label}</p>
            <p className={`text-xl font-bold mt-1 ${c.color}`}>{formatCurrency(c.val)}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['', 'Pending', 'Partially Paid', 'Cleared'].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setFilterStatus(s)}
            className={`px-4 py-1.5 rounded-full text-sm border transition-all ${filterStatus === s ? 'bg-accent/20 border-accent text-accent-light' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" /></div>
      ) : dues.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <CheckCircle2 size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">{filterStatus ? `No ${filterStatus} dues.` : 'No dues recorded yet.'}</p>
          <button onClick={() => setShowForm(true)} className="mt-4 btn-secondary text-sm">Add First Due</button>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/50 text-slate-400">
                <tr>
                  <th className="text-left p-3 pl-5 font-medium">Person / Vendor</th>
                  <th className="text-left p-3 font-medium">Role / Work</th>
                  <th className="text-right p-3 font-medium">Total Owed</th>
                  <th className="text-right p-3 font-medium">Paid</th>
                  <th className="text-right p-3 font-medium text-rose-400">Remaining</th>
                  <th className="text-center p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Action</th>
                  <th className="text-right p-3 pr-5 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {dues.map((d) => (
                  <tr key={d.due_id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 pl-5 font-medium text-slate-200">{d.person_vendor}</td>
                    <td className="p-3 text-slate-400">{d.role_work}</td>
                    <td className="p-3 text-right text-slate-300">{formatCurrency(d.total_owed)}</td>
                    <td className="p-3 text-right text-emerald-400">{formatCurrency(d.amount_paid)}</td>
                    <td className={`p-3 text-right font-semibold ${parseFloat(d.balance_remaining) > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {formatCurrency(d.balance_remaining)}
                    </td>
                    <td className="p-3 text-center"><StatusBadge status={d.status} /></td>
                    <td className="p-3">
                      {d.status !== 'Cleared' && (
                        <InlinePayRow due={d} onUpdated={fetchDues} />
                      )}
                    </td>
                    <td className="p-3 pr-5 text-right">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => { setEditingDue(d); setShowForm(true); }} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors">
                          <Edit3 size={14} />
                        </button>
                        <button onClick={() => handleDelete(d.due_id)} className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <DueForm
          due={editingDue}
          onClose={() => { setShowForm(false); setEditingDue(null); }}
          onSaved={(isEdit) => { setShowForm(false); setEditingDue(null); fetchDues(); toast.success(isEdit ? 'Due updated' : 'Due added'); }}
        />
      )}
    </div>
  );
}
