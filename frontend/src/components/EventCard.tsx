import React from 'react';
import { Event } from '../types/event.types';

interface EventCardProps {
  event: Event;
  isAdmin?: boolean;
  onEdit?: (event: Event) => void;
  onDelete?: (id: string) => void;
}

/**
 * EventCard - Componente para mostrar tarjeta de evento
 * 
 * Responsabilidades:
 * - Mostrar información del evento de forma visual
 * - Mostrar botones de edición/eliminación para admin
 * - Formatear fechas y datos para presentación
 */
const EventCard: React.FC<EventCardProps> = ({ event, isAdmin, onEdit, onDelete }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="event-card">
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
          <span>{event.capacity} cupos</span>
        </div>
      </div>

      {isAdmin && (
        <div className="event-actions">
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
            🗑️ Eliminar
          </button>
        </div>
      )}
    </div>
  );
};

export default EventCard;

