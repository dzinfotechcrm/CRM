const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  project_name: { type: String, required: true },
  service_type: { type: String, required: true, enum: ['Website', 'Web App', 'Custom Software', 'Other'] },
  total_value: { type: Number, required: true, min: 0 },
  amount_collected: { type: Number, required: true, default: 0, min: 0 },
  project_status: { type: String, required: true, default: 'In Progress', enum: ['In Progress', 'Delivered', 'Completed & Paid'] },
  start_date: { type: Date, required: true },
  delivery_date: { type: Date },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
