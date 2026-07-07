require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Un admin existe déjà.');
      process.exit();
    }

    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    const admin = new User({
      email: 'admin@layedeco.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true
    });
    await admin.save();
    
    console.log('✅ Admin créé: admin@layedeco.com / Admin123!');
    process.exit();
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
};

createAdmin();