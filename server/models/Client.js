const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  city: { type: String, required: true },
  source: { type: String, required: true, enum: ['Referral', 'Cold Call', 'Walk-in', 'Instagram', 'Other'] },
  client_type: { type: String, required: true, enum: ['Project Client', 'Subscription Client', 'Both'] },
  status: { type: String, required: true, default: 'Lead', enum: ['Active', 'Inactive', 'Lead'] },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Client', clientSchema);
