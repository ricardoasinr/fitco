import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { useAuth } from '../context/AuthContext';
import { AttendanceWithRegistration } from '../types/event.types';
import { attendanceService } from '../services/attendance.service';
import AdminSidebar from '../components/AdminSidebar';
import '../styles/Dashboard.css';

const QRScanner: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [foundRegistration, setFoundRegistration] = useState<AttendanceWithRegistration | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [marking, setMarking] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      // Cleanup: detener el escáner cuando el componente se desmonte
      if (html5QrCodeRef.current && scanning) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, [scanning]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const startScanning = async () => {
    try {
      setError('');
      setSuccess('');
      setFoundRegistration(null);
      setShowConfirmModal(false);

      // Si ya hay un escáner activo, detenerlo primero
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop();
          html5QrCodeRef.current.clear();
        } catch (e) {
          // Ignorar errores al detener
        }
        html5QrCodeRef.current = null;
      }

      if (!scannerRef.current) {
        setError('Error: No se pudo inicializar el escáner');
        return;
      }

      const html5QrCode = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' }, // Usar cámara trasera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          // Cuando se escanea un código QR
          await handleQRCodeScanned(decodedText);
        },
        (_errorMessage) => {
          // Ignorar errores de escaneo continuo
        }
      );

      setScanning(true);
    } catch (err: any) {
      console.error('Error al iniciar escáner:', err);
      setError('Error al iniciar la cámara. Asegúrate de dar permisos de cámara.');
      setScanning(false);
    }
  };

  const stopScanning = async () => {
    try {
      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null;
      }
      setScanning(false);
    } catch (err) {
      console.error('Error al detener escáner:', err);
    }
  };

  const handleQRCodeScanned = async (qrCode: string) => {
    try {
      // Detener el escáner temporalmente
      await stopScanning();
      
      setLoading(true);
      setError('');
      
      // Buscar el registro por QR code
      const attendance = await attendanceService.getByQrCode(qrCode);
      
      setFoundRegistration(attendance);
      setShowConfirmModal(true);
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || 'No se encontró un registro con este código QR');
      // Reiniciar el escáner después de un error
      setTimeout(() => {
        startScanning();
      }, 2000);
    }
  };

  const handleConfirmAttendance = async () => {
    if (!foundRegistration) return;

    // Verificar que tenga PRE completado
    const hasPre = foundRegistration.registration.wellnessAssessments.find(
      w => w.type === 'PRE' && w.status === 'COMPLETED'
    );

    if (!hasPre) {
      setError('⚠️ El usuario no ha completado la evaluación PRE');
      setShowConfirmModal(false);
      return;
    }

    if (foundRegistration.attended) {
      setError('Este usuario ya tiene asistencia marcada');
      setShowConfirmModal(false);
      return;
    }

    try {
      setMarking(true);
      setError('');
      
      await attendanceService.mark({
        registrationId: foundRegistration.registration.id
      });

      setSuccess(`✅ Asistencia marcada para ${foundRegistration.registration.user.name}`);
      setShowConfirmModal(false);
      setFoundRegistration(null);
      
      // Reiniciar el escáner después de marcar
      setTimeout(() => {
        startScanning();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al marcar asistencia');
    } finally {
      setMarking(false);
    }
  };

  const handleCloseModal = () => {
    setShowConfirmModal(false);
    setFoundRegistration(null);
    // Reiniciar el escáner
    setTimeout(() => {
      startScanning();
    }, 500);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
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

          <div className="scanner-container" style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            marginBottom: '1.5rem'
          }}>
            <div id="qr-reader" ref={scannerRef} style={{
              width: '100%',
              maxWidth: '500px',
              margin: '0 auto'
            }}></div>

            {!scanning && !loading && (
              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <button
                  onClick={startScanning}
                  className="btn-primary"
                  style={{
                    padding: '1rem 2rem',
                    fontSize: '1.1rem',
                    fontWeight: 600
                  }}
                >
                  🎥 Iniciar Escáner
                </button>
              </div>
            )}

            {scanning && (
              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <button
                  onClick={stopScanning}
                  className="btn-secondary"
                  style={{
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    fontWeight: 600
                  }}
                >
                  ⏹️ Detener Escáner
                </button>
              </div>
            )}

            {loading && (
              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <div className="loading">Buscando registro...</div>
              </div>
            )}
          </div>

          {/* Modal de Confirmación */}
          {showConfirmModal && foundRegistration && (
            <div className="modal-overlay" style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div className="modal-content" style={{
                background: 'white',
                borderRadius: '12px',
                padding: '2rem',
                maxWidth: '600px',
                width: '90%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem',
                  paddingBottom: '1rem',
                  borderBottom: '2px solid #dee2e6'
                }}>
                  <h2 style={{ margin: 0, color: '#2c3e50' }}>📋 Confirmar Asistencia</h2>
                  <button
                    onClick={handleCloseModal}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '1.5rem',
                      cursor: 'pointer',
                      color: '#6c757d',
                      padding: '0',
                      width: '30px',
                      height: '30px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '4px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#dee2e6';
                      e.currentTarget.style.color = '#2c3e50';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'none';
                      e.currentTarget.style.color = '#6c757d';
                    }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    background: '#f8f9fa',
                    borderRadius: '8px'
                  }}>
                    <span style={{ fontWeight: 600, color: '#6c757d', minWidth: '120px' }}>Nombre:</span>
                    <span style={{ color: '#2c3e50' }}>{foundRegistration.registration.user.name}</span>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    background: '#f8f9fa',
                    borderRadius: '8px'
                  }}>
                    <span style={{ fontWeight: 600, color: '#6c757d', minWidth: '120px' }}>Email:</span>
                    <span style={{ color: '#2c3e50' }}>{foundRegistration.registration.user.email}</span>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    background: '#f8f9fa',
                    borderRadius: '8px'
                  }}>
                    <span style={{ fontWeight: 600, color: '#6c757d', minWidth: '120px' }}>Evento:</span>
                    <span style={{ color: '#2c3e50' }}>{foundRegistration.registration.event.name}</span>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    background: '#f8f9fa',
                    borderRadius: '8px'
                  }}>
                    <span style={{ fontWeight: 600, color: '#6c757d', minWidth: '120px' }}>Fecha del evento:</span>
                    <span style={{ color: '#2c3e50' }}>{formatDateTime(foundRegistration.registration.eventInstance.dateTime)}</span>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    background: '#f8f9fa',
                    borderRadius: '8px'
                  }}>
                    <span style={{ fontWeight: 600, color: '#6c757d', minWidth: '120px' }}>QR Code:</span>
                    <code style={{
                      background: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      color: '#495057',
                      fontSize: '0.9rem'
                    }}>
                      {foundRegistration.registration.qrCode}
                    </code>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    background: '#f8f9fa',
                    borderRadius: '8px'
                  }}>
                    <span style={{ fontWeight: 600, color: '#6c757d', minWidth: '120px' }}>Estado PRE:</span>
                    {foundRegistration.registration.wellnessAssessments.find(w => w.type === 'PRE')?.status === 'COMPLETED' ? (
                      <span style={{ color: '#28a745', fontWeight: 600 }}>✅ Completado</span>
                    ) : (
                      <span style={{ color: '#dc3545', fontWeight: 600 }}>⏳ Pendiente</span>
                    )}
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    background: '#f8f9fa',
                    borderRadius: '8px'
                  }}>
                    <span style={{ fontWeight: 600, color: '#6c757d', minWidth: '120px' }}>Asistencia:</span>
                    {foundRegistration.attended ? (
                      <span style={{ color: '#28a745', fontWeight: 600 }}>✅ Ya marcada</span>
                    ) : (
                      <span style={{ color: '#ffc107', fontWeight: 600 }}>⏳ Pendiente</span>
                    )}
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  marginTop: '2rem',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    onClick={handleCloseModal}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#5a6268';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#6c757d';
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmAttendance}
                    disabled={marking || foundRegistration.attended || foundRegistration.registration.wellnessAssessments.find(w => w.type === 'PRE')?.status !== 'COMPLETED'}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: foundRegistration.attended || foundRegistration.registration.wellnessAssessments.find(w => w.type === 'PRE')?.status !== 'COMPLETED' ? '#6c757d' : '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontWeight: 600,
                      cursor: foundRegistration.attended || foundRegistration.registration.wellnessAssessments.find(w => w.type === 'PRE')?.status !== 'COMPLETED' ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      opacity: marking ? 0.7 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!foundRegistration.attended && foundRegistration.registration.wellnessAssessments.find(w => w.type === 'PRE')?.status === 'COMPLETED') {
                        e.currentTarget.style.background = '#218838';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!foundRegistration.attended && foundRegistration.registration.wellnessAssessments.find(w => w.type === 'PRE')?.status === 'COMPLETED') {
                        e.currentTarget.style.background = '#28a745';
                      }
                    }}
                  >
                    {marking ? 'Marcando...' : '✅ Confirmar Asistencia'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScanner;

