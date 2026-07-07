const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const {
  calculatePayments,
  getPaymentsByEmployee,
  addAdvance,
  markAsPaid
} = require('../controllers/paymentController');

const router = express.Router();

router.post('/calculate', authenticate, authorize('admin', 'director', 'accountant'), calculatePayments);
router.get('/employee/:employeeId', authenticate, authorize('admin', 'director', 'accountant', 'daily_worker'), getPaymentsByEmployee);
router.post('/advance', authenticate, authorize('admin', 'director', 'accountant'), addAdvance);
router.put('/:id/paid', authenticate, authorize('admin', 'director'), markAsPaid);

module.exports = router;