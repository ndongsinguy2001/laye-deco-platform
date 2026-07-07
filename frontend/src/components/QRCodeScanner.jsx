import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { FiCamera, FiX, FiUser } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';

const QRCodeScanner = ({ onScan, onClose }) => {
  const [scanning, setScanning] = useState(true);
  const [employeeId, setEmployeeId] = useState('');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const scannerRef = useRef(null);
  const scannerContainerRef = useRef(null);

  // Charger la liste des employés
  useEffect(() => {
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
    fetchEmployees();
  }, []);

  // Initialiser le scanner
  useEffect(() => {
    if (!scannerContainerRef.current) return;

    const html5QrCode = new Html5Qrcode(scannerContainerRef.current.id);

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0
    };

    const onScanSuccess = async (decodedText, decodedResult) => {
      if (!scanning) return;
      setScanning(false);

      try {
        if (!employeeId) {
          toast.error('Veuillez sélectionner un employé');
          setScanning(true);
          return;
        }

        const response = await api.post('/attendance/qr/scan', {
          qrData: decodedText,
          employeeId
        });

        toast.success(response.data.message);
        onScan?.(response.data);
        
        await html5QrCode.stop();
        onClose?.();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Erreur lors du scan');
        setScanning(true);
      }
    };

    const onScanError = (error) => {};

    html5QrCode.start(
      { facingMode: 'environment' },
      config,
      onScanSuccess,
      onScanError
    );

    scannerRef.current = html5QrCode;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [employeeId, scanning, onScan, onClose]);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (e) {}
    }
    onClose?.();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
            <FiCamera className="text-primary-600" /> Scanner QR Code
          </h3>
          <button
            onClick={stopScanner}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <FiX size={24} className="dark:text-white" />
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <FiUser className="inline mr-1" /> Sélectionner l'employé
          </label>
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={loading}
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
          {loading && (
            <p className="text-xs text-gray-500 mt-1">Chargement des employés...</p>
          )}
        </div>

        <div className="bg-black rounded-lg overflow-hidden aspect-square relative">
          <div 
            id="qr-scanner-container" 
            ref={scannerContainerRef}
            className="w-full h-full"
          />
          {!scanning && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
                <p>Scan en cours...</p>
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
          📱 Placez le QR Code devant la caméra
        </p>

        <button
          onClick={stopScanner}
          className="mt-4 w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white py-2 rounded-lg transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  );
};

export default QRCodeScanner;