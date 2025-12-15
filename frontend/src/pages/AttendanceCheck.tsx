import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [attendances, setAttendances] = useState<AttendanceWithRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Search state
  const [searchType, setSearchType] = useState<'qr' | 'email'>('email');
  const [qrCode, setQrCode] = useState('');
  const [email, setEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundUser, setFoundUser] = useState<AttendanceWithRegistration | null>(null);

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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFoundUser(null);
    
    try {
      setSearching(true);
      
      let result: AttendanceWithRegistration;
      
      if (searchType === 'qr') {
        if (!qrCode.trim()) {
          setError('Ingresa el código QR');
          return;
        }
        result = await attendanceService.getByQrCode(qrCode.trim());
      } else {
        if (!email.trim()) {
          setError('Ingresa el email del usuario');
          return;
        }
        result = await attendanceService.mark({ email: email.trim(), eventId });
        // Si llega aquí es porque ya se marcó la asistencia directamente
        setSuccess(`✅ Asistencia marcada para ${email}`);
        setEmail('');
        await loadEventData();
        return;
      }
      
      // Verificar que la inscripción sea para este evento
      if (result.registration.eventId !== eventId) {
        setError('Este código QR no corresponde a este evento');
        return;
      }
      
      setFoundUser(result);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Usuario no encontrado');
    } finally {
      setSearching(false);
    }
  };

  const handleMarkAttendance = async () => {
    if (!foundUser) return;
    
    try {
      setSearching(true);
      await attendanceService.mark({ qrCode: foundUser.registration.qrCode });
      setSuccess(`✅ Asistencia marcada para ${foundUser.registration.user.name}`);
      setFoundUser(null);
      setQrCode('');
      setEmail('');
      await loadEventData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al marcar asistencia');
    } finally {
      setSearching(false);
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

  const getPreWellnessStatus = (attendance: AttendanceWithRegistration) => {
    const pre = attendance.registration.wellnessAssessments.find(w => w.type === 'PRE');
    return pre?.status === 'COMPLETED';
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
              <div className="stat-card info">
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
          <div className="search-section">
            <h3 className="section-title">🔍 Buscar Participante</h3>
            
            <div className="search-tabs">
              <button 
                className={`search-tab ${searchType === 'email' ? 'active' : ''}`}
                onClick={() => { setSearchType('email'); setFoundUser(null); }}
              >
                📧 Por Email
              </button>
              <button 
                className={`search-tab ${searchType === 'qr' ? 'active' : ''}`}
                onClick={() => { setSearchType('qr'); setFoundUser(null); }}
              >
                📱 Por QR Code
              </button>
            </div>

            <form onSubmit={handleSearch} className="search-form">
              {searchType === 'qr' ? (
                <div className="search-input-group">
                  <label>Código QR</label>
                  <input
                    type="text"
                    value={qrCode}
                    onChange={(e) => setQrCode(e.target.value)}
                    placeholder="Pega o escanea el código QR"
                    autoFocus
                  />
                </div>
              ) : (
                <div className="search-input-group">
                  <label>Email del Participante</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@email.com"
                    autoFocus
                  />
                </div>
              )}
              <button type="submit" className="btn-primary" disabled={searching}>
                {searching ? 'Buscando...' : searchType === 'qr' ? '🔍 Buscar' : '✅ Marcar Asistencia'}
              </button>
            </form>
          </div>

          {foundUser && (
            <div className="user-found-card">
              <div className="user-info-header">
                <div className="user-details">
                  <h3>{foundUser.registration.user.name}</h3>
                  <p>📧 {foundUser.registration.user.email}</p>
                </div>
                <span className={`attendance-badge ${foundUser.attended ? 'attended' : 'not-attended'}`}>
                  {foundUser.attended ? '✅ Ya asistió' : '⏳ Pendiente'}
                </span>
              </div>

              <div className="wellness-pre-status">
                <h4>Estado Wellness PRE</h4>
                {getPreWellnessStatus(foundUser) ? (
                  <div className="wellness-metrics">
                    {foundUser.registration.wellnessAssessments
                      .filter(w => w.type === 'PRE')
                      .map(w => (
                        <React.Fragment key={w.id}>
                          <div className="wellness-metric">
                            <span>😴 Sueño</span>
                            <strong>{w.sleepQuality}</strong>
                          </div>
                          <div className="wellness-metric">
                            <span>😰 Estrés</span>
                            <strong>{w.stressLevel}</strong>
                          </div>
                          <div className="wellness-metric">
                            <span>😊 Ánimo</span>
                            <strong>{w.mood}</strong>
                          </div>
                        </React.Fragment>
                      ))}
                  </div>
                ) : (
                  <p className="error-message">
                    ⚠️ El usuario no ha completado la evaluación PRE. 
                    No se puede marcar asistencia hasta que la complete.
                  </p>
                )}
              </div>

              {!foundUser.attended && getPreWellnessStatus(foundUser) && (
                <button 
                  onClick={handleMarkAttendance}
                  className="mark-attendance-btn"
                  disabled={searching}
                >
                  {searching ? 'Marcando...' : '✅ Marcar Asistencia'}
                </button>
              )}
            </div>
          )}

          {attendances.length > 0 && (
            <div className="attendance-list-section">
              <h3 className="section-title">📋 Lista de Asistencia</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>PRE</th>
                    <th>Asistencia</th>
                    <th>POST</th>
                  </tr>
                </thead>
                <tbody>
                  {attendances.map(att => (
                    <tr key={att.id}>
                      <td>{att.registration.user.name}</td>
                      <td>{att.registration.user.email}</td>
                      <td>
                        {att.registration.wellnessAssessments.find(w => w.type === 'PRE')?.status === 'COMPLETED' 
                          ? <span className="status-badge active">✅</span>
                          : <span className="status-badge inactive">⏳</span>}
                      </td>
                      <td>
                        {att.attended 
                          ? <span className="status-badge active">✅ Asistió</span>
                          : <span className="status-badge inactive">⏳ Pendiente</span>}
                      </td>
                      <td>
                        {att.registration.wellnessAssessments.find(w => w.type === 'POST')?.status === 'COMPLETED' 
                          ? <span className="status-badge active">✅</span>
                          : att.attended 
                            ? <span className="status-badge inactive">⏳</span>
                            : <span>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
        .search-section {
          margin-bottom: 2rem;
        }
        .search-tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .search-tab {
          flex: 1;
          padding: 0.75rem 1rem;
          background: #f8f9fa;
          border: 2px solid transparent;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }
        .search-tab.active {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }
        .search-form {
          display: flex;
          gap: 1rem;
          align-items: end;
        }
        .search-input-group {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .search-input-group label {
          font-weight: 500;
          color: #495057;
        }
        .search-input-group input {
          padding: 0.75rem;
          border: 2px solid #dee2e6;
          border-radius: 8px;
          font-size: 1rem;
        }
        .search-input-group input:focus {
          outline: none;
          border-color: #007bff;
        }
        .user-found-card {
          background: #f8f9fa;
          border: 2px solid #007bff;
          border-radius: 10px;
          padding: 1.5rem;
          margin-top: 1.5rem;
        }
        .user-info-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 1rem;
        }
        .user-details h3 {
          margin: 0 0 0.25rem 0;
          color: #2c3e50;
        }
        .user-details p {
          margin: 0;
          color: #6c757d;
        }
        .attendance-badge {
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.9rem;
        }
        .attendance-badge.attended {
          background: #d4edda;
          color: #155724;
        }
        .attendance-badge.not-attended {
          background: #fff3cd;
          color: #856404;
        }
        .wellness-pre-status {
          background: white;
          padding: 1rem;
          border-radius: 8px;
          margin: 1rem 0;
        }
        .wellness-pre-status h4 {
          margin: 0 0 0.75rem 0;
          color: #495057;
        }
        .wellness-metrics {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }
        .wellness-metric {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.75rem;
          background: #e9ecef;
          border-radius: 6px;
        }
        .wellness-metric span {
          font-size: 0.9rem;
          color: #495057;
        }
        .wellness-metric strong {
          font-size: 1.5rem;
          color: #007bff;
          margin-top: 0.25rem;
        }
        .mark-attendance-btn {
          width: 100%;
          padding: 1rem;
          background: #28a745;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .mark-attendance-btn:hover {
          background: #218838;
        }
        .mark-attendance-btn:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }
        .attendance-list-section {
          margin-top: 2rem;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1rem;
        }
        .data-table thead {
          background: #f8f9fa;
        }
        .data-table th {
          padding: 0.75rem;
          text-align: left;
          font-weight: 600;
          color: #495057;
          border-bottom: 2px solid #dee2e6;
        }
        .data-table td {
          padding: 0.75rem;
          border-bottom: 1px solid #dee2e6;
        }
        .data-table tbody tr:hover {
          background: #f8f9fa;
        }
        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
          font-size: 0.85rem;
          font-weight: 500;
        }
        .status-badge.active {
          background: #d4edda;
          color: #155724;
        }
        .status-badge.inactive {
          background: #fff3cd;
          color: #856404;
        }
      `}</style>
    </div>
  );
};

export default AttendanceCheck;

