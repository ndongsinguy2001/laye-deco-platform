import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiPlus, FiCheckCircle, FiClock, FiSearch, FiUser, FiDownload } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { exportToPDF, exportToExcel, exportToCSV } from '../utils/exportUtils';
import Pagination from '../components/Pagination';

const Payments = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('calculate');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    employeeId: '',
    period: '',
    paymentId: '',
    amount: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      fetchPayments(selectedEmployee);
      setCurrentPage(1);
    } else {
      setPayments([]);
    }
  }, [selectedEmployee]);

  const fetchData = async () => {
    try {
      const response = await api.get('/employees');
      setEmployees(response.data);
    } catch (error) {
      toast.error('Erreur chargement des employés');
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async (employeeId) => {
    try {
      const response = await api.get(`/payments/employee/${employeeId}`);
      setPayments(response.data);
    } catch (error) {
      toast.error('Erreur chargement des paiements');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const openCalculateModal = () => {
    setModalType('calculate');
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setFormData({
      employeeId: selectedEmployee,
      period: period,
      paymentId: '',
      amount: ''
    });
    setShowModal(true);
  };

  const openAdvanceModal = (paymentId) => {
    setModalType('advance');
    setFormData({
      employeeId: selectedEmployee,
      period: '',
      paymentId: paymentId,
      amount: ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalType === 'calculate') {
        await api.post('/payments/calculate', {
          employeeId: formData.employeeId,
          period: formData.period
        });
        toast.success('Paiement calculé avec succès');
      } else if (modalType === 'advance') {
        await api.post('/payments/advance', {
          paymentId: formData.paymentId,
          amount: parseFloat(formData.amount)
        });
        toast.success('Avance enregistrée avec succès');
      }
      setShowModal(false);
      fetchPayments(selectedEmployee);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur');
    }
  };

  const handleMarkAsPaid = async (paymentId) => {
    if (window.confirm('Marquer ce paiement comme payé ?')) {
      try {
        await api.put(`/payments/${paymentId}/paid`);
        toast.success('Paiement marqué comme payé');
        fetchPayments(selectedEmployee);
        fetchData();
      } catch (error) {
        toast.error('Erreur');
      }
    }
  };

  const handleExport = (format) => {
    const statusLabels = {
      pending: 'En attente',
      paid: 'Payé',
      partial: 'Partiel'
    };

    const columns = [
      { key: 'period', label: 'Période' },
      { key: 'totalDays', label: 'Jours' },
      { key: 'totalEvents', label: 'Événements' },
      { key: 'amount', label: 'Montant (FCFA)', format: (v) => v.toLocaleString() },
      { key: 'advances', label: 'Avances (FCFA)', format: (v) => v.toLocaleString() },
      { key: 'balance', label: 'Solde (FCFA)', format: (v) => v.toLocaleString() },
      { key: 'status', label: 'Statut', format: (v) => statusLabels[v] || v }
    ];

    const employeeName = selectedEmployeeData 
      ? `${selectedEmployeeData.firstName} ${selectedEmployeeData.lastName}`
      : 'Tous';

    const title = `Paiements - ${employeeName}`;
    const filename = `paiements_${employeeName.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}`;

    if (format === 'pdf') {
      exportToPDF(paginatedPayments, title, columns, filename);
    } else if (format === 'excel') {
      exportToExcel(paginatedPayments, title, columns, filename);
    } else if (format === 'csv') {
      exportToCSV(paginatedPayments, columns, filename);
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'En attente',
      paid: 'Payé',
      partial: 'Partiel'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      partial: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'director';
  const isAccountant = user?.role === 'accountant';
  const canManage = isAdmin || isAccountant;

  const selectedEmployeeData = employees.find(e => e._id === selectedEmployee);

  const totalItems = payments.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedPayments = payments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Chargement...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-gray-800">Paiements</h1>
        {payments.length > 0 && (
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
          </div>
        )}
      </div>

      {/* Sélection de l'employé */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Sélectionner un employé</label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
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
          {canManage && selectedEmployee && (
            <button
              onClick={openCalculateModal}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <FiPlus /> Calculer le paiement
            </button>
          )}
        </div>
      </div>

      {/* Liste des paiements */}
      {selectedEmployee ? (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {selectedEmployeeData?.firstName} {selectedEmployeeData?.lastName}
            </h2>
            <span className="text-sm text-gray-500">{payments.length} paiement(s)</span>
          </div>

          {payments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucun paiement pour cet employé</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Période</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Jours</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Événements</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Montant</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Avances</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Solde</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Statut</th>
                      {canManage && <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPayments.map((payment) => (
                      <tr key={payment._id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3">{payment.period}</td>
                        <td className="px-4 py-3">{payment.totalDays}</td>
                        <td className="px-4 py-3">{payment.totalEvents}</td>
                        <td className="px-4 py-3 font-semibold">{payment.amount.toLocaleString()} FCFA</td>
                        <td className="px-4 py-3">{payment.advances.toLocaleString()} FCFA</td>
                        <td className="px-4 py-3 font-semibold">{payment.balance.toLocaleString()} FCFA</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                            {getStatusLabel(payment.status)}
                          </span>
                        </td>
                        {canManage && (
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => openAdvanceModal(payment._id)}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                Avance
                              </button>
                              {payment.status !== 'paid' && (
                                <button
                                  onClick={() => handleMarkAsPaid(payment._id)}
                                  className="text-green-600 hover:text-green-800 text-sm"
                                >
                                  <FiCheckCircle size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
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
            </>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md p-8 text-center text-gray-500">
          <FiUser size={48} className="mx-auto mb-4 text-gray-300" />
          <p>Sélectionnez un employé pour voir ses paiements</p>
        </div>
      )}

      {/* Modal de calcul / avance */}
      {showModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">
              {modalType === 'calculate' ? 'Calculer le paiement' : 'Enregistrer une avance'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {modalType === 'calculate' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Période (AAAA-MM)</label>
                  <input
                    type="text"
                    name="period"
                    value={formData.period}
                    onChange={handleInputChange}
                    placeholder="2026-07"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>
              )}
              {modalType === 'advance' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Montant de l'avance (FCFA)</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="Montant..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg">
                  {modalType === 'calculate' ? 'Calculer' : 'Enregistrer'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); }}
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

export default Payments;