import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminSidebar from '../components/AdminSidebar';
import EventCard from '../components/EventCard';
import EventForm from '../components/EventForm';
import { useEventManagement } from '../hooks/useEventManagement';
import '../styles/Dashboard.css';
import '../styles/EventManagement.css';

/**
 * EventManagement - Página de administración de eventos (ADMIN only)
 *
 * Refactorizada para SOLID y Clean Code:
 * - Lógica de estado y datos extraída a useEventManagement
 * - Estilos extraídos a EventManagement.css
 */
const EventManagement: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const {
    events,
    loading,
    error,
    showEventForm,
    editingEvent,
    handleCreateEvent,
    handleUpdateEvent,
    handleDeleteEvent,
    handleStatusChange,
    openEditForm,
    closeForm,
    toggleForm
  } = useEventManagement();

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
                onClick={toggleForm}
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
                  onCancel={closeForm}
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
                    onEdit={openEditForm}
                    onAttendance={handleAttendance}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventManagement;
