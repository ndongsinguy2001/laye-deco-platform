import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiUser, FiBriefcase, FiPhone, FiCalendar, FiDownload } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { exportToPDF, exportToExcel, exportToCSV } from '../utils/exportUtils';
import Pagination from '../components/Pagination';

const Employees = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [newCredentials, setNewCredentials] = useState({ phone: '', email: '', password: '' });
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    status: 'permanent',
    dailyRate: '',
    salary: '',
    hireDate: '',
    availability: true,
    address: '',
    idCard: '',
    trade: ''
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus]);

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employees');
      setEmployees(response.data);
    } catch (error) {
      toast.error('Erreur chargement des employés');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        dailyRate: formData.status === 'daily' ? parseFloat(formData.dailyRate) : undefined,
        salary: formData.status === 'permanent' ? parseFloat(formData.salary) : undefined
      };

      let response;
      if (editingEmployee) {
        response = await api.put(`/employees/${editingEmployee._id}`, payload);
        toast.success('Employé modifié avec succès');
      } else {
        response = await api.post('/employees', payload);
        toast.success('Employé créé avec succès');
        
        if (response.data.userCreated && response.data.generatedPassword) {
          setNewCredentials({
            phone: formData.phone,
            email: formData.email || '',
            password: response.data.generatedPassword
          });
          setShowCredentials(true);
        }
      }

      setShowModal(false);
      setEditingEmployee(null);
      resetForm();
      fetchEmployees();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Voulez-vous vraiment désactiver cet employé ?')) {
      try {
        await api.delete(`/employees/${id}`);
        toast.success('Employé désactivé');
        fetchEmployees();
      } catch (error) {
        toast.error('Erreur');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      position: '',
      status: 'permanent',
      dailyRate: '',
      salary: '',
      hireDate: '',
      availability: true,
      address: '',
      idCard: '',
      trade: ''
    });
  };

  const openEditModal = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email || '',
      phone: employee.phone || '',
      position: employee.position || '',
      status: employee.status,
      dailyRate: employee.dailyRate || '',
      salary: employee.salary || '',
      hireDate: employee.hireDate ? employee.hireDate.split('T')[0] : '',
      availability: employee.availability,
      address: employee.address || '',
      idCard: employee.idCard || '',
      trade: employee.trade || ''
    });
    setShowModal(true);
  };

  const handleExport = (format) => {
    const columns = [
      { key: 'firstName', label: 'Prénom' },
      { key: 'lastName', label: 'Nom' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Téléphone' },
      { key: 'position', label: 'Poste' },
      { key: 'status', label: 'Statut', format: (v) => v === 'permanent' ? 'Permanent' : 'Journalier' },
      { key: 'availability', label: 'Disponible', format: (v) => v ? 'Oui' : 'Non' }
    ];

    const title = 'Liste des employés - Laye Déco';
    const filename = `employes_${new Date().toISOString().split('T')[0]}`;

    if (format === 'pdf') {
      exportToPDF(filteredEmployees, title, columns, filename);
    } else if (format === 'excel') {
      exportToExcel(filteredEmployees, title, columns, filename);
    } else if (format === 'csv') {
      exportToCSV(filteredEmployees, columns, filename);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      emp.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      emp.email?.toLowerCase().includes(search.toLowerCase()) ||
      emp.phone?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterStatus === 'all' || emp.status === filterStatus;
    return matchesSearch && matchesFilter && emp.isActive !== false;
  });

  const totalItems = filteredEmployees.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const isAdmin = user?.role === 'admin' || user?.role === 'director';

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Chargement...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Employés</h1>
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
          {isAdmin && (
            <button
              onClick={() => { setEditingEmployee(null); resetForm(); setShowModal(true); }}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <FiPlus /> Nouvel employé
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
              placeholder="Rechercher..."
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
            <option value="all">Tous</option>
            <option value="permanent">Permanents</option>
            <option value="daily">Journaliers</option>
          </select>
        </div>
      </div>

      {/* Liste */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Employé</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Téléphone</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Poste</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Statut</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Disponible</th>
                {isAdmin && <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {paginatedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Aucun employé trouvé
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map((emp) => (
                  <tr key={emp._id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {emp.photo ? (
                          <img src={emp.photo} alt={emp.firstName} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                            <FiUser className="text-gray-500 dark:text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium dark:text-white">{emp.firstName} {emp.lastName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{emp.email || 'Email non renseigné'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 dark:text-white">{emp.email || '-'}</td>
                    <td className="px-4 py-3 dark:text-white">{emp.phone || '-'}</td>
                    <td className="px-4 py-3 dark:text-white">{emp.position || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        emp.status === 'permanent' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {emp.status === 'permanent' ? 'Permanent' : 'Journalier'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        emp.availability 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {emp.availability ? 'Disponible' : 'Indisponible'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(emp)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Modifier"
                          >
                            <FiEdit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(emp._id)}
                            className="text-red-600 hover:text-red-800"
                            title="Désactiver"
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

      {/* Modal CRUD */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 dark:text-white">
              {editingEmployee ? 'Modifier l\'employé' : 'Nouvel employé'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prénom *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email (optionnel)</label>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  L'email est optionnel, le téléphone est l'identifiant principal.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone * (identifiant de connexion)</label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="77 123 45 67"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                  required
                />
                <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                  📱 Le journalier utilisera ce numéro pour se connecter.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Poste</label>
                <input
                  type="text"
                  name="position"
                  placeholder="Poste"
                  value={formData.position}
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
                  <option value="permanent">Permanent</option>
                  <option value="daily">Journalier</option>
                </select>
              </div>

              {formData.status === 'permanent' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Salaire mensuel (FCFA)</label>
                  <input
                    type="number"
                    name="salary"
                    placeholder="Salaire mensuel (FCFA)"
                    value={formData.salary}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tarif journalier (FCFA)</label>
                  <input
                    type="number"
                    name="dailyRate"
                    placeholder="Tarif journalier (FCFA)"
                    value={formData.dailyRate}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date d'embauche</label>
                <input
                  type="date"
                  name="hireDate"
                  value={formData.hireDate}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="availability"
                  checked={formData.availability}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-primary-600"
                />
                <label className="text-gray-700 dark:text-gray-300">Disponible</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg">
                  {editingEmployee ? 'Modifier' : 'Créer'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingEmployee(null); resetForm(); }}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 py-2 rounded-lg dark:text-white"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal des identifiants */}
      {showCredentials && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">🎉</div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Compte créé avec succès !</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Voici les identifiants du journalier. Envoyez-les-lui par WhatsApp.
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center py-2 border-b dark:border-gray-600">
                <span className="font-medium text-gray-700 dark:text-gray-300">📱 Téléphone :</span>
                <span className="text-gray-800 dark:text-white font-mono">{newCredentials.phone}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b dark:border-gray-600">
                <span className="font-medium text-gray-700 dark:text-gray-300">🔑 Mot de passe :</span>
                <span className="text-gray-800 dark:text-white font-mono">{newCredentials.password}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-medium text-gray-700 dark:text-gray-300">🔗 Lien de connexion :</span>
                <span className="text-gray-800 dark:text-white text-xs font-mono break-all">
                  https://laye-deco-platform.netlify.app
                </span>
              </div>
              {newCredentials.email && (
                <div className="flex justify-between items-center py-2 border-t dark:border-gray-600">
                  <span className="font-medium text-gray-700 dark:text-gray-300">📧 Email :</span>
                  <span className="text-gray-800 dark:text-white font-mono">{newCredentials.email}</span>
                </div>
              )}
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
              <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                📱 Copiez ces identifiants et envoyez-les au journalier par WhatsApp.
                <br />
                ⚠️ Il pourra changer son mot de passe dans son profil après sa première connexion.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  const text = `📱 Téléphone: ${newCredentials.phone}\n🔑 Mot de passe: ${newCredentials.password}\n🔗 Lien: https://laye-deco-platform.netlify.app${newCredentials.email ? `\n📧 Email: ${newCredentials.email}` : ''}`;
                  navigator.clipboard.writeText(text);
                  toast.success('Identifiants copiés !');
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
              >
                📋 Copier tout
              </button>
              <button
                onClick={() => setShowCredentials(false)}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;