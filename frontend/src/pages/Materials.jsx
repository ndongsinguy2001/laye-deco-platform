import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiPackage, FiArrowRight, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const Materials = () => {
  const { user } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'bache',
    dimensions: '',
    state: 'good',
    location: '',
    quantity: 1,
    notes: ''
  });
  const [movementData, setMovementData] = useState({
    action: 'sortie',
    quantity: 1,
    eventId: '',
    notes: ''
  });
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetchMaterials();
    fetchEvents();
  }, []);

  const fetchMaterials = async () => {
    try {
      const response = await api.get('/materials');
      setMaterials(response.data);
    } catch (error) {
      toast.error('Erreur chargement des matériels');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await api.get('/events');
      setEvents(response.data);
    } catch (error) {
      console.error('Erreur chargement événements:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleMovementChange = (e) => {
    const { name, value } = e.target;
    setMovementData({ ...movementData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        quantity: parseInt(formData.quantity) || 1
      };

      if (editingMaterial) {
        await api.put(`/materials/${editingMaterial._id}`, payload);
        toast.success('Matériel modifié avec succès');
      } else {
        await api.post('/materials', payload);
        toast.success('Matériel créé avec succès');
      }

      setShowModal(false);
      setEditingMaterial(null);
      resetForm();
      fetchMaterials();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce matériel ?')) {
      try {
        await api.delete(`/materials/${id}`);
        toast.success('Matériel supprimé');
        fetchMaterials();
      } catch (error) {
        toast.error('Erreur');
      }
    }
  };

  const handleMovement = async (e) => {
    e.preventDefault();
    try {
      await api.post('/materials/movement', {
        materialId: selectedMaterial._id,
        eventId: movementData.eventId || undefined,
        action: movementData.action,
        quantity: parseInt(movementData.quantity) || 1,
        notes: movementData.notes
      });
      toast.success('Mouvement enregistré avec succès');
      setShowMovementModal(false);
      setSelectedMaterial(null);
      resetMovement();
      fetchMaterials();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'bache',
      dimensions: '',
      state: 'good',
      location: '',
      quantity: 1,
      notes: ''
    });
  };

  const resetMovement = () => {
    setMovementData({
      action: 'sortie',
      quantity: 1,
      eventId: '',
      notes: ''
    });
  };

  const openEditModal = (material) => {
    setEditingMaterial(material);
    setFormData({
      name: material.name,
      type: material.type,
      dimensions: material.dimensions || '',
      state: material.state,
      location: material.location || '',
      quantity: material.quantity || 1,
      notes: material.notes || ''
    });
    setShowModal(true);
  };

  const openMovementModal = (material) => {
    setSelectedMaterial(material);
    resetMovement();
    setShowMovementModal(true);
  };

  const getTypeLabel = (type) => {
    const labels = {
      bache: 'Bâche',
      chaise: 'Chaise',
      table: 'Table',
      decoration: 'Décoration',
      eclairage: 'Éclairage',
      accessoire: 'Accessoire',
      autre: 'Autre'
    };
    return labels[type] || type;
  };

  const getStateLabel = (state) => {
    const labels = {
      good: 'Bon état',
      needs_repair: 'À réparer',
      lost: 'Perdu',
      damaged: 'Endommagé'
    };
    return labels[state] || state;
  };

  const getStateColor = (state) => {
    const colors = {
      good: 'bg-green-100 text-green-800',
      needs_repair: 'bg-yellow-100 text-yellow-800',
      lost: 'bg-red-100 text-red-800',
      damaged: 'bg-red-100 text-red-800'
    };
    return colors[state] || 'bg-gray-100 text-gray-800';
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'director';

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Chargement...</div>;
  }

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = 
      material.name?.toLowerCase().includes(search.toLowerCase()) ||
      material.location?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterType === 'all' || material.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Matériels</h1>
        {isAdmin && (
          <button
            onClick={() => { setEditingMaterial(null); resetForm(); setShowModal(true); }}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <FiPlus /> Nouveau matériel
          </button>
        )}
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
            <FiSearch className="text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou emplacement..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 outline-none"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="all">Tous les types</option>
            <option value="bache">Bâches</option>
            <option value="chaise">Chaises</option>
            <option value="table">Tables</option>
            <option value="decoration">Décorations</option>
            <option value="eclairage">Éclairages</option>
            <option value="accessoire">Accessoires</option>
            <option value="autre">Autre</option>
          </select>
        </div>
      </div>

      {/* Liste */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Nom</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">État</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Quantité</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Disponible</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Emplacement</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    Aucun matériel trouvé
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((material) => (
                  <tr key={material._id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{material.name}</td>
                    <td className="px-4 py-3">{getTypeLabel(material.type)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStateColor(material.state)}`}>
                        {getStateLabel(material.state)}
                      </span>
                    </td>
                    <td className="px-4 py-3">{material.quantity}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        material.availability 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {material.availability ? 'Disponible' : 'Indisponible'}
                      </span>
                    </td>
                    <td className="px-4 py-3">{material.location || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openMovementModal(material)}
                          className="text-purple-600 hover:text-purple-800"
                          title="Mouvement"
                        >
                          <FiArrowRight size={18} />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => openEditModal(material)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Modifier"
                            >
                              <FiEdit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(material._id)}
                              className="text-red-600 hover:text-red-800"
                              title="Supprimer"
                            >
                              <FiTrash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal CRUD */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingMaterial ? 'Modifier le matériel' : 'Nouveau matériel'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                name="name"
                placeholder="Nom du matériel *"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="bache">Bâche</option>
                <option value="chaise">Chaise</option>
                <option value="table">Table</option>
                <option value="decoration">Décoration</option>
                <option value="eclairage">Éclairage</option>
                <option value="accessoire">Accessoire</option>
                <option value="autre">Autre</option>
              </select>
              <input
                type="text"
                name="dimensions"
                placeholder="Dimensions (ex: 5x5 m)"
                value={formData.dimensions}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
              <select
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="good">Bon état</option>
                <option value="needs_repair">À réparer</option>
                <option value="lost">Perdu</option>
                <option value="damaged">Endommagé</option>
              </select>
              <input
                type="text"
                name="location"
                placeholder="Emplacement"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
              <input
                type="number"
                name="quantity"
                placeholder="Quantité"
                value={formData.quantity}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                min="1"
              />
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
                  {editingMaterial ? 'Modifier' : 'Créer'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingMaterial(null); resetForm(); }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 py-2 rounded-lg"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Mouvement */}
      {showMovementModal && selectedMaterial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">
              Mouvement - {selectedMaterial.name}
            </h2>
            <form onSubmit={handleMovement} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                <select
                  name="action"
                  value={movementData.action}
                  onChange={handleMovementChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="sortie">Sortie</option>
                  <option value="retour">Retour</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
                <input
                  type="number"
                  name="quantity"
                  value={movementData.quantity}
                  onChange={handleMovementChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  min="1"
                  max={selectedMaterial.quantity}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Événement (optionnel)</label>
                <select
                  name="eventId"
                  value={movementData.eventId}
                  onChange={handleMovementChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">-- Aucun --</option>
                  {events.map((event) => (
                    <option key={event._id} value={event._id}>
                      {event.clientName} - {new Date(event.date).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <input
                  type="text"
                  name="notes"
                  value={movementData.notes}
                  onChange={handleMovementChange}
                  placeholder="Notes..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg">
                  Enregistrer
                </button>
                <button
                  type="button"
                  onClick={() => { setShowMovementModal(false); setSelectedMaterial(null); resetMovement(); }}
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

export default Materials;