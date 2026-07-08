const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getEmployeesByStatus
} = require('../controllers/employeeController');

const router = express.Router();

router.post('/', authenticate, authorize('admin', 'director'), createEmployee);
router.get('/', authenticate, authorize('admin', 'director', 'team_leader', 'accountant', 'daily_worker'), getAllEmployees);
router.get('/status/:status', authenticate, authorize('admin', 'director', 'team_leader'), getEmployeesByStatus);
router.get('/:id', authenticate, authorize('admin', 'director', 'team_leader', 'daily_worker'), getEmployeeById);
router.put('/:id', authenticate, authorize('admin', 'director'), updateEmployee);
router.delete('/:id', authenticate, authorize('admin', 'director'), deleteEmployee);

module.exports = router;