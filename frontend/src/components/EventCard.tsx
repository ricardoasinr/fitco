import React from 'react';
import { Event } from '../types/event.types';

interface EventCardProps {
  event: Event;
  isAdmin?: boolean;
  isAuthenticated?: boolean;
  isRegistered?: boolean;
  registeredInstancesCount?: number;
  onEdit?: (event: Event) => void;
  onDelete?: (id: string) => void;
  onRegister?: (event: Event) => void;
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
 * - Soportar eventos recurrentes con múltiples instancias
 * - Permitir múltiples inscripciones al mismo evento
 */
const EventCard: React.FC<EventCardProps> = ({
  event,
  isAdmin,
  isAuthenticated,
  isRegistered,
  registeredInstancesCount = 0,
  onEdit,
  onDelete,
  onRegister,
  onAttendance,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
  };

  const isRecurring = event.recurrenceType !== 'SINGLE';
  const instanceCount = event._count?.instances || event.instances?.length || 1;
  
  // Para eventos recurrentes, calcular cupos totales disponibles
  const totalRegistrations = event._count?.registrations || 0;
  const totalCapacity = instanceCount * event.capacity;
  
  // Verificar si hay instancias futuras disponibles
  const futureInstances = event.instances?.filter(
    (i) => new Date(i.dateTime) > new Date() && i.isActive
  ) || [];
  const hasFutureInstances = futureInstances.length > 0;
  
  // Para eventos únicos, usar la fecha de inicio
  const isEventPast = !hasFutureInstances && new Date(event.endDate) < new Date();
  
  // Verificar si todas las instancias están llenas
  const availableInstancesCount = futureInstances.filter((i) => {
    const registered = i._count?.registrations || 0;
    return registered < i.capacity;
  }).length;
  const isFull = availableInstancesCount === 0 && futureInstances.length > 0;

  const getRecurrenceText = () => {
    if (!isRecurring) return null;
    
    if (event.recurrenceType === 'WEEKLY' && event.recurrencePattern?.weekdays) {
      const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const selectedDays = event.recurrencePattern.weekdays
        .sort((a, b) => a - b)
        .map((d) => days[d])
        .join(', ');
      return `Cada ${selectedDays}`;
    }
    
    if (event.recurrenceType === 'INTERVAL' && event.recurrencePattern?.intervalDays) {
      return `Cada ${event.recurrencePattern.intervalDays} día(s)`;
    }
    
    return 'Recurrente';
  };

  return (
    <div className={`event-card ${isEventPast ? 'past-event' : ''}`}>
      <div className="event-header">
        <h3>{event.name}</h3>
        <div className="event-badges">
          <span className="event-type-badge">{event.exerciseType.name}</span>
          {isRecurring && (
            <span className="recurrence-badge">🔄 {instanceCount} fechas</span>
          )}
        </div>
      </div>

      <p className="event-description">{event.description}</p>

      <div className="event-details">
        <div className="event-detail">
          <span className="detail-icon">📅</span>
          <span>
            {isRecurring
              ? `${formatDate(event.startDate)} - ${formatDate(event.endDate)}`
              : formatDate(event.startDate)}
          </span>
        </div>
        <div className="event-detail">
          <span className="detail-icon">⏰</span>
          <span>
            {isRecurring && event.instances && event.instances.length > 0
              ? 'Múltiples horarios'
              : event.time}
          </span>
        </div>
        {isRecurring && (
          <div className="event-detail">
            <span className="detail-icon">🔄</span>
            <span>{getRecurrenceText()}</span>
          </div>
        )}
        <div className="event-detail">
          <span className="detail-icon">👥</span>
          <span>
            {isRecurring
              ? `${event.capacity} cupos por sesión`
              : `${totalRegistrations}/${event.capacity} inscritos`}
          </span>
        </div>
      </div>

      {!isRecurring && (
        <>
          <div className="availability-bar">
            <div
              className="availability-fill"
              style={{ width: `${(totalRegistrations / event.capacity) * 100}%` }}
            />
          </div>
          <p className={`availability-text ${isFull ? 'full' : totalCapacity - totalRegistrations <= 3 ? 'low' : ''}`}>
            {isFull ? '🔴 Sin cupos' : `🟢 ${event.capacity - totalRegistrations} cupos disponibles`}
          </p>
        </>
      )}

      {isRecurring && (
        <p className={`availability-text ${!hasFutureInstances ? 'full' : isFull ? 'full' : ''}`}>
          {!hasFutureInstances
            ? '⏰ Sin fechas disponibles'
            : isFull
              ? '🔴 Todas las fechas llenas'
              : `🟢 ${availableInstancesCount} fecha(s) con cupo`}
        </p>
      )}

      {isAdmin ? (
        <div className="event-actions">
          <button
            onClick={() => onAttendance && onAttendance(event.id)}
            className="btn-edit"
          >
            ✅ Asistencia
          </button>
          <button onClick={() => onEdit && onEdit(event)} className="btn-edit">
            ✏️ Editar
          </button>
        </div>
      ) : isAuthenticated && !isEventPast ? (
        <div className="event-actions">
          {isRegistered && registeredInstancesCount > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
              <span className="registered-badge">
                ✅ Inscrito en {registeredInstancesCount} fecha{registeredInstancesCount > 1 ? 's' : ''}
              </span>
              <button
                onClick={() => onRegister && onRegister(event)}
                className="btn-register"
                disabled={isFull || !hasFutureInstances}
              >
                {isFull || !hasFutureInstances ? 'Sin cupos' : '📝 Inscribirse a otra fecha'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => onRegister && onRegister(event)}
              className="btn-register"
              disabled={isFull || !hasFutureInstances}
            >
              {isFull || !hasFutureInstances ? 'Sin cupos' : '📝 Inscribirme'}
            </button>
          )}
        </div>
      ) : isEventPast ? (
        <div className="event-actions">
          <span className="past-badge">⏰ Evento pasado</span>
        </div>
      ) : null}

      <style>{`
        .event-badges {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .recurrence-badge {
          background: #e8f4f8;
          color: #17a2b8;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

export default EventCard;
