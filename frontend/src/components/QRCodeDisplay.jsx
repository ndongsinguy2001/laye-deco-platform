import React, { useState, useEffect } from 'react';
import { FiDownload, FiCopy, FiCheck } from 'react-icons/fi';
import { FaQrcode } from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';

const QRCodeDisplay = ({ eventId, eventName }) => {
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const generateQR = async () => {
    try {
      setLoading(true);
      console.log('🔄 Génération du QR Code pour eventId:', eventId);
      const response = await api.get(`/attendance/qr/generate/${eventId}`);
      console.log('✅ QR Code reçu:', response.data);
      setQrCode(response.data.qrCode);
      toast.success('QR Code généré avec succès !');
    } catch (error) {
      console.error('❌ Erreur génération QR:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la génération du QR Code');
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    if (!qrCode) return;
    const link = document.createElement('a');
    link.download = `qr_${eventName}_${new Date().toISOString().split('T')[0]}.png`;
    link.href = qrCode;
    link.click();
  };

  const copyQR = () => {
    if (!qrCode) return;
    navigator.clipboard.writeText(qrCode);
    setCopied(true);
    toast.success('QR Code copié !');
    setTimeout(() => setCopied(false), 2000);
  };

  // Générer automatiquement le QR Code quand le composant se charge
  useEffect(() => {
    if (eventId) {
      generateQR();
    }
  }, [eventId]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Génération du QR Code...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <FaQrcode className="text-primary-600 text-2xl" />
        QR Code - {eventName}
      </h3>

      {qrCode ? (
        <div className="flex flex-col items-center">
          <div className="bg-white p-4 rounded-lg shadow-md border-2 border-dashed border-gray-200">
            <img 
              src={qrCode} 
              alt="QR Code" 
              className="w-48 h-48 object-contain"
            />
          </div>
          
          <div className="flex gap-2 mt-4">
            <button
              onClick={downloadQR}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center gap-2 text-sm"
            >
              <FiDownload /> Télécharger
            </button>
            <button
              onClick={copyQR}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg flex items-center gap-2 text-sm dark:text-white"
            >
              {copied ? <FiCheck className="text-green-500" /> : <FiCopy />}
              {copied ? 'Copié !' : 'Copier'}
            </button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            📱 Les employés scannent ce QR Code pour pointer leur arrivée/départ
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Événement : {eventName} • ID: {eventId}
          </p>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">Aucun QR Code généré</p>
          <button
            onClick={generateQR}
            className="mt-4 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
          >
            Générer le QR Code
          </button>
        </div>
      )}
    </div>
  );
};

export default QRCodeDisplay;