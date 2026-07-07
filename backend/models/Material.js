const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['bache', 'chaise', 'table', 'decoration', 'eclairage', 'accessoire', 'autre'],
    required: true
  },
  dimensions: {
    type: String
  },
  state: {
    type: String,
    enum: ['good', 'needs_repair', 'lost', 'damaged'],
    default: 'good'
  },
  location: {
    type: String
  },
  availability: {
    type: Boolean,
    default: true
  },
  quantity: {
    type: Number,
    default: 1
  },
  notes: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Material', materialSchema);