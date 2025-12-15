import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { ExerciseTypesService } from './exercise-types.service';
import { CreateExerciseTypeDto } from './dto/create-exercise-type.dto';
import { UpdateExerciseTypeDto } from './dto/update-exercise-type.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

/**
 * User object from JWT strategy validation
 */
interface RequestUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

/**
 * ExerciseTypesController - Manejo de endpoints de tipos de ejercicio
 * 
 * Responsabilidades (Single Responsibility Principle):
 * - Recibir requests HTTP
 * - Validar datos de entrada (con ValidationPipe)
 * - Delegar lógica al Service
 * - Retornar responses HTTP
 * 
 * Control de acceso:
 * - GET (público): Cualquiera puede listar tipos de ejercicio para dropdown
 * - POST, PATCH, DELETE: Solo ADMIN
 */
@Controller('exercise-types')
export class ExerciseTypesController {
  constructor(private readonly exerciseTypesService: ExerciseTypesService) {}

  @Post()
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  create(
    @Body() createExerciseTypeDto: CreateExerciseTypeDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.exerciseTypesService.create(createExerciseTypeDto, user.id);
  }

  @Public()
  @Get()
  findAll() {
    return this.exerciseTypesService.findAllActive();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.exerciseTypesService.findById(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  update(
    @Param('id') id: string,
    @Body() updateExerciseTypeDto: UpdateExerciseTypeDto,
  ) {
    return this.exerciseTypesService.update(id, updateExerciseTypeDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  remove(@Param('id') id: string) {
    return this.exerciseTypesService.delete(id);
  }
}

