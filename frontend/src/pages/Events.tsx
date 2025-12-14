import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Event } from '../types/event.types';
import { eventsService } from '../services/events.service';
import EventCard from '../components/EventCard';
import '../styles/Dashboard.css';

/**
 * Events - Página pública para visualizar eventos disponibles
 * 
 * Responsabilidades:
 * - Mostrar lista de eventos disponibles
 * - Filtrar eventos por tipo (opcional)
 * - Permitir navegación según rol del usuario
 */
const Events: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await eventsService.getAll();
      // Ordenar por fecha
      const sortedEvents = data.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      setEvents(sortedEvents);
      setError('');
    } catch (error: any) {
      setError('Error al cargar eventos');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const uniqueTypes = Array.from(new Set(events.map(e => e.exerciseType.name)));
  const filteredEvents = filterType === 'all' 
    ? events 
    : events.filter(e => e.exerciseType.name === filterType);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="dashboard-logo">
          <h1>📅 Eventos FITCO</h1>
          {isAuthenticated && <span className="role-badge">{user?.role}</span>}
        </div>
        <div className="header-actions">
          {isAuthenticated ? (
            <>
              <button onClick={() => navigate('/dashboard')} className="btn-secondary">
                Dashboard
              </button>
              <button onClick={handleLogout} className="btn-logout">
                Logout
              </button>
            </>
          ) : (
            <button onClick={() => navigate('/')} className="btn-primary">
              Login
            </button>
          )}
        </div>
      </div>

      <div className="dashboard-content">
        <div className="events-header">
          <div className="welcome-card">
            <h2>Eventos Wellness Disponibles</h2>
            <p>Descubre y participa en nuestras sesiones de bienestar</p>
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
                {uniqueTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Cargando eventos...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="empty-state">
            <h3>📭 No hay eventos disponibles</h3>
            <p>{filterType !== 'all' ? 'Intenta con otro filtro' : 'Vuelve pronto para ver nuevos eventos'}</p>
          </div>
        ) : (
          <div className="events-grid">
            {filteredEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}

        {isAuthenticated && user?.role === 'ADMIN' && (
          <div className="admin-actions">
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
  );
};

export default Events;

