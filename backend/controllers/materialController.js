const Material = require('../models/Material');
const MaterialMovement = require('../models/MaterialMovement');
const Event = require('../models/Event');

// Fonction de notification désactivée
const sendNotification = () => {};

// Créer un matériel
exports.createMaterial = async (req, res) => {
  try {
    const { name, type, dimensions, state, location, quantity, notes } = req.body;

    const material = new Material({
      name,
      type,
      dimensions,
      state,
      location,
      quantity,
      notes
    });

    await material.save();

    res.status(201).json({
      message: 'Matériel créé avec succès.',
      material
    });
  } catch (error) {
    console.error('Erreur createMaterial:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Obtenir tous les matériels
exports.getAllMaterials = async (req, res) => {
  try {
    const materials = await Material.find().sort({ createdAt: -1 });
    res.json(materials);
  } catch (error) {
    console.error('Erreur getAllMaterials:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Obtenir un matériel par ID
exports.getMaterialById = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: 'Matériel non trouvé.' });
    }
    res.json(material);
  } catch (error) {
    console.error('Erreur getMaterialById:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Mettre à jour un matériel
exports.updateMaterial = async (req, res) => {
  try {
    const material = await Material.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!material) {
      return res.status(404).json({ message: 'Matériel non trouvé.' });
    }

    res.json({ message: 'Matériel mis à jour.', material });
  } catch (error) {
    console.error('Erreur updateMaterial:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Supprimer un matériel
exports.deleteMaterial = async (req, res) => {
  try {
    const material = await Material.findByIdAndDelete(req.params.id);
    if (!material) {
      return res.status(404).json({ message: 'Matériel non trouvé.' });
    }

    res.json({ message: 'Matériel supprimé.' });
  } catch (error) {
    console.error('Erreur deleteMaterial:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Enregistrer un mouvement (sortie/retour)
exports.recordMovement = async (req, res) => {
  try {
    const { materialId, eventId, action, quantity, notes } = req.body;

    const material = await Material.findById(materialId);
    if (!material) {
      return res.status(404).json({ message: 'Matériel non trouvé.' });
    }

    const movement = new MaterialMovement({
      materialId,
      eventId,
      action,
      quantity: quantity || 1,
      notes,
      recordedBy: req.user.id
    });

    await movement.save();

    // Mettre à jour la disponibilité du matériel
    if (action === 'sortie') {
      material.availability = false;
      if (material.quantity) material.quantity -= quantity || 1;
    } else if (action === 'retour') {
      material.availability = true;
      if (material.quantity) material.quantity += quantity || 1;
    }
    await material.save();

    res.json({
      message: 'Mouvement enregistré avec succès.',
      movement,
      material
    });
  } catch (error) {
    console.error('Erreur recordMovement:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Obtenir l'historique des mouvements d'un matériel
exports.getMovementsByMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;
    const movements = await MaterialMovement.find({ materialId })
      .populate('eventId', 'clientName date')
      .populate('recordedBy', 'email')
      .sort({ date: -1 });
    res.json(movements);
  } catch (error) {
    console.error('Erreur getMovementsByMaterial:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Obtenir les matériels disponibles
exports.getAvailableMaterials = async (req, res) => {
  try {
    const materials = await Material.find({ availability: true });
    res.json(materials);
  } catch (error) {
    console.error('Erreur getAvailableMaterials:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};