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
      <div className="dashboard-container">
        <div className="loading">Cargando datos del evento...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="dashboard-logo">
          <h1>✅ Control de Asistencia</h1>
          <span className="role-badge role-admin">ADMIN</span>
        </div>
        <div className="header-actions">
          <button onClick={() => navigate('/admin/events')} className="btn-secondary">
            Gestión Eventos
          </button>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {event && (
          <div className="welcome-card">
            <h2>{event.name}</h2>
            <p>📅 {formatDate(event.date)} | 🕐 {event.time}</p>
            <p>🏋️ {event.exerciseType.name} | 👥 Capacidad: {event.capacity}</p>
          </div>
        )}

        {stats && (
          <div className="stats-card">
            <h3>📊 Estadísticas del Evento</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-value">{stats.total}</span>
                <span className="stat-label">Inscritos</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{stats.attended}</span>
                <span className="stat-label">Asistieron</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{stats.pending}</span>
                <span className="stat-label">Pendientes</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{stats.preCompleted}</span>
                <span className="stat-label">PRE Completado</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{stats.postCompleted}</span>
                <span className="stat-label">POST Completado</span>
              </div>
            </div>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="attendance-container">
          <div className="attendance-search">
            <h3>🔍 Buscar Participante</h3>
            
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
            <div className="form-container">
              <h3>📋 Lista de Asistencia</h3>
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
  );
};

export default AttendanceCheck;

