const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  clientName: {
    type: String,
    required: true,
    trim: true
  },
  eventType: {
    type: String,
    enum: ['bapteme', 'mariage', 'anniversaire', 'religieux', 'prive', 'entreprise', 'autre'],
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  responsible: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  budget: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['planned', 'in_progress', 'completed', 'cancelled'],
    default: 'planned'
  },
  notes: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);