/**
 * Server-side calculation helpers.
 * All business numbers come from the settings cache — NEVER hardcoded.
 */

/**
 * Compute project allocation fields from amount_collected + settings.
 * Returns a new object with the original project fields + computed fields.
 */
function computeProjectAllocations(project, settings) {
  const reservePct = parseFloat(settings.project_split_reserve_pct) || 0;
  const profitPct  = parseFloat(settings.project_split_profit_pct) || 0;
  const duesPct    = parseFloat(settings.project_split_dues_pct) || 0;
  const collected  = parseFloat(project.amount_collected) || 0;
  const total      = parseFloat(project.total_value) || 0;

  return {
    ...project,
    amount_pending:     +(total - collected).toFixed(2),
    collection_percent: total > 0 ? +((collected / total) * 100).toFixed(1) : 0,
    reserve_alloc:      +(collected * (reservePct / 100)).toFixed(2),
    profit_alloc:       +(collected * (profitPct  / 100)).toFixed(2),
    dues_alloc:         +(collected * (duesPct    / 100)).toFixed(2),
  };
}

/**
 * Compute subscription profit from plan pricing in settings.
 */
function computeSubscriptionProfit(planType, settings) {
  const prefix = `plan_${planType}`;
  const price   = parseFloat(settings[`${prefix}_price`]) || 0;
  const expense = parseFloat(settings[`${prefix}_expense_total`]) || 0;
  const totalProfit = price - expense;
  const perFounder  = totalProfit / 2;

  return {
    plan_price:     price,
    plan_expense:   expense,
    total_profit:   +totalProfit.toFixed(2),
    per_founder:    +perFounder.toFixed(2),
    is_negative:    totalProfit < 0,
  };
}

module.exports = { computeProjectAllocations, computeSubscriptionProfit };
