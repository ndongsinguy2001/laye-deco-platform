const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const {
  createMaterial,
  getAllMaterials,
  getMaterialById,
  updateMaterial,
  deleteMaterial,
  recordMovement,
  getMovementsByMaterial,
  getAvailableMaterials
} = require('../controllers/materialController');

const router = express.Router();

router.post('/', authenticate, authorize('admin', 'director'), createMaterial);
router.get('/', authenticate, authorize('admin', 'director', 'team_leader'), getAllMaterials);
router.get('/available', authenticate, authorize('admin', 'director', 'team_leader'), getAvailableMaterials);
router.get('/:id', authenticate, authorize('admin', 'director', 'team_leader'), getMaterialById);
router.put('/:id', authenticate, authorize('admin', 'director'), updateMaterial);
router.delete('/:id', authenticate, authorize('admin', 'director'), deleteMaterial);
router.post('/movement', authenticate, authorize('admin', 'director', 'team_leader'), recordMovement);
router.get('/movements/:materialId', authenticate, authorize('admin', 'director', 'team_leader'), getMovementsByMaterial);

module.exports = router;