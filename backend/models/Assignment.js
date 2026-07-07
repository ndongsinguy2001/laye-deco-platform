const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  role: {
    type: String,
    enum: ['responsible', 'team_member', 'support'],
    default: 'team_member'
  },
  assignedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index pour éviter les doublons
assignmentSchema.index({ eventId: 1, employeeId: 1 }, { unique: true });

module.exports = mongoose.model('Assignment', assignmentSchema);