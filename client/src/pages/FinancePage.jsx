import { useState, useEffect } from 'react';
import { BarChart2, TrendingUp, PiggyBank, Wallet, ShieldCheck } from 'lucide-react';
import api from '../utils/api';
import { formatCurrency } from '../utils/formatCurrency';

// ── Mini bar for progress ─────────────────────────────────────
function ProgressBar({ percent, color = 'violet' }) {
  const colors = {
    violet:  'from-violet-500 to-purple-400',
    blue:    'from-blue-500 to-cyan-400',
    emerald: 'from-emerald-500 to-teal-400',
    amber:   'from-amber-500 to-orange-400',
    rose:    'from-rose-500 to-pink-400',
  };
  return (
    <div className="h-2 bg-slate-700/60 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${colors[color] || colors.violet} transition-all duration-700`}
        style={{ width: `${Math.min(100, percent)}%` }}
      />
    </div>
  );
}

function BucketCard({ bucket }) {
  const colorMap = {
    blue:    { text: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    bar: 'blue' },
    emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', bar: 'emerald' },
    amber:   { text: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   bar: 'amber' },
  };
  const c = colorMap[bucket.color] || colorMap.blue;
  return (
    <div className={`glass-card p-5 border ${c.border} ${c.bg}`}>
      <p className={`text-xs font-semibold uppercase tracking-wider ${c.text}`}>{bucket.name}</p>
      <p className="text-2xl font-bold text-white mt-2">{formatCurrency(bucket.total)}</p>
      {bucket.per_founder != null && (
        <p className="text-xs text-slate-400 mt-0.5">Per founder: {formatCurrency(bucket.per_founder)}</p>
      )}
      {bucket.target > 0 && (
        <>
          <ProgressBar percent={bucket.percent} color={c.bar} />
          <p className="text-xs text-slate-500 mt-1.5">
            {bucket.percent.toFixed(1)}% of {formatCurrency(bucket.target)} target
          </p>
        </>
      )}
    </div>
  );
}

