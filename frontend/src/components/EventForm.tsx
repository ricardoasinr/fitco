import React, { useState, useEffect } from 'react';
import {
  ExerciseType,
  CreateEventDto,
  Event,
  RecurrenceType,
  RecurrencePattern,
} from '../types/event.types';
import { exerciseTypesService } from '../services/exerciseTypes.service';

interface EventFormProps {
  event?: Event | null;
  onSubmit: (data: CreateEventDto) => void;
  onCancel: () => void;
}

const WEEKDAYS = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mié' },
  { value: 4, label: 'Jue' },
  { value: 5, label: 'Vie' },
  { value: 6, label: 'Sáb' },
];

/**
 * EventForm - Formulario para crear/editar eventos
 *
 * Responsabilidades:
 * - Gestionar estado del formulario
 * - Validar datos de entrada
 * - Cargar tipos de ejercicio disponibles
 * - Configurar recurrencia de eventos
 * - Enviar datos al componente padre
 */
const EventForm: React.FC<EventFormProps> = ({ event, onSubmit, onCancel }) => {
  const [exerciseTypes, setExerciseTypes] = useState<ExerciseType[]>([]);
  const [formData, setFormData] = useState<CreateEventDto>({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    time: '',
    capacity: 1,
    recurrenceType: 'SINGLE',
    recurrencePattern: undefined,
    exerciseTypeId: '',
  });
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
  const [intervalDays, setIntervalDays] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadExerciseTypes();
    if (event) {
      const recType = event.recurrenceType || 'SINGLE';
      const isRec = recType !== 'SINGLE';

      setFormData({
        name: event.name,
        description: event.description,
        startDate: event.startDate.split('T')[0],
        endDate: event.endDate.split('T')[0],
        time: event.time,
        capacity: event.capacity,
        recurrenceType: recType,
        recurrencePattern: event.recurrencePattern || undefined,
        exerciseTypeId: event.exerciseTypeId,
      });

      setIsRecurring(isRec);
      if (event.recurrencePattern?.weekdays) {
        setSelectedWeekdays(event.recurrencePattern.weekdays);
      }
      if (event.recurrencePattern?.intervalDays) {
        setIntervalDays(event.recurrencePattern.intervalDays);
      }
    }
  }, [event]);

  const loadExerciseTypes = async () => {
    try {
      const types = await exerciseTypesService.getAll();
      setExerciseTypes(types);
    } catch (error: any) {
      setError('Error al cargar tipos de ejercicio');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Preparar datos de recurrencia
      let recurrenceType: RecurrenceType = 'SINGLE';
      let recurrencePattern: RecurrencePattern | undefined = undefined;

      if (isRecurring) {
        recurrenceType = formData.recurrenceType || 'WEEKLY';
        if (recurrenceType === 'WEEKLY') {
          if (selectedWeekdays.length === 0) {
            throw new Error('Selecciona al menos un día de la semana');
          }
          recurrencePattern = { weekdays: selectedWeekdays };
        } else if (recurrenceType === 'INTERVAL') {
          if (intervalDays < 1) {
            throw new Error('El intervalo debe ser al menos 1 día');
          }
          recurrencePattern = { intervalDays };
        }
      }

      // Si es evento único, startDate y endDate son iguales
      const submitData: CreateEventDto = {
        ...formData,
        endDate: isRecurring ? formData.endDate : formData.startDate,
        recurrenceType,
        recurrencePattern,
      };

      await onSubmit(submitData);
    } catch (error: any) {
      setError(error.message || 'Error al guardar evento');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'capacity' ? parseInt(value) || 1 : value,
    }));
  };

  const handleRecurrenceToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const recurring = e.target.checked;
    setIsRecurring(recurring);
    if (!recurring) {
      setFormData((prev) => ({
        ...prev,
        recurrenceType: 'SINGLE',
        recurrencePattern: undefined,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        recurrenceType: 'WEEKLY',
      }));
    }
  };

  const handleWeekdayToggle = (day: number) => {
    setSelectedWeekdays((prev) => {
      if (prev.includes(day)) {
        return prev.filter((d) => d !== day);
      }
      return [...prev, day].sort((a, b) => a - b);
    });
  };

  const isEditing = !!event;

  return (
    <form onSubmit={handleSubmit} className="event-form">
      <h3>{isEditing ? 'Editar Evento' : 'Crear Nuevo Evento'}</h3>

      {error && <div className="error-message">{error}</div>}

      <div className="form-group">
        <label htmlFor="name">Nombre del Evento *</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="Ej: Sesión de Yoga Matutina"
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Descripción *</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          rows={3}
          placeholder="Describe el evento..."
        />
      </div>

      {/* Toggle Recurrencia - Solo al crear */}
      {!isEditing && (
        <div className="form-group recurrence-toggle">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={handleRecurrenceToggle}
            />
            <span>Evento recurrente</span>
          </label>
          <small className="form-hint">
            Los eventos recurrentes generan múltiples fechas automáticamente
          </small>
        </div>
      )}

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="startDate">
            {isRecurring ? 'Fecha de Inicio *' : 'Fecha *'}
          </label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            required
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        {isRecurring && (
          <div className="form-group">
            <label htmlFor="endDate">Fecha de Fin *</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              required
              min={formData.startDate || new Date().toISOString().split('T')[0]}
            />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="time">Hora *</label>
          <input
            type="time"
            id="time"
            name="time"
            value={formData.time}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      {/* Configuración de Recurrencia */}
      {isRecurring && !isEditing && (
        <div className="recurrence-config">
          <div className="form-group">
            <label>Tipo de Recurrencia *</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="recurrenceType"
                  value="WEEKLY"
                  checked={formData.recurrenceType === 'WEEKLY'}
                  onChange={handleChange}
                />
                <span>Por días de la semana</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="recurrenceType"
                  value="INTERVAL"
                  checked={formData.recurrenceType === 'INTERVAL'}
                  onChange={handleChange}
                />
                <span>Por intervalo de días</span>
              </label>
            </div>
          </div>

          {formData.recurrenceType === 'WEEKLY' && (
            <div className="form-group">
              <label>Días de la semana *</label>
              <div className="weekday-selector">
                {WEEKDAYS.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    className={`weekday-btn ${selectedWeekdays.includes(day.value) ? 'active' : ''}`}
                    onClick={() => handleWeekdayToggle(day.value)}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
              <small className="form-hint">
                Selecciona los días en que se repetirá el evento
              </small>
            </div>
          )}

          {formData.recurrenceType === 'INTERVAL' && (
            <div className="form-group">
              <label htmlFor="intervalDays">Repetir cada (días) *</label>
              <input
                type="number"
                id="intervalDays"
                value={intervalDays}
                onChange={(e) => setIntervalDays(parseInt(e.target.value) || 1)}
                min="1"
                max="365"
                style={{ width: '100px' }}
              />
              <small className="form-hint">
                El evento se repetirá cada {intervalDays} día(s)
              </small>
            </div>
          )}
        </div>
      )}

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="capacity">Capacidad por sesión *</label>
          <input
            type="number"
            id="capacity"
            name="capacity"
            value={formData.capacity}
            onChange={handleChange}
            required
            min="1"
          />
          <small className="form-hint">
            Número máximo de participantes por fecha
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="exerciseTypeId">Tipo de Ejercicio *</label>
          <select
            id="exerciseTypeId"
            name="exerciseTypeId"
            value={formData.exerciseTypeId}
            onChange={handleChange}
            required
          >
            <option value="">Seleccionar...</option>
            {exerciseTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
        </button>
      </div>

      <style>{`
        .recurrence-toggle {
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 8px;
          margin: 1rem 0;
        }
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          font-weight: 500;
        }
        .checkbox-label input {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }
        .form-hint {
          display: block;
          color: #6c757d;
          font-size: 0.85rem;
          margin-top: 0.25rem;
        }
        .recurrence-config {
          background: #e8f4f8;
          padding: 1rem;
          border-radius: 8px;
          margin: 1rem 0;
          border-left: 4px solid #17a2b8;
        }
        .radio-group {
          display: flex;
          gap: 1.5rem;
          margin-top: 0.5rem;
        }
        .radio-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }
        .radio-label input {
          width: 16px;
          height: 16px;
          cursor: pointer;
        }
        .weekday-selector {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-top: 0.5rem;
        }
        .weekday-btn {
          padding: 0.5rem 0.75rem;
          border: 2px solid #dee2e6;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }
        .weekday-btn:hover {
          border-color: #17a2b8;
        }
        .weekday-btn.active {
          background: #17a2b8;
          border-color: #17a2b8;
          color: white;
        }
      `}</style>
    </form>
  );
};

export default EventForm;
