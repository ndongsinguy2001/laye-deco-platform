const Event = require('../models/Event');

// Fonction de notification désactivée
const sendNotification = () => {};

// Créer un événement
exports.createEvent = async (req, res) => {
  try {
    const {
      clientName,
      eventType,
      startDate,    // 👈 MODIFIÉ
      endDate,      // 👈 MODIFIÉ
      time,
      location,
      responsible,
      budget,
      status,
      notes,
      materials
    } = req.body;

    // 👈 Vérification que endDate est après startDate
    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ message: 'La date de fin doit être après la date de début.' });
    }

    const event = new Event({
      clientName,
      eventType,
      startDate,
      endDate,
      time,
      location,
      responsible,
      budget,
      status,
      notes,
      materials: materials || [],
      createdBy: req.user.id
    });

    await event.save();

    // Notifications
    try {
      const typeLabels = {
        religieux: 'Cérémonie religieuse',
        prive: 'Événement privé',
        entreprise: 'Événement d\'entreprise',
        foire: 'Foire',
        autre: 'Autre'
      };

      sendNotification('admin', {
        type: 'event',
        message: `📅 Nouvel événement : ${clientName} - ${typeLabels[eventType] || eventType} (du ${new Date(startDate).toLocaleDateString()} au ${new Date(endDate).toLocaleDateString()})`,
        timestamp: new Date().toISOString()
      });

      sendNotification('director', {
        type: 'event',
        message: `📅 Nouvel événement créé : ${clientName} - ${typeLabels[eventType] || eventType}`,
        timestamp: new Date().toISOString()
      });

      sendNotification('team_leader', {
        type: 'event',
        message: `📅 Nouvel événement : ${clientName} du ${new Date(startDate).toLocaleDateString()} au ${new Date(endDate).toLocaleDateString()}`,
        timestamp: new Date().toISOString()
      });
    } catch (notifError) {
      console.log('⚠️ Erreur notification:', notifError.message);
    }

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
      .sort({ startDate: -1 });  // 👈 MODIFIÉ
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
    // 👈 Vérification si startDate et endDate sont fournis
    if (req.body.startDate && req.body.endDate) {
      if (new Date(req.body.endDate) < new Date(req.body.startDate)) {
        return res.status(400).json({ message: 'La date de fin doit être après la date de début.' });
      }
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé.' });
    }

    // Notification si le statut change
    if (req.body.status && req.body.status !== event.status) {
      try {
        const statusLabels = {
          planned: 'Planifié',
          in_progress: 'En cours',
          completed: 'Terminé',
          cancelled: 'Annulé'
        };

        sendNotification('admin', {
          type: 'event',
          message: `📅 ${event.clientName} : Statut changé en "${statusLabels[req.body.status] || req.body.status}"`,
          timestamp: new Date().toISOString()
        });

        if (req.body.status === 'completed') {
          sendNotification('team_leader', {
            type: 'event',
            message: `✅ Événement terminé : ${event.clientName}`,
            timestamp: new Date().toISOString()
          });
        }
      } catch (notifError) {
        console.log('⚠️ Erreur notification:', notifError.message);
      }
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

    try {
      sendNotification('admin', {
        type: 'event',
        message: `📅 Événement supprimé : ${event.clientName}`,
        timestamp: new Date().toISOString()
      });
    } catch (notifError) {
      console.log('⚠️ Erreur notification:', notifError.message);
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
      .sort({ startDate: 1 });  // 👈 MODIFIÉ
    res.json(events);
  } catch (error) {
    console.error('Erreur getEventsByStatus:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};