import api from './api';
import { ExerciseType, CreateExerciseTypeDto, UpdateExerciseTypeDto } from '../types/event.types';

/**
 * ExerciseTypesService - Servicio para gestión de tipos de ejercicio
 * 
 * Responsabilidades:
 * - Comunicación con el backend para operaciones CRUD de tipos de ejercicio
 * - Manejo de peticiones HTTP
 * - Transformación de datos si es necesario
 */
export const exerciseTypesService = {
  /**
   * Obtener todos los tipos de ejercicio activos (público)
   */
  getAll: async (): Promise<ExerciseType[]> => {
    const response = await api.get<ExerciseType[]>('/exercise-types');
    return response.data;
  },

  /**
   * Obtener un tipo de ejercicio por ID
   */
  getById: async (id: string): Promise<ExerciseType> => {
    const response = await api.get<ExerciseType>(`/exercise-types/${id}`);
    return response.data;
  },

  /**
   * Crear un nuevo tipo de ejercicio (ADMIN)
   */
  create: async (data: CreateExerciseTypeDto): Promise<ExerciseType> => {
    const response = await api.post<ExerciseType>('/exercise-types', data);
    return response.data;
  },

  /**
   * Actualizar un tipo de ejercicio (ADMIN)
   */
  update: async (id: string, data: UpdateExerciseTypeDto): Promise<ExerciseType> => {
    const response = await api.patch<ExerciseType>(`/exercise-types/${id}`, data);
    return response.data;
  },

  /**
   * Eliminar un tipo de ejercicio (ADMIN)
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/exercise-types/${id}`);
  },
};

