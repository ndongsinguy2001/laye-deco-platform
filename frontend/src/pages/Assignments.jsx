import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiUser, FiCalendar, FiSearch } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const Assignments = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [events, setEvents] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    eventId: '',
    employeeId: '',
    role: 'team_member'
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchAssignmentsByEvent(selectedEvent);
    } else {
      setAssignments([]);
    }
  }, [selectedEvent]);

  const fetchData = async () => {
    try {
      const [eventsRes, employeesRes] = await Promise.all([
        api.get('/events'),
        api.get('/employees')
      ]);
      setEvents(eventsRes.data);
      setEmployees(employeesRes.data);
    } catch (error) {
      toast.error('Erreur chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignmentsByEvent = async (eventId) => {
    try {
      const response = await api.get(`/assignments/event/${eventId}`);
      setAssignments(response.data);
    } catch (error) {
      toast.error('Erreur chargement des affectations');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedEvent) {
      toast.error('Veuillez sélectionner un événement');
      return;
    }

    if (!formData.employeeId) {
      toast.error('Veuillez sélectionner un employé');
      return;
    }

    try {
      const payload = {
        eventId: selectedEvent,
        employeeId: formData.employeeId,
        role: formData.role
      };

      await api.post('/assignments', payload);
      toast.success('Employé affecté avec succès');
      setShowModal(false);
      setFormData({ eventId: selectedEvent, employeeId: '', role: 'team_member' });
      fetchAssignmentsByEvent(selectedEvent);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'affectation');
    }
  };

  const handleRemove = async (id) => {
    if (window.confirm('Retirer cette affectation ?')) {
      try {
        await api.delete(`/assignments/${id}`);
        toast.success('Affectation retirée');
        fetchAssignmentsByEvent(selectedEvent);
        fetchData();
      } catch (error) {
        toast.error('Erreur');
      }
    }
  };

  const getRoleLabel = (role) => {
    const labels = {
      responsible: 'Responsable',
      team_member: 'Membre d\'équipe',
      support: 'Support'
    };
    return labels[role] || role;
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'director';
  const isTeamLeader = user?.role === 'team_leader';
  const canManage = isAdmin || isTeamLeader;

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Chargement...</div>;
  }

  const selectedEventData = events.find(e => e._id === selectedEvent);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Affectations</h1>

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
                  {event.clientName} - {new Date(event.date).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
          {canManage && selectedEvent && (
            <button
              onClick={() => {
                setFormData({ eventId: selectedEvent, employeeId: '', role: 'team_member' });
                setShowModal(true);
              }}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <FiPlus /> Affecter un employé
            </button>
          )}
        </div>
      </div>

      {selectedEvent ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              {selectedEventData?.clientName} - {selectedEventData && new Date(selectedEventData.date).toLocaleDateString()}
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">{assignments.length} employé(s) affecté(s)</span>
          </div>

          {assignments.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">Aucun employé affecté à cet événement</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Employé</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Poste</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Rôle</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Téléphone</th>
                    {canManage && <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((assignment) => (
                    <tr key={assignment._id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <FiUser className="text-gray-400" />
                          <span className="dark:text-white">
                            {assignment.employeeId?.firstName} {assignment.employeeId?.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 dark:text-white">{assignment.employeeId?.position || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          assignment.role === 'responsible' 
                            ? 'bg-purple-100 text-purple-800' 
                            : assignment.role === 'team_member'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {getRoleLabel(assignment.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3 dark:text-white">{assignment.employeeId?.phone || '-'}</td>
                      {canManage && (
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleRemove(assignment._id)}
                            className="text-red-600 hover:text-red-800"
                            title="Retirer"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </td>
                      )}
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
          <p>Sélectionnez un événement pour voir les affectations</p>
        </div>
      )}

      {showModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Affecter un employé</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Événement : <strong>{selectedEventData?.clientName}</strong>
            </p>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rôle</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                >
                  <option value="team_member">Membre d'équipe</option>
                  <option value="responsible">Responsable</option>
                  <option value="support">Support</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg">
                  Affecter
                </button>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setFormData({ eventId: selectedEvent, employeeId: '', role: 'team_member' }); }}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 py-2 rounded-lg dark:text-white"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assignments;