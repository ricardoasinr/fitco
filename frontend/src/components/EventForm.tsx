import React, { useState, useEffect } from 'react';
import {
  ExerciseType,
  CreateEventDto,
  UpdateEventDto,
  Event,
  RecurrenceType,
  RecurrencePattern,
  RecurrenceSchedule,
} from '../types/event.types';
import { exerciseTypesService } from '../services/exerciseTypes.service';

interface EventFormProps {
  event?: Event | null;
  onSubmit: (data: CreateEventDto | UpdateEventDto) => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, isActive: boolean) => void;
}

interface ScheduleItem {
  id: string;
  time: string;
  weekdays: number[];
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

// Generar ID único para schedules
const generateScheduleId = () => `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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
const EventForm: React.FC<EventFormProps> = ({ event, onSubmit, onCancel, onDelete, onStatusChange }) => {
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
  const [schedules, setSchedules] = useState<ScheduleItem[]>([
    { id: generateScheduleId(), time: '', weekdays: [] }
  ]);
  const [intervalDays, setIntervalDays] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showScheduleEdit, setShowScheduleEdit] = useState(false); // Para mostrar sección de edición de horarios
  const [scheduleChanged, setScheduleChanged] = useState(false); // Track si hubo cambios en horarios
  const [isActive, setIsActive] = useState(true); // Estado local para isActive

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
      setIsActive(event.isActive); // Actualizar estado local
      
      // Cargar schedules del evento existente (si los hay)
      // Por ahora, crear un schedule con el time y weekdays existentes
      if (event.time) {
        setSchedules([{
          id: generateScheduleId(),
          time: event.time,
          weekdays: event.recurrencePattern?.weekdays || []
        }]);
      }
      
      if (event.recurrencePattern?.intervalDays) {
        setIntervalDays(event.recurrencePattern.intervalDays);
      }
    } else {
      // Resetear estado cuando no hay evento (modo creación)
      setIsActive(true);
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
      const isEditing = !!event;

      // Para edición, si no se están modificando horarios, solo enviar nombre, descripción y estado
      if (isEditing && !showScheduleEdit) {
        const updateData: UpdateEventDto = {
          name: formData.name,
          description: formData.description,
          isActive: isActive,
        };
        await onSubmit(updateData);
        return;
      }

      // Preparar datos de recurrencia
      let recurrenceType: RecurrenceType = 'SINGLE';
      let recurrencePattern: RecurrencePattern | undefined = undefined;
      let schedulesData: RecurrenceSchedule[] | undefined = undefined;

      if (isRecurring) {
        recurrenceType = formData.recurrenceType || 'WEEKLY';
        
        if (recurrenceType === 'WEEKLY') {
          // Validar que cada schedule tenga hora y al menos un día
          for (let i = 0; i < schedules.length; i++) {
            const schedule = schedules[i];
            if (!schedule.time) {
              throw new Error(`La recurrencia ${i + 1} necesita una hora`);
            }
            if (schedule.weekdays.length === 0) {
              throw new Error(`La recurrencia ${i + 1} necesita al menos un día de la semana`);
            }
          }
          
          // Convertir schedules al formato del DTO
          schedulesData = schedules.map(s => ({
            time: s.time,
            weekdays: s.weekdays
          }));
          
        } else if (recurrenceType === 'INTERVAL') {
          if (intervalDays < 1) {
            throw new Error('El intervalo debe ser al menos 1 día');
          }
          if (!schedules[0]?.time) {
            throw new Error('Debes especificar una hora');
          }
          recurrencePattern = { intervalDays };
          // Para INTERVAL, usamos el time del primer schedule
          schedulesData = [{ time: schedules[0].time }];
        }
      } else {
        // Evento único - usar el time del primer schedule
        if (!schedules[0]?.time) {
          throw new Error('Debes especificar una hora');
        }
      }

      if (isEditing) {
        // Para edición con cambios de horarios
        const updateData: UpdateEventDto = {
          name: formData.name,
          description: formData.description,
          startDate: formData.startDate,
          endDate: isRecurring ? formData.endDate : formData.startDate,
          time: schedules[0]?.time || formData.time,
          capacity: formData.capacity,
          recurrenceType,
          recurrencePattern,
          schedules: schedulesData,
          exerciseTypeId: formData.exerciseTypeId,
          isActive: isActive,
          regenerateInstances: scheduleChanged, // Solo regenerar si hubo cambios
        };
        await onSubmit(updateData);
      } else {
        // Para creación
        const createData: CreateEventDto = {
          ...formData,
          time: schedules[0]?.time || formData.time,
          endDate: isRecurring ? formData.endDate : formData.startDate,
          recurrenceType,
          recurrencePattern,
          schedules: schedulesData,
        };
        await onSubmit(createData);
      }
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
    setScheduleChanged(true); // Marcar que hubo cambio
    if (!recurring) {
      setFormData((prev) => ({
        ...prev,
        recurrenceType: 'SINGLE',
        recurrencePattern: undefined,
      }));
      // Mantener solo el primer schedule sin weekdays
      setSchedules(prev => [{
        id: prev[0]?.id || generateScheduleId(),
        time: prev[0]?.time || '',
        weekdays: []
      }]);
    } else {
      setFormData((prev) => ({
        ...prev,
        recurrenceType: 'WEEKLY',
      }));
    }
  };

  // Funciones para manejar schedules
  const handleAddSchedule = () => {
    setSchedules(prev => [...prev, { id: generateScheduleId(), time: '', weekdays: [] }]);
    setScheduleChanged(true);
  };

  const handleRemoveSchedule = (scheduleId: string) => {
    if (schedules.length <= 1) return; // Siempre mantener al menos uno
    setSchedules(prev => prev.filter(s => s.id !== scheduleId));
    setScheduleChanged(true);
  };

  const handleScheduleTimeChange = (scheduleId: string, time: string) => {
    setSchedules(prev => prev.map(s => 
      s.id === scheduleId ? { ...s, time } : s
    ));
    setScheduleChanged(true);
  };

  const handleScheduleWeekdayToggle = (scheduleId: string, day: number) => {
    setSchedules(prev => prev.map(s => {
      if (s.id !== scheduleId) return s;
      const newWeekdays = s.weekdays.includes(day)
        ? s.weekdays.filter(d => d !== day)
        : [...s.weekdays, day].sort((a, b) => a - b);
      return { ...s, weekdays: newWeekdays };
    }));
    setScheduleChanged(true);
  };

  const isEditing = !!event;

  const handleDeleteClick = () => {
    if (event && onDelete) {
      const confirmMessage = '¿Estás seguro de que deseas eliminar este evento permanentemente?\n\nEsta acción eliminará:\n- El evento y todas sus instancias\n- Todas las inscripciones asociadas\n- Todos los datos relacionados\n\n⚠️ Esta acción NO se puede deshacer.';
      if (confirm(confirmMessage)) {
        onDelete(event.id);
      }
    }
  };

  const handleStatusToggle = () => {
    const newIsActive = !isActive;
    setIsActive(newIsActive);
    if (event && onStatusChange) {
      onStatusChange(event.id, newIsActive);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="event-form">
      <h3>{isEditing ? 'Editar Evento' : 'Crear Nuevo Evento'}</h3>

      {error && <div className="error-message">{error}</div>}

      {isEditing && (
        <div className="event-info-banner">
          <div className="info-section">
            <p><strong>📅 Fecha:</strong> {new Date(event!.startDate).toLocaleDateString('es-ES')}</p>
            <p><strong>🕐 Hora:</strong> {event!.time}</p>
            <p><strong>👥 Capacidad:</strong> {event!.capacity}</p>
            <p><strong>🏋️ Tipo:</strong> {exerciseTypes.find(t => t.id === event!.exerciseTypeId)?.name || 'N/A'}</p>
          </div>
          <div className="status-section">
            <label className="status-toggle">
              <input
                type="checkbox"
                checked={isActive}
                onChange={handleStatusToggle}
              />
              <span className={`status-label ${isActive ? 'active' : 'inactive'}`}>
                {isActive ? '✅ Activo' : '⏸️ Inactivo'}
              </span>
            </label>
          </div>
        </div>
      )}

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

      {/* Botón para editar horarios cuando está editando */}
      {isEditing && !showScheduleEdit && (
        <div className="edit-schedule-section">
          <button
            type="button"
            className="btn-edit-schedule"
            onClick={() => {
              setShowScheduleEdit(true);
              setScheduleChanged(true); // Marcar cambio al abrir edición de horarios
            }}
          >
            ⚙️ Editar horarios y recurrencia
          </button>
          <small className="form-hint">
            Modifica las fechas, horarios y configuración de recurrencia del evento
          </small>
        </div>
      )}

      {/* Campos de horarios y recurrencia - mostrar al crear o al editar horarios */}
      {(!isEditing || showScheduleEdit) && (
        <>
          {showScheduleEdit && (
            <div className="edit-schedule-warning">
              <p>⚠️ <strong>Atención:</strong> Al modificar los horarios o la recurrencia, se regenerarán las instancias futuras del evento que no tengan inscripciones.</p>
              <button
                type="button"
                className="btn-cancel-edit-schedule"
                onClick={() => {
                  setShowScheduleEdit(false);
                  setScheduleChanged(false);
                  // Restaurar valores originales del evento
                  if (event) {
                    setIsRecurring(event.recurrenceType !== 'SINGLE');
                    setFormData(prev => ({
                      ...prev,
                      startDate: event.startDate.split('T')[0],
                      endDate: event.endDate.split('T')[0],
                      recurrenceType: event.recurrenceType || 'SINGLE',
                      capacity: event.capacity,
                      exerciseTypeId: event.exerciseTypeId,
                    }));
                    setSchedules([{
                      id: generateScheduleId(),
                      time: event.time,
                      weekdays: event.recurrencePattern?.weekdays || []
                    }]);
                  }
                }}
              >
                Cancelar edición de horarios
              </button>
            </div>
          )}

          {/* Toggle Recurrencia */}
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
                onChange={(e) => {
                  handleChange(e);
                  setScheduleChanged(true);
                }}
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
                  onChange={(e) => {
                    handleChange(e);
                    setScheduleChanged(true);
                  }}
                  required
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                />
              </div>
            )}

            {/* Hora solo para eventos únicos sin recurrencia */}
            {!isRecurring && (
              <div className="form-group">
                <label htmlFor="time">Hora *</label>
                <input
                  type="time"
                  id="time"
                  value={schedules[0]?.time || ''}
                  onChange={(e) => handleScheduleTimeChange(schedules[0]?.id, e.target.value)}
                  required
                />
              </div>
            )}
          </div>

          {/* Configuración de Recurrencia */}
          {isRecurring && (
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
                      onChange={(e) => {
                        handleChange(e);
                        setScheduleChanged(true);
                      }}
                    />
                    <span>Por días de la semana</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="recurrenceType"
                      value="INTERVAL"
                      checked={formData.recurrenceType === 'INTERVAL'}
                      onChange={(e) => {
                        handleChange(e);
                        setScheduleChanged(true);
                      }}
                    />
                    <span>Por intervalo de días</span>
                  </label>
                </div>
              </div>

              {formData.recurrenceType === 'WEEKLY' && (
                <div className="schedules-container">
                  <div className="schedules-header">
                    <label>Horarios de Recurrencia *</label>
                    <button
                      type="button"
                      className="btn-add-schedule"
                      onClick={handleAddSchedule}
                    >
                      + Agregar Horario
                    </button>
                  </div>
                  
                  {schedules.map((schedule, index) => (
                    <div key={schedule.id} className="schedule-item">
                      <div className="schedule-header">
                        <span className="schedule-number">Horario {index + 1}</span>
                        {schedules.length > 1 && (
                          <button
                            type="button"
                            className="btn-remove-schedule"
                            onClick={() => handleRemoveSchedule(schedule.id)}
                            title="Eliminar horario"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      
                      <div className="schedule-content">
                        <div className="form-group schedule-time">
                          <label>Hora *</label>
                          <input
                            type="time"
                            value={schedule.time}
                            onChange={(e) => handleScheduleTimeChange(schedule.id, e.target.value)}
                            required
                          />
                        </div>
                        
                        <div className="form-group schedule-weekdays">
                          <label>Días *</label>
                          <div className="weekday-selector">
                            {WEEKDAYS.map((day) => (
                              <button
                                key={day.value}
                                type="button"
                                className={`weekday-btn ${schedule.weekdays.includes(day.value) ? 'active' : ''}`}
                                onClick={() => handleScheduleWeekdayToggle(schedule.id, day.value)}
                              >
                                {day.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <small className="form-hint">
                    Cada horario genera eventos en los días seleccionados. Puedes agregar múltiples horarios.
                  </small>
                </div>
              )}

              {formData.recurrenceType === 'INTERVAL' && (
                <>
                  <div className="form-group">
                    <label>Hora *</label>
                    <input
                      type="time"
                      value={schedules[0]?.time || ''}
                      onChange={(e) => handleScheduleTimeChange(schedules[0]?.id, e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="intervalDays">Repetir cada (días) *</label>
                    <input
                      type="number"
                      id="intervalDays"
                      value={intervalDays}
                      onChange={(e) => {
                        setIntervalDays(parseInt(e.target.value) || 1);
                        setScheduleChanged(true);
                      }}
                      min="1"
                      max="365"
                      style={{ width: '100px' }}
                    />
                    <small className="form-hint">
                      El evento se repetirá cada {intervalDays} día(s)
                    </small>
                  </div>
                </>
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
        </>
      )}

      <div className="form-actions">
        <div className="left-actions">
          {isEditing && onDelete && (
            <button 
              type="button" 
              onClick={handleDeleteClick} 
              className="btn-danger"
            >
              🗑️ Eliminar
            </button>
          )}
        </div>
        <div className="right-actions">
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </div>

      <style>{`
        .event-info-banner {
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          border-left: 4px solid #17a2b8;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }
        .info-section p {
          margin: 0.25rem 0;
          color: #495057;
        }
        .status-section {
          display: flex;
          align-items: center;
        }
        .status-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }
        .status-toggle input {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }
        .status-label {
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-weight: 500;
        }
        .status-label.active {
          background: #d4edda;
          color: #155724;
        }
        .status-label.inactive {
          background: #f8d7da;
          color: #721c24;
        }
        .form-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          margin-top: 1.5rem;
        }
        .left-actions, .right-actions {
          display: flex;
          gap: 0.5rem;
        }
        .btn-danger {
          padding: 0.75rem 1.5rem;
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-danger:hover {
          background: #c82333;
        }
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
        
        /* Estilos para múltiples schedules */
        .schedules-container {
          margin-top: 1rem;
        }
        .schedules-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .schedules-header label {
          font-weight: 600;
          color: #2c3e50;
        }
        .btn-add-schedule {
          padding: 0.5rem 1rem;
          background: #28a745;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-add-schedule:hover {
          background: #218838;
          transform: translateY(-1px);
        }
        .schedule-item {
          background: white;
          border: 2px solid #e9ecef;
          border-radius: 10px;
          padding: 1rem;
          margin-bottom: 1rem;
          transition: border-color 0.2s;
        }
        .schedule-item:hover {
          border-color: #17a2b8;
        }
        .schedule-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #e9ecef;
        }
        .schedule-number {
          font-weight: 600;
          color: #17a2b8;
          font-size: 0.95rem;
        }
        .btn-remove-schedule {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 50%;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-remove-schedule:hover {
          background: #c82333;
          transform: scale(1.1);
        }
        .schedule-content {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .schedule-time {
          max-width: 150px;
        }
        .schedule-time input {
          width: 100%;
        }
        .schedule-weekdays .weekday-selector {
          margin-top: 0.25rem;
        }
        .schedule-weekdays .weekday-btn {
          padding: 0.4rem 0.6rem;
          font-size: 0.85rem;
        }
        
        /* Estilos para edición de horarios */
        .edit-schedule-section {
          background: #f0f7ff;
          padding: 1rem;
          border-radius: 8px;
          margin: 1rem 0;
          border: 1px dashed #17a2b8;
          text-align: center;
        }
        .btn-edit-schedule {
          padding: 0.75rem 1.5rem;
          background: #17a2b8;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-edit-schedule:hover {
          background: #138496;
          transform: translateY(-1px);
        }
        .edit-schedule-warning {
          background: #fff3cd;
          padding: 1rem;
          border-radius: 8px;
          margin: 1rem 0;
          border-left: 4px solid #ffc107;
        }
        .edit-schedule-warning p {
          margin: 0 0 0.75rem 0;
          color: #856404;
        }
        .btn-cancel-edit-schedule {
          padding: 0.5rem 1rem;
          background: #6c757d;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-cancel-edit-schedule:hover {
          background: #5a6268;
        }
      `}</style>
    </form>
  );
};

export default EventForm;
