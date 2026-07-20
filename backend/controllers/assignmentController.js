const Assignment = require('../models/Assignment');
const Event = require('../models/Event');
const Employee = require('../models/Employee');

// Fonction de notification désactivée
const sendNotification = () => {};

exports.assignEmployee = async (req, res) => {
  try {
    const { eventId, employeeId, role, dailyRate } = req.body;  // 👈 AJOUT dailyRate

    // Vérifications
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé.' });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employé non trouvé.' });
    }

    // Vérifier si dailyRate est fourni pour les journaliers
    if (employee.status === 'daily' && !dailyRate) {
      return res.status(400).json({ 
        message: 'Veuillez renseigner le tarif journalier pour cet événement.' 
      });
    }

    // Vérifier si l'employé est déjà affecté
    const existing = await Assignment.findOne({ eventId, employeeId });
    if (existing) {
      return res.status(400).json({ message: 'Employé déjà affecté à cet événement.' });
    }

    // Créer l'affectation avec le tarif
    const assignment = new Assignment({
      eventId,
      employeeId,
      role: role || 'team_member',
      dailyRate: dailyRate || 0  // 👈 AJOUT
    });

    await assignment.save();

    employee.totalEvents += 1;
    await employee.save();

    // Notifications (optionnelles)
    try {
      const roleLabel = {
        responsible: 'Responsable',
        team_member: 'Membre d\'équipe',
        support: 'Support'
      };

      sendNotification('team_leader', {
        type: 'assignment',
        message: `${employee.firstName} ${employee.lastName} a été affecté à "${event.clientName}" avec un tarif de ${dailyRate || 0} FCFA/jour`,
        timestamp: new Date().toISOString()
      });

      sendNotification('admin', {
        type: 'assignment',
        message: `Nouvelle affectation : ${employee.firstName} ${employee.lastName} → ${event.clientName}`,
        timestamp: new Date().toISOString()
      });
    } catch (notifError) {
      console.log('⚠️ Erreur notification:', notifError.message);
    }

    res.status(201).json({
      message: 'Employé affecté avec succès.',
      assignment
    });
  } catch (error) {
    console.error('Erreur assignEmployee:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

exports.getAssignmentsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const assignments = await Assignment.find({ eventId })
      .populate('employeeId', 'firstName lastName phone position status')  // 👈 AJOUT status
      .populate('eventId', 'clientName date');
    res.json(assignments);
  } catch (error) {
    console.error('Erreur getAssignmentsByEvent:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

exports.getEventsByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const assignments = await Assignment.find({ employeeId })
      .populate('eventId', 'clientName date location status')
      .populate('employeeId', 'firstName lastName');
    res.json(assignments);
  } catch (error) {
    console.error('Erreur getEventsByEmployee:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

exports.removeAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ message: 'Affectation non trouvée.' });
    }

    const employee = await Employee.findById(assignment.employeeId);
    await Assignment.findByIdAndDelete(id);

    if (employee) {
      await Employee.findByIdAndUpdate(assignment.employeeId, { $inc: { totalEvents: -1 } });
    }

    res.json({ message: 'Affectation supprimée.' });
  } catch (error) {
    console.error('Erreur removeAssignment:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};