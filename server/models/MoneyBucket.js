const mongoose = require('mongoose');

const moneyBucketSchema = new mongoose.Schema({
  bucket_key: { type: String, required: true, unique: true, enum: ['reserve', 'profit', 'dues'] },
  bucket_name: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('MoneyBucket', moneyBucketSchema);
