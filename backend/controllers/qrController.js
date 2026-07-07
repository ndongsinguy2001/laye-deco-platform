const QRCode = require('qrcode');
const Event = require('../models/Event');
const Employee = require('../models/Employee');
const Assignment = require('../models/Assignment');
const Attendance = require('../models/Attendance');
const { sendNotification } = require('../socket');

// Générer un QR Code pour un événement
exports.generateQRCode = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    console.log('🔄 Génération QR Code pour eventId:', eventId);

    const event = await Event.findById(eventId);
    if (!event) {
      console.log('❌ Événement non trouvé:', eventId);
      return res.status(404).json({ message: 'Événement non trouvé.' });
    }

    console.log('✅ Événement trouvé:', event.clientName);

    // Créer les données du QR Code
    const qrData = {
      eventId: event._id.toString(),
      eventName: event.clientName,
      date: event.date,
      location: event.location || 'Non spécifié',
      type: 'pointage',
      timestamp: new Date().toISOString()
    };

    console.log('📦 Données QR:', qrData);

    // Générer le QR Code en base64
    const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));

    console.log('✅ QR Code généré avec succès');

    res.json({
      message: 'QR Code généré avec succès.',
      qrCode,
      event: {
        id: event._id,
        clientName: event.clientName,
        date: event.date,
        location: event.location
      }
    });
  } catch (error) {
    console.error('❌ Erreur generateQRCode:', error);
    res.status(500).json({ 
      message: 'Erreur serveur lors de la génération du QR Code.',
      error: error.message 
    });
  }
};

// Scanner un QR Code (pointage)
exports.scanQRCode = async (req, res) => {
  try {
    const { qrData, employeeId } = req.body;
    
    console.log('🔄 Scan QR Code - Employé:', employeeId);
    console.log('📦 Données QR reçues:', qrData);

    // Vérifier si l'employé existe
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      console.log('❌ Employé non trouvé:', employeeId);
      return res.status(404).json({ message: 'Employé non trouvé.' });
    }

    console.log('✅ Employé trouvé:', employee.firstName, employee.lastName);

    // Décoder les données du QR
    let eventData;
    try {
      eventData = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
    } catch (e) {
      console.log('❌ QR Code invalide');
      return res.status(400).json({ message: 'QR Code invalide.' });
    }

    console.log('📋 Données décodées:', eventData);

    const event = await Event.findById(eventData.eventId);
    if (!event) {
      console.log('❌ Événement non trouvé:', eventData.eventId);
      return res.status(404).json({ message: 'Événement non trouvé.' });
    }

    console.log('✅ Événement trouvé:', event.clientName);

    // Vérifier si l'événement est actif
    if (event.status === 'cancelled') {
      return res.status(400).json({ message: 'Cet événement est annulé.' });
    }

    if (event.status === 'completed') {
      return res.status(400).json({ message: 'Cet événement est déjà terminé.' });
    }

    // Vérifier si l'employé est déjà affecté
    const assignment = await Assignment.findOne({ eventId: event._id, employeeId });
    if (!assignment) {
      console.log('❌ Employé non affecté à cet événement');
      return res.status(400).json({ 
        message: 'Vous n\'êtes pas affecté à cet événement.' 
      });
    }

    console.log('✅ Employé affecté à cet événement');

    // Vérifier si un pointage existe déjà
    let attendance = await Attendance.findOne({ employeeId, eventId: event._id });

    if (!attendance) {
      // Première arrivée
      attendance = new Attendance({
        employeeId,
        eventId: event._id,
        checkIn: new Date(),
        status: 'present',
        recordedBy: req.user?.id || employeeId
      });
      await attendance.save();

      console.log('✅ Arrivée enregistrée pour', employee.firstName, employee.lastName);

      // Notifications
      sendNotification('team_leader', {
        type: 'attendance',
        message: `👷 ${employee.firstName} ${employee.lastName} a pointé son arrivée à "${event.clientName}" via QR Code`,
        timestamp: new Date().toISOString()
      });

      sendNotification('admin', {
        type: 'attendance',
        message: `✅ ${employee.firstName} ${employee.lastName} - Arrivée à "${event.clientName}" (QR Code)`,
        timestamp: new Date().toISOString()
      });

      return res.json({
        message: 'Arrivée enregistrée avec succès ! ✅',
        attendance,
        type: 'arrivée'
      });
    } else if (attendance.checkIn && !attendance.checkOut) {
      // Départ
      attendance.checkOut = new Date();
      await attendance.save();

      console.log('✅ Départ enregistré pour', employee.firstName, employee.lastName);

      // Notifications
      sendNotification('team_leader', {
        type: 'attendance',
        message: `👷 ${employee.firstName} ${employee.lastName} a pointé son départ de "${event.clientName}" via QR Code`,
        timestamp: new Date().toISOString()
      });

      sendNotification('admin', {
        type: 'attendance',
        message: `✅ ${employee.firstName} ${employee.lastName} - Départ de "${event.clientName}" (QR Code)`,
        timestamp: new Date().toISOString()
      });

      return res.json({
        message: 'Départ enregistré avec succès ! ✅',
        attendance,
        type: 'départ'
      });
    } else {
      return res.status(400).json({ 
        message: 'Vous avez déjà pointé votre arrivée et votre départ pour cet événement.' 
      });
    }
  } catch (error) {
    console.error('❌ Erreur scanQRCode:', error);
    res.status(500).json({ 
      message: 'Erreur serveur lors du scan.',
      error: error.message 
    });
  }
};