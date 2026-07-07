const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getEventsByStatus
} = require('../controllers/eventController');

const router = express.Router();

router.post('/', authenticate, authorize('admin', 'director', 'team_leader'), createEvent);

// ✅ Vérifier que 'daily_worker' est bien présent
router.get('/', authenticate, authorize('admin', 'director', 'team_leader', 'daily_worker'), getAllEvents);
router.get('/status/:status', authenticate, authorize('admin', 'director', 'team_leader'), getEventsByStatus);
router.get('/:id', authenticate, authorize('admin', 'director', 'team_leader', 'daily_worker'), getEventById);

router.put('/:id', authenticate, authorize('admin', 'director', 'team_leader'), updateEvent);
router.delete('/:id', authenticate, authorize('admin', 'director'), deleteEvent);

module.exports = router;