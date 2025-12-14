import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { IUsersRepository } from './interfaces/users.repository.interface';

type UserWithoutPassword = Omit<User, 'password'>;

/**
 * UsersRepository - Implementa el patrón Repository
 * 
 * Responsabilidades (Single Responsibility Principle):
 * - Abstrae el acceso a datos de usuarios
 * - Encapsula la lógica de persistencia con Prisma
 * - Proporciona una interfaz clara para operaciones CRUD
 * 
 * Dependency Inversion Principle:
 * - El servicio depende de la interfaz IUsersRepository, no de esta implementación
 */
@Injectable()
export class UsersRepository implements IUsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserDto): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findAll(): Promise<UserWithoutPassword[]> {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        password: false, // No exponer contraseñas
      },
    });
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<User> {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}

