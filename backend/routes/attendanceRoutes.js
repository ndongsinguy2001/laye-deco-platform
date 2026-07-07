const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const {
  checkIn,
  checkOut,
  markAbsent,
  getAttendanceByEvent,
  getAttendanceByEmployee,
  getTodayAttendance
} = require('../controllers/attendanceController');
const {
  generateQRCode,
  scanQRCode
} = require('../controllers/qrController');

const router = express.Router();

// Pointage manuel (gestionnaires uniquement)
router.post('/check-in', authenticate, authorize('admin', 'director', 'team_leader'), checkIn);
router.post('/check-out', authenticate, authorize('admin', 'director', 'team_leader'), checkOut);
router.post('/absent', authenticate, authorize('admin', 'director', 'team_leader'), markAbsent);

// ✅ AJOUTER 'daily_worker' ICI
router.get('/event/:eventId', authenticate, authorize('admin', 'director', 'team_leader', 'daily_worker'), getAttendanceByEvent);
router.get('/employee/:employeeId', authenticate, authorize('admin', 'director', 'team_leader'), getAttendanceByEmployee);
router.get('/today', authenticate, authorize('admin', 'director', 'team_leader'), getTodayAttendance);

// QR Code
router.get('/qr/generate/:eventId', authenticate, authorize('admin', 'director', 'team_leader'), generateQRCode);
router.post('/qr/scan', authenticate, authorize('admin', 'director', 'team_leader', 'daily_worker'), scanQRCode);

module.exports = router;