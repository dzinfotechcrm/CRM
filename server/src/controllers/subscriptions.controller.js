const Subscription = require('../../models/Subscription');
const settingsCache = require('../helpers/settingsCache');
const { computeSubscriptionProfit } = require('../helpers/calculations');

// Helper to format a date for input[type=date] in local timezone
const toLocalDate = (d) => {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return null;
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};

const formatSubscription = (doc) => {
  if (!doc) return doc;
  const obj = doc.toObject ? doc.toObject() : doc;
  obj.subscription_id = obj._id;
  
  if (obj.client_id && typeof obj.client_id === 'object') {
    obj.client_name = obj.client_id.name;
    obj.client_id = obj.client_id._id;
  }
  
  if (obj.createdAt) obj.created_at = obj.createdAt;
  if (obj.updatedAt) obj.updated_at = obj.updatedAt;
  return obj;
};

// ══════════════════════════════════════════════════════════════
// GET /api/subscriptions — list all with plan pricing from settings
// ══════════════════════════════════════════════════════════════
exports.getAll = async (req, res) => {
  try {
    const { status, client_id } = req.query;
    let query = {};

    if (status) query.status = status;
    if (client_id) query.client_id = client_id;

    const subscriptions = await Subscription.find(query)
      .populate('client_id', 'name')
      .sort({ subscription_start: -1 });

    const settings = settingsCache.getAll();

    // Enrich each subscription with plan pricing from settings
    const enriched = subscriptions.map((sub) => {
      const formatted = formatSubscription(sub);
      const profit = computeSubscriptionProfit(formatted.plan_type, settings);
      return {
        ...formatted,
        ...profit,
      };
    });

    res.json({ subscriptions: enriched });
  } catch (err) {
    console.error('Get subscriptions error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ══════════════════════════════════════════════════════════════
// GET /api/subscriptions/:id — detail with plan pricing
// ══════════════════════════════════════════════════════════════
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const subscription = await Subscription.findById(id).populate('client_id', 'name');

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const settings = settingsCache.getAll();
    const formatted = formatSubscription(subscription);
    const profit = computeSubscriptionProfit(formatted.plan_type, settings);

    res.json({ subscription: { ...formatted, ...profit } });
  } catch (err) {
    console.error('Get subscription by id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ══════════════════════════════════════════════════════════════
// POST /api/subscriptions — create
// ══════════════════════════════════════════════════════════════
exports.create = async (req, res) => {
  try {
    const { client_id, plan_type, subscription_start, next_renewal_date, status, notes } = req.body;

    if (!client_id || !plan_type || !subscription_start || !next_renewal_date) {
      return res.status(400).json({
        error: 'client_id, plan_type, subscription_start, and next_renewal_date are required',
      });
    }

    // Validate plan_type exists in settings
    const settings = settingsCache.getAll();
    const priceKey = `plan_${plan_type}_price`;
    if (settings[priceKey] === undefined) {
      return res.status(400).json({
        error: `Unknown plan type "${plan_type}". Only plan types configured in Settings are allowed.`,
      });
    }

    const subscription = await Subscription.create({
      client_id,
      plan_type,
      subscription_start,
      next_renewal_date,
      status: status || 'Active',
      notes: notes || null
    });

    const fullSubscription = await Subscription.findById(subscription._id).populate('client_id', 'name');
    const formatted = formatSubscription(fullSubscription);
    const profit = computeSubscriptionProfit(plan_type, settings);

    res.status(201).json({ subscription: { ...formatted, ...profit } });
  } catch (err) {
    console.error('Create subscription error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: 'Invalid value check constraints and status' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ══════════════════════════════════════════════════════════════
// PUT /api/subscriptions/:id — update
// ══════════════════════════════════════════════════════════════
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { plan_type, subscription_start, next_renewal_date, status, notes } = req.body;

    const updates = {};
    if (plan_type !== undefined) updates.plan_type = plan_type;
    if (subscription_start !== undefined) updates.subscription_start = subscription_start === '' ? null : subscription_start;
    if (next_renewal_date !== undefined) updates.next_renewal_date = next_renewal_date === '' ? null : next_renewal_date;
    if (status !== undefined) updates.status = status;
    if (notes !== undefined) updates.notes = notes;

    const subscription = await Subscription.findByIdAndUpdate(id, updates, { new: true });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const fullSubscription = await Subscription.findById(id).populate('client_id', 'name');
    const settings = settingsCache.getAll();
    const formatted = formatSubscription(fullSubscription);
    const profit = computeSubscriptionProfit(formatted.plan_type, settings);

    res.json({ subscription: { ...formatted, ...profit } });
  } catch (err) {
    console.error('Update subscription error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: 'Invalid status value' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ══════════════════════════════════════════════════════════════
// DELETE /api/subscriptions/:id
// ══════════════════════════════════════════════════════════════
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const subscription = await Subscription.findByIdAndDelete(id);

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json({ message: 'Subscription deleted successfully' });
  } catch (err) {
    console.error('Delete subscription error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
