import React, { useState, useEffect } from 'react';
import { ExerciseType, CreateExerciseTypeDto } from '../types/event.types';
import { exerciseTypesService } from '../services/exerciseTypes.service';

/**
 * ExerciseTypeManager - Componente para gestionar tipos de ejercicio (ADMIN)
 * 
 * Responsabilidades:
 * - Listar todos los tipos de ejercicio
 * - Crear nuevos tipos
 * - Editar tipos existentes
 * - Activar/desactivar tipos
 * - Manejar estados de carga y errores
 */
const ExerciseTypeManager: React.FC = () => {
  const [exerciseTypes, setExerciseTypes] = useState<ExerciseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingType, setEditingType] = useState<ExerciseType | null>(null);
  const [formData, setFormData] = useState<CreateExerciseTypeDto>({
    name: '',
    isActive: true,
  });

  useEffect(() => {
    loadExerciseTypes();
  }, []);

  const loadExerciseTypes = async () => {
    try {
      setLoading(true);
      const types = await exerciseTypesService.getAll();
      setExerciseTypes(types);
      setError('');
    } catch (error: any) {
      setError('Error al cargar tipos de ejercicio');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingType) {
        await exerciseTypesService.update(editingType.id, formData);
      } else {
        await exerciseTypesService.create(formData);
      }
      await loadExerciseTypes();
      resetForm();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error al guardar');
    }
  };

  const handleEdit = (type: ExerciseType) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      isActive: type.isActive,
    });
    setShowForm(true);
  };

  const handleToggleActive = async (type: ExerciseType) => {
    try {
      await exerciseTypesService.update(type.id, { isActive: !type.isActive });
      await loadExerciseTypes();
    } catch (error: any) {
      setError('Error al actualizar estado');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este tipo de ejercicio?')) return;
    
    try {
      await exerciseTypesService.delete(id);
      await loadExerciseTypes();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error al eliminar');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', isActive: true });
    setEditingType(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="loading">Cargando tipos de ejercicio...</div>;
  }

  return (
    <div className="exercise-type-manager">
      <div className="manager-header">
        <h3>🏋️ Tipos de Ejercicio</h3>
        <button 
          onClick={() => setShowForm(!showForm)} 
          className="btn-primary"
        >
          {showForm ? 'Cancelar' : '+ Nuevo Tipo'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="exercise-type-form">
          <div className="form-group">
            <label htmlFor="name">Nombre *</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Ej: Yoga, Meditación, Spa..."
            />
          </div>
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              Activo
            </label>
          </div>
          <div className="form-actions">
            <button type="button" onClick={resetForm} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              {editingType ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      )}

      <div className="exercise-types-list">
        {exerciseTypes.length === 0 ? (
          <p className="empty-message">No hay tipos de ejercicio registrados</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {exerciseTypes.map(type => (
                <tr key={type.id}>
                  <td>{type.name}</td>
                  <td>
                    <span className={`status-badge ${type.isActive ? 'active' : 'inactive'}`}>
                      {type.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="table-actions">
                    <button 
                      onClick={() => handleEdit(type)} 
                      className="btn-icon"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => handleToggleActive(type)} 
                      className="btn-icon"
                      title={type.isActive ? 'Desactivar' : 'Activar'}
                    >
                      {type.isActive ? '🔴' : '🟢'}
                    </button>
                    <button 
                      onClick={() => handleDelete(type.id)} 
                      className="btn-icon btn-danger"
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ExerciseTypeManager;

