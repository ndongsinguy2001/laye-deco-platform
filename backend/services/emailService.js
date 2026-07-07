const nodemailer = require('nodemailer');

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Fonction pour envoyer un email de bienvenue
exports.sendWelcomeEmail = async (email, password, role) => {
  const roleLabels = {
    director: 'Directeur',
    admin: 'Administrateur',
    team_leader: 'Chef d\'équipe',
    accountant: 'Comptable',
    daily_worker: 'Journalier'
  };

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'Laye Déco <noreply@layedeco.com>',
    to: email,
    subject: 'Bienvenue sur Laye Déco - Vos identifiants de connexion',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h1 style="color: #4f46e5; text-align: center;">Bienvenue sur Laye Déco</h1>
        <p style="color: #333; font-size: 16px;">Bonjour,</p>
        <p style="color: #333; font-size: 16px;">Votre compte a été créé avec succès sur la plateforme Laye Déco.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>📧 Email :</strong> ${email}</p>
          <p style="margin: 5px 0;"><strong>🔑 Mot de passe :</strong> ${password}</p>
          <p style="margin: 5px 0;"><strong>👤 Rôle :</strong> ${roleLabels[role] || role}</p>
        </div>

        <p style="color: #333; font-size: 16px;">🔗 <a href="http://localhost:5173/login" style="color: #4f46e5; text-decoration: none;">Se connecter à Laye Déco</a></p>
        
        <div style="background-color: #fef3c7; padding: 12px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="color: #92400e; font-size: 14px; margin: 0;">
            ⚠️ <strong>Important :</strong> Nous vous recommandons de changer votre mot de passe après votre première connexion.
          </p>
        </div>

        <p style="color: #666; font-size: 14px; text-align: center; border-top: 1px solid #e0e0e0; padding-top: 15px;">
          Laye Déco - Gestion des pointages et suivi des activités<br>
          © ${new Date().getFullYear()} Tous droits réservés
        </p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email de bienvenue envoyé à:', email);
    console.log('📨 Message ID:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email:', error.message);
    return false;
  }
};