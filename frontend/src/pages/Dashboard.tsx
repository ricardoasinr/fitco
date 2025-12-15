import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Event, Registration, WellnessImpactResponse } from '../types/event.types';
import { eventsService } from '../services/events.service';
import { registrationsService } from '../services/registrations.service';
import { wellnessService } from '../services/wellness.service';
import Sidebar from '../components/Sidebar';
import EventCard from '../components/EventCard';
import InstanceSelector from '../components/InstanceSelector';
import '../styles/Dashboard.css';
import '../styles/Sidebar.css';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [events, setEvents] = useState<Event[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<Registration[]>([]);
  const [lastImpact, setLastImpact] = useState<WellnessImpactResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showInstanceSelector, setShowInstanceSelector] = useState(false);

  useEffect(() => {
    // Recargar datos cuando el componente se monta o cuando el usuario navega al Dashboard
    // Solo recargar si estamos en la ruta del dashboard
    if (location.pathname === '/dashboard') {
      loadDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Cargar eventos disponibles
      const eventsData = await eventsService.getAll();
      const sortedEvents = eventsData.sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
      );
      setEvents(sortedEvents);

      // Cargar inscripciones del usuario
      if (user?.role === 'USER' || user?.role === 'ADMIN') {
        const registrationsData = await registrationsService.getMyRegistrations();
        setMyRegistrations(registrationsData);

        // Obtener el último impacto de wellness
        if (registrationsData.length > 0) {
          await loadLastWellnessImpact(registrationsData);
        } else {
          // Si no hay inscripciones, limpiar el impacto
          setLastImpact(null);
        }
      }

      setError('');
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      setError('Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadLastWellnessImpact = async (registrations: Registration[]) => {
    try {
      // Ordenar inscripciones por fecha del evento (más reciente primero)
      // Usar createdAt como criterio secundario para desempatar
      const sortedRegistrations = [...registrations].sort((a, b) => {
        const dateA = a.eventInstance?.dateTime 
          ? new Date(a.eventInstance.dateTime).getTime()
          : new Date(a.event.startDate).getTime();
        const dateB = b.eventInstance?.dateTime
          ? new Date(b.eventInstance.dateTime).getTime()
          : new Date(b.event.startDate).getTime();
        
        // Si las fechas son iguales, usar createdAt como desempate
        if (dateB === dateA) {
          const createdA = new Date(a.createdAt || 0).getTime();
          const createdB = new Date(b.createdAt || 0).getTime();
          return createdB - createdA; // Más reciente primero
        }
        
        return dateB - dateA; // Más reciente primero
      });

      // Buscar la última inscripción con ambas evaluaciones completadas
      // Intentar obtener el impacto directamente del backend para cada inscripción
      // en orden de más reciente a más antigua, hasta encontrar una con impacto válido
      let foundImpact = false;
      for (const registration of sortedRegistrations) {
        try {
          // Intentar obtener el impacto directamente del backend
          // Esto asegura que obtenemos datos actualizados y válidos
          const impact = await wellnessService.getImpact(registration.id);
          
          // Solo usar este impacto si tiene datos válidos (ambas evaluaciones completadas)
          if (impact && impact.impact && impact.impact.overallImpact !== null) {
            setLastImpact(impact);
            foundImpact = true;
            break;
          }
        } catch (error) {
          // Si hay un error al obtener el impacto (por ejemplo, evaluaciones incompletas),
          // continuar con la siguiente inscripción
          continue;
        }
      }

      // Si no se encontró ningún impacto, limpiar el estado anterior
      if (!foundImpact) {
        setLastImpact(null);
      }
    } catch (error) {
      console.error('Error loading wellness impact:', error);
      setLastImpact(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleRegisterClick = (event: Event) => {
    setSelectedEvent(event);
    setShowInstanceSelector(true);
    setError('');
    setSuccess('');
  };

  const handleInstanceSelect = async (instanceId: string) => {
    if (!selectedEvent) return;

    try {
      setError('');
      await registrationsService.register(selectedEvent.id, instanceId);
      setSuccess('✅ ¡Inscripción exitosa!');
      setShowInstanceSelector(false);
      setSelectedEvent(null);
      await loadDashboardData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al inscribirse');
      setShowInstanceSelector(false);
    }
  };

  const handleCancelInstanceSelection = () => {
    setShowInstanceSelector(false);
    setSelectedEvent(null);
  };

  const handleAttendance = (eventId: string) => {
    navigate(`/admin/attendance/${eventId}`);
  };

  const getRegisteredInstances = (eventId: string): string[] => {
    return myRegistrations
      .filter((reg) => reg.eventId === eventId)
      .map((reg) => reg.eventInstanceId);
  };

  const renderImpactSummary = () => {
    if (!lastImpact || lastImpact.impact.overallImpact === null) {
      return null;
    }

    const { impact } = lastImpact;
    // TypeScript type guard - aseguramos que overallImpact no es null (ya verificado arriba)
    const overallImpact = impact.overallImpact as number;

    let summaryText = '';
    let summaryClass = '';

    if (overallImpact > 0) {
      summaryText = `¡Excelente! Has mejorado un ${overallImpact.toFixed(1)}% en tu bienestar general 🎉`;
      summaryClass = 'positive';
    } else if (overallImpact < 0) {
      summaryText = `Tu bienestar ha bajado un ${Math.abs(overallImpact).toFixed(1)}%. Sigue trabajando en ello 💪`;
      summaryClass = 'negative';
    } else {
      summaryText = 'Tu bienestar se mantiene estable';
      summaryClass = 'neutral';
    }

    return (
      <div className="wellness-impact-card">
        <h3>📊 Tu Último Impacto Wellness</h3>
        <div className="impact-metrics">
          {impact.sleepQualityChange !== null && (
            <div className="impact-metric">
              <span className="metric-label">Calidad del Sueño</span>
              <span className={`metric-value ${impact.sleepQualityChange >= 0 ? 'positive' : 'negative'}`}>
                {impact.sleepQualityChange > 0 ? '+' : ''}{impact.sleepQualityChange.toFixed(1)}
              </span>
            </div>
          )}
          {impact.stressLevelChange !== null && (
            <div className="impact-metric">
              <span className="metric-label">Nivel de Estrés</span>
              <span className={`metric-value ${impact.stressLevelChange >= 0 ? 'positive' : 'negative'}`}>
                {(-impact.stressLevelChange).toFixed(1)}
              </span>
            </div>
          )}
          {impact.moodChange !== null && (
            <div className="impact-metric">
              <span className="metric-label">Estado de Ánimo</span>
              <span className={`metric-value ${impact.moodChange >= 0 ? 'positive' : 'negative'}`}>
                {impact.moodChange > 0 ? '+' : ''}{impact.moodChange.toFixed(1)}
              </span>
            </div>
          )}
        </div>
        <div className={`impact-summary ${summaryClass}`}>
          <p className="summary-text">{summaryText}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="layout-with-sidebar">
      <Sidebar onLogout={handleLogout} />
      
      <div className="main-content">
        <div className="dashboard-content-wrapper">
          <div className="welcome-section">
            <h1 className="welcome-title">¡Bienvenido, {user?.name}!</h1>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {loading ? (
            <div className="loading-card">
              <div className="loading">Cargando...</div>
            </div>
          ) : (
            <>
              {/* Último Impacto Wellness */}
              {lastImpact && renderImpactSummary()}

              {/* Eventos Disponibles */}
              <div className="events-section">
                <h2 className="section-title">📅 Eventos Disponibles</h2>
                {events.length === 0 ? (
                  <div className="empty-state-card">
                    <h3>📭 No hay eventos disponibles</h3>
                    <p>Vuelve pronto para ver nuevos eventos</p>
                  </div>
                ) : (
                  <div className="events-grid">
                    {events.map((event) => {
                      const registeredInstances = getRegisteredInstances(event.id);
                      return (
                        <EventCard
                          key={event.id}
                          event={event}
                          isAdmin={user?.role === 'ADMIN'}
                          isAuthenticated={true}
                          isRegistered={registeredInstances.length > 0}
                          registeredInstancesCount={registeredInstances.length}
                          onRegister={handleRegisterClick}
                          onAttendance={handleAttendance}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal de selección de instancia */}
      {showInstanceSelector && selectedEvent && (
        <InstanceSelector
          event={selectedEvent}
          onSelect={handleInstanceSelect}
          onCancel={handleCancelInstanceSelection}
          excludeInstanceIds={getRegisteredInstances(selectedEvent.id)}
        />
      )}
    </div>
  );
};

export default Dashboard;
