const Payment = require('../models/Payment');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Assignment = require('../models/Assignment');

// Fonction de notification désactivée
const sendNotification = () => {};

// Obtenir tous les paiements (pour le dashboard)
exports.getPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('employeeId', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    console.error('Erreur getPayments:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Calculer les paiements pour un employé sur une période
exports.calculatePayments = async (req, res) => {
  try {
    const { employeeId, period } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employé non trouvé.' });
    }

    const [year, month] = period.split('-');
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Récupérer les pointages de la période
    const attendances = await Attendance.find({
      employeeId,
      checkIn: { $gte: startDate, $lte: endDate },
      status: 'present'
    });

    // Récupérer toutes les affectations de l'employé
    const assignments = await Assignment.find({ employeeId });

    // Créer un map des tarifs par événement
    const rateMap = {};
    assignments.forEach(ass => {
      rateMap[ass.eventId.toString()] = ass.dailyRate || 0;
    });

    // Calculer le montant total
    let totalAmount = 0;
    let totalDays = 0;
    const eventSet = new Set();

    for (const att of attendances) {
      const eventId = att.eventId.toString();
      const rate = rateMap[eventId] || 0;
      totalAmount += rate;
      totalDays += 1;
      eventSet.add(eventId);
    }

    const totalEvents = eventSet.size;

    // Déterminer le montant pour les permanents
    let amount = 0;
    if (employee.status === 'permanent') {
      amount = employee.salary || 0;
    } else {
      amount = totalAmount;
    }

    // Vérifier si un paiement existe déjà
    let payment = await Payment.findOne({ employeeId, period });

    if (payment) {
      payment.totalDays = totalDays;
      payment.totalEvents = totalEvents;
      payment.amount = amount;
      payment.balance = amount - payment.advances;
      await payment.save();
    } else {
      payment = new Payment({
        employeeId,
        period,
        totalDays,
        totalEvents,
        amount,
        advances: 0,
        balance: amount,
        status: 'pending'
      });
      await payment.save();
    }

    res.json({
      message: 'Paiement calculé avec succès.',
      payment
    });
  } catch (error) {
    console.error('Erreur calculatePayments:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Obtenir les paiements d'un employé
exports.getPaymentsByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const payments = await Payment.find({ employeeId }).sort({ period: -1 });
    res.json(payments);
  } catch (error) {
    console.error('Erreur getPaymentsByEmployee:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Enregistrer une avance
exports.addAdvance = async (req, res) => {
  try {
    const { paymentId, amount } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Paiement non trouvé.' });
    }

    payment.advances += amount;
    payment.balance = payment.amount - payment.advances;
    payment.status = payment.balance === 0 ? 'paid' : 'partial';
    await payment.save();

    res.json({
      message: 'Avance enregistrée.',
      payment
    });
  } catch (error) {
    console.error('Erreur addAdvance:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Marquer un paiement comme payé
exports.markAsPaid = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ message: 'Paiement non trouvé.' });
    }

    payment.status = 'paid';
    payment.paidAt = new Date();
    payment.paidBy = req.user.id;
    await payment.save();

    res.json({
      message: 'Paiement marqué comme payé.',
      payment
    });
  } catch (error) {
    console.error('Erreur markAsPaid:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};