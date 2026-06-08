const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  setting_key: { type: String, required: true, unique: true },
  setting_value: { type: String },
  setting_label: { type: String, required: true },
  setting_group: { type: String, required: true, enum: ['project_splits', 'saas_plans', 'goals', 'founders'] }
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);
