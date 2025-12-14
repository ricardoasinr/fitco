import React, { useState, useEffect } from 'react';
import { ExerciseType, CreateEventDto, Event } from '../types/event.types';
import { exerciseTypesService } from '../services/exerciseTypes.service';

interface EventFormProps {
  event?: Event | null;
  onSubmit: (data: CreateEventDto) => void;
  onCancel: () => void;
}

/**
 * EventForm - Formulario para crear/editar eventos
 * 
 * Responsabilidades:
 * - Gestionar estado del formulario
 * - Validar datos de entrada
 * - Cargar tipos de ejercicio disponibles
 * - Enviar datos al componente padre
 */
const EventForm: React.FC<EventFormProps> = ({ event, onSubmit, onCancel }) => {
  const [exerciseTypes, setExerciseTypes] = useState<ExerciseType[]>([]);
  const [formData, setFormData] = useState<CreateEventDto>({
    name: '',
    description: '',
    date: '',
    time: '',
    capacity: 1,
    exerciseTypeId: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadExerciseTypes();
    if (event) {
      setFormData({
        name: event.name,
        description: event.description,
        date: event.date.split('T')[0],
        time: event.time,
        capacity: event.capacity,
        exerciseTypeId: event.exerciseTypeId,
      });
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
      await onSubmit(formData);
    } catch (error: any) {
      setError(error.message || 'Error al guardar evento');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity' ? parseInt(value) : value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="event-form">
      <h3>{event ? 'Editar Evento' : 'Crear Nuevo Evento'}</h3>

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

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="date">Fecha *</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

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

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="capacity">Capacidad *</label>
          <input
            type="number"
            id="capacity"
            name="capacity"
            value={formData.capacity}
            onChange={handleChange}
            required
            min="1"
          />
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
            {exerciseTypes.map(type => (
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
          {loading ? 'Guardando...' : event ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </form>
  );
};

export default EventForm;

