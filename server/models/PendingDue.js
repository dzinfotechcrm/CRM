const mongoose = require('mongoose');

const pendingDueSchema = new mongoose.Schema({
  person_vendor: { type: String, required: true },
  role_work: { type: String, required: true },
  total_owed: { type: Number, required: true, min: 0 },
  amount_paid: { type: Number, required: true, default: 0, min: 0 },
  status: { type: String, required: true, default: 'Pending', enum: ['Pending', 'Partially Paid', 'Cleared'] },
  payment_date: { type: Date },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('PendingDue', pendingDueSchema);
