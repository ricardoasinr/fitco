import { User } from '@prisma/client';
import { CreateUserDto } from '../dto/create-user.dto';

type UserWithoutPassword = Omit<User, 'password'>;

export interface IUsersRepository {
  create(data: CreateUserDto): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findAll(): Promise<UserWithoutPassword[]>;
  update(id: string, data: Partial<User>): Promise<User>;
  delete(id: string): Promise<User>;
}

