const Payment = require('../models/Payment');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');

// Fonction de notification désactivée
const sendNotification = () => {};

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

    const attendances = await Attendance.find({
      employeeId,
      checkIn: { $gte: startDate, $lte: endDate },
      status: 'present'
    });

    const totalDays = attendances.length;
    const totalEvents = new Set(attendances.map(a => a.eventId.toString())).size;

    let amount = 0;
    if (employee.status === 'daily') {
      amount = totalDays * employee.dailyRate;
    } else {
      amount = employee.salary || 0;
    }

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