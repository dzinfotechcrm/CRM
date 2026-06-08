const Project = require('../../models/Project');
const Subscription = require('../../models/Subscription');
const Payment = require('../../models/Payment');
const PendingDue = require('../../models/PendingDue');

const settingsCache = require('../helpers/settingsCache');
const { computeProjectAllocations, computeSubscriptionProfit } = require('../helpers/calculations');

// ══════════════════════════════════════════════════════════════
// GET /api/finance/overview
// ══════════════════════════════════════════════════════════════
exports.getOverview = async (req, res) => {
  try {
    const settings = settingsCache.getAll();

    // ── Aggregate all project allocations ────────────────────
    const projects = await Project.find();
    let totalReserve = 0, totalProfit = 0, totalDues = 0, totalCollected = 0, totalPending = 0;
    for (const p of projects) {
      const obj = p.toObject ? p.toObject() : p;
      obj.project_id = obj._id;
      const alloc = computeProjectAllocations(obj, settings);
      totalReserve    += alloc.reserve_alloc;
      totalProfit     += alloc.profit_alloc;
      totalDues       += alloc.dues_alloc;
      totalCollected  += parseFloat(obj.amount_collected) || 0;
      totalPending    += alloc.amount_pending;
    }

    // ── Subscription revenue (active only) ────────────────────
    const subs = await Subscription.find({ status: 'Active' });
    const subCounts = {};
    for (const s of subs) {
      subCounts[s.plan_type] = (subCounts[s.plan_type] || 0) + 1;
    }
    
    let totalSubRevenue = 0, totalSubProfit = 0;
    const subBreakdown = Object.entries(subCounts).map(([plan_type, count]) => {
      const pf = computeSubscriptionProfit(plan_type, settings);
      totalSubRevenue += pf.plan_price * count;
      totalSubProfit  += pf.total_profit * count;
      return {
        plan_type:     plan_type,
        count,
        plan_price:    pf.plan_price,
        plan_expense:  pf.plan_expense,
        total_revenue: +(pf.plan_price * count).toFixed(2),
        total_profit:  +(pf.total_profit * count).toFixed(2),
        per_founder:   pf.per_founder,
      };
    });

    // ── Month-by-month revenue (last 6 months) ────────────────
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const payments = await Payment.find({ payment_date: { $gte: sixMonthsAgo } });
    
    // Build a structured map
    const monthMap = {};
    for (const row of payments) {
      if (!monthMap[row.month_year]) monthMap[row.month_year] = { month_year: row.month_year, project: 0, subscription: 0 };
      if (row.payment_source === 'Project') monthMap[row.month_year].project += parseFloat(row.amount);
      else monthMap[row.month_year].subscription += parseFloat(row.amount);
    }
    const monthlyRevenue = Object.values(monthMap).sort((a, b) => a.month_year.localeCompare(b.month_year)).map((m) => ({
      ...m,
      total: +(m.project + m.subscription).toFixed(2),
    }));

    // ── Pending dues summary ───────────────────────────────────
    const dues = await PendingDue.find();
    let dTotalOwed = 0, dTotalPaid = 0, dOpenCount = 0;
    for (const d of dues) {
      dTotalOwed += parseFloat(d.total_owed) || 0;
      dTotalPaid += parseFloat(d.amount_paid) || 0;
      if (d.status !== 'Cleared') dOpenCount++;
    }

    // ── Bucket targets ─────────────────────────────────────────
    const reserveTarget = parseFloat(settings.goal_reserve_target) || 0;
    const duesTarget    = parseFloat(settings.goal_dues_target) || 0;
    const founderTarget = parseFloat(settings.goal_founder_profit_monthly) || 0;

    const buckets = [
      {
        key:     'reserve',
        name:    'Reserve Fund',
        color:   'blue',
        total:   +totalReserve.toFixed(2),
        target:  reserveTarget,
        percent: reserveTarget > 0 ? Math.min(100, (totalReserve / reserveTarget) * 100) : 0,
      },
      {
        key:     'profit',
        name:    'Profit Pool',
        color:   'emerald',
        total:   +totalProfit.toFixed(2),
        per_founder: +(totalProfit / 2).toFixed(2),
        target:  founderTarget * 2,
        percent: founderTarget > 0 ? Math.min(100, (totalProfit / 2 / founderTarget) * 100) : 0,
      },
      {
        key:     'dues',
        name:    'Dues Provision',
        color:   'amber',
        total:   +totalDues.toFixed(2),
        target:  duesTarget,
        percent: duesTarget > 0 ? Math.min(100, (totalDues / duesTarget) * 100) : 0,
      },
    ];

    res.json({
      buckets,
      projectSummary: {
        total_collected: +totalCollected.toFixed(2),
        total_pending:   +totalPending.toFixed(2),
        total_projects:  projects.length,
        split: {
          reserve: +totalReserve.toFixed(2),
          profit:  +totalProfit.toFixed(2),
          dues:    +totalDues.toFixed(2),
        },
      },
      subSummary: {
        breakdown:     subBreakdown,
        total_revenue: +totalSubRevenue.toFixed(2),
        total_profit:  +totalSubProfit.toFixed(2),
      },
      monthlyRevenue,
      duesSummary: {
        total_owed:       +dTotalOwed.toFixed(2),
        total_paid:       +dTotalPaid.toFixed(2),
        balance_remaining: +(dTotalOwed - dTotalPaid).toFixed(2),
        open_count:       dOpenCount,
      },
      founders: {
        founder1: settings.founder1_name || 'Founder 1',
        founder2: settings.founder2_name || 'Founder 2',
      },
    });
  } catch (err) {
    console.error('Finance overview error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ══════════════════════════════════════════════════════════════
// GET /api/finance/goals
// Returns all 5 goal cards with progress
// ══════════════════════════════════════════════════════════════
exports.getGoals = async (req, res) => {
  try {
    const settings = settingsCache.getAll();

    // Current month revenue
    const now = new Date();
    const currentMonthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currPayments = await Payment.find({ month_year: currentMonthYear });
    const monthRevenue = currPayments.reduce((sum, p) => sum + p.amount, 0);

    // Total reserve from project splits
    const projects = await Project.find();
    let totalReserve = 0, totalProfit = 0, totalDues = 0;
    for (const p of projects) {
      const obj = p.toObject ? p.toObject() : p;
      obj.project_id = obj._id;
      const alloc = computeProjectAllocations(obj, settings);
      totalReserve += alloc.reserve_alloc;
      totalProfit  += alloc.profit_alloc;
      totalDues    += alloc.dues_alloc;
    }

    // Pending dues balance
    const dues = await PendingDue.find({ status: { $ne: 'Cleared' } });
    let duesBalance = 0;
    for (const d of dues) {
      duesBalance += (parseFloat(d.total_owed) - parseFloat(d.amount_paid));
    }

    // Build 5 goal cards
    const revenueTarget  = parseFloat(settings.goal_monthly_revenue_target) || 0;
    const reserveTarget  = parseFloat(settings.goal_reserve_target) || 0;
    const duesClearTarget = parseFloat(settings.goal_dues_target) || 0;
    const founderTarget  = parseFloat(settings.goal_founder_profit_monthly) || 0;

    const goals = [
      {
        key:        'monthly_revenue',
        label:      'Monthly Revenue',
        icon:       'TrendingUp',
        color:      'violet',
        current:    +monthRevenue.toFixed(2),
        target:     revenueTarget,
        percent:    revenueTarget > 0 ? Math.min(100, (monthRevenue / revenueTarget) * 100) : 0,
        unit:       '₹',
        deadline:   settings.goal_monthly_revenue_deadline || null,
        sub:        `This month: ${currentMonthYear}`,
      },
      {
        key:        'reserve_fund',
        label:      'Reserve Fund',
        icon:       'ShieldCheck',
        color:      'blue',
        current:    +totalReserve.toFixed(2),
        target:     reserveTarget,
        percent:    reserveTarget > 0 ? Math.min(100, (totalReserve / reserveTarget) * 100) : 0,
        unit:       '₹',
        sub:        'Accumulated from project splits',
      },
      {
        key:        'founder1_profit',
        label:      `${settings.founder1_name || 'Founder 1'} Monthly Profit`,
        icon:       'User',
        color:      'emerald',
        current:    +(totalProfit / 2).toFixed(2),
        target:     founderTarget,
        percent:    founderTarget > 0 ? Math.min(100, ((totalProfit / 2) / founderTarget) * 100) : 0,
        unit:       '₹',
        sub:        'From project profit splits',
      },
      {
        key:        'founder2_profit',
        label:      `${settings.founder2_name || 'Founder 2'} Monthly Profit`,
        icon:       'User',
        color:      'emerald',
        current:    +(totalProfit / 2).toFixed(2),
        target:     founderTarget,
        percent:    founderTarget > 0 ? Math.min(100, ((totalProfit / 2) / founderTarget) * 100) : 0,
        unit:       '₹',
        sub:        'From project profit splits',
      },
      {
        key:        'dues_clearance',
        label:      'Dues Clearance',
        icon:       'AlertTriangle',
        color:      'amber',
        current:    +duesBalance.toFixed(2),
        target:     duesClearTarget,
        // For dues, lower is better — show inverse progress
        percent:    duesClearTarget > 0 ? Math.min(100, Math.max(0, ((duesClearTarget - duesBalance) / duesClearTarget) * 100)) : 0,
        unit:       '₹',
        sub:        'Outstanding balance to clear',
        inverse:    true,
      },
    ];

    res.json({ goals, currentMonthYear });
  } catch (err) {
    console.error('Finance goals error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
