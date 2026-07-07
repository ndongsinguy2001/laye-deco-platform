const Attendance = require('../models/Attendance');
const Event = require('../models/Event');
const Employee = require('../models/Employee');

// Pointer une arrivée
exports.checkIn = async (req, res) => {
  try {
    const { employeeId, eventId, comments } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employé non trouvé.' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé.' });
    }

    const existing = await Attendance.findOne({ employeeId, eventId });
    if (existing && existing.checkIn) {
      return res.status(400).json({ message: 'Employé déjà pointé sur cet événement.' });
    }

    let attendance = await Attendance.findOne({ employeeId, eventId });
    if (!attendance) {
      attendance = new Attendance({
        employeeId,
        eventId,
        recordedBy: req.user.id
      });
    }

    attendance.checkIn = new Date();
    attendance.status = 'present';
    if (comments) attendance.comments = comments;
    await attendance.save();

    res.json({
      message: 'Arrivée enregistrée avec succès.',
      attendance
    });
  } catch (error) {
    console.error('Erreur checkIn:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Pointer un départ
exports.checkOut = async (req, res) => {
  try {
    const { employeeId, eventId, comments } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employé non trouvé.' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé.' });
    }

    const attendance = await Attendance.findOne({ employeeId, eventId });
    if (!attendance) {
      return res.status(404).json({ message: 'Aucun pointage trouvé pour cet employé sur cet événement.' });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ message: 'Départ déjà enregistré.' });
    }

    attendance.checkOut = new Date();
    if (comments) attendance.comments = comments;
    await attendance.save();

    res.json({
      message: 'Départ enregistré avec succès.',
      attendance
    });
  } catch (error) {
    console.error('Erreur checkOut:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Enregistrer une absence
exports.markAbsent = async (req, res) => {
  try {
    const { employeeId, eventId, comments } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employé non trouvé.' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé.' });
    }

    const attendance = new Attendance({
      employeeId,
      eventId,
      status: 'absent',
      comments: comments || 'Absent non justifié',
      recordedBy: req.user.id
    });

    await attendance.save();

    res.json({
      message: 'Absence enregistrée.',
      attendance
    });
  } catch (error) {
    console.error('Erreur markAbsent:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Obtenir les pointages d'un événement
exports.getAttendanceByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const attendances = await Attendance.find({ eventId })
      .populate('employeeId', 'firstName lastName phone')
      .populate('recordedBy', 'email');
    res.json(attendances);
  } catch (error) {
    console.error('Erreur getAttendanceByEvent:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Obtenir les pointages d'un employé
exports.getAttendanceByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const attendances = await Attendance.find({ employeeId })
      .populate('eventId', 'clientName date location')
      .sort({ createdAt: -1 });
    res.json(attendances);
  } catch (error) {
    console.error('Erreur getAttendanceByEmployee:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Obtenir les pointages du jour
exports.getTodayAttendance = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendances = await Attendance.find({
      checkIn: { $gte: today, $lt: tomorrow }
    }).populate('employeeId', 'firstName lastName');

    res.json(attendances);
  } catch (error) {
    console.error('Erreur getTodayAttendance:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};