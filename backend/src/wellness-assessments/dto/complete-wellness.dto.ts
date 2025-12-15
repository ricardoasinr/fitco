import { IsInt, Min, Max, IsNotEmpty } from 'class-validator';

/**
 * CompleteWellnessDto - DTO para completar cuestionario de bienestar
 * 
 * Métricas en escala 1-10:
 * - sleepQuality: Calidad del sueño
 * - stressLevel: Nivel de estrés
 * - mood: Estado de ánimo
 */
export class CompleteWellnessDto {
  @IsNotEmpty({ message: 'Sleep quality is required' })
  @IsInt({ message: 'Sleep quality must be an integer' })
  @Min(0, { message: 'Sleep quality must be at least 0' })
  @Max(10, { message: 'Sleep quality must be at most 10' })
  sleepQuality: number;

  @IsNotEmpty({ message: 'Stress level is required' })
  @IsInt({ message: 'Stress level must be an integer' })
  @Min(0, { message: 'Stress level must be at least 0' })
  @Max(10, { message: 'Stress level must be at most 10' })
  stressLevel: number;

  @IsNotEmpty({ message: 'Mood is required' })
  @IsInt({ message: 'Mood must be an integer' })
  @Min(0, { message: 'Mood must be at least 0' })
  @Max(10, { message: 'Mood must be at most 10' })
  mood: number;
}


