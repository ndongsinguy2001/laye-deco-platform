const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetPassword
} = require('../controllers/userController');

const router = express.Router();

// Routes protégées (seul le Directeur peut gérer les utilisateurs)
router.get('/', authenticate, authorize('director'), getAllUsers);
router.get('/:id', authenticate, authorize('director'), getUserById);
router.post('/', authenticate, authorize('director'), createUser);
router.put('/:id', authenticate, authorize('director'), updateUser);
router.delete('/:id', authenticate, authorize('director'), deleteUser);
router.post('/:id/reset-password', authenticate, authorize('director'), resetPassword);

module.exports = router;