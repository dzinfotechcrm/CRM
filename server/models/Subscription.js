const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  plan_type: { type: String, required: true },
  subscription_start: { type: Date, required: true },
  next_renewal_date: { type: Date, required: true },
  status: { type: String, required: true, default: 'Active', enum: ['Active', 'Expired', 'Cancelled'] },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
