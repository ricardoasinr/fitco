import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminSidebar from '../components/AdminSidebar';
import { useQRScanner } from '../hooks/useQRScanner';
import { ScannerView } from '../components/scanner/ScannerView';
import { ConfirmationModal } from '../components/scanner/ConfirmationModal';
import '../styles/Dashboard.css';

/**
 * QRScanner - Página para escanear códigos QR de asistencia
 * 
 * Refactorizada para SOLID y Clean Code:
 * - Lógica de escáner extraída a useQRScanner
 * - UI dividida en ScannerView y ConfirmationModal
 */
const QRScanner: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const {
    scanning,
    error,
    success,
    loading,
    foundRegistration,
    showConfirmModal,
    marking,
    startScanning,
    stopScanning,
    confirmAttendance,
    closeModal
  } = useQRScanner();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="layout-with-sidebar">
      <AdminSidebar onLogout={handleLogout} />

      <div className="main-content">
        <div className="dashboard-content-wrapper">
          <div className="welcome-section">
            <h1 className="welcome-title">📷 Escanear QR</h1>
            <p style={{ color: '#6c757d', marginTop: '0.5rem' }}>
              Escanea el código QR del participante para registrar su asistencia
            </p>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <ScannerView
            scanning={scanning}
            loading={loading}
            onStart={startScanning}
            onStop={stopScanning}
          />

          {showConfirmModal && foundRegistration && (
            <ConfirmationModal
              registration={foundRegistration}
              marking={marking}
              onConfirm={confirmAttendance}
              onClose={closeModal}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
