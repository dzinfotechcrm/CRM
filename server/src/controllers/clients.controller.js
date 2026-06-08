const Client = require('../../models/Client');
const Project = require('../../models/Project');
const Subscription = require('../../models/Subscription');
const Payment = require('../../models/Payment');

const formatDoc = (doc, idField) => {
  if (!doc) return doc;
  const obj = doc.toObject ? doc.toObject() : doc;
  obj[idField] = obj._id;
  if (obj.createdAt) obj.created_at = obj.createdAt;
  if (obj.updatedAt) obj.updated_at = obj.updatedAt;
  return obj;
};

// ══════════════════════════════════════════════════════════════
// GET /api/clients — list all, filterable
// ══════════════════════════════════════════════════════════════
exports.getAll = async (req, res) => {
  try {
    const { client_type, status, search } = req.query;
    let query = {};

    if (client_type) query.client_type = client_type;
    if (status) query.status = status;
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { name: regex },
        { phone: regex },
        { email: regex },
        { city: regex }
      ];
    }

    const clients = await Client.find(query).sort({ createdAt: -1 });
    res.json({ clients: clients.map(c => formatDoc(c, 'client_id')) });
  } catch (err) {
    console.error('Get clients error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ══════════════════════════════════════════════════════════════
// GET /api/clients/:id — detail + related projects/subs/payments
// ══════════════════════════════════════════════════════════════
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const client = await Client.findById(id);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Related data
    const [projects, subscriptions, payments] = await Promise.all([
      Project.find({ client_id: id }).sort({ start_date: -1 }),
      Subscription.find({ client_id: id }).sort({ subscription_start: -1 }),
      Payment.find({ client_id: id }).sort({ payment_date: -1 }),
    ]);

    res.json({
      client: formatDoc(client, 'client_id'),
      projects: projects.map(p => formatDoc(p, 'project_id')),
      subscriptions: subscriptions.map(s => formatDoc(s, 'subscription_id')),
      payments: payments.map(p => formatDoc(p, 'payment_id')),
    });
  } catch (err) {
    console.error('Get client by id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ══════════════════════════════════════════════════════════════
// POST /api/clients — create
// ══════════════════════════════════════════════════════════════
exports.create = async (req, res) => {
  try {
    const { name, phone, email, city, source, client_type, status, notes } = req.body;

    if (!name || !phone || !city || !source || !client_type) {
      return res.status(400).json({ error: 'Name, phone, city, source, and client_type are required' });
    }

    const client = await Client.create({
      name,
      phone,
      email: email || null,
      city,
      source,
      client_type,
      status: status || 'Lead',
      notes: notes || null
    });

    res.status(201).json({ client: formatDoc(client, 'client_id') });
  } catch (err) {
    console.error('Create client error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: 'Invalid value for source, client_type, or status' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ══════════════════════════════════════════════════════════════
// PUT /api/clients/:id — update
// ══════════════════════════════════════════════════════════════
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, city, source, client_type, status, notes } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (email !== undefined) updates.email = email;
    if (city !== undefined) updates.city = city;
    if (source !== undefined) updates.source = source;
    if (client_type !== undefined) updates.client_type = client_type;
    if (status !== undefined) updates.status = status;
    if (notes !== undefined) updates.notes = notes;

    const client = await Client.findByIdAndUpdate(id, updates, { new: true });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({ client: formatDoc(client, 'client_id') });
  } catch (err) {
    console.error('Update client error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: 'Invalid value for source, client_type, or status' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ══════════════════════════════════════════════════════════════
// DELETE /api/clients/:id — delete (cascades)
// ══════════════════════════════════════════════════════════════
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await Client.findByIdAndDelete(id);

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    // Cascades (delete related data)
    await Promise.all([
      Project.deleteMany({ client_id: id }),
      Subscription.deleteMany({ client_id: id }),
      Payment.deleteMany({ client_id: id }),
    ]);

    res.json({ message: 'Client deleted successfully' });
  } catch (err) {
    console.error('Delete client error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
