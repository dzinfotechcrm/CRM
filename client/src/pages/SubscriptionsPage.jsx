import { useState, useEffect } from 'react';
import { Plus, RefreshCw, Filter, AlertTriangle } from 'lucide-react';
import api from '../utils/api';
import SubscriptionForm from '../components/subscriptions/SubscriptionForm';
import { formatDate, formatCurrency } from '../utils/formatCurrency';
import { useToast } from '../context/ToastContext';

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const toast = useToast();

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      const { data } = await api.get(`/subscriptions?${params.toString()}`);
      setSubscriptions(data.subscriptions || []);
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [statusFilter]);

  const handleSaved = (isEdit) => {
    setShowForm(false);
    setEditingSub(null);
    fetchSubscriptions();
    toast.success(isEdit ? 'Subscription updated' : 'Subscription created');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'Expired': return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
      case 'Cancelled': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Subscriptions</h1>
          <p className="text-slate-400 text-sm mt-1">Manage SaaS subscription clients and renewals.</p>
        </div>
        <button
          onClick={() => { setEditingSub(null); setShowForm(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} /> New Subscription
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative">
          <Filter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-dark pl-10 pr-8 appearance-none bg-slate-800"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Expired">Expired</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-800/50 border-b border-slate-700/50">
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Client / Plan</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Timeline</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Plan Pricing</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Profit / Founder</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-slate-400">Loading subscriptions...</td></tr>
              ) : subscriptions.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-slate-400">No subscriptions found.</td></tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr
                    key={sub.subscription_id}
                    className="hover:bg-slate-800/30 transition-colors group cursor-pointer"
                    onClick={() => { setEditingSub(sub); setShowForm(true); }}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 text-slate-400 group-hover:text-purple-400 group-hover:border-purple-500/30 transition-colors">
                          <RefreshCw size={18} />
                        </div>
                        <div>
                          <p className="font-medium text-slate-200 group-hover:text-purple-400 transition-colors">{sub.client_name}</p>
                          <p className="text-xs text-slate-500 mt-0.5 capitalize">{sub.plan_type} Plan</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-slate-300">Start: {formatDate(sub.subscription_start)}</p>
                      <p className="text-xs text-slate-500 mt-1">Renewal: {formatDate(sub.next_renewal_date)}</p>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(sub.status)}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Price:</span>
                          <span className="text-slate-200">{formatCurrency(sub.plan_price)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Expense:</span>
                          <span className="text-slate-300">{formatCurrency(sub.plan_expense)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Profit:</span>
                          <span className={`font-medium ${sub.is_negative ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {formatCurrency(sub.total_profit)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Per founder:</span>
                          <span className={`text-xs ${sub.is_negative ? 'text-rose-400' : 'text-purple-400'}`}>
                            {formatCurrency(sub.per_founder)}
                          </span>
                        </div>
                        {sub.is_negative && (
                          <div className="flex items-center gap-1 text-rose-400 text-xs mt-1">
                            <AlertTriangle size={12} /> Negative margin
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <SubscriptionForm
          subscription={editingSub}
          onClose={() => { setShowForm(false); setEditingSub(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
