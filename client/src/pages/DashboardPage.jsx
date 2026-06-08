import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, Users, FolderKanban, CreditCard, AlertTriangle,
  RefreshCw, ArrowRight, Clock, CheckCircle2, Wifi, Target,
  Wallet, PiggyBank, ShieldCheck,
} from 'lucide-react';
import api from '../utils/api';
import { formatCurrency, formatDate } from '../utils/formatCurrency';
import { useSettings } from '../context/SettingsContext';

// ── Small helpers ──────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color = 'accent', onClick }) {
  const colors = {
    accent:  'from-violet-500 to-purple-500',
    emerald: 'from-emerald-500 to-teal-500',
    amber:   'from-amber-500 to-orange-500',
    blue:    'from-blue-500 to-cyan-500',
    rose:    'from-rose-500 to-pink-500',
  };
  return (
    <button
      onClick={onClick}
      className="glass-card p-5 text-left hover:bg-slate-800/60 transition-all group w-full"
    >
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center shadow-lg`}>
          <Icon size={20} className="text-white" />
        </div>
        {onClick && <ArrowRight size={16} className="text-slate-600 group-hover:text-slate-400 transition-colors mt-1" />}
      </div>
      <p className="text-slate-400 text-sm mt-3">{label}</p>
      <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </button>
  );
}

function ProgressRing({ percent, color = 'violet' }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  const colors = { violet: '#8b5cf6', emerald: '#10b981', amber: '#f59e0b', blue: '#3b82f6' };
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" className="flex-shrink-0">
      <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7" />
      <circle
        cx="36" cy="36" r={r} fill="none"
        stroke={colors[color] || colors.violet}
        strokeWidth="7"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 36 36)"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
      <text x="36" y="40" textAnchor="middle" fontSize="12" fontWeight="700" fill="white">
        {Math.round(percent)}%
      </text>
    </svg>
  );
}

function BucketCard({ bucket, founder1, founder2 }) {
  const colorMap = {
    blue:    { ring: 'blue',    text: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20' },
    emerald: { ring: 'emerald', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    amber:   { ring: 'amber',   text: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20' },
  };
  const c = colorMap[bucket.color] || colorMap.blue;

  return (
    <div className={`glass-card p-5 border ${c.border} ${c.bg}`}>
      <div className="flex items-center gap-4">
        <ProgressRing percent={bucket.percent} color={bucket.color} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${c.text}`}>{bucket.name}</p>
          <p className="text-xl font-bold text-white mt-0.5">{formatCurrency(bucket.total)}</p>
          {bucket.target > 0 && (
            <p className="text-xs text-slate-500 mt-0.5">Target: {formatCurrency(bucket.target)}</p>
          )}
          {bucket.key === 'profit' && bucket.per_founder != null && (
            <p className="text-xs text-slate-400 mt-1">
              {founder1}: {formatCurrency(bucket.per_founder)} &nbsp;|&nbsp; {founder2}: {formatCurrency(bucket.per_founder)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate = useNavigate();
  const { incompleteGroups } = useSettings();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await api.get('/dashboard');
      setData(res.data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const { stats, revenueGoal, buckets, recentPayments, renewals, overdueProjects, subSummary, founders } = data || {};
  const f1 = founders?.founder1 || 'Founder 1';
  const f2 = founders?.founder2 || 'Founder 2';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {lastRefresh ? `Last updated ${lastRefresh.toLocaleTimeString('en-IN')}` : ''}
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchDashboard(); }}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Settings Incomplete Warning */}
      {incompleteGroups.length > 0 && (
        <div className="glass-card border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={18} className="text-amber-400" />
          </div>
          <div>
            <h3 className="text-amber-300 font-semibold text-sm">Settings Incomplete</h3>
            <p className="text-amber-200/60 text-sm mt-0.5">
              Some settings are not configured — calculations may be approximate.{' '}
              <button onClick={() => navigate('/settings')} className="text-amber-300 underline hover:text-amber-200">
                Go to Settings
              </button>
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {incompleteGroups.map((g) => (
                <span key={g.group} className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {g.group.replace(/_/g, ' ')} ({g.filled}/{g.total})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats — 6 cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={FolderKanban} label="Active Projects" value={stats?.active_projects ?? '—'} color="blue" onClick={() => navigate('/projects')} />
        <StatCard icon={Wifi} label="Active Subscriptions" value={stats?.active_subscriptions ?? '—'} color="accent" onClick={() => navigate('/subscriptions')} />
        <StatCard icon={Users} label="Total Clients" value={stats?.total_clients ?? '—'} color="emerald" onClick={() => navigate('/clients')} />
        <StatCard
          icon={TrendingUp}
          label="This Month's Revenue"
          value={formatCurrency(stats?.month_revenue ?? 0)}
          sub={revenueGoal?.target > 0 ? `Goal: ${formatCurrency(revenueGoal.target)}` : ''}
          color="emerald"
          onClick={() => navigate('/payments')}
        />
        <StatCard
          icon={Wallet}
          label="Pending Collection"
          value={formatCurrency(stats?.pending_collection ?? 0)}
          sub="Across active projects"
          color="amber"
          onClick={() => navigate('/projects')}
        />
        <StatCard
          icon={AlertTriangle}
          label="Pending Dues"
          value={stats?.pending_dues_count ?? '—'}
          color="rose"
          onClick={() => navigate('/dues')}
        />
      </div>

      {/* Monthly Revenue Goal Bar */}
      {revenueGoal && revenueGoal.target > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-violet-400" />
              <h3 className="font-semibold text-white text-sm">Monthly Revenue Goal</h3>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-white">{formatCurrency(revenueGoal.current)}</span>
              <span className="text-slate-500 text-sm"> / {formatCurrency(revenueGoal.target)}</span>
            </div>
          </div>
          <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-400 transition-all duration-700"
              style={{ width: `${revenueGoal.percent}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className={`text-xs font-medium ${revenueGoal.percent >= 100 ? 'text-emerald-400' : 'text-violet-400'}`}>
              {revenueGoal.percent.toFixed(1)}% achieved
            </span>
            {revenueGoal.deadline && (
              <span className="text-xs text-slate-500">Deadline: {formatDate(revenueGoal.deadline)}</span>
            )}
          </div>
        </div>
      )}

      {/* Money Buckets */}
      <div>
        <h2 className="section-title mb-3 flex items-center gap-2">
          <PiggyBank size={18} className="text-slate-400" /> Money Buckets
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(buckets || []).map((b) => (
            <BucketCard key={b.key} bucket={b} founder1={f1} founder2={f2} />
          ))}
        </div>
      </div>

      {/* Two-column: Recent Payments + Upcoming Renewals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <div className="glass-card p-0 overflow-hidden">
          <div className="p-4 border-b border-slate-700/50 flex items-center justify-between bg-slate-800/30">
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              <CreditCard size={16} className="text-emerald-400" /> Recent Payments
            </h3>
            <button onClick={() => navigate('/payments')} className="text-xs text-accent-light hover:text-accent flex items-center gap-1">
              View All <ArrowRight size={12} />
            </button>
          </div>
          {recentPayments?.length === 0 ? (
            <p className="text-slate-500 text-sm p-6 text-center">No payments recorded yet.</p>
          ) : (
            <div className="divide-y divide-slate-700/30">
              {(recentPayments || []).map((p) => (
                <div key={p.payment_id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-800/30 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{p.client_name}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {p.payment_source === 'Project' ? p.project_name : `${p.subscription_plan} subscription`}
                      {' · '}{p.payment_type}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-sm font-semibold text-emerald-400">{formatCurrency(p.amount)}</p>
                    <p className="text-xs text-slate-500">{formatDate(p.payment_date)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Renewals */}
        <div className="glass-card p-0 overflow-hidden">
          <div className="p-4 border-b border-slate-700/50 flex items-center justify-between bg-slate-800/30">
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              <Clock size={16} className="text-amber-400" /> Upcoming Renewals
              <span className="text-xs text-slate-500">(next 30 days)</span>
            </h3>
            <button onClick={() => navigate('/subscriptions')} className="text-xs text-accent-light hover:text-accent flex items-center gap-1">
              View All <ArrowRight size={12} />
            </button>
          </div>
          {renewals?.length === 0 ? (
            <p className="text-slate-500 text-sm p-6 text-center">No renewals due in the next 30 days.</p>
          ) : (
            <div className="divide-y divide-slate-700/30">
              {(renewals || []).map((r) => {
                const daysLeft = Math.ceil((new Date(r.next_renewal_date) - new Date()) / 86400000);
                return (
                  <div key={r.subscription_id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-800/30 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{r.client_name}</p>
                      <p className="text-xs text-slate-500">{r.plan_type} plan · {r.phone}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="text-sm font-semibold text-amber-400">{formatCurrency(r.plan_price)}</p>
                      <p className={`text-xs ${daysLeft <= 7 ? 'text-rose-400 font-medium' : 'text-slate-500'}`}>
                        {daysLeft === 0 ? 'Due today' : daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `in ${daysLeft}d`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Overdue Projects */}
      {overdueProjects?.length > 0 && (
        <div className="glass-card p-0 overflow-hidden">
          <div className="p-4 border-b border-slate-700/50 bg-slate-800/30 flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              <AlertTriangle size={16} className="text-rose-400" /> Pending Collections
            </h3>
            <button onClick={() => navigate('/projects')} className="text-xs text-accent-light hover:text-accent flex items-center gap-1">
              View All <ArrowRight size={12} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/50 text-slate-400">
                <tr>
                  <th className="text-left p-3 pl-5 font-medium">Project</th>
                  <th className="text-right p-3 font-medium">Total</th>
                  <th className="text-right p-3 font-medium">Collected</th>
                  <th className="text-right p-3 pr-5 font-medium text-rose-400">Pending</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {overdueProjects.map((p) => (
                  <tr key={p.project_id} className="hover:bg-slate-800/30 cursor-pointer" onClick={() => navigate('/projects')}>
                    <td className="p-3 pl-5 text-slate-200 font-medium">{p.project_name}</td>
                    <td className="p-3 text-right text-slate-300">{formatCurrency(p.total_value)}</td>
                    <td className="p-3 text-right text-emerald-400">{formatCurrency(p.amount_collected)}</td>
                    <td className="p-3 pr-5 text-right text-rose-400 font-semibold">{formatCurrency(p.pending)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subscription Summary */}
      {subSummary?.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="font-semibold text-white text-sm mb-4 flex items-center gap-2">
            <ShieldCheck size={16} className="text-violet-400" /> Active Subscription Summary
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {subSummary.map((s) => (
              <div key={s.plan_type} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/40">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-300 capitalize">{s.plan_type} Plan</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    {s.count} active
                  </span>
                </div>
                <p className="text-lg font-bold text-white mt-2">{formatCurrency(s.total_revenue)}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {formatCurrency(s.plan_price)} × {s.count} · Per founder: {formatCurrency(s.per_founder)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
