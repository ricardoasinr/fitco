import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [events, setEvents] = useState<Event[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<Registration[]>([]);
  const [lastImpact, setLastImpact] = useState<WellnessImpactResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showInstanceSelector, setShowInstanceSelector] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

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
      // Buscar la última inscripción con ambas evaluaciones completadas
      for (const registration of registrations.reverse()) {
        const preAssessment = registration.wellnessAssessments.find(w => w.type === 'PRE' && w.status === 'COMPLETED');
        const postAssessment = registration.wellnessAssessments.find(w => w.type === 'POST' && w.status === 'COMPLETED');
        
        if (preAssessment && postAssessment) {
          const impact = await wellnessService.getImpact(registration.id);
          setLastImpact(impact);
          break;
        }
      }
    } catch (error) {
      console.error('Error loading wellness impact:', error);
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
    if (!lastImpact || !lastImpact.impact.overallImpact) {
      return null;
    }

    const { impact } = lastImpact;
    const overallImpact = impact.overallImpact;

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
              <span className={`metric-value ${impact.stressLevelChange <= 0 ? 'positive' : 'negative'}`}>
                {impact.stressLevelChange > 0 ? '+' : ''}{impact.stressLevelChange.toFixed(1)}
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
