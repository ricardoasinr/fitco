import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * RegisterDto - DTO para registro de usuarios
 * 
 * Seguridad:
 * - NO incluye el campo 'role' intencionalmente
 * - Todos los nuevos registros son forzados a rol USER
 * - Esto previene que usuarios maliciosos se registren como ADMIN
 * 
 * Los usuarios ADMIN solo se pueden crear mediante:
 * - Script de seed (npm run seed)
 * - Endpoint /users (solo accesible por otros ADMIN)
 */
export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}

