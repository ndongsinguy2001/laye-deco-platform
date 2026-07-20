import React, { useState, useEffect } from 'react';
import { FiLogIn, FiLogOut, FiUserX, FiCalendar, FiCamera, FiX } from 'react-icons/fi';
import { FaQrcode } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import QRCodeDisplay from '../components/QRCodeDisplay';
import QRCodeScanner from '../components/QRCodeScanner';

const Attendance = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showQRDisplay, setShowQRDisplay] = useState(false);
  const [modalType, setModalType] = useState('in');
  const [formData, setFormData] = useState({
    eventId: '',
    employeeId: '',
    comments: ''
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'director';
  const isTeamLeader = user?.role === 'team_leader';
  const isDailyWorker = user?.role === 'daily_worker';
  const canManage = isAdmin || isTeamLeader;

  // Fonction pour formater la période
  const formatEventPeriod = (event) => {
    if (!event.startDate || !event.endDate) return 'Date non définie';
    const start = new Date(event.startDate).toLocaleDateString();
    const end = new Date(event.endDate).toLocaleDateString();
    return `${start} - ${end}`;
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchAttendances(selectedEvent);
    } else {
      setAttendances([]);
    }
  }, [selectedEvent]);

  const fetchData = async () => {
    try {
      console.log('🔄 Chargement des données pour le rôle:', user?.role);
      
      let eventsData = [];
      try {
        const eventsRes = await api.get('/events');
        eventsData = eventsRes.data || [];
        console.log('📋 Tous les événements:', eventsData.length);
        
        if (user?.role === 'daily_worker') {
          try {
            const userProfileRes = await api.get('/auth/profile');
            const userProfile = userProfileRes.data;
            const employeeId = userProfile.employeeId;
            
            if (employeeId) {
              const assignmentsRes = await api.get(`/assignments/employee/${employeeId}`);
              const assignedEventIds = assignmentsRes.data
                .map(a => a.eventId?._id || a.eventId)
                .filter(id => id);
              eventsData = eventsData.filter(event => assignedEventIds.includes(event._id));
            } else {
              eventsData = [];
            }
          } catch (assignError) {
            console.error('❌ Erreur chargement affectations:', assignError);
          }
        }
      } catch (error) {
        console.error('❌ Erreur chargement événements:', error);
        toast.error('Erreur chargement des événements');
      }

      let employeesData = [];
      try {
        const employeesRes = await api.get('/employees');
        employeesData = employeesRes.data || [];
      } catch (error) {
        console.log('⚠️ Impossible de charger les employés (normal pour journalier)');
      }

      setEvents(eventsData);
      setEmployees(employeesData);
    } catch (error) {
      console.error('❌ Erreur générale:', error);
      toast.error('Erreur chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendances = async (eventId) => {
    try {
      const response = await api.get(`/attendance/event/${eventId}`);
      let data = response.data || [];
      
      if (isDailyWorker) {
        const currentUserId = user?.id;
        data = data.filter(att => att.employeeId?._id === currentUserId || att.employeeId === currentUserId);
      }
      
      setAttendances(data);
    } catch (error) {
      toast.error('Erreur chargement des pointages');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const openModal = (type) => {
    setModalType(type);
    setFormData({
      eventId: selectedEvent,
      employeeId: '',
      comments: ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let endpoint = '';
      let payload = {
        eventId: formData.eventId,
        employeeId: formData.employeeId,
        comments: formData.comments
      };

      if (modalType === 'in') {
        endpoint = '/attendance/check-in';
      } else if (modalType === 'out') {
        endpoint = '/attendance/check-out';
      } else if (modalType === 'absent') {
        endpoint = '/attendance/absent';
      }

      await api.post(endpoint, payload);
      toast.success('Pointage enregistré avec succès');
      setShowModal(false);
      fetchAttendances(selectedEvent);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur');
    }
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

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Chargement...</div>;
  }

  const selectedEventData = events.find(e => e._id === selectedEvent);

  if (events.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          {isDailyWorker ? 'Scanner QR Code' : 'Pointage'}
        </h1>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
          <p className="text-yellow-800 dark:text-yellow-200 text-lg">
            {isDailyWorker 
              ? '📋 Vous n\'êtes affecté à aucun événement pour le moment.'
              : '📋 Aucun événement disponible'}
          </p>
          <p className="text-yellow-600 dark:text-yellow-400 mt-2">
            {isDailyWorker 
              ? 'Contactez votre responsable pour une affectation.'
              : 'Contactez votre responsable pour créer un événement.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
        {isDailyWorker ? 'Scanner QR Code' : 'Pointage'}
      </h1>

      {isDailyWorker && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <p className="text-blue-800 dark:text-blue-200">
            📱 Sélectionnez un événement auquel vous êtes affecté, puis cliquez sur <strong>"Scanner"</strong> pour pointer votre arrivée ou votre départ.
          </p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sélectionner un événement</label>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
            >
              <option value="">-- Choisir un événement --</option>
              {events.map((event) => (
                <option key={event._id} value={event._id}>
                  {event.clientName} - {formatEventPeriod(event)}
                </option>
              ))}
            </select>
          </div>

          {selectedEvent && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setShowQRScanner(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <FiCamera /> Scanner
              </button>

              {canManage && (
                <>
                  <button
                    onClick={() => openModal('in')}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <FiLogIn /> Arrivée
                  </button>
                  <button
                    onClick={() => openModal('out')}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <FiLogOut /> Départ
                  </button>
                  <button
                    onClick={() => openModal('absent')}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <FiUserX /> Absence
                  </button>
                  <button
                    onClick={() => setShowQRDisplay(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <FaQrcode /> QR Code
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedEvent ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              {selectedEventData?.clientName} - {selectedEventData && formatEventPeriod(selectedEventData)}
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">{attendances.length} pointage(s)</span>
          </div>

          {attendances.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              {isDailyWorker ? 'Vous n\'avez pas encore pointé pour cet événement' : 'Aucun pointage pour cet événement'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Employé</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Arrivée</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Départ</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Statut</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Commentaire</th>
                  </tr>
                </thead>
                <tbody>
                  {attendances.map((att) => (
                    <tr key={att._id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 dark:text-white">
                        {att.employeeId?.firstName} {att.employeeId?.lastName}
                      </td>
                      <td className="px-4 py-3 dark:text-white">
                        {att.checkIn ? new Date(att.checkIn).toLocaleTimeString() : '-'}
                      </td>
                      <td className="px-4 py-3 dark:text-white">
                        {att.checkOut ? new Date(att.checkOut).toLocaleTimeString() : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(att.status)}`}>
                          {getStatusLabel(att.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{att.comments || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center text-gray-500 dark:text-gray-400">
          <FiCalendar size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p>Sélectionnez un événement pour voir les pointages</p>
        </div>
      )}

      {showModal && selectedEvent && canManage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 dark:text-white">
              {modalType === 'in' ? 'Enregistrer une arrivée' :
               modalType === 'out' ? 'Enregistrer un départ' :
               'Enregistrer une absence'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Employé</label>
                <select
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="">-- Choisir un employé --</option>
                  {employees
                    .filter(e => e.isActive !== false)
                    .map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.firstName} {emp.lastName} - {emp.position || 'Sans poste'}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Commentaire (optionnel)</label>
                <input
                  type="text"
                  name="comments"
                  value={formData.comments}
                  onChange={handleInputChange}
                  placeholder="Commentaire..."
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg">
                  Enregistrer
                </button>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); }}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 py-2 rounded-lg dark:text-white"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showQRDisplay && selectedEvent && canManage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold dark:text-white">QR Code</h2>
              <button 
                onClick={() => setShowQRDisplay(false)} 
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <FiX size={24} />
              </button>
            </div>
            <QRCodeDisplay 
              eventId={selectedEvent} 
              eventName={selectedEventData?.clientName || 'Événement'} 
            />
            <button
              onClick={() => setShowQRDisplay(false)}
              className="mt-4 w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 py-2 rounded-lg dark:text-white"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {showQRScanner && (
        <QRCodeScanner
          onScan={(data) => {
            console.log('Scan réussi:', data);
            if (selectedEvent) {
              fetchAttendances(selectedEvent);
              fetchData();
            }
          }}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </div>
  );
};

export default Attendance;