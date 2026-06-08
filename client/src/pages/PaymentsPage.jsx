import { useState, useEffect } from 'react';
import { Plus, Filter, Trash2, IndianRupee, ArrowUpRight, ArrowDownRight, Target } from 'lucide-react';
import api from '../utils/api';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import PaymentForm from '../components/payments/PaymentForm';
import { formatDate, formatCurrency } from '../utils/formatCurrency';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthFilter, setMonthFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const { settings } = useSettings();
  const toast = useToast();

  const goalTarget = settings?.goal_monthly_revenue_target ? parseFloat(settings.goal_monthly_revenue_target) : 0;

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (monthFilter) params.append('month_year', monthFilter);
      if (sourceFilter) params.append('payment_source', sourceFilter);
      const { data } = await api.get(`/payments?${params.toString()}`);
      setPayments(data.payments || []);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyTotal = async () => {
    try {
      const params = new URLSearchParams();
      if (monthFilter) params.append('month_year', monthFilter);
      const { data } = await api.get(`/payments/monthly-total?${params.toString()}`);
      setMonthlyTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to load monthly total:', err);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchMonthlyTotal();
  }, [monthFilter, sourceFilter]);

  const handleSaved = () => {
    setShowForm(false);
    fetchPayments();
    fetchMonthlyTotal();
    toast.success('Payment recorded successfully');
  };

  const handleDelete = async (paymentId, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this payment? This will also reverse the collected amount on the project.')) return;
    try {
      await api.delete(`/payments/${paymentId}`);
      fetchPayments();
      fetchMonthlyTotal();
      toast.success('Payment deleted');
    } catch (err) {
      toast.error('Failed to delete payment');
    }
  };

  // Generate month options for filter (last 12 months)
  const monthOptions = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    monthOptions.push({ value: val, label });
  }

  const progressPct = goalTarget > 0 ? Math.min((monthlyTotal / goalTarget) * 100, 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="text-slate-400 text-sm mt-1">Track all incoming payments from projects and subscriptions.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} /> Record Payment
        </button>
      </div>

      {/* Monthly Revenue Card */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Target size={20} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">{monthFilter ? monthOptions.find(m => m.value === monthFilter)?.label : 'This Month'} Revenue</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(monthlyTotal)}</p>
            </div>
          </div>
          {goalTarget > 0 && (
            <div className="text-right">
              <p className="text-xs text-slate-500">Goal: {formatCurrency(goalTarget)}</p>
              <p className={`text-sm font-semibold ${progressPct >= 100 ? 'text-emerald-400' : progressPct >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                {progressPct.toFixed(0)}%
              </p>
            </div>
          )}
        </div>
        {goalTarget > 0 && (
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${progressPct >= 100 ? 'bg-emerald-500' : progressPct >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative">
          <Filter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="input-dark pl-10 pr-8 appearance-none bg-slate-800"
          >
            <option value="">All Months</option>
            {monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <div className="relative">
          <Filter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="input-dark pl-10 pr-8 appearance-none bg-slate-800"
          >
            <option value="">All Sources</option>
            <option value="Project">Project</option>
            <option value="Subscription">Subscription</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-800/50 border-b border-slate-700/50">
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Client / Source</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Details</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-slate-400">Loading payments...</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-slate-400">No payments found.</td></tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.payment_id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0 ${
                          payment.payment_source === 'Project'
                            ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                            : 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                        }`}>
                          {payment.payment_source === 'Project' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                        </div>
                        <div>
                          <p className="font-medium text-slate-200">{payment.client_name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{payment.payment_source}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-slate-300">
                        {payment.payment_source === 'Project'
                          ? payment.project_name || '—'
                          : `${payment.plan_type || '—'} plan`
                        }
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 bg-slate-800 rounded text-slate-400">{payment.payment_type}</span>
                        <span className="text-xs px-2 py-0.5 bg-slate-800 rounded text-slate-400">{payment.payment_method}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-lg font-semibold text-emerald-400">{formatCurrency(payment.amount)}</p>
                    </td>
                    <td className="p-4 text-sm text-slate-400">
                      {formatDate(payment.payment_date)}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={(e) => handleDelete(payment.payment_id, e)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-rose-500/10 rounded-lg transition-colors border border-slate-700 hover:border-rose-500/30"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <PaymentForm
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
