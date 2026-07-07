import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiCalendar, FiMapPin, FiUser, FiDollarSign, FiDownload } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { exportToPDF, exportToExcel, exportToCSV } from '../utils/exportUtils';
import Pagination from '../components/Pagination';

const Events = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    clientName: '',
    eventType: 'mariage',
    date: '',
    time: '',
    location: '',
    budget: '',
    status: 'planned',
    notes: ''
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus]);

  const fetchEvents = async () => {
    try {
      const response = await api.get('/events');
      setEvents(response.data);
    } catch (error) {
      toast.error('Erreur chargement des événements');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        budget: parseFloat(formData.budget) || 0
      };

      if (editingEvent) {
        await api.put(`/events/${editingEvent._id}`, payload);
        toast.success('Événement modifié avec succès');
      } else {
        await api.post('/events', payload);
        toast.success('Événement créé avec succès');
      }

      setShowModal(false);
      setEditingEvent(null);
      resetForm();
      fetchEvents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Voulez-vous vraiment supprimer cet événement ?')) {
      try {
        await api.delete(`/events/${id}`);
        toast.success('Événement supprimé');
        fetchEvents();
      } catch (error) {
        toast.error('Erreur');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      clientName: '',
      eventType: 'mariage',
      date: '',
      time: '',
      location: '',
      budget: '',
      status: 'planned',
      notes: ''
    });
  };

  const openEditModal = (event) => {
    setEditingEvent(event);
    setFormData({
      clientName: event.clientName,
      eventType: event.eventType,
      date: event.date ? event.date.split('T')[0] : '',
      time: event.time || '',
      location: event.location || '',
      budget: event.budget || '',
      status: event.status,
      notes: event.notes || ''
    });
    setShowModal(true);
  };

  const safeDateFormat = (value) => {
    if (!value) return '-';
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('fr-FR');
    } catch (e) {
      return '-';
    }
  };

  const handleExport = (format) => {
    const typeLabels = {
      bapteme: 'Baptême',
      mariage: 'Mariage',
      anniversaire: 'Anniversaire',
      religieux: 'Cérémonie religieuse',
      prive: 'Événement privé',
      entreprise: 'Événement d\'entreprise',
      autre: 'Autre'
    };

    const statusLabels = {
      planned: 'Planifié',
      in_progress: 'En cours',
      completed: 'Terminé',
      cancelled: 'Annulé'
    };

    const columns = [
      { key: 'clientName', label: 'Client' },
      { key: 'eventType', label: 'Type', format: (v) => typeLabels[v] || v },
      { key: 'date', label: 'Date', format: (v) => safeDateFormat(v) },
      { key: 'location', label: 'Lieu' },
      { key: 'status', label: 'Statut', format: (v) => statusLabels[v] || v },
      { key: 'budget', label: 'Budget (FCFA)', format: (v) => v ? v.toLocaleString() : '-' }
    ];

    const exportData = events.filter(event => {
      const matchesSearch = 
        event.clientName?.toLowerCase().includes(search.toLowerCase()) ||
        event.location?.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filterStatus === 'all' || event.status === filterStatus;
      return matchesSearch && matchesFilter;
    });

    if (exportData.length === 0) {
      toast.error('Aucune donnée à exporter');
      return;
    }

    const title = 'Liste des événements - Laye Déco';
    const filename = `evenements_${new Date().toISOString().split('T')[0]}`;

    if (format === 'pdf') {
      exportToPDF(exportData, title, columns, filename);
    } else if (format === 'excel') {
      exportToExcel(exportData, title, columns, filename);
    } else if (format === 'csv') {
      exportToCSV(exportData, columns, filename);
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      planned: 'Planifié',
      in_progress: 'En cours',
      completed: 'Terminé',
      cancelled: 'Annulé'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      planned: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTypeLabel = (type) => {
    const labels = {
      bapteme: 'Baptême',
      mariage: 'Mariage',
      anniversaire: 'Anniversaire',
      religieux: 'Cérémonie religieuse',
      prive: 'Événement privé',
      entreprise: 'Événement d\'entreprise',
      autre: 'Autre'
    };
    return labels[type] || type;
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'director';
  const isTeamLeader = user?.role === 'team_leader';

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Chargement...</div>;
  }

  const filteredEvents = events.filter(event => {
    const matchesSearch = 
      event.clientName?.toLowerCase().includes(search.toLowerCase()) ||
      event.location?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterStatus === 'all' || event.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalItems = filteredEvents.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-gray-800">Événements</h1>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => handleExport('excel')}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm"
          >
            <FiDownload /> Excel
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm"
          >
            <FiDownload /> PDF
          </button>
          {(isAdmin || isTeamLeader) && (
            <button
              onClick={() => { setEditingEvent(null); resetForm(); setShowModal(true); }}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <FiPlus /> Nouvel événement
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
            <FiSearch className="text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par client ou lieu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 outline-none"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="all">Tous les statuts</option>
            <option value="planned">Planifié</option>
            <option value="in_progress">En cours</option>
            <option value="completed">Terminé</option>
            <option value="cancelled">Annulé</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Client</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Lieu</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Statut</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Budget</th>
                {(isAdmin || isTeamLeader) && <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {paginatedEvents.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin || isTeamLeader ? 7 : 6} className="text-center py-8 text-gray-500">
                    Aucun événement trouvé
                  </td>
                </tr>
              ) : (
                paginatedEvents.map((event) => (
                  <tr key={event._id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{event.clientName}</td>
                    <td className="px-4 py-3">{getTypeLabel(event.eventType)}</td>
                    <td className="px-4 py-3">{new Date(event.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{event.location || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                        {getStatusLabel(event.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">{event.budget ? `${event.budget.toLocaleString()} FCFA` : '-'}</td>
                    {(isAdmin || isTeamLeader) && (
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(event)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Modifier"
                          >
                            <FiEdit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(event._id)}
                            className="text-red-600 hover:text-red-800"
                            title="Supprimer"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          totalItems={totalItems}
          onItemsPerPageChange={(newSize) => {
            setItemsPerPage(newSize);
            setCurrentPage(1);
          }}
        />
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingEvent ? 'Modifier l\'événement' : 'Nouvel événement'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                name="clientName"
                placeholder="Nom du client *"
                value={formData.clientName}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                required
              />
              <select
                name="eventType"
                value={formData.eventType}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="bapteme">Baptême</option>
                <option value="mariage">Mariage</option>
                <option value="anniversaire">Anniversaire</option>
                <option value="religieux">Cérémonie religieuse</option>
                <option value="prive">Événement privé</option>
                <option value="entreprise">Événement d'entreprise</option>
                <option value="autre">Autre</option>
              </select>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                />
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <input
                type="text"
                name="location"
                placeholder="Lieu"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
              <input
                type="number"
                name="budget"
                placeholder="Budget (FCFA)"
                value={formData.budget}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="planned">Planifié</option>
                <option value="in_progress">En cours</option>
                <option value="completed">Terminé</option>
                <option value="cancelled">Annulé</option>
              </select>
              <textarea
                name="notes"
                placeholder="Notes"
                value={formData.notes}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                rows="3"
              />
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg">
                  {editingEvent ? 'Modifier' : 'Créer'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingEvent(null); resetForm(); }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 py-2 rounded-lg"
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

export default Events;
