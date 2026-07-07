const Employee = require('../models/Employee');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { sendWelcomeEmail } = require('../services/emailService');

// Fonction de notification désactivée
const sendNotification = () => {};

// Générer un mot de passe aléatoire
const generatePassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Créer un employé (admin ou directeur)
exports.createEmployee = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      photo,
      position,
      status,
      dailyRate,
      salary,
      hireDate,
      availability,
      address,
      idCard,
      trade
    } = req.body;

    // 1. Créer l'employé
    const employee = new Employee({
      firstName,
      lastName,
      email,
      phone,
      photo,
      position,
      status,
      dailyRate,
      salary,
      hireDate,
      availability,
      address,
      idCard,
      trade,
      createdBy: req.user.id
    });

    await employee.save();

    // 2. Si un téléphone est fourni, créer un compte utilisateur
    let userCreated = false;
    let generatedPassword = '';

    if (phone) {
      try {
        const existingUser = await User.findOne({ phone });
        if (!existingUser) {
          const password = generatePassword();
          generatedPassword = password;

          const hashedPassword = await bcrypt.hash(password, 10);

          let role = 'daily_worker';
          if (position && position.toLowerCase().includes('responsable')) {
            role = 'team_leader';
          } else if (status === 'permanent') {
            role = 'accountant';
          }

          const user = new User({
            phone,
            email: email || '',
            password: hashedPassword,
            role: role,
            employeeId: employee._id,
            isActive: true
          });

          await user.save();
          userCreated = true;
          console.log('✅ Compte utilisateur créé pour:', phone);

          // Envoyer l'email si un email est fourni
          if (email) {
            try {
              await sendWelcomeEmail(email, password, role);
              console.log('✅ Email de bienvenue envoyé à:', email);
            } catch (emailError) {
              console.log('⚠️ Email non envoyé:', emailError.message);
            }
          }
        } else {
          console.log('ℹ️ Un compte existe déjà pour:', phone);
        }
      } catch (userError) {
        console.error('❌ Erreur création utilisateur:', userError);
      }
    }

    // Notifications avec fallback
    try {
      sendNotification('admin', {
        type: 'assignment',
        message: `👤 Nouvel employé ajouté : ${firstName} ${lastName} (${position || 'Sans poste'})`,
        timestamp: new Date().toISOString()
      });

      sendNotification('director', {
        type: 'assignment',
        message: `👤 ${firstName} ${lastName} a rejoint l'équipe`,
        timestamp: new Date().toISOString()
      });
    } catch (notifError) {
      console.log('⚠️ Erreur notification:', notifError.message);
    }

    let message = 'Employé créé avec succès.';
    if (userCreated) {
      message += ' Un compte utilisateur a été créé avec le téléphone comme identifiant.';
    } else if (phone) {
      message += ' Un compte existe déjà pour ce téléphone.';
    }

    res.status(201).json({
      message,
      employee,
      userCreated,
      generatedPassword: userCreated ? generatedPassword : undefined
    });
  } catch (error) {
    console.error('Erreur createEmployee:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Obtenir tous les employés
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    console.error('Erreur getAllEmployees:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Obtenir un employé par ID
exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employé non trouvé.' });
    }
    res.json(employee);
  } catch (error) {
    console.error('Erreur getEmployeeById:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Mettre à jour un employé
exports.updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!employee) {
      return res.status(404).json({ message: 'Employé non trouvé.' });
    }

    try {
      sendNotification('admin', {
        type: 'assignment',
        message: `👤 ${employee.firstName} ${employee.lastName} a été modifié`,
        timestamp: new Date().toISOString()
      });
    } catch (notifError) {
      console.log('⚠️ Erreur notification:', notifError.message);
    }

    res.json({ message: 'Employé mis à jour.', employee });
  } catch (error) {
    console.error('Erreur updateEmployee:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Supprimer un employé (soft delete)
exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!employee) {
      return res.status(404).json({ message: 'Employé non trouvé.' });
    }

    try {
      sendNotification('admin', {
        type: 'assignment',
        message: `👤 ${employee.firstName} ${employee.lastName} a été désactivé`,
        timestamp: new Date().toISOString()
      });
    } catch (notifError) {
      console.log('⚠️ Erreur notification:', notifError.message);
    }

    res.json({ message: 'Employé désactivé.' });
  } catch (error) {
    console.error('Erreur deleteEmployee:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Obtenir les employés par statut (permanent / journalier)
exports.getEmployeesByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const employees = await Employee.find({ status, isActive: true });
    res.json(employees);
  } catch (error) {
    console.error('Erreur getEmployeesByStatus:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};