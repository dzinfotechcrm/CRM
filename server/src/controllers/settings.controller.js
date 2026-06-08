const Setting = require('../../models/Setting');
const settingsCache = require('../helpers/settingsCache');

// ── Valid groups ──────────────────────────────────────────────
const VALID_GROUPS = ['project_splits', 'saas_plans', 'goals', 'founders'];

const formatSetting = (doc) => {
  if (!doc) return doc;
  const obj = doc.toObject ? doc.toObject() : doc;
  obj.setting_id = obj._id;

  if (obj.createdAt) obj.created_at = obj.createdAt;
  if (obj.updatedAt) obj.updated_at = obj.updatedAt;
  return obj;
};

// ══════════════════════════════════════════════════════════════
// GET /api/settings — all settings, grouped
// ══════════════════════════════════════════════════════════════
exports.getAll = async (req, res) => {
  try {
    const settings = await Setting.find().sort({ setting_group: 1, setting_key: 1 });

    const grouped = {};
    settings.forEach((doc) => {
      const row = formatSetting(doc);
      if (!grouped[row.setting_group]) grouped[row.setting_group] = [];
      grouped[row.setting_group].push(row);
    });

    // Include incomplete-groups info for dashboard warnings
    const incompleteGroups = settingsCache.getIncompleteGroups();

    res.json({ settings: grouped, incompleteGroups });
  } catch (err) {
    console.error('Get all settings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ══════════════════════════════════════════════════════════════
// GET /api/settings/:group — settings for one group
// ══════════════════════════════════════════════════════════════
exports.getByGroup = async (req, res) => {
  try {
    const { group } = req.params;

    if (!VALID_GROUPS.includes(group)) {
      return res.status(400).json({ error: `Invalid group. Must be one of: ${VALID_GROUPS.join(', ')}` });
    }

    const settings = await Setting.find({ setting_group: group }).sort({ setting_key: 1 });

    res.json({ settings: settings.map(formatSetting) });
  } catch (err) {
    console.error('Get settings by group error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ══════════════════════════════════════════════════════════════
// PUT /api/settings/:group — batch-update a group
// ══════════════════════════════════════════════════════════════
exports.updateByGroup = async (req, res) => {
  try {
    const { group } = req.params;
    const { settings } = req.body; // { key: value, ... }

    if (!VALID_GROUPS.includes(group)) {
      return res.status(400).json({ error: `Invalid group. Must be one of: ${VALID_GROUPS.join(', ')}` });
    }

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Request body must include a "settings" object' });
    }

    // ── Group-specific validation ──────────────────────────
    const errors = validateGroup(group, settings);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // ── Persist ────────────────────────────────────────────
    for (const [key, value] of Object.entries(settings)) {
      const sanitised = value === '' || value === null || value === undefined ? null : String(value);
      await Setting.findOneAndUpdate(
        { setting_key: key, setting_group: group },
        { setting_value: sanitised }
      );
    }

    // ── Refresh cache so all future reads see new values ───
    await settingsCache.invalidate();

    // ── Return updated settings for this group ─────────────
    const updatedSettings = await Setting.find({ setting_group: group }).sort({ setting_key: 1 });

    res.json({ message: 'Settings updated successfully', settings: updatedSettings.map(formatSetting) });
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ══════════════════════════════════════════════════════════════
// Validation helpers
// ══════════════════════════════════════════════════════════════

function validateGroup(group, settings) {
  const errors = [];

  switch (group) {
    // ── Project Splits ──────────────────────────────────────
    case 'project_splits': {
      const reserve = parseFloat(settings.project_split_reserve_pct);
      const profit = parseFloat(settings.project_split_profit_pct);
      const dues = parseFloat(settings.project_split_dues_pct);

      if (isNaN(reserve) || reserve < 0)
        errors.push({ field: 'project_split_reserve_pct', message: 'Reserve % must be a non-negative number' });
      if (isNaN(profit) || profit < 0)
        errors.push({ field: 'project_split_profit_pct', message: 'Profit % must be a non-negative number' });
      if (isNaN(dues) || dues < 0)
        errors.push({ field: 'project_split_dues_pct', message: 'Dues % must be a non-negative number' });

      if (errors.length === 0) {
        const sum = reserve + profit + dues;
        if (Math.abs(sum - 100) > 0.01) {
          errors.push({
            field: 'sum',
            message: `Split percentages must sum to 100% (currently ${sum.toFixed(2)}%)`,
          });
        }
      }
      break;
    }

    // ── SaaS Plans ──────────────────────────────────────────
    case 'saas_plans': {
      const planTypes = ['monthly', 'annual'];

      for (const type of planTypes) {
        const keys = {
          price: `plan_${type}_price`,
          total: `plan_${type}_expense_total`,
          technical: `plan_${type}_expense_technical`,
          physical: `plan_${type}_expense_physical`,
          misc: `plan_${type}_expense_misc`,
        };

        const priceVal = settings[keys.price];
        const techVal = settings[keys.technical];
        const physVal = settings[keys.physical];
        const miscVal = settings[keys.misc];

        const hasAny = [priceVal, techVal, physVal, miscVal].some(
          (v) => v !== null && v !== undefined && v !== ''
        );

        if (hasAny) {
          // Price must be non-negative
          const priceNum = parseFloat(priceVal);
          if (isNaN(priceNum) || priceNum < 0) {
            errors.push({ field: keys.price, message: `${capitalize(type)} plan price must be a non-negative number` });
          }

          // Sub-expenses must be non-negative
          for (const [label, key] of [['technical', keys.technical], ['physical', keys.physical], ['misc', keys.misc]]) {
            const val = parseFloat(settings[key]);
            if (settings[key] !== '' && settings[key] !== null && settings[key] !== undefined) {
              if (isNaN(val) || val < 0) {
                errors.push({ field: key, message: `${capitalize(type)} plan ${label} expense must be non-negative` });
              }
            }
          }

          // Auto-compute expense_total = technical + physical + misc
          const techNum = parseFloat(techVal) || 0;
          const physNum = parseFloat(physVal) || 0;
          const miscNum = parseFloat(miscVal) || 0;
          const computedTotal = techNum + physNum + miscNum;
          settings[keys.total] = String(computedTotal);

          // Warn if profit is negative (expense > price)
          if (!isNaN(priceNum) && computedTotal > priceNum) {
            errors.push({
              field: keys.price,
              type: 'warning',
              message: `⚠️ ${capitalize(type)} plan profit is negative (Price ₹${priceNum} < Expense ₹${computedTotal})`,
            });
          }
        }
      }
      break;
    }

    // ── Goals ────────────────────────────────────────────────
    case 'goals': {
      const numericKeys = [
        'goal_monthly_revenue_target',
        'goal_reserve_target',
        'goal_dues_target',
        'goal_founder_profit_monthly',
      ];

      for (const key of numericKeys) {
        const val = settings[key];
        if (val !== null && val !== undefined && val !== '') {
          const num = parseFloat(val);
          if (isNaN(num) || num < 0) {
            errors.push({ field: key, message: `${key.replace(/_/g, ' ')} must be a non-negative number` });
          }
        }
      }

      // Validate deadline date if provided
      const deadline = settings.goal_monthly_revenue_deadline;
      if (deadline && isNaN(Date.parse(deadline))) {
        errors.push({ field: 'goal_monthly_revenue_deadline', message: 'Deadline must be a valid date' });
      }
      break;
    }

    // ── Founders (no special validation) ─────────────────────
    case 'founders':
      break;
  }

  // Filter out warnings from blocking errors
  const blockingErrors = errors.filter((e) => e.type !== 'warning');
  if (blockingErrors.length > 0) {
    return blockingErrors;
  }

  return []; // Warnings alone don't block saves
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
