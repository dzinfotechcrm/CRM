const Payment = require('../../models/Payment');
const Project = require('../../models/Project');
const Subscription = require('../../models/Subscription');
const Client = require('../../models/Client');

const formatPayment = (doc) => {
  if (!doc) return doc;
  const obj = doc.toObject ? doc.toObject() : doc;
  obj.payment_id = obj._id;

  if (obj.client_id && typeof obj.client_id === 'object') {
    obj.client_name = obj.client_id.name;
    obj.client_id = obj.client_id._id;
  }
  if (obj.project_id && typeof obj.project_id === 'object') {
    obj.project_name = obj.project_id.project_name;
    obj.project_id = obj.project_id._id;
  }
  if (obj.subscription_id && typeof obj.subscription_id === 'object') {
    obj.plan_type = obj.subscription_id.plan_type;
    obj.subscription_id = obj.subscription_id._id;
  }

  if (obj.createdAt) obj.created_at = obj.createdAt;
  if (obj.updatedAt) obj.updated_at = obj.updatedAt;
  return obj;
};

// ══════════════════════════════════════════════════════════════
// GET /api/payments — list all, filterable by month, source, client
// ══════════════════════════════════════════════════════════════
exports.getAll = async (req, res) => {
  try {
    const { month_year, payment_source, client_id } = req.query;
    let query = {};

    if (month_year) query.month_year = month_year;
    if (payment_source) query.payment_source = payment_source;
    if (client_id) query.client_id = client_id;

    const payments = await Payment.find(query)
      .populate('client_id', 'name')
      .populate('project_id', 'project_name')
      .populate('subscription_id', 'plan_type')
      .sort({ payment_date: -1 });

    res.json({ payments: payments.map(formatPayment) });
  } catch (err) {
    console.error('Get payments error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ══════════════════════════════════════════════════════════════
// GET /api/payments/monthly-total — current month total
// ══════════════════════════════════════════════════════════════
exports.getMonthlyTotal = async (req, res) => {
  try {
    const { month_year } = req.query;
    // Default to current month
    const target = month_year || (() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    })();

    const payments = await Payment.find({ month_year: target });
    const total = payments.reduce((sum, p) => sum + p.amount, 0);

    res.json({ month_year: target, total });
  } catch (err) {
    console.error('Get monthly total error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ══════════════════════════════════════════════════════════════
// POST /api/payments — create payment
// Auto-updates project.amount_collected if payment_source = 'Project'
// ══════════════════════════════════════════════════════════════
exports.create = async (req, res) => {
  try {
    const {
      payment_source, project_id, subscription_id,
      client_id, amount, payment_type, payment_date,
      payment_method, notes,
    } = req.body;

    // Validate required fields
    if (!payment_source || !client_id || !amount || !payment_type || !payment_date || !payment_method) {
      return res.status(400).json({
        error: 'payment_source, client_id, amount, payment_type, payment_date, and payment_method are required',
      });
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    // Validate FK based on payment_source
    if (payment_source === 'Project' && !project_id) {
      return res.status(400).json({ error: 'project_id is required when payment_source is Project' });
    }
    if (payment_source === 'Subscription' && !subscription_id) {
      return res.status(400).json({ error: 'subscription_id is required when payment_source is Subscription' });
    }

    // Derive month_year from payment_date
    const dateObj = new Date(payment_date);
    const month_year = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;

    // If project payment, validate amount_collected won't exceed total_value
    let proj = null;
    if (payment_source === 'Project' && project_id) {
      proj = await Project.findById(project_id);
      if (!proj) {
        return res.status(400).json({ error: 'Project not found' });
      }
      
      const newCollected = proj.amount_collected + amountNum;
      if (newCollected > proj.total_value) {
        return res.status(400).json({
          error: `Payment of ₹${amountNum} would exceed project total value. Current collected: ₹${proj.amount_collected}, Total: ₹${proj.total_value}`,
        });
      }
    }

    // Insert payment
    const payment = await Payment.create({
      payment_source,
      project_id: payment_source === 'Project' ? project_id : undefined,
      subscription_id: payment_source === 'Subscription' ? subscription_id : undefined,
      client_id,
      amount: amountNum,
      payment_type,
      payment_date,
      payment_method,
      month_year,
      notes: notes || null
    });

    // Auto-update project amount_collected
    if (payment_source === 'Project' && proj) {
      proj.amount_collected += amountNum;
      await proj.save();
    }

    // Re-fetch with joins
    const fullRes = await Payment.findById(payment._id)
      .populate('client_id', 'name')
      .populate('project_id', 'project_name')
      .populate('subscription_id', 'plan_type');

    res.status(201).json({ payment: formatPayment(fullRes) });
  } catch (err) {
    console.error('Create payment error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: 'Invalid value — check payment_source, payment_type, or payment_method' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ══════════════════════════════════════════════════════════════
// DELETE /api/payments/:id — delete (reverse amount_collected if project)
// ══════════════════════════════════════════════════════════════
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch payment first to reverse project amount_collected
    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Reverse project amount_collected
    if (payment.payment_source === 'Project' && payment.project_id) {
      const proj = await Project.findById(payment.project_id);
      if (proj) {
        proj.amount_collected = Math.max(0, proj.amount_collected - payment.amount);
        await proj.save();
      }
    }

    await Payment.findByIdAndDelete(id);

    res.json({ message: 'Payment deleted successfully' });
  } catch (err) {
    console.error('Delete payment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
