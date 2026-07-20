const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true,
    match: [/^\S+@\S+\.\S+$/, 'Email invalide']
  },
  phone: {
    type: String,
    required: true
  },
  photo: {
    type: String
  },
  position: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['permanent', 'daily'],
    required: true
  },
  // 👇 SUPPRESSION DE dailyRate
  salary: {
    type: Number,
    required: function() { return this.status === 'permanent'; }
  },
  hireDate: {
    type: Date,
    default: Date.now
  },
  availability: {
    type: Boolean,
    default: true
  },
  address: {
    type: String
  },
  idCard: {
    type: String
  },
  trade: {
    type: String
  },
  totalEvents: {
    type: Number,
    default: 0
  },
  paymentHistory: [{
    date: Date,
    amount: Number,
    type: String,
    status: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('Employee', employeeSchema);