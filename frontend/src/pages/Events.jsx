import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiCalendar, FiMapPin, FiUser, FiDollarSign, FiDownload, FiPackage } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { exportToPDF, exportToExcel, exportToCSV } from '../utils/exportUtils';
import Pagination from '../components/Pagination';

const Events = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    clientName: '',
    eventType: 'religieux',
    startDate: '',    // 👈 MODIFIÉ
    endDate: '',      // 👈 MODIFIÉ
    time: '',
    location: '',
    budget: '',
    status: 'planned',
    notes: '',
    materials: []
  });

  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [materialQuantities, setMaterialQuantities] = useState({});

  useEffect(() => {
    fetchEvents();
    fetchMaterials();
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

  const fetchMaterials = async () => {
    try {
      const response = await api.get('/materials');
      setMaterials(response.data);
    } catch (error) {
      console.error('Erreur chargement matériels:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleMaterialSelect = (materialId) => {
    if (selectedMaterials.includes(materialId)) {
      setSelectedMaterials(selectedMaterials.filter(id => id !== materialId));
      const newQuantities = { ...materialQuantities };
      delete newQuantities[materialId];
      setMaterialQuantities(newQuantities);
    } else {
      setSelectedMaterials([...selectedMaterials, materialId]);
      setMaterialQuantities({ ...materialQuantities, [materialId]: 1 });
    }
  };

  const handleQuantityChange = (materialId, quantity) => {
    if (quantity > 0) {
      setMaterialQuantities({ ...materialQuantities, [materialId]: quantity });
    }
  };

  // 👇 Calcul de la durée
  const getDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 👇 Vérification des dates
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      toast.error('La date de fin doit être après la date de début.');
      return;
    }

    try {
      const materialsList = selectedMaterials.map(id => ({
        materialId: id,
        quantity: materialQuantities[id] || 1
      }));

      const payload = {
        ...formData,
        budget: parseFloat(formData.budget) || 0,
        materials: materialsList
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
      eventType: 'religieux',
      startDate: '',
      endDate: '',
      time: '',
      location: '',
      budget: '',
      status: 'planned',
      notes: '',
      materials: []
    });
    setSelectedMaterials([]);
    setMaterialQuantities({});
  };

  const openEditModal = (event) => {
    setEditingEvent(event);
    setFormData({
      clientName: event.clientName,
      eventType: event.eventType,
      startDate: event.startDate ? event.startDate.split('T')[0] : '',
      endDate: event.endDate ? event.endDate.split('T')[0] : '',
      time: event.time || '',
      location: event.location || '',
      budget: event.budget || '',
      status: event.status,
      notes: event.notes || '',
      materials: event.materials || []
    });
    if (event.materials && event.materials.length > 0) {
      const materialIds = event.materials.map(m => m.materialId);
      setSelectedMaterials(materialIds);
      const quantities = {};
      event.materials.forEach(m => {
        quantities[m.materialId] = m.quantity || 1;
      });
      setMaterialQuantities(quantities);
    }
    setShowModal(true);
  };

  const handleExport = (format) => {
    const typeLabels = {
      religieux: 'Cérémonie religieuse',
      prive: 'Événement privé',
      entreprise: 'Événement d\'entreprise',
      foire: 'Foire',
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
      { 
        key: 'startDate', 
        label: 'Période', 
        format: (v, row) => {
          if (!row.startDate || !row.endDate) return '-';
          try {
            const start = new Date(row.startDate).toLocaleDateString('fr-FR');
            const end = new Date(row.endDate).toLocaleDateString('fr-FR');
            return `Du ${start} au ${end}`;
          } catch (e) { return '-'; }
        }
      },
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
      religieux: 'Cérémonie religieuse',
      prive: 'Événement privé',
      entreprise: 'Événement d\'entreprise',
      foire: 'Foire',
      autre: 'Autre'
    };
    return labels[type] || type;
  };

  const getMaterialName = (id) => {
    const material = materials.find(m => m._id === id);
    return material ? material.name : 'Matériel supprimé';
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
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Événements</h1>
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

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex items-center gap-2 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2">
            <FiSearch className="text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par client ou lieu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 outline-none dark:bg-transparent dark:text-white"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">Tous les statuts</option>
            <option value="planned">Planifié</option>
            <option value="in_progress">En cours</option>
            <option value="completed">Terminé</option>
            <option value="cancelled">Annulé</option>
          </select>
        </div>
      </div>

      {/* Liste */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Client</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Période</th>  {/* 👈 MODIFIÉ */}
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Lieu</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Statut</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Budget</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Matériels</th>
                {(isAdmin || isTeamLeader) && <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {paginatedEvents.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin || isTeamLeader ? 8 : 7} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Aucun événement trouvé
                  </td>
                </tr>
              ) : (
                paginatedEvents.map((event) => (
                  <tr key={event._id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 font-medium dark:text-white">{event.clientName}</td>
                    <td className="px-4 py-3 dark:text-white">{getTypeLabel(event.eventType)}</td>
                    <td className="px-4 py-3 dark:text-white">
                      {event.startDate && event.endDate ? (
                        <div>
                          <span className="text-sm">
                            Du {new Date(event.startDate).toLocaleDateString()}
                            <br />
                            au {new Date(event.endDate).toLocaleDateString()}
                          </span>
                          <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                            {getDuration(event.startDate, event.endDate)} jours
                          </span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3 dark:text-white">{event.location || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                        {getStatusLabel(event.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 dark:text-white">{event.budget ? `${event.budget.toLocaleString()} FCFA` : '-'}</td>
                    <td className="px-4 py-3 dark:text-white">
                      {event.materials && event.materials.length > 0 ? (
                        <div className="text-xs">
                          {event.materials.slice(0, 2).map((m, idx) => (
                            <span key={idx} className="block">
                              {getMaterialName(m.materialId)} × {m.quantity || 1}
                            </span>
                          ))}
                          {event.materials.length > 2 && (
                            <span className="text-gray-400">+{event.materials.length - 2} autres</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 dark:text-white">
              {editingEvent ? 'Modifier l\'événement' : 'Nouvel événement'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom du client *</label>
                <input
                  type="text"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type d'événement</label>
                <select
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                >
                  <option value="religieux">Cérémonie religieuse</option>
                  <option value="prive">Événement privé</option>
                  <option value="entreprise">Événement d'entreprise</option>
                  <option value="foire">Foire</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              {/* 👇 NOUVEAU : Champs startDate et endDate */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date de début *</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date de fin *</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
              </div>

              {/* 👇 Affichage de la durée */}
              {formData.startDate && formData.endDate && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    📅 Durée : <strong>{getDuration(formData.startDate, formData.endDate)} jours</strong>
                    {new Date(formData.endDate) < new Date(formData.startDate) && (
                      <span className="text-red-500 ml-2">⚠️ La date de fin doit être après la date de début</span>
                    )}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Heure</label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lieu</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Budget (FCFA)</label>
                <input
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Statut</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                >
                  <option value="planned">Planifié</option>
                  <option value="in_progress">En cours</option>
                  <option value="completed">Terminé</option>
                  <option value="cancelled">Annulé</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                  rows="2"
                />
              </div>

              {/* Section matériels */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                  <FiPackage className="text-primary-600" />
                  Matériels utilisés
                </label>
                {materials.length === 0 ? (
                  <p className="text-sm text-gray-500">Aucun matériel disponible. Créez d'abord des matériels.</p>
                ) : (
                  <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                    {materials.map((material) => (
                      <div key={material._id} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedMaterials.includes(material._id)}
                          onChange={() => handleMaterialSelect(material._id)}
                          className="w-4 h-4 text-primary-600"
                        />
                        <span className="flex-1 text-sm dark:text-white">{material.name}</span>
                        {selectedMaterials.includes(material._id) && (
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-500 dark:text-gray-400">Qté:</label>
                            <input
                              type="number"
                              min="1"
                              value={materialQuantities[material._id] || 1}
                              onChange={(e) => handleQuantityChange(material._id, parseInt(e.target.value) || 1)}
                              className="w-16 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm dark:bg-gray-700 dark:text-white"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Sélectionnez les matériels nécessaires pour cet événement.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg">
                  {editingEvent ? 'Modifier' : 'Créer'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingEvent(null); resetForm(); }}
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

export default Events;