const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  clientName: {
    type: String,
    required: true,
    trim: true
  },
  eventType: {
    type: String,
    enum: ['religieux', 'prive', 'entreprise', 'foire', 'autre'], // 👈 MODIFIÉ
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
  materials: [{                              // 👈 NOUVEAU CHAMP
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material'
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);