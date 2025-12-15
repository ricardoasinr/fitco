import React, { useState, useEffect } from 'react';
import { Event, EventInstance, InstanceAvailability } from '../types/event.types';
import { eventsService } from '../services/events.service';
import { registrationsService } from '../services/registrations.service';

interface InstanceSelectorProps {
  event: Event;
  onSelect: (instanceId: string) => void;
  onCancel: () => void;
  excludeInstanceIds?: string[]; // IDs de instancias en las que ya está inscrito
}

/**
 * InstanceSelector - Componente para seleccionar una instancia de evento
 *
 * Muestra las instancias disponibles de un evento con:
 * - Fecha y hora
 * - Capacidad disponible
 * - Estado (disponible/lleno/ya inscrito)
 */
const InstanceSelector: React.FC<InstanceSelectorProps> = ({
  event,
  onSelect,
  onCancel,
  excludeInstanceIds = [],
}) => {
  const [instances, setInstances] = useState<EventInstance[]>([]);
  const [availabilities, setAvailabilities] = useState<Record<string, InstanceAvailability>>({});
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadInstances();
  }, [event.id, excludeInstanceIds]);

  const loadInstances = async () => {
    try {
      setLoading(true);
      setError('');

      // Obtener instancias disponibles
      const availableInstances = await eventsService.getAvailableInstances(event.id);
      
      // Filtrar las instancias en las que ya está inscrito
      const filteredInstances = availableInstances.filter(
        (instance) => !excludeInstanceIds.includes(instance.id)
      );
      
      setInstances(filteredInstances);

      // Obtener disponibilidad de cada instancia
      const availabilityPromises = filteredInstances.map(async (instance) => {
        try {
          const availability = await registrationsService.getInstanceAvailability(instance.id);
          return { id: instance.id, availability };
        } catch {
          return { id: instance.id, availability: { capacity: instance.capacity, registered: 0, available: instance.capacity } };
        }
      });

      const results = await Promise.all(availabilityPromises);
      const availabilityMap: Record<string, InstanceAvailability> = {};
      results.forEach((result) => {
        availabilityMap[result.id] = result.availability;
      });
      setAvailabilities(availabilityMap);
    } catch (err: any) {
      setError('Error al cargar las fechas disponibles');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedInstance) {
      setError('Selecciona una fecha para continuar');
      return;
    }

    setSubmitting(true);
    try {
      onSelect(selectedInstance);
    } catch (err: any) {
      setError(err.message || 'Error al procesar la selección');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAvailabilityStatus = (instanceId: string) => {
    const availability = availabilities[instanceId];
    if (!availability) return { status: 'loading', text: 'Cargando...' };
    
    if (availability.available === 0) {
      return { status: 'full', text: 'Lleno' };
    }
    if (availability.available <= 3) {
      return { status: 'limited', text: `¡Solo ${availability.available} cupo(s)!` };
    }
    return { status: 'available', text: `${availability.available} cupos` };
  };

  return (
    <div className="instance-selector-overlay">
      <div className="instance-selector-modal">
        <div className="modal-header">
          <h3>Selecciona tu fecha</h3>
          <p className="event-name">{event.name}</p>
          {excludeInstanceIds.length > 0 && (
            <p className="already-registered-hint">
              Ya estás inscrito en {excludeInstanceIds.length} fecha{excludeInstanceIds.length > 1 ? 's' : ''} de este evento
            </p>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="modal-content">
          {loading ? (
            <div className="loading">Cargando fechas disponibles...</div>
          ) : instances.length === 0 ? (
            <div className="no-instances">
              <p>No hay fechas disponibles para este evento.</p>
              <p>
                {excludeInstanceIds.length > 0
                  ? 'Ya estás inscrito en todas las fechas disponibles o no hay más fechas con cupo.'
                  : 'El evento puede haber terminado o estar completamente lleno.'}
              </p>
            </div>
          ) : (
            <div className="instances-list">
              {instances.map((instance) => {
                const { status, text } = getAvailabilityStatus(instance.id);
                const isDisabled = status === 'full';
                const isSelected = selectedInstance === instance.id;

                return (
                  <div
                    key={instance.id}
                    className={`instance-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                    onClick={() => !isDisabled && setSelectedInstance(instance.id)}
                  >
                    <div className="instance-date">
                      <span className="date">{formatDate(instance.dateTime)}</span>
                      <span className="time">{formatTime(instance.dateTime)}</span>
                    </div>
                    <div className={`instance-availability ${status}`}>
                      {text}
                    </div>
                    {isSelected && <div className="selected-check">✓</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
            disabled={submitting}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="btn-primary"
            disabled={!selectedInstance || submitting || loading}
          >
            {submitting ? 'Inscribiendo...' : 'Confirmar inscripción'}
          </button>
        </div>
      </div>

      <style>{`
        .instance-selector-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }
        .instance-selector-modal {
          background: white;
          border-radius: 12px;
          max-width: 500px;
          width: 100%;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        .modal-header {
          padding: 1.5rem;
          border-bottom: 1px solid #eee;
        }
        .modal-header h3 {
          margin: 0 0 0.5rem 0;
          color: #333;
        }
        .event-name {
          margin: 0;
          color: #17a2b8;
          font-weight: 500;
        }
        .already-registered-hint {
          margin: 0.5rem 0 0 0;
          font-size: 0.85rem;
          color: #6c757d;
          font-style: italic;
        }
        .modal-content {
          flex: 1;
          overflow-y: auto;
          padding: 1rem 1.5rem;
        }
        .loading, .no-instances {
          text-align: center;
          padding: 2rem;
          color: #666;
        }
        .instances-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .instance-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }
        .instance-card:hover:not(.disabled) {
          border-color: #17a2b8;
          background: #f8f9fa;
        }
        .instance-card.selected {
          border-color: #17a2b8;
          background: #e8f4f8;
        }
        .instance-card.disabled {
          opacity: 0.6;
          cursor: not-allowed;
          background: #f5f5f5;
        }
        .instance-date {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .instance-date .date {
          font-weight: 500;
          color: #333;
          text-transform: capitalize;
        }
        .instance-date .time {
          color: #666;
          font-size: 0.9rem;
        }
        .instance-availability {
          font-size: 0.85rem;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-weight: 500;
        }
        .instance-availability.available {
          color: #28a745;
          background: #d4edda;
        }
        .instance-availability.limited {
          color: #856404;
          background: #fff3cd;
        }
        .instance-availability.full {
          color: #721c24;
          background: #f8d7da;
        }
        .instance-availability.loading {
          color: #666;
          background: #e9ecef;
        }
        .selected-check {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          width: 24px;
          height: 24px;
          background: #17a2b8;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
          font-weight: bold;
        }
        .modal-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid #eee;
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }
        .modal-footer button {
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-secondary {
          background: #e9ecef;
          border: none;
          color: #495057;
        }
        .btn-secondary:hover:not(:disabled) {
          background: #dee2e6;
        }
        .btn-primary {
          background: #17a2b8;
          border: none;
          color: white;
        }
        .btn-primary:hover:not(:disabled) {
          background: #138496;
        }
        .btn-primary:disabled, .btn-secondary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .error-message {
          background: #f8d7da;
          color: #721c24;
          padding: 0.75rem 1rem;
          margin: 0 1.5rem;
          border-radius: 6px;
        }
      `}</style>
    </div>
  );
};

export default InstanceSelector;
