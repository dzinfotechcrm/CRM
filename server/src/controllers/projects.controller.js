const Project = require('../../models/Project');
const settingsCache = require('../helpers/settingsCache');
const { computeProjectAllocations } = require('../helpers/calculations');

const formatProject = (doc) => {
  if (!doc) return doc;
  const obj = doc.toObject ? doc.toObject() : doc;
  obj.project_id = obj._id;
  
  if (obj.client_id && typeof obj.client_id === 'object') {
    obj.client_name = obj.client_id.name;
    obj.client_id = obj.client_id._id;
  }
  
  if (obj.createdAt) obj.created_at = obj.createdAt;
  if (obj.updatedAt) obj.updated_at = obj.updatedAt;
  return obj;
};

// ══════════════════════════════════════════════════════════════
// GET /api/projects — list all with computed allocations
// ══════════════════════════════════════════════════════════════
exports.getAll = async (req, res) => {
  try {
    const { status, client_id } = req.query;
    let query = {};

    if (status) query.project_status = status;
    if (client_id) query.client_id = client_id;

    const projects = await Project.find(query)
      .populate('client_id', 'name')
      .sort({ start_date: -1 });

    const settings = settingsCache.getAll();
    const enriched = projects.map(p => computeProjectAllocations(formatProject(p), settings));

    res.json({ projects: enriched });
  } catch (err) {
    console.error('Get projects error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ══════════════════════════════════════════════════════════════
// GET /api/projects/:id — detail with computed allocations
// ══════════════════════════════════════════════════════════════
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id).populate('client_id', 'name');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const settings = settingsCache.getAll();
    res.json({ project: computeProjectAllocations(formatProject(project), settings) });
  } catch (err) {
    console.error('Get project by id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ══════════════════════════════════════════════════════════════
// POST /api/projects — create
// ══════════════════════════════════════════════════════════════
exports.create = async (req, res) => {
  try {
    const {
      client_id, project_name, service_type, total_value,
      amount_collected, project_status, start_date, delivery_date, notes,
    } = req.body;

    // Validate required fields
    if (!client_id || !project_name || !service_type || total_value === undefined || !start_date) {
      return res.status(400).json({
        error: 'client_id, project_name, service_type, total_value, and start_date are required',
      });
    }

    const totalNum = parseFloat(total_value);
    const collectedNum = parseFloat(amount_collected) || 0;

    if (isNaN(totalNum) || totalNum < 0) {
      return res.status(400).json({ error: 'total_value must be a non-negative number' });
    }
    if (collectedNum < 0) {
      return res.status(400).json({ error: 'amount_collected must be non-negative' });
    }
    if (collectedNum > totalNum) {
      return res.status(400).json({ error: 'amount_collected cannot exceed total_value' });
    }

    const project = await Project.create({
      client_id,
      project_name,
      service_type,
      total_value: totalNum,
      amount_collected: collectedNum,
      project_status: project_status || 'In Progress',
      start_date,
      delivery_date: delivery_date || null,
      notes: notes || null
    });

    const fullProject = await Project.findById(project._id).populate('client_id', 'name');
    const settings = settingsCache.getAll();
    res.status(201).json({ project: computeProjectAllocations(formatProject(fullProject), settings) });
  } catch (err) {
    console.error('Create project error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: 'Invalid value — check constraints and status/service_type' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ══════════════════════════════════════════════════════════════
// PUT /api/projects/:id — update (including amount_collected)
// ══════════════════════════════════════════════════════════════
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      project_name, service_type, total_value,
      amount_collected, project_status, start_date, delivery_date, notes,
    } = req.body;

    // Get current values to merge
    const current = await Project.findById(id);
    if (!current) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (total_value !== undefined || amount_collected !== undefined) {
      const newTotal = total_value !== undefined ? parseFloat(total_value) : current.total_value;
      const newCollected = amount_collected !== undefined ? parseFloat(amount_collected) : current.amount_collected;

      if (isNaN(newTotal) || newTotal < 0) {
        return res.status(400).json({ error: 'total_value must be a non-negative number' });
      }
      if (isNaN(newCollected) || newCollected < 0) {
        return res.status(400).json({ error: 'amount_collected must be non-negative' });
      }
      if (newCollected > newTotal) {
        return res.status(400).json({
          error: `amount_collected (₹${newCollected}) cannot exceed total_value (₹${newTotal})`,
        });
      }
      
      current.total_value = newTotal;
      current.amount_collected = newCollected;
    }

    if (project_name !== undefined) current.project_name = project_name;
    if (service_type !== undefined) current.service_type = service_type;
    if (project_status !== undefined) current.project_status = project_status;
    if (start_date !== undefined) current.start_date = start_date === '' ? null : start_date;
    if (delivery_date !== undefined) current.delivery_date = delivery_date === '' ? null : delivery_date;
    if (notes !== undefined) current.notes = notes;

    await current.save();

    const fullProject = await Project.findById(id).populate('client_id', 'name');
    const settings = settingsCache.getAll();
    res.json({ project: computeProjectAllocations(formatProject(fullProject), settings) });
  } catch (err) {
    console.error('Update project error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: 'Invalid value — check constraints and status/service_type' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ══════════════════════════════════════════════════════════════
// DELETE /api/projects/:id
// ══════════════════════════════════════════════════════════════
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findByIdAndDelete(id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
