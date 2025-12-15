import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { 
  AttendanceWithRegistration, 
  AttendanceStats, 
  Event 
} from '../types/event.types';
import { attendanceService } from '../services/attendance.service';
import { eventsService } from '../services/events.service';
import AdminSidebar from '../components/AdminSidebar';
import '../styles/Dashboard.css';
import '../styles/Registrations.css';

/**
 * AttendanceCheck - Página para que admin marque asistencia
 * 
 * Funcionalidades:
 * - Búsqueda por QR code
 * - Búsqueda por email
 * - Ver estadísticas del evento
 * - Lista de asistencias
 */
const AttendanceCheck: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [attendances, setAttendances] = useState<AttendanceWithRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Search state
  const [emailFilter, setEmailFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<AttendanceWithRegistration | null>(null);
  const [marking, setMarking] = useState(false);
  const qrCodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (eventId) {
      loadEventData();
    }
  }, [eventId]);

  const loadEventData = async () => {
    if (!eventId) return;
    
    try {
      setLoading(true);
      const [eventData, statsData, attendanceData] = await Promise.all([
        eventsService.getById(eventId),
        attendanceService.getStats(eventId),
        attendanceService.getByEventId(eventId),
      ]);
      setEvent(eventData);
      setStats(statsData);
      setAttendances(attendanceData);
      setError('');
    } catch (err: any) {
      setError('Error al cargar datos del evento');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleMarkAttendance = async (attendance: AttendanceWithRegistration) => {
    setError('');
    setSuccess('');
    
    // Verificar que tenga PRE completado
    const hasPre = attendance.registration.wellnessAssessments.find(
      w => w.type === 'PRE' && w.status === 'COMPLETED'
    );
    
    if (!hasPre) {
      setError('⚠️ El usuario no ha completado la evaluación PRE');
      return;
    }
    
    if (attendance.attended) {
      setError('Este usuario ya tiene asistencia marcada');
      return;
    }
    
    try {
      setMarking(true);
      await attendanceService.mark({ 
        registrationId: attendance.registration.id
      });
      setSuccess(`✅ Asistencia marcada para ${attendance.registration.user.name}`);
      setSelectedUser(null);
      await loadEventData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al marcar asistencia');
    } finally {
      setMarking(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  const getPreWellnessStatus = (attendance: AttendanceWithRegistration) => {
    const pre = attendance.registration.wellnessAssessments.find(w => w.type === 'PRE');
    return pre?.status === 'COMPLETED';
  };

  const downloadQRCode = async () => {
    if (!qrCodeRef.current || !selectedUser) return;

    try {
      const svgElement = qrCodeRef.current.querySelector('svg');
      if (!svgElement) return;

      // Crear un canvas para convertir SVG a imagen
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Obtener las dimensiones del SVG
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        // Configurar el tamaño del canvas (más grande para mejor calidad)
        canvas.width = 400;
        canvas.height = 400;
        
        // Dibujar la imagen en el canvas
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Convertir a PNG y descargar
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `QR-${selectedUser.registration.user.name.replace(/\s+/g, '-')}-${selectedUser.registration.qrCode.slice(0, 8)}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }
        }, 'image/png');

        URL.revokeObjectURL(url);
      };
      img.src = url;
    } catch (error) {
      console.error('Error al generar imagen QR:', error);
      setError('Error al generar imagen QR');
    }
  };

  // Filtrar y ordenar attendances: últimos 10 inscritos
  const getFilteredAttendances = () => {
    let filtered = [...attendances];
    
    // Filtrar por email si hay búsqueda
    if (emailFilter.trim()) {
      filtered = filtered.filter(att => 
        att.registration.user.email.toLowerCase().includes(emailFilter.toLowerCase()) ||
        att.registration.user.name.toLowerCase().includes(emailFilter.toLowerCase())
      );
    }
    
    // Ordenar por fecha de creación descendente (más recientes primero)
    filtered.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    // Mostrar solo los últimos 10
    return filtered.slice(0, 10);
  };

  if (loading) {
    return (
      <div className="layout-with-sidebar">
        <AdminSidebar onLogout={handleLogout} />
        <div className="main-content">
          <div className="dashboard-content-wrapper">
            <div className="loading-card">
              <div className="loading">Cargando datos del evento...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="layout-with-sidebar">
      <AdminSidebar onLogout={handleLogout} />
      
      <div className="main-content">
        <div className="dashboard-content-wrapper">
          <div className="welcome-section">
            <h1 className="welcome-title">✅ Control de Asistencia</h1>
          </div>
        {event && (
          <div className="event-info-card">
            <div className="event-header">
              <h2>{event.name}</h2>
              <button 
                onClick={() => navigate('/admin/events')} 
                className="btn-back"
              >
                ← Volver
              </button>
            </div>
            <div className="event-details-grid">
              <div className="detail-item">
                <span className="detail-icon">📅</span>
                <div>
                  <span className="detail-label">Creado</span>
                  <span className="detail-value">{formatDate(event.startDate)}</span>
                </div>
              </div>
              <div className="detail-item">
                <span className="detail-icon">🕐</span>
                <div>
                  <span className="detail-label">Hora</span>
                  <span className="detail-value">{event.time}</span>
                </div>
              </div>
              <div className="detail-item">
                <span className="detail-icon">🏋️</span>
                <div>
                  <span className="detail-label">Tipo</span>
                  <span className="detail-value">{event.exerciseType.name}</span>
                </div>
              </div>
              <div className="detail-item">
                <span className="detail-icon">👥</span>
                <div>
                  <span className="detail-label">Capacidad</span>
                  <span className="detail-value">{event.capacity}</span>
                </div>
              </div>
              {event.recurrenceType !== 'SINGLE' && (
                <div className="detail-item">
                  <span className="detail-icon">🔄</span>
                  <div>
                    <span className="detail-label">Recurrente</span>
                    <span className="detail-value">{event._count?.instances || 0} fechas</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {stats && (
          <div className="stats-container">
            <h3 className="stats-title">📊 Estadísticas del Evento</h3>
            <div className="stats-grid-modern">
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <span className="stat-value">{stats.total}</span>
                  <span className="stat-label">Total Inscritos</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <span className="stat-value">{stats.attended}</span>
                  <span className="stat-label">Asistieron</span>
                  <span className="stat-percentage">
                    {stats.total > 0 ? Math.round((stats.attended / stats.total) * 100) : 0}%
                  </span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⏳</div>
                <div className="stat-content">
                  <span className="stat-value">{stats.pending}</span>
                  <span className="stat-label">Pendientes</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🌟</div>
                <div className="stat-content">
                  <span className="stat-value">{stats.preCompleted}</span>
                  <span className="stat-label">PRE Completado</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">💫</div>
                <div className="stat-content">
                  <span className="stat-value">{stats.postCompleted}</span>
                  <span className="stat-label">POST Completado</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="attendance-container-modern">
          <div className="attendance-list-section">
            <div className="list-header">
              <h3 className="section-title">📋 Lista de Asistencia (Últimos 10 inscritos)</h3>
              <div className="search-filter">
                <input
                  type="text"
                  value={emailFilter}
                  onChange={(e) => setEmailFilter(e.target.value)}
                  placeholder="🔍 Filtrar por email o nombre..."
                  className="filter-input"
                />
              </div>
            </div>

            {attendances.length > 0 ? (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID Registro</th>
                      <th>Fecha y Hora Evento</th>
                      <th>Email</th>
                      <th>PRE</th>
                      <th>Asistencia</th>
                      <th>POST</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredAttendances().map(att => {
                      const hasPre = getPreWellnessStatus(att);
                      const canMarkAttendance = !att.attended && hasPre;
                      
                      return (
                        <tr 
                          key={att.id}
                          className={selectedUser?.id === att.id ? 'selected-row' : ''}
                          onClick={() => setSelectedUser(att)}
                        >
                          <td className="id-cell">
                            <code>{att.registration.qrCode.slice(0, 8)}</code>
                          </td>
                          <td className="date-cell">{formatDateTime(att.registration.eventInstance.dateTime)}</td>
                          <td>
                            <div className="user-cell">
                              <strong>{att.registration.user.name}</strong>
                              <small>{att.registration.user.email}</small>
                            </div>
                          </td>
                          <td className="centered">
                            {hasPre
                              ? <span className="status-badge active">✅</span>
                              : <span className="status-badge inactive">⏳</span>}
                          </td>
                          <td className="centered">
                            {att.attended 
                              ? <span className="status-badge active">✅ Sí</span>
                              : <span className="status-badge inactive">⏳ No</span>}
                          </td>
                          <td className="centered">
                            {att.registration.wellnessAssessments.find(w => w.type === 'POST')?.status === 'COMPLETED' 
                              ? <span className="status-badge active">✅</span>
                              : att.attended 
                                ? <span className="status-badge inactive">⏳</span>
                                : <span>—</span>}
                          </td>
                          <td className="centered">
                            {canMarkAttendance ? (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAttendance(att);
                                }}
                                className="mark-btn"
                                disabled={marking}
                              >
                                {marking ? '...' : '✅ Marcar'}
                              </button>
                            ) : att.attended ? (
                              <span className="done-text">✓ Marcado</span>
                            ) : (
                              <span className="no-pre-text">Sin PRE</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                
                {getFilteredAttendances().length === 0 && (
                  <div className="no-results">
                    No se encontraron resultados para "{emailFilter}"
                  </div>
                )}
              </div>
            ) : (
              <div className="no-data">
                No hay registros de asistencia aún
              </div>
            )}
          </div>

          {selectedUser && (
            <div className="user-detail-card">
              <div className="detail-header">
                <h4>📋 Detalle del Participante</h4>
                <button 
                  className="close-btn"
                  onClick={() => setSelectedUser(null)}
                >
                  ✕
                </button>
              </div>
              
              <div className="detail-content">
                <div className="detail-row">
                  <span className="detail-label-text">ID Registro:</span>
                  <span className="detail-value-text">
                    <code style={{background: '#f8f9fa', padding: '0.25rem 0.5rem', borderRadius: '4px'}}>
                      {selectedUser.registration.id}
                    </code>
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label-text">QR Code:</span>
                  <span className="detail-value-text">
                    <code style={{background: '#f8f9fa', padding: '0.25rem 0.5rem', borderRadius: '4px'}}>
                      {selectedUser.registration.qrCode}
                    </code>
                  </span>
                </div>
                <div className="qr-code-section">
                  <h5 style={{margin: '0 0 1rem 0', color: '#2c3e50', fontSize: '1.1rem'}}>🎫 Tu Código QR</h5>
                  <div 
                    ref={qrCodeRef}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '1rem'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      padding: '1rem',
                      background: 'white',
                      borderRadius: '8px',
                      border: '2px solid #dee2e6'
                    }}>
                      <QRCodeSVG 
                        value={selectedUser.registration.qrCode}
                        size={200}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                    <button
                      onClick={downloadQRCode}
                      className="download-qr-btn"
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      📥 Descargar Imagen QR
                    </button>
                  </div>
                </div>
                <div className="detail-row">
                  <span className="detail-label-text">Nombre:</span>
                  <span className="detail-value-text">{selectedUser.registration.user.name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label-text">Email:</span>
                  <span className="detail-value-text">{selectedUser.registration.user.email}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label-text">Evento:</span>
                  <span className="detail-value-text">{selectedUser.registration.event.name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label-text">Fecha del evento:</span>
                  <span className="detail-value-text">{formatDateTime(selectedUser.registration.eventInstance.dateTime)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label-text">Fecha de inscripción:</span>
                  <span className="detail-value-text">{formatDateTime(selectedUser.createdAt)}</span>
                </div>
                
                {getPreWellnessStatus(selectedUser) && (
                  <div className="wellness-detail">
                    <h5>Estado Wellness PRE</h5>
                    {selectedUser.registration.wellnessAssessments
                      .filter(w => w.type === 'PRE')
                      .map(w => (
                        <div key={w.id} className="wellness-grid">
                          <div className="wellness-item">
                            <span>😴 Sueño:</span>
                            <strong>{w.sleepQuality}/10</strong>
                          </div>
                          <div className="wellness-item">
                            <span>😰 Estrés:</span>
                            <strong>{w.stressLevel}/10</strong>
                          </div>
                          <div className="wellness-item">
                            <span>😊 Ánimo:</span>
                            <strong>{w.mood}/10</strong>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        </div>
      </div>

      <style>{`
        .event-info-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          margin-bottom: 1.5rem;
        }
        .event-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #e9ecef;
        }
        .event-header h2 {
          margin: 0;
          color: #2c3e50;
        }
        .btn-back {
          padding: 0.5rem 1rem;
          background: #6c757d;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: background 0.2s;
        }
        .btn-back:hover {
          background: #5a6268;
        }
        .event-details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }
        .detail-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: #f8f9fa;
          border-radius: 8px;
        }
        .detail-icon {
          font-size: 1.5rem;
        }
        .detail-item > div {
          display: flex;
          flex-direction: column;
        }
        .detail-label {
          font-size: 0.75rem;
          color: #6c757d;
          text-transform: uppercase;
          font-weight: 600;
        }
        .detail-value {
          font-size: 1rem;
          color: #2c3e50;
          font-weight: 500;
        }
        .stats-container {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          margin-bottom: 1.5rem;
        }
        .stats-title, .section-title {
          margin: 0 0 1rem 0;
          color: #2c3e50;
          font-size: 1.25rem;
          font-weight: 600;
        }
        .stats-grid-modern {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 1rem;
        }
        .stat-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem;
          border-radius: 10px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
          transition: transform 0.2s;
          background: white;
          color: #2c3e50;
        }
        .stat-card:hover {
          transform: translateY(-2px);
        }
        .stat-icon {
          font-size: 2rem;
          opacity: 0.9;
        }
        .stat-content {
          display: flex;
          flex-direction: column;
        }
        .stat-card .stat-value {
          font-size: 1.75rem;
          font-weight: 700;
          line-height: 1;
        }
        .stat-card .stat-label {
          font-size: 0.8rem;
          margin-top: 0.25rem;
          opacity: 0.9;
          font-weight: 500;
        }
        .stat-percentage {
          font-size: 0.75rem;
          margin-top: 0.25rem;
          opacity: 0.8;
        }
        .attendance-container-modern {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .attendance-list-section {
          width: 100%;
        }
        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .search-filter {
          flex: 1;
          max-width: 400px;
        }
        .filter-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 2px solid #dee2e6;
          border-radius: 8px;
          font-size: 0.95rem;
          transition: border-color 0.2s;
        }
        .filter-input:focus {
          outline: none;
          border-color: #007bff;
        }
        .table-wrapper {
          overflow-x: auto;
          border-radius: 8px;
          border: 1px solid #dee2e6;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
        }
        .data-table thead {
          background: #f8f9fa;
        }
        .data-table th {
          padding: 1rem 0.75rem;
          text-align: left;
          font-weight: 600;
          color: #495057;
          border-bottom: 2px solid #dee2e6;
          font-size: 0.9rem;
          white-space: nowrap;
        }
        .data-table td {
          padding: 1rem 0.75rem;
          border-bottom: 1px solid #dee2e6;
          font-size: 0.9rem;
        }
        .data-table tbody tr {
          cursor: pointer;
          transition: all 0.2s;
        }
        .data-table tbody tr:hover {
          background: #f8f9fa;
        }
        .data-table tbody tr.selected-row {
          background: #e7f3ff;
          border-left: 4px solid #007bff;
        }
        .id-cell {
          font-family: 'Courier New', monospace;
          font-size: 0.8rem;
          color: #495057;
          white-space: nowrap;
        }
        .id-cell code {
          background: #f8f9fa;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
        }
        .date-cell {
          color: #6c757d;
          font-size: 0.85rem;
          white-space: nowrap;
        }
        .user-cell {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .user-cell strong {
          color: #2c3e50;
        }
        .user-cell small {
          color: #6c757d;
          font-size: 0.85rem;
        }
        .centered {
          text-align: center;
        }
        .status-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
          font-size: 0.85rem;
          font-weight: 500;
          white-space: nowrap;
        }
        .status-badge.active {
          background: #d4edda;
          color: #155724;
        }
        .status-badge.inactive {
          background: #fff3cd;
          color: #856404;
        }
        .mark-btn {
          padding: 0.5rem 1rem;
          background: #28a745;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .mark-btn:hover {
          background: #218838;
          transform: scale(1.05);
        }
        .mark-btn:disabled {
          background: #6c757d;
          cursor: not-allowed;
          transform: none;
        }
        .done-text {
          color: #28a745;
          font-weight: 600;
          font-size: 0.85rem;
        }
        .no-pre-text {
          color: #dc3545;
          font-size: 0.85rem;
        }
        .no-results, .no-data {
          padding: 2rem;
          text-align: center;
          color: #6c757d;
          font-style: italic;
        }
        .user-detail-card {
          background: #f8f9fa;
          border: 2px solid #007bff;
          border-radius: 10px;
          padding: 1.5rem;
          margin-top: 1.5rem;
        }
        .detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #dee2e6;
        }
        .detail-header h4 {
          margin: 0;
          color: #2c3e50;
        }
        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #6c757d;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: all 0.2s;
        }
        .close-btn:hover {
          background: #dee2e6;
          color: #2c3e50;
        }
        .detail-content {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .detail-row {
          display: flex;
          gap: 0.5rem;
        }
        .detail-label-text {
          font-weight: 600;
          color: #6c757d;
          min-width: 150px;
        }
        .detail-value-text {
          color: #2c3e50;
        }
        .wellness-detail {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 2px solid #dee2e6;
        }
        .wellness-detail h5 {
          margin: 0 0 0.75rem 0;
          color: #495057;
        }
        .wellness-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
        }
        .wellness-item {
          background: white;
          padding: 0.75rem;
          border-radius: 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }
        .wellness-item span {
          font-size: 0.85rem;
          color: #6c757d;
        }
        .wellness-item strong {
          font-size: 1.25rem;
          color: #007bff;
        }
        .qr-code-section {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 2px solid #dee2e6;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .download-qr-btn:hover {
          background: #0056b3 !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
        }
        .download-qr-btn:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
};

export default AttendanceCheck;

