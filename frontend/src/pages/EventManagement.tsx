import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Event, CreateEventDto } from '../types/event.types';
import { eventsService } from '../services/events.service';
import AdminSidebar from '../components/AdminSidebar';
import EventCard from '../components/EventCard';
import EventForm from '../components/EventForm';
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
    try {
      await eventsService.delete(id);
      await loadEvents();
      setShowEventForm(false);
      setEditingEvent(null);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error al eliminar evento');
    }
  };

  const handleStatusChange = async (id: string, isActive: boolean) => {
    try {
      await eventsService.update(id, { isActive });
      await loadEvents();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error al cambiar estado del evento');
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
    <div className="layout-with-sidebar">
      <AdminSidebar onLogout={handleLogout} />
      
      <div className="main-content">
        <div className="dashboard-content-wrapper">
          <div className="welcome-section">
            <h1 className="welcome-title">Gestión de Eventos</h1>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="admin-section-content">
            <div className="admin-section-header">
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
                  onDelete={editingEvent ? handleDeleteEvent : undefined}
                  onStatusChange={editingEvent ? handleStatusChange : undefined}
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
        </div>
      </div>

      <style>{`
        .admin-section-content {
          animation: fadeIn 0.3s;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .admin-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: white;
          border-radius: 10px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
        }
        .admin-section-header h2 {
          margin: 0;
          color: #2c3e50;
          font-size: 1.5rem;
        }
        .form-container {
          background: white;
          border-radius: 10px;
          padding: 1.5rem;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
          margin-bottom: 1.5rem;
        }
        .empty-state {
          text-align: center;
          padding: 3rem;
          background: white;
          border-radius: 10px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
        }
        .empty-state h3 {
          color: #6c757d;
          margin: 0 0 0.5rem 0;
        }
        .empty-state p {
          color: #adb5bd;
        }
      `}</style>
    </div>
  );
};

export default EventManagement;