function MonthlyChart({ monthlyRevenue }) {
  if (!monthlyRevenue || monthlyRevenue.length === 0) {
    return <p className="text-slate-500 text-sm text-center py-8">No payment data in the last 6 months.</p>;
  }
  const maxVal = Math.max(...monthlyRevenue.map((m) => m.total), 1);
  return (
    <div className="space-y-3">
      {monthlyRevenue.map((m) => (
        <div key={m.month_year}>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>{m.month_year}</span>
            <span className="text-white font-medium">{formatCurrency(m.total)}</span>
          </div>
          <div className="h-6 bg-slate-800 rounded-md overflow-hidden flex gap-0.5">
            {m.project > 0 && (
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-l-md transition-all duration-700"
                style={{ width: `${(m.project / maxVal) * 100}%` }}
                title={`Projects: ${formatCurrency(m.project)}`}
              />
            )}
            {m.subscription > 0 && (
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-r-md transition-all duration-700"
                style={{ width: `${(m.subscription / maxVal) * 100}%` }}
                title={`Subscriptions: ${formatCurrency(m.subscription)}`}
              />
            )}
          </div>
          <div className="flex gap-4 text-xs text-slate-500 mt-0.5">
            {m.project > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-400 inline-block" />Projects {formatCurrency(m.project)}</span>}
            {m.subscription > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-violet-400 inline-block" />Subscriptions {formatCurrency(m.subscription)}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FinancePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/finance/overview')
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
    </div>
  );

  const { buckets, projectSummary, subSummary, monthlyRevenue, duesSummary, founders } = data || {};
  const f1 = founders?.founder1 || 'Founder 1';
  const f2 = founders?.founder2 || 'Founder 2';

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title flex items-center gap-2"><BarChart2 size={24} /> Finance Overview</h1>
        <p className="text-slate-400 text-sm mt-1">Comprehensive breakdown of all money flows.</p>
      </div>

      {/* Money Buckets */}
      <section>
        <h2 className="section-title mb-3 flex items-center gap-2"><PiggyBank size={16} className="text-slate-400" /> Money Buckets</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(buckets || []).map((b) => <BucketCard key={b.key} bucket={b} />)}
        </div>
      </section>

      {/* Project Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="glass-card p-5 space-y-4">
          <h2 className="section-title flex items-center gap-2"><Wallet size={16} className="text-blue-400" /> Project Revenue</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30 text-center">
              <p className="text-xs text-slate-500">Total Collected</p>
              <p className="text-lg font-bold text-emerald-400 mt-1">{formatCurrency(projectSummary?.total_collected || 0)}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30 text-center">
              <p className="text-xs text-slate-500">Still Pending</p>
              <p className="text-lg font-bold text-amber-400 mt-1">{formatCurrency(projectSummary?.total_pending || 0)}</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-300">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400" />Reserve</span>
              <span className="font-medium">{formatCurrency(projectSummary?.split?.reserve || 0)}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" />Profit Pool</span>
              <span className="font-medium">{formatCurrency(projectSummary?.split?.profit || 0)}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" />Dues Provision</span>
              <span className="font-medium">{formatCurrency(projectSummary?.split?.dues || 0)}</span>
            </div>
          </div>
        </section>

        {/* Subscription Summary */}
        <section className="glass-card p-5 space-y-4">
          <h2 className="section-title flex items-center gap-2"><ShieldCheck size={16} className="text-violet-400" /> Subscription Revenue</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30 text-center">
              <p className="text-xs text-slate-500">Monthly Revenue</p>
              <p className="text-lg font-bold text-violet-400 mt-1">{formatCurrency(subSummary?.total_revenue || 0)}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30 text-center">
              <p className="text-xs text-slate-500">Monthly Profit</p>
              <p className="text-lg font-bold text-emerald-400 mt-1">{formatCurrency(subSummary?.total_profit || 0)}</p>
            </div>
          </div>
          {(subSummary?.breakdown || []).map((s) => (
            <div key={s.plan_type} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/30 text-sm">
              <div>
                <p className="font-medium text-slate-200 capitalize">{s.plan_type} Plan</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.count} active · ₹{s.plan_price}/mo</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-white">{formatCurrency(s.total_revenue)}</p>
                <p className="text-xs text-emerald-400">profit {formatCurrency(s.total_profit)}</p>
              </div>
            </div>
          ))}
          <div className="pt-2 border-t border-slate-700/30 flex justify-between text-xs text-slate-400">
            <span>{f1} share: {formatCurrency((subSummary?.total_profit || 0) / 2)}</span>
            <span>{f2} share: {formatCurrency((subSummary?.total_profit || 0) / 2)}</span>
          </div>
        </section>
      </div>

      {/* Monthly Revenue Chart */}
      <section className="glass-card p-5">
        <h2 className="section-title mb-4 flex items-center gap-2">
          <TrendingUp size={16} className="text-emerald-400" /> Monthly Revenue — Last 6 Months
        </h2>
        <MonthlyChart monthlyRevenue={monthlyRevenue} />
      </section>

      {/* Pending Dues Summary */}
      <section className="glass-card p-5">
        <h2 className="section-title mb-4">Pending Dues Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Owed',      val: duesSummary?.total_owed,        color: 'text-rose-400' },
            { label: 'Total Paid',      val: duesSummary?.total_paid,        color: 'text-emerald-400' },
            { label: 'Balance Left',    val: duesSummary?.balance_remaining,  color: 'text-amber-400' },
            { label: 'Open Items',      val: duesSummary?.open_count,        color: 'text-slate-200', isCnt: true },
          ].map((item) => (
            <div key={item.label} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30 text-center">
              <p className="text-xs text-slate-500">{item.label}</p>
              <p className={`text-lg font-bold mt-1 ${item.color}`}>
                {item.isCnt ? item.val ?? 0 : formatCurrency(item.val ?? 0)}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
