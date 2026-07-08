import React, { useState, useEffect } from 'react';
import { FiUser, FiMail, FiShield, FiKey, FiSave, FiRefreshCw, FiDollarSign, FiClock, FiCheckCircle, FiAlertCircle, FiCalendar, FiLogIn, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [payments, setPayments] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchProfile();
    if (user?.role === 'daily_worker') {
      fetchPayments();
      fetchAttendanceHistory();
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/profile');
      setProfile(response.data);
    } catch (error) {
      toast.error('Erreur chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      const profileRes = await api.get('/auth/profile');
      const employeeId = profileRes.data.employeeId;
      
      if (employeeId) {
        const response = await api.get(`/payments/employee/${employeeId}`);
        setPayments(response.data);
      }
    } catch (error) {
      console.error('Erreur chargement paiements:', error);
    }
  };

  const fetchAttendanceHistory = async () => {
    try {
      const profileRes = await api.get('/auth/profile');
      const employeeId = profileRes.data.employeeId;
      
      if (employeeId) {
        const response = await api.get(`/attendance/employee/${employeeId}`);
        setAttendances(response.data);
      }
    } catch (error) {
      console.error('Erreur chargement historique pointages:', error);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Les nouveaux mots de passe ne correspondent pas');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (!passwordData.currentPassword) {
      toast.error('Veuillez entrer votre mot de passe actuel');
      return;
    }
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      toast.success('Mot de passe modifié avec succès');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setChangingPassword(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors du changement de mot de passe');
    }
  };

  const getRoleLabel = (role) => {
    const labels = {
      director: 'Directeur',
      admin: 'Administrateur',
      team_leader: 'Chef d\'équipe',
      accountant: 'Comptable',
      daily_worker: 'Journalier'
    };
    return labels[role] || role;
  };

  const getRoleColor = (role) => {
    const colors = {
      director: 'bg-purple-100 text-purple-800',
      admin: 'bg-blue-100 text-blue-800',
      team_leader: 'bg-green-100 text-green-800',
      accountant: 'bg-yellow-100 text-yellow-800',
      daily_worker: 'bg-gray-100 text-gray-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      present: 'Présent',
      late: 'Retard',
      absent: 'Absent'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      present: 'bg-green-100 text-green-800',
      late: 'bg-yellow-100 text-yellow-800',
      absent: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'present':
        return <FiCheckCircle className="text-green-600" />;
      case 'late':
        return <FiClock className="text-yellow-600" />;
      default:
        return <FiAlertCircle className="text-red-600" />;
    }
  };

  const getPaymentStatusLabel = (status) => {
    const labels = {
      pending: 'En attente',
      paid: 'Payé',
      partial: 'Partiel'
    };
    return labels[status] || status;
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      partial: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Calculer les totaux des paiements
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'pending' || p.status === 'partial').reduce((sum, p) => sum + p.balance, 0);

  // Statistiques des pointages
  const totalAttendance = attendances.length;
  const presentCount = attendances.filter(a => a.status === 'present').length;
  const absentCount = attendances.filter(a => a.status === 'absent').length;
  const lateCount = attendances.filter(a => a.status === 'late').length;

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center">
        <div className="text-gray-500 dark:text-gray-400">Chargement du profil...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Mon profil</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                <FiUser className="text-blue-600 dark:text-blue-300" size={24} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Informations du compte</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Vos informations personnelles</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b dark:border-gray-700">
                <FiMail className="text-gray-400 dark:text-gray-500" size={18} />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                  <p className="text-gray-800 dark:text-white">{profile?.email || 'Non renseigné'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 pb-3 border-b dark:border-gray-700">
                <FiShield className="text-gray-400 dark:text-gray-500" size={18} />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Rôle</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(profile?.role)}`}>
                    {getRoleLabel(profile?.role)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 pb-3 border-b dark:border-gray-700">
                <FiKey className="text-gray-400 dark:text-gray-500" size={18} />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">ID Utilisateur</p>
                  <p className="text-gray-800 dark:text-white text-sm font-mono">{profile?._id}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Changement de mot de passe */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-full">
                <FiRefreshCw className="text-orange-600 dark:text-orange-300" size={24} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Sécurité</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Modifier votre mot de passe</p>
              </div>
            </div>

            {!changingPassword ? (
              <button
                onClick={() => setChangingPassword(true)}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg flex items-center justify-center gap-2"
              >
                <FiKey /> Changer le mot de passe
              </button>
            ) : (
              <form onSubmit={handlePasswordChange} className="space-y-3">
                <input
                  type="password"
                  placeholder="Mot de passe actuel"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                  required
                />
                <input
                  type="password"
                  placeholder="Nouveau mot de passe"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                  required
                />
                <input
                  type="password"
                  placeholder="Confirmer le nouveau mot de passe"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                  required
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg flex items-center justify-center gap-2"
                  >
                    <FiSave size={16} /> Enregistrer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setChangingPassword(false);
                      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    }}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 py-2 rounded-lg dark:text-white"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Section Journalier : Statistiques et Historique */}
      {user?.role === 'daily_worker' && (
        <div className="mt-6 space-y-6">
          {/* Statistiques des pointages */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <FiClock className="text-blue-600" /> 
              Mes statistiques de pointage
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">Total pointages</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{totalAttendance}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">Présences</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{presentCount}</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">Absences</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{absentCount}</p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">Retards</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{lateCount}</p>
              </div>
            </div>
          </div>

          {/* Paiements */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <FiDollarSign className="text-green-600" /> 
              Mes paiements
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">Total gagné</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{totalAmount.toLocaleString()} FCFA</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">Déjà payé</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{totalPaid.toLocaleString()} FCFA</p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">En attente</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{totalPending.toLocaleString()} FCFA</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">Périodes</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{payments.length}</p>
              </div>
            </div>

            {payments.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">Aucun paiement enregistré</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Période</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Jours</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Montant</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Avances</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Solde</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment._id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-2 dark:text-white">{payment.period}</td>
                        <td className="px-4 py-2 dark:text-white">{payment.totalDays}</td>
                        <td className="px-4 py-2 font-semibold dark:text-white">{payment.amount.toLocaleString()} FCFA</td>
                        <td className="px-4 py-2 dark:text-white">{payment.advances.toLocaleString()} FCFA</td>
                        <td className="px-4 py-2 font-semibold dark:text-white">{payment.balance.toLocaleString()} FCFA</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(payment.status)}`}>
                            {getPaymentStatusLabel(payment.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Historique des pointages */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <FiCalendar className="text-indigo-600" /> 
              Historique des pointages
            </h3>

            {attendances.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">Aucun pointage enregistré</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Événement</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Date</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Arrivée</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Départ</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Statut</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Commentaire</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendances.map((att) => (
                      <tr key={att._id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-2 dark:text-white">
                          {att.eventId?.clientName || 'Événement supprimé'}
                        </td>
                        <td className="px-4 py-2 dark:text-white">
                          {att.eventId?.date ? new Date(att.eventId.date).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-2 dark:text-white">
                          {att.checkIn ? new Date(att.checkIn).toLocaleTimeString() : '-'}
                        </td>
                        <td className="px-4 py-2 dark:text-white">
                          {att.checkOut ? new Date(att.checkOut).toLocaleTimeString() : '-'}
                        </td>
                        <td className="px-4 py-2">
                          <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(att.status)}`}>
                            {getStatusIcon(att.status)}
                            {getStatusLabel(att.status)}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{att.comments || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Informations supplémentaires */}
      <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-sm text-blue-800 dark:text-blue-200">
        <p className="font-semibold mb-1">💡 Astuce :</p>
        <p>Pour des raisons de sécurité, changez régulièrement votre mot de passe et ne le partagez jamais.</p>
      </div>
    </div>
  );
};

export default Profile;