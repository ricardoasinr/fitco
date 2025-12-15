import api from './api';
import { 
  WellnessAssessment, 
  CompleteWellnessDto, 
  WellnessImpactResponse 
} from '../types/event.types';

/**
 * WellnessService - Servicio para evaluaciones de bienestar
 * 
 * Responsabilidades:
 * - Comunicación con el backend para operaciones de wellness
 * - Manejo de peticiones HTTP
 */
export const wellnessService = {
  /**
   * Obtener evaluaciones pendientes (USER)
   */
  getPending: async (): Promise<WellnessAssessment[]> => {
    const response = await api.get<WellnessAssessment[]>('/wellness/pending');
    return response.data;
  },

  /**
   * Obtener todas las evaluaciones pendientes con detalles (USER)
   */
  getPendingEvaluations: async (): Promise<WellnessAssessment[]> => {
    const response = await api.get<WellnessAssessment[]>('/wellness/pending');
    return response.data;
  },

  /**
   * Obtener evaluación por ID
   */
  getById: async (id: string): Promise<WellnessAssessment> => {
    const response = await api.get<WellnessAssessment>(`/wellness/${id}`);
    return response.data;
  },

  /**
   * Obtener evaluaciones de una inscripción
   */
  getByRegistration: async (registrationId: string): Promise<WellnessAssessment[]> => {
    const response = await api.get<WellnessAssessment[]>(`/wellness/registration/${registrationId}`);
    return response.data;
  },

  /**
   * Completar evaluación de bienestar (USER)
   */
  complete: async (id: string, data: CompleteWellnessDto): Promise<WellnessAssessment> => {
    const response = await api.post<WellnessAssessment>(`/wellness/${id}/complete`, data);
    return response.data;
  },

  /**
   * Obtener impacto wellness de una inscripción
   */
  getImpact: async (registrationId: string): Promise<WellnessImpactResponse> => {
    const response = await api.get<WellnessImpactResponse>(`/wellness/registration/${registrationId}/impact`);
    return response.data;
  },
};

