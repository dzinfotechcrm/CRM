const Project = require('../../models/Project');
const Subscription = require('../../models/Subscription');
const Payment = require('../../models/Payment');
const PendingDue = require('../../models/PendingDue');
const Client = require('../../models/Client');

const settingsCache = require('../helpers/settingsCache');
const { computeProjectAllocations, computeSubscriptionProfit } = require('../helpers/calculations');

// ══════════════════════════════════════════════════════════════
// GET /api/dashboard
// Returns everything the Dashboard page needs in one request
// ══════════════════════════════════════════════════════════════
exports.getDashboard = async (req, res) => {
  try {
    const settings = settingsCache.getAll();

    // ── Current month/year string e.g. "2025-06" ──────────────
    const now = new Date();
    const currentMonthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // ── 1. Quick Stats ─────────────────────────────────────────
    const activeProjects = await Project.countDocuments({ project_status: { $ne: 'Completed & Paid' } });
    const activeSubs = await Subscription.countDocuments({ status: 'Active' });
    const pendingDuesCount = await PendingDue.countDocuments({ status: { $ne: 'Cleared' } });
    const totalClients = await Client.countDocuments();
    
    const currPayments = await Payment.find({ month_year: currentMonthYear });
    const monthRevenue = currPayments.reduce((sum, p) => sum + p.amount, 0);
    
    const pendingProjects = await Project.find({ project_status: { $ne: 'Completed & Paid' } });
    const pendingCollection = pendingProjects.reduce((sum, p) => sum + Math.max(0, p.total_value - p.amount_collected), 0);

    const stats = {
      active_projects:     activeProjects,
      active_subscriptions: activeSubs,
      pending_dues_count:  pendingDuesCount,
      total_clients:       totalClients,
      month_revenue:       monthRevenue,
      pending_collection:  pendingCollection,
    };

    // ── 2. Monthly Revenue Goal Progress ──────────────────────
    const revenueTarget = parseFloat(settings.goal_monthly_revenue_target) || 0;
    const revenueGoal = {
      current: stats.month_revenue,
      target:  revenueTarget,
      percent: revenueTarget > 0 ? Math.min(100, (stats.month_revenue / revenueTarget) * 100) : 0,
      deadline: settings.goal_monthly_revenue_deadline || null,
    };

    // ── 3. Money Buckets ───────────────────────────────────────
    // Aggregate all project allocations
    const allProjects = await Project.find();
    let totalReserve = 0, totalProfit = 0, totalDues = 0;
    for (const p of allProjects) {
      const obj = p.toObject ? p.toObject() : p;
      obj.project_id = obj._id;
      const alloc = computeProjectAllocations(obj, settings);
      totalReserve += alloc.reserve_alloc;
      totalProfit  += alloc.profit_alloc;
      totalDues    += alloc.dues_alloc;
    }

    const reserveTarget = parseFloat(settings.goal_reserve_target)     || 0;
    const duesTarget    = parseFloat(settings.goal_dues_target)         || 0;
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

    // ── 4. Recent Payments (last 5) ────────────────────────────
    const recentPaymentsRaw = await Payment.find()
      .populate('client_id', 'name')
      .populate('project_id', 'project_name')
      .populate('subscription_id', 'plan_type')
      .sort({ payment_date: -1, _id: -1 })
      .limit(5);

    const recentPayments = recentPaymentsRaw.map(p => {
      const doc = p.toObject();
      return {
        payment_id: doc._id,
        amount: doc.amount,
        payment_type: doc.payment_type,
        payment_date: doc.payment_date,
        payment_source: doc.payment_source,
        payment_method: doc.payment_method,
        client_name: doc.client_id ? doc.client_id.name : null,
        project_name: doc.project_id ? doc.project_id.project_name : null,
        subscription_plan: doc.subscription_id ? doc.subscription_id.plan_type : null
      };
    });

    // ── 5. Upcoming Renewals (next 30 days) ───────────────────
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    // Convert to start of day for comparison
    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);
    thirtyDaysFromNow.setHours(23,59,59,999);

    const renewalsRaw = await Subscription.find({
      status: 'Active',
      next_renewal_date: {
        $gte: startOfToday,
        $lte: thirtyDaysFromNow
      }
    }).populate('client_id', 'name phone').sort({ next_renewal_date: 1 }).limit(10);

    const renewals = renewalsRaw.map((r) => {
      const doc = r.toObject();
      const price = parseFloat(settings[`plan_${doc.plan_type}_price`]) || 0;
      return {
        subscription_id: doc._id,
        plan_type: doc.plan_type,
        next_renewal_date: doc.next_renewal_date,
        status: doc.status,
        client_name: doc.client_id ? doc.client_id.name : null,
        phone: doc.client_id ? doc.client_id.phone : null,
        plan_price: price
      };
    });

    // ── 6. Overdue Projects (amount_collected < total_value & status != completed) ──
    const overdueProjects = pendingProjects
      .filter(p => p.amount_collected < p.total_value)
      .map(p => {
        const doc = p.toObject();
        return {
          project_id: doc._id,
          project_name: doc.project_name,
          total_value: doc.total_value,
          amount_collected: doc.amount_collected,
          pending: doc.total_value - doc.amount_collected,
          project_status: doc.project_status,
          start_date: doc.start_date
        };
      })
      .sort((a, b) => b.pending - a.pending)
      .slice(0, 5);

    // ── 7. Subscription summary for current month ─────────────
    const allActiveSubs = await Subscription.find({ status: 'Active' });
    const subCounts = {};
    for (const s of allActiveSubs) {
      subCounts[s.plan_type] = (subCounts[s.plan_type] || 0) + 1;
    }

    const subSummary = Object.entries(subCounts).map(([plan_type, count]) => {
      const profit = computeSubscriptionProfit(plan_type, settings);
      return {
        plan_type:   plan_type,
        count:       count,
        plan_price:  profit.plan_price,
        total_revenue: profit.plan_price * count,
        per_founder: profit.per_founder,
      };
    });

    // ── 8. Founder names ──────────────────────────────────────
    const founders = {
      founder1: settings.founder1_name || 'Founder 1',
      founder2: settings.founder2_name || 'Founder 2',
    };

    res.json({
      stats,
      revenueGoal,
      buckets,
      recentPayments,
      renewals,
      overdueProjects,
      subSummary,
      founders,
      currentMonthYear,
      incompleteSettings: settingsCache.getIncompleteGroups(),
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
