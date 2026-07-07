const Event = require('../models/Event');

// Fonction de notification désactivée
const sendNotification = () => {};

// Créer un événement
exports.createEvent = async (req, res) => {
  try {
    const {
      clientName,
      eventType,
      date,
      time,
      location,
      responsible,
      budget,
      status,
      notes
    } = req.body;

    const event = new Event({
      clientName,
      eventType,
      date,
      time,
      location,
      responsible,
      budget,
      status,
      notes,
      createdBy: req.user.id
    });

    await event.save();

    res.status(201).json({
      message: 'Événement créé avec succès.',
      event
    });
  } catch (error) {
    console.error('Erreur createEvent:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Obtenir tous les événements
exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate('responsible', 'email')
      .populate('createdBy', 'email')
      .sort({ date: -1 });
    res.json(events);
  } catch (error) {
    console.error('Erreur getAllEvents:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Obtenir un événement par ID
exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('responsible', 'email')
      .populate('createdBy', 'email');
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé.' });
    }
    res.json(event);
  } catch (error) {
    console.error('Erreur getEventById:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Mettre à jour un événement
exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé.' });
    }

    res.json({ message: 'Événement mis à jour.', event });
  } catch (error) {
    console.error('Erreur updateEvent:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Supprimer un événement
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé.' });
    }

    res.json({ message: 'Événement supprimé.' });
  } catch (error) {
    console.error('Erreur deleteEvent:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Obtenir les événements par statut
exports.getEventsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const events = await Event.find({ status })
      .populate('responsible', 'email')
      .sort({ date: 1 });
    res.json(events);
  } catch (error) {
    console.error('Erreur getEventsByStatus:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};