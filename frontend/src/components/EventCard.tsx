import React from 'react';
import { Event } from '../types/event.types';

interface EventCardProps {
  event: Event;
  isAdmin?: boolean;
  isAuthenticated?: boolean;
  isRegistered?: boolean;
  onEdit?: (event: Event) => void;
  onDelete?: (id: string) => void;
  onRegister?: (eventId: string) => void;
  onAttendance?: (eventId: string) => void;
}

/**
 * EventCard - Componente para mostrar tarjeta de evento
 * 
 * Responsabilidades:
 * - Mostrar información del evento de forma visual
 * - Mostrar botones de edición/eliminación para admin
 * - Mostrar botón de inscripción para usuarios
 * - Mostrar disponibilidad de cupos
 * - Formatear fechas y datos para presentación
 */
const EventCard: React.FC<EventCardProps> = ({ 
  event, 
  isAdmin, 
  isAuthenticated,
  isRegistered,
  onEdit, 
  onDelete,
  onRegister,
  onAttendance,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const registered = event._count?.registrations || 0;
  const available = event.capacity - registered;
  const isEventPast = new Date(event.date) < new Date(new Date().setHours(0, 0, 0, 0));
  const isFull = available <= 0;

  return (
    <div className={`event-card ${isEventPast ? 'past-event' : ''}`}>
      <div className="event-header">
        <h3>{event.name}</h3>
        <span className="event-type-badge">{event.exerciseType.name}</span>
      </div>
      
      <p className="event-description">{event.description}</p>
      
      <div className="event-details">
        <div className="event-detail">
          <span className="detail-icon">📅</span>
          <span>{formatDate(event.date)}</span>
        </div>
        <div className="event-detail">
          <span className="detail-icon">⏰</span>
          <span>{event.time}</span>
        </div>
        <div className="event-detail">
          <span className="detail-icon">👥</span>
          <span>{registered}/{event.capacity} inscritos</span>
        </div>
      </div>

      <div className="availability-bar">
        <div 
          className="availability-fill" 
          style={{ width: `${(registered / event.capacity) * 100}%` }}
        />
      </div>
      <p className={`availability-text ${isFull ? 'full' : available <= 3 ? 'low' : ''}`}>
        {isFull ? '🔴 Sin cupos' : `🟢 ${available} cupos disponibles`}
      </p>

      {isAdmin ? (
        <div className="event-actions">
          <button 
            onClick={() => onAttendance && onAttendance(event.id)} 
            className="btn-edit"
          >
            ✅ Asistencia
          </button>
          <button 
            onClick={() => onEdit && onEdit(event)} 
            className="btn-edit"
          >
            ✏️ Editar
          </button>
          <button 
            onClick={() => onDelete && onDelete(event.id)} 
            className="btn-delete"
          >
            🗑️
          </button>
        </div>
      ) : isAuthenticated && !isEventPast ? (
        <div className="event-actions">
          {isRegistered ? (
            <span className="registered-badge">✅ Ya inscrito</span>
          ) : (
            <button 
              onClick={() => onRegister && onRegister(event.id)} 
              className="btn-register"
              disabled={isFull}
            >
              {isFull ? 'Sin cupos' : '📝 Inscribirme'}
            </button>
          )}
        </div>
      ) : isEventPast ? (
        <div className="event-actions">
          <span className="past-badge">⏰ Evento pasado</span>
        </div>
      ) : null}
    </div>
  );
};

export default EventCard;


