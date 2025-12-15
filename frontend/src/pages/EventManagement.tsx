import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Event, CreateEventDto } from '../types/event.types';
import { eventsService } from '../services/events.service';
import EventCard from '../components/EventCard';
import EventForm from '../components/EventForm';
import ExerciseTypeManager from '../components/ExerciseTypeManager';
import '../styles/Dashboard.css';

/**
 * EventManagement - Página de administración de eventos (ADMIN only)
 *
 * Responsabilidades:
 * - Gestión completa de eventos (CRUD)
 * - Gestión de tipos de ejercicio
 * - Vista administrativa con controles completos
 */
const EventManagement: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [activeTab, setActiveTab] = useState<'events' | 'types'>('events');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await eventsService.getAll();
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

  const handleCreateEvent = async (data: CreateEventDto) => {
    try {
      await eventsService.create(data);
      await loadEvents();
      setShowEventForm(false);
      setEditingEvent(null);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al crear evento');
    }
  };

  const handleUpdateEvent = async (data: CreateEventDto) => {
    if (!editingEvent) return;

    try {
      await eventsService.update(editingEvent.id, data);
      await loadEvents();
      setShowEventForm(false);
      setEditingEvent(null);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al actualizar evento');
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setShowEventForm(true);
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este evento?')) return;

    try {
      await eventsService.delete(id);
      await loadEvents();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error al eliminar evento');
    }
  };

  const handleCancelForm = () => {
    setShowEventForm(false);
    setEditingEvent(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleAttendance = (eventId: string) => {
    navigate(`/admin/attendance/${eventId}`);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="dashboard-logo">
          <h1>👑 Gestión de Eventos</h1>
          <span className="role-badge role-admin">ADMIN</span>
        </div>
        <div className="header-actions">
          <button onClick={() => navigate('/events')} className="btn-secondary">
            Ver Eventos Públicos
          </button>
          <button onClick={() => navigate('/dashboard')} className="btn-secondary">
            Dashboard
          </button>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {error && <div className="error-message">{error}</div>}

        <div className="tabs">
          <button
            className={`tab ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            📅 Eventos
          </button>
          <button
            className={`tab ${activeTab === 'types' ? 'active' : ''}`}
            onClick={() => setActiveTab('types')}
          >
            🏋️ Tipos de Ejercicio
          </button>
        </div>

        {activeTab === 'events' && (
          <div className="tab-content">
            <div className="section-header">
              <h3>Gestión de Eventos</h3>
              <button
                onClick={() => {
                  setEditingEvent(null);
                  setShowEventForm(!showEventForm);
                }}
                className="btn-primary"
              >
                {showEventForm ? 'Cancelar' : '+ Nuevo Evento'}
              </button>
            </div>

            {showEventForm && (
              <div className="form-container">
                <EventForm
                  event={editingEvent}
                  onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent}
                  onCancel={handleCancelForm}
                />
              </div>
            )}

            {loading ? (
              <div className="loading">Cargando eventos...</div>
            ) : events.length === 0 ? (
              <div className="empty-state">
                <h3>📭 No hay eventos registrados</h3>
                <p>Crea tu primer evento para comenzar</p>
              </div>
            ) : (
              <div className="events-grid">
                {events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    isAdmin={true}
                    onEdit={handleEditEvent}
                    onDelete={handleDeleteEvent}
                    onAttendance={handleAttendance}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'types' && (
          <div className="tab-content">
            <ExerciseTypeManager />
          </div>
        )}
      </div>
    </div>
  );
};

export default EventManagement;
