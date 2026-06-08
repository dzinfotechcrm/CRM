const PendingDue = require('../../models/PendingDue');

// ── Auto-compute status from amounts ─────────────────────────
function computeStatus(totalOwed, amountPaid) {
  const owed = parseFloat(totalOwed) || 0;
  const paid = parseFloat(amountPaid) || 0;
  if (paid <= 0) return 'Pending';
  if (paid >= owed) return 'Cleared';
  return 'Partially Paid';
}

const formatDue = (doc) => {
  if (!doc) return doc;
  const obj = doc.toObject ? doc.toObject() : doc;
  obj.due_id = obj._id;
  obj.balance_remaining = Math.max(0, obj.total_owed - obj.amount_paid);

  if (obj.createdAt) obj.created_at = obj.createdAt;
  if (obj.updatedAt) obj.updated_at = obj.updatedAt;
  return obj;
};

// ══════════════════════════════════════════════════════════════
// GET /api/dues — list all with computed balance
// ══════════════════════════════════════════════════════════════
exports.getAll = async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status) {
      query.status = status;
    }

    const dues = await PendingDue.find(query).sort({ status: 1, total_owed: -1 });

    res.json({ dues: dues.map(formatDue) });
  } catch (err) {
    console.error('Get dues error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ══════════════════════════════════════════════════════════════
// POST /api/dues — create
// ══════════════════════════════════════════════════════════════
exports.create = async (req, res) => {
  try {
    const { person_vendor, role_work, total_owed, amount_paid, payment_date, notes } = req.body;

    if (!person_vendor || !role_work || total_owed === undefined || total_owed === '') {
      return res.status(400).json({ error: 'person_vendor, role_work, and total_owed are required' });
    }

    const owed = parseFloat(total_owed);
    const paid = parseFloat(amount_paid) || 0;

    if (isNaN(owed) || owed < 0) return res.status(400).json({ error: 'total_owed must be a non-negative number' });
    if (paid < 0) return res.status(400).json({ error: 'amount_paid must be non-negative' });
    if (paid > owed) return res.status(400).json({ error: 'amount_paid cannot exceed total_owed' });

    const status = computeStatus(owed, paid);

    const due = await PendingDue.create({
      person_vendor,
      role_work,
      total_owed: owed,
      amount_paid: paid,
      status,
      payment_date: payment_date || null,
      notes: notes || null
    });

    res.status(201).json({ due: formatDue(due) });
  } catch (err) {
    console.error('Create due error:', err);
    if (err.name === 'ValidationError') return res.status(400).json({ error: 'amount_paid cannot exceed total_owed' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ══════════════════════════════════════════════════════════════
// PUT /api/dues/:id — update (auto-sets status)
// ══════════════════════════════════════════════════════════════
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { person_vendor, role_work, total_owed, amount_paid, payment_date, notes } = req.body;

    // Fetch current
    const current = await PendingDue.findById(id);
    if (!current) return res.status(404).json({ error: 'Due not found' });

    const owed = total_owed !== undefined ? parseFloat(total_owed) : current.total_owed;
    const paid = amount_paid !== undefined ? parseFloat(amount_paid) : current.amount_paid;

    if (paid > owed) return res.status(400).json({ error: 'amount_paid cannot exceed total_owed' });

    const status = computeStatus(owed, paid);

    if (person_vendor !== undefined) current.person_vendor = person_vendor;
    if (role_work !== undefined) current.role_work = role_work;
    current.total_owed = owed;
    current.amount_paid = paid;
    current.status = status;
    if (payment_date !== undefined) current.payment_date = payment_date || null;
    if (notes !== undefined) current.notes = notes || null;

    await current.save();

    res.json({ due: formatDue(current) });
  } catch (err) {
    console.error('Update due error:', err);
    if (err.name === 'ValidationError') return res.status(400).json({ error: 'amount_paid cannot exceed total_owed' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ══════════════════════════════════════════════════════════════
// DELETE /api/dues/:id
// ══════════════════════════════════════════════════════════════
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const due = await PendingDue.findByIdAndDelete(id);
    if (!due) return res.status(404).json({ error: 'Due not found' });
    res.json({ message: 'Due deleted' });
  } catch (err) {
    console.error('Delete due error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
