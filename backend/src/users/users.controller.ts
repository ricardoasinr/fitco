import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

/**
 * UsersController - Manejo de endpoints de usuarios
 * 
 * Responsabilidades (Single Responsibility Principle):
 * - Recibir requests HTTP
 * - Validar datos de entrada (con ValidationPipe)
 * - Delegar lógica al Service
 * - Retornar responses HTTP
 * 
 * Seguridad:
 * - Todos los endpoints requieren autenticación (JwtAuthGuard)
 * - Solo admins pueden crear, actualizar y eliminar usuarios
 * - Solo admins pueden asignar el rol ADMIN
 */
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Crear usuario - Solo ADMIN
   * No se puede crear usuarios ADMIN desde este endpoint por seguridad
   */
  @Post()
  @Roles(Role.ADMIN)
  create(@Body() createUserDto: CreateUserDto) {
    // Prevenir creación de admins desde este endpoint
    if (createUserDto.role === Role.ADMIN) {
      throw new ForbiddenException(
        'Cannot create users via this endpoint.',
      );
    }
    return this.usersService.create(createUserDto);
  }

  /**
   * Listar usuarios - Solo ADMIN
   */
  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.usersService.findAll();
  }

  /**
   * Obtener usuario por ID - Solo ADMIN
   */
  @Get(':id')
  @Roles(Role.ADMIN)
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  /**
   * Actualizar usuario - Solo ADMIN
   * Solo admins pueden asignar el rol ADMIN
   */
  @Patch(':id')
  @Roles(Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: any,
  ) {
    // Solo admins pueden asignar el rol ADMIN
    if (updateUserDto.role === Role.ADMIN && currentUser.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can assign admin role');
    }
    return this.usersService.update(id, updateUserDto);
  }

  /**
   * Eliminar usuario - Solo ADMIN
   */
  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.usersService.delete(id);
  }
}

