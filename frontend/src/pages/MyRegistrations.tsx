import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Registration } from '../types/event.types';
import { registrationsService } from '../services/registrations.service';
import Sidebar from '../components/Sidebar';
import { QRCodeSVG } from 'qrcode.react';
import QRCode from 'qrcode';
import '../styles/Dashboard.css';
import '../styles/Sidebar.css';
import '../styles/Registrations.css';
import '../styles/Wellness.css';

/**
 * MyRegistrations - Página para ver inscripciones del usuario
 *
 * Muestra:
 * - Vista resumida: Lista de inscripciones como tarjetas simples
 * - Vista detalle: QR code, wellness assessments, y acciones
 */
const MyRegistrations: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRegistrations();
  }, []);

  useEffect(() => {
    if (id && registrations.length > 0) {
      const registration = registrations.find(r => r.id === id);
      if (registration) {
        setSelectedRegistration(registration);
      }
    } else {
      setSelectedRegistration(null);
    }
  }, [id, registrations]);

  const loadRegistrations = async () => {
    try {
      setLoading(true);
      const data = await registrationsService.getMyRegistrations();
      setRegistrations(data);
      setError('');
    } catch (err: any) {
      setError('Error al cargar inscripciones');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleCancelRegistration = async (registrationId: string) => {
    if (!confirm('¿Estás seguro de cancelar esta inscripción?')) return;

    try {
      await registrationsService.cancel(registrationId);
      navigate('/my-registrations');
      await loadRegistrations();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cancelar inscripción');
    }
  };

  const getStatusText = (registration: Registration): string => {
    const preAssessment = registration.wellnessAssessments.find(
      (w) => w.type === 'PRE',
    );
    const postAssessment = registration.wellnessAssessments.find(
      (w) => w.type === 'POST',
    );

    if (postAssessment?.status === 'COMPLETED') {
      return '✅ Completado';
    }
    if (registration.attendance?.attended) {
      return '🎯 Asistido - POST pendiente';
    }
    if (preAssessment?.status === 'COMPLETED') {
      return '📋 PRE completado';
    }
    return '⏳ PRE pendiente';
  };

  const getStatusBadge = (registration: Registration) => {
    const statusText = getStatusText(registration);
    const preAssessment = registration.wellnessAssessments.find(
      (w) => w.type === 'PRE',
    );
    const postAssessment = registration.wellnessAssessments.find(
      (w) => w.type === 'POST',
    );

    if (postAssessment?.status === 'COMPLETED') {
      return <span className="status-badge completed">{statusText}</span>;
    }
    if (registration.attendance?.attended) {
      return <span className="status-badge attended">{statusText}</span>;
    }
    if (preAssessment?.status === 'COMPLETED') {
      return <span className="status-badge pre-done">{statusText}</span>;
    }
    return <span className="status-badge pending">{statusText}</span>;
  };

  const getPendingAction = (registration: Registration) => {
    const preAssessment = registration.wellnessAssessments.find(
      (w) => w.type === 'PRE',
    );
    const postAssessment = registration.wellnessAssessments.find(
      (w) => w.type === 'POST',
    );

    if (preAssessment?.status === 'PENDING') {
      return (
        <button
          onClick={() => navigate(`/wellness/${preAssessment.id}`)}
          className="btn-action btn-wellness"
        >
          📝 Completar PRE
        </button>
      );
    }

    if (postAssessment?.status === 'PENDING') {
      return (
        <button
          onClick={() => navigate(`/wellness/${postAssessment.id}`)}
          className="btn-action btn-wellness"
        >
          📝 Completar POST
        </button>
      );
    }

    if (postAssessment?.status === 'COMPLETED') {
      return (
        <button
          onClick={() => navigate(`/wellness/impact/${registration.id}`)}
          className="btn-action btn-impact"
        >
          📊 Ver Impacto
        </button>
      );
    }

    return null;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isInstancePast = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  const handleCardClick = (registrationId: string) => {
    navigate(`/my-registrations/${registrationId}`);
  };

  const handleBackToList = () => {
    navigate('/my-registrations');
  };

  const handleDownloadQR = async () => {
    if (!selectedRegistration) return;

    try {
      // Crear canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Configurar tamaño del canvas
      canvas.width = 600;
      canvas.height = 900;

      // Fondo blanco
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Generar QR code como imagen
      const qrDataUrl = await QRCode.toDataURL(selectedRegistration.qrCode, {
        width: 250,
        margin: 2,
        errorCorrectionLevel: 'H',
      });

      // Cargar imagen QR
      const qrImage = new Image();
      await new Promise((resolve, reject) => {
        qrImage.onload = resolve;
        qrImage.onerror = reject;
        qrImage.src = qrDataUrl;
      });

      // Configurar estilos de texto
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      let yPos = 40;

      // Título del evento
      ctx.fillStyle = '#2c3e50';
      ctx.font = 'bold 32px Arial';
      ctx.fillText(selectedRegistration.event.name, canvas.width / 2, yPos);
      yPos += 50;

      // Tipo de ejercicio
      ctx.font = '24px Arial';
      ctx.fillText(`🏋️ ${selectedRegistration.event.exerciseType.name}`, canvas.width / 2, yPos);
      yPos += 50;

      // Estado
      const statusText = getStatusText(selectedRegistration);
      ctx.font = '20px Arial';
      ctx.fillStyle = '#7f8c8d';
      ctx.fillText(statusText, canvas.width / 2, yPos);
      yPos += 50;

      // Información del evento
      ctx.font = 'bold 20px Arial';
      ctx.fillStyle = '#2c3e50';
      ctx.fillText('📅 Información del Evento', canvas.width / 2, yPos);
      yPos += 40;

      ctx.font = '18px Arial';
      ctx.fillStyle = '#34495e';
      const dateText = `📅 ${formatDate(selectedRegistration.eventInstance.dateTime)}`;
      ctx.fillText(dateText, canvas.width / 2, yPos);
      yPos += 35;

      const timeText = `🕐 ${formatTime(selectedRegistration.eventInstance.dateTime)}`;
      ctx.fillText(timeText, canvas.width / 2, yPos);
      yPos += 60;

      // Título del QR
      ctx.font = 'bold 20px Arial';
      ctx.fillStyle = '#2c3e50';
      ctx.fillText('🎫 Tu Código QR', canvas.width / 2, yPos);
      yPos += 40;

      // Dibujar QR code
      const qrSize = 250;
      const qrX = (canvas.width - qrSize) / 2;
      ctx.drawImage(qrImage, qrX, yPos, qrSize, qrSize);
      yPos += qrSize + 20;

      // ID de registro
      ctx.font = 'bold 18px monospace';
      ctx.fillStyle = '#2c3e50';
      ctx.fillText(selectedRegistration.qrCode, canvas.width / 2, yPos);

      // Descargar imagen
      const link = document.createElement('a');
      link.download = `QR-${selectedRegistration.event.name.replace(/\s+/g, '-')}-${selectedRegistration.qrCode}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error al generar QR:', error);
      setError('Error al generar la imagen del QR');
    }
  };

  // Vista de detalle de una inscripción específica
  if (selectedRegistration) {
    const preAssessment = selectedRegistration.wellnessAssessments.find(w => w.type === 'PRE');
    const postAssessment = selectedRegistration.wellnessAssessments.find(w => w.type === 'POST');

    return (
      <div className="layout-with-sidebar">
        <Sidebar onLogout={handleLogout} />
        
        <div className="main-content">
          <div className="dashboard-content-wrapper">
            <button onClick={handleBackToList} className="btn-back">
              ← Volver a Mis Inscripciones
            </button>

            <div className="registration-detail-card">
              <div className="detail-header">
                <h2 className="detail-title">{selectedRegistration.event.name}</h2>
                <p className="detail-subtitle">
                  🏋️ {selectedRegistration.event.exerciseType.name}
                </p>
                {getStatusBadge(selectedRegistration)}
              </div>

              <div className="detail-sections">
                {/* Información del evento */}
                <div className="detail-section">
                  <h4>📅 Información del Evento</h4>
                  <div className="detail-item">
                    <span className="detail-icon">📅</span>
                    <span className="detail-text">
                      {formatDate(selectedRegistration.eventInstance.dateTime)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-icon">🕐</span>
                    <span className="detail-text">
                      {formatTime(selectedRegistration.eventInstance.dateTime)}
                    </span>
                  </div>
                </div>

                {/* Código QR */}
                <div className="detail-section">
                  <h4>🎫 Tu Código QR</h4>
                  <div className="qr-code-large" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
                    <QRCodeSVG 
                      value={selectedRegistration.qrCode}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <p style={{ marginTop: '16px', textAlign: 'center', color: '#2c3e50', fontSize: '16px', fontWeight: '600', fontFamily: 'monospace' }}>
                    {selectedRegistration.qrCode}
                  </p>
                  <p className="qr-hint" style={{ marginTop: '12px', textAlign: 'center', color: '#7f8c8d', fontSize: '14px' }}>
                    Presenta este código al llegar al evento
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                    <button
                      onClick={handleDownloadQR}
                      className="btn-action"
                      style={{ 
                        backgroundColor: '#3498db',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      📥 Descargar QR
                    </button>
                  </div>
                </div>

                {/* Estado Wellness */}
                <div className="detail-section">
                  <h4>🌟 Evaluaciones Wellness</h4>
                  <div className="wellness-section">
                    {preAssessment && (
                      <div className="wellness-item">
                        <div className="wellness-item-info">
                          <span className="wellness-item-type">📋 PRE</span>
                          <span className="wellness-item-status">
                            {preAssessment.status === 'COMPLETED' ? 'Completado' : 'Pendiente'}
                          </span>
                        </div>
                        {preAssessment.status === 'PENDING' && (
                          <button
                            onClick={() => navigate(`/wellness/${preAssessment.id}`)}
                            className="btn-action btn-wellness"
                            style={{ padding: '8px 16px', fontSize: '14px' }}
                          >
                            Completar
                          </button>
                        )}
                      </div>
                    )}
                    {postAssessment && (
                      <div className="wellness-item">
                        <div className="wellness-item-info">
                          <span className="wellness-item-type">📝 POST</span>
                          <span className="wellness-item-status">
                            {postAssessment.status === 'COMPLETED' ? 'Completado' : 'Pendiente'}
                          </span>
                        </div>
                        {postAssessment.status === 'PENDING' && (
                          <button
                            onClick={() => navigate(`/wellness/${postAssessment.id}`)}
                            className="btn-action btn-wellness"
                            style={{ padding: '8px 16px', fontSize: '14px' }}
                          >
                            Completar
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                <div className="registration-actions" style={{ marginTop: '20px' }}>
                  {getPendingAction(selectedRegistration)}

                  {!selectedRegistration.attendance?.attended &&
                    !isInstancePast(selectedRegistration.eventInstance.dateTime) && (
                      <button
                        onClick={() => handleCancelRegistration(selectedRegistration.id)}
                        className="btn-action btn-cancel"
                      >
                        ❌ Cancelar Inscripción
                      </button>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vista de lista resumida
  return (
    <div className="layout-with-sidebar">
      <Sidebar onLogout={handleLogout} />
      
      <div className="main-content">
        <div className="dashboard-content-wrapper">
          <div className="welcome-section">
            <h1 className="welcome-title">🎫 Mis Inscripciones</h1>
            <p style={{ color: '#666', marginTop: '15px', fontSize: '16px' }}>
              Haz clic en una inscripción para ver los detalles y tu código QR
            </p>
          </div>

          {error && <div className="error-message">{error}</div>}

          {loading ? (
            <div className="loading-card">
              <div className="loading">Cargando inscripciones...</div>
            </div>
          ) : registrations.length === 0 ? (
            <div className="empty-state-card">
              <h3>📭 No tienes inscripciones</h3>
              <p>Explora los eventos disponibles y regístrate</p>
              <button onClick={() => navigate('/events')} className="btn-primary" style={{ marginTop: '20px', maxWidth: '250px' }}>
                Ver Eventos
              </button>
            </div>
          ) : (
            <div className="registrations-grid">
              {registrations.map((registration) => (
                <div 
                  key={registration.id} 
                  className="registration-card registration-card-compact"
                  onClick={() => handleCardClick(registration.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="registration-header">
                    <h3>{registration.event.name}</h3>
                    {getStatusBadge(registration)}
                  </div>

                  <div className="registration-info">
                    <p className="event-type">
                      🏋️ {registration.event.exerciseType.name}
                    </p>
                    <p className="event-date">
                      📅 {formatDate(registration.eventInstance.dateTime)}
                    </p>
                    <p className="event-time">
                      🕐 {formatTime(registration.eventInstance.dateTime)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyRegistrations;
