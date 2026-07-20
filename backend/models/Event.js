const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  clientName: {
    type: String,
    required: true,
    trim: true
  },
  eventType: {
    type: String,
    enum: ['religieux', 'prive', 'entreprise', 'foire', 'autre'],
    required: true
  },
  // 👇 REMPLACER date par startDate et endDate
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
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
  materials: [{
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

// 👇 AJOUT : validation pour que endDate soit après startDate
eventSchema.pre('validate', function(next) {
  if (this.startDate && this.endDate && this.endDate < this.startDate) {
    next(new Error('La date de fin doit être après la date de début'));
  } else {
    next();
  }
});

module.exports = mongoose.model('Event', eventSchema);