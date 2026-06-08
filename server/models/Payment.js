const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  payment_source: { type: String, required: true, enum: ['Project', 'Subscription'] },
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  subscription_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  amount: { type: Number, required: true, min: 0.01 },
  payment_type: { type: String, required: true, enum: ['Advance', 'Partial', 'Final Payment', 'Subscription Renewal'] },
  payment_date: { type: Date, required: true },
  payment_method: { type: String, required: true, enum: ['UPI', 'Bank Transfer', 'Cash', 'Cheque'] },
  month_year: { type: String, required: true },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
