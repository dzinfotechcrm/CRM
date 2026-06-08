import { useState, useEffect } from 'react';
import { Target, TrendingUp, ShieldCheck, User, AlertTriangle } from 'lucide-react';
import api from '../utils/api';
import { formatCurrency, formatDate } from '../utils/formatCurrency';

const ICON_MAP = {
  TrendingUp:    TrendingUp,
  ShieldCheck:   ShieldCheck,
  User:          User,
  AlertTriangle: AlertTriangle,
};

const COLOR_MAP = {
  violet:  { text: 'text-violet-400',  ring: 'stroke-violet-500', bg: 'from-violet-500 to-purple-500' },
  blue:    { text: 'text-blue-400',    ring: 'stroke-blue-500',   bg: 'from-blue-500 to-cyan-500' },
  emerald: { text: 'text-emerald-400', ring: 'stroke-emerald-500',bg: 'from-emerald-500 to-teal-500' },
  amber:   { text: 'text-amber-400',   ring: 'stroke-amber-500',  bg: 'from-amber-500 to-orange-500' },
};

function GoalRing({ percent, color }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  const strokeColors = {
    violet: '#8b5cf6', blue: '#3b82f6', emerald: '#10b981', amber: '#f59e0b',
  };
  return (
    <svg width="110" height="110" viewBox="0 0 110 110">
      <circle cx="55" cy="55" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
      <circle
        cx="55" cy="55" r={r} fill="none"
        stroke={strokeColors[color] || strokeColors.violet}
        strokeWidth="10"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 55 55)"
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
      <text x="55" y="50" textAnchor="middle" fontSize="16" fontWeight="800" fill="white">
        {Math.round(percent)}%
      </text>
      <text x="55" y="68" textAnchor="middle" fontSize="10" fill="rgba(148,163,184,0.8)">
        achieved
      </text>
    </svg>
  );
}

function GoalCard({ goal }) {
  const Icon = ICON_MAP[goal.icon] || Target;
  const c = COLOR_MAP[goal.color] || COLOR_MAP.violet;

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${c.bg} flex items-center justify-center shadow-lg flex-shrink-0`}>
          <Icon size={18} className="text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-200 text-sm">{goal.label}</h3>
          <p className="text-xs text-slate-500">{goal.sub}</p>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <GoalRing percent={goal.percent} color={goal.color} />
        <div className="space-y-1.5 flex-1">
          <div>
            <p className="text-xs text-slate-500">Current</p>
            <p className={`text-xl font-bold ${c.text}`}>{formatCurrency(goal.current)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Target</p>
            <p className="text-sm font-semibold text-slate-300">
              {goal.target > 0 ? formatCurrency(goal.target) : <span className="text-amber-400 text-xs">Not set in Settings</span>}
            </p>
          </div>
          {goal.deadline && (
            <div>
              <p className="text-xs text-slate-500">Deadline</p>
              <p className="text-xs text-slate-300">{formatDate(goal.deadline)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="h-2 bg-slate-700/60 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${c.bg} transition-all duration-700`}
            style={{ width: `${Math.min(100, goal.percent)}%` }}
          />
        </div>
        {goal.inverse && (
          <p className="text-xs text-slate-500 mt-1">↓ Lower outstanding balance = higher progress</p>
        )}
      </div>
    </div>
  );
}

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [currentMonth, setCurrentMonth] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/finance/goals')
      .then((res) => {
        setGoals(res.data.goals || []);
        setCurrentMonth(res.data.currentMonthYear || '');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title flex items-center gap-2"><Target size={24} /> Goals</h1>
        <p className="text-slate-400 text-sm mt-1">
          Live progress towards your 5 financial targets.
          {currentMonth && <span className="text-slate-500"> · Current month: {currentMonth}</span>}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {goals.map((g) => <GoalCard key={g.key} goal={g} />)}
      </div>

      {goals.length === 0 && (
        <div className="glass-card p-12 text-center">
          <Target size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No goals configured yet.</p>
          <p className="text-slate-500 text-sm mt-1">Set targets in <a href="/settings" className="text-accent-light hover:underline">Settings → Goals</a>.</p>
        </div>
      )}
    </div>
  );
}
