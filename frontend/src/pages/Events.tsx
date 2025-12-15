import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Event, Registration } from '../types/event.types';
import { eventsService } from '../services/events.service';
import { registrationsService } from '../services/registrations.service';
import EventCard from '../components/EventCard';
import InstanceSelector from '../components/InstanceSelector';
import Sidebar from '../components/Sidebar';
import '../styles/Dashboard.css';
import '../styles/Sidebar.css';

/**
 * Events - Página pública para visualizar eventos disponibles
 *
 * Responsabilidades:
 * - Mostrar lista de eventos disponibles
 * - Filtrar eventos por tipo (opcional)
 * - Permitir inscripción a eventos con selección de instancia
 * - Permitir múltiples inscripciones al mismo evento (diferentes instancias)
 * - Permitir navegación según rol del usuario
 */
const Events: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  
  // Estado para el selector de instancias
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showInstanceSelector, setShowInstanceSelector] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'USER') {
      loadMyRegistrations();
    }
  }, [isAuthenticated, user]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await eventsService.getAll();
      // Ordenar por fecha de inicio
      const sortedEvents = data.sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
      );
      setEvents(sortedEvents);
      setError('');
    } catch (error: any) {
      setError('Error al cargar eventos');
    } finally {
      setLoading(false);
    }
  };

  const loadMyRegistrations = async () => {
    try {
      const data = await registrationsService.getMyRegistrations();
      setMyRegistrations(data);
    } catch (error) {
      // Silently fail - user might not have registrations
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Cuando el usuario hace clic en inscribirse, mostramos el selector de instancias
  const handleRegisterClick = (event: Event) => {
    setSelectedEvent(event);
    setShowInstanceSelector(true);
    setError('');
    setSuccess('');
  };

  // Cuando el usuario selecciona una instancia
  const handleInstanceSelect = async (instanceId: string) => {
    if (!selectedEvent) return;

    try {
      setError('');
      await registrationsService.register(selectedEvent.id, instanceId);
      setSuccess('✅ ¡Inscripción exitosa! Ahora completa tu evaluación PRE-evento.');
      setShowInstanceSelector(false);
      setSelectedEvent(null);
      await Promise.all([loadEvents(), loadMyRegistrations()]);
      // Redirigir a mis inscripciones después de 2 segundos
      setTimeout(() => navigate('/my-registrations'), 2000);
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

  // Verificar si el usuario está inscrito en alguna instancia de este evento
  const getRegisteredInstances = (eventId: string): string[] => {
    return myRegistrations
      .filter((reg) => reg.eventId === eventId)
      .map((reg) => reg.eventInstanceId);
  };

  const uniqueTypes = Array.from(new Set(events.map((e) => e.exerciseType.name)));
  
  // Filtrar eventos: para usuarios no admin, solo mostrar activos
  const visibleEvents = user?.role === 'ADMIN' 
    ? events 
    : events.filter((e) => e.isActive);
  
  const filteredEvents =
    filterType === 'all'
      ? visibleEvents
      : visibleEvents.filter((e) => e.exerciseType.name === filterType);

  // Si el usuario está autenticado, mostrar con sidebar
  if (isAuthenticated) {
    return (
      <div className="layout-with-sidebar">
        <Sidebar onLogout={handleLogout} />
        
        <div className="main-content">
          <div className="dashboard-content-wrapper">
            <div className="welcome-section">
              <h1 className="welcome-title">📅 Eventos Wellness Disponibles</h1>
              <p style={{ color: '#666', marginTop: '15px', fontSize: '16px' }}>
                Descubre y participa en nuestras sesiones de bienestar
              </p>
            </div>

            {uniqueTypes.length > 0 && (
              <div className="filter-card">
                <label style={{ fontWeight: 600, color: '#333', marginRight: '15px' }}>Filtrar por tipo:</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">Todos</option>
                  {uniqueTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            {loading ? (
              <div className="loading-card">
                <div className="loading">Cargando eventos...</div>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="empty-state-card">
                <h3>📭 No hay eventos disponibles</h3>
                <p>
                  {filterType !== 'all'
                    ? 'Intenta con otro filtro'
                    : 'Vuelve pronto para ver nuevos eventos'}
                </p>
              </div>
            ) : (
              <div className="events-section">
                <div className="events-grid">
                  {filteredEvents.map((event) => {
                    const registeredInstances = getRegisteredInstances(event.id);
                    return (
                      <EventCard
                        key={event.id}
                        event={event}
                        isAdmin={user?.role === 'ADMIN'}
                        isAuthenticated={isAuthenticated}
                        isRegistered={registeredInstances.length > 0}
                        registeredInstancesCount={registeredInstances.length}
                        onRegister={handleRegisterClick}
                        onAttendance={handleAttendance}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {user?.role === 'ADMIN' && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                <button
                  onClick={() => navigate('/admin/events')}
                  className="btn-primary btn-large"
                >
                  👑 Gestionar Eventos
                </button>
              </div>
            )}
          </div>
        </div>

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
  }

  // Si NO está autenticado, mostrar la vista pública sin sidebar
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="dashboard-logo">
          <h1>📅 Eventos FITCO</h1>
        </div>
        <div className="header-actions">
          <button onClick={() => navigate('/')} className="btn-primary">
            Login
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="events-header">
          <div className="welcome-card">
            <h2>Eventos Wellness Disponibles</h2>
            <p>Descubre y participa en nuestras sesiones de bienestar</p>
            <p className="login-hint">
              💡 <strong>Inicia sesión</strong> para inscribirte a los eventos
            </p>
          </div>

          {uniqueTypes.length > 0 && (
            <div className="filter-section">
              <label>Filtrar por tipo:</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="filter-select"
              >
                <option value="all">Todos</option>
                {uniqueTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {loading ? (
          <div className="loading">Cargando eventos...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="empty-state">
            <h3>📭 No hay eventos disponibles</h3>
            <p>
              {filterType !== 'all'
                ? 'Intenta con otro filtro'
                : 'Vuelve pronto para ver nuevos eventos'}
            </p>
          </div>
        ) : (
          <div className="events-grid">
            {filteredEvents.map((event) => {
              const registeredInstances = getRegisteredInstances(event.id);
              return (
                <EventCard
                  key={event.id}
                  event={event}
                  isAdmin={false}
                  isAuthenticated={false}
                  isRegistered={false}
                  registeredInstancesCount={0}
                  onRegister={handleRegisterClick}
                  onAttendance={handleAttendance}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;
