const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const {
  assignEmployee,
  getAssignmentsByEvent,
  getEventsByEmployee,
  removeAssignment
} = require('../controllers/assignmentController');

const router = express.Router();

router.post('/', authenticate, authorize('admin', 'director', 'team_leader'), assignEmployee);

// GET - Ajouter 'daily_worker' pour permettre aux journaliers de voir leurs affectations
router.get('/event/:eventId', authenticate, authorize('admin', 'director', 'team_leader', 'daily_worker'), getAssignmentsByEvent);
router.get('/employee/:employeeId', authenticate, authorize('admin', 'director', 'team_leader', 'daily_worker'), getEventsByEmployee);

router.delete('/:id', authenticate, authorize('admin', 'director', 'team_leader'), removeAssignment);

module.exports = router;