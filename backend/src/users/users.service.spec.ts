import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<UsersRepository>;

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(UsersRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      role: 'USER',
    };

    it('should create a user successfully', async () => {
      const mockUser = {
        id: 'user-id',
        ...createUserDto,
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      repository.findByEmail.mockResolvedValue(null);
      repository.create.mockResolvedValue(mockUser as any);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password' as never);

      const result = await service.create(createUserDto);

      expect(repository.findByEmail).toHaveBeenCalledWith(createUserDto.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(repository.create).toHaveBeenCalled();
      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe(createUserDto.email);
    });

    it('should throw ConflictException if email already exists', async () => {
      const existingUser = {
        id: 'existing-id',
        email: createUserDto.email,
        name: 'Existing User',
        role: 'USER',
      };

      repository.findByEmail.mockResolvedValue(existingUser as any);

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should hash password before saving', async () => {
      const mockUser = {
        id: 'user-id',
        ...createUserDto,
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      repository.findByEmail.mockResolvedValue(null);
      repository.create.mockResolvedValue(mockUser as any);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password' as never);

      await service.create(createUserDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          password: 'hashed-password',
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return user without password', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      repository.findById.mockResolvedValue(mockUser as any);

      const result = await service.findById('user-id');

      expect(repository.findById).toHaveBeenCalledWith('user-id');
      expect(result).not.toHaveProperty('password');
      expect(result.id).toBe('user-id');
    });

    it('should throw NotFoundException if user does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all users without passwords', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          name: 'User 1',
          role: 'USER',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          name: 'User 2',
          role: 'ADMIN',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      repository.findAll.mockResolvedValue(mockUsers as any);

      const result = await service.findAll();

      expect(repository.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      result.forEach((user) => {
        expect(user).not.toHaveProperty('password');
      });
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      name: 'Updated Name',
    };

    it('should update user successfully', async () => {
      const existingUser = {
        id: 'user-id',
        email: 'test@example.com',
        name: 'Old Name',
        role: 'USER',
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedUser = {
        ...existingUser,
        name: 'Updated Name',
      };

      repository.findById.mockResolvedValue(existingUser as any);
      repository.update.mockResolvedValue(updatedUser as any);

      const result = await service.update('user-id', updateUserDto);

      expect(repository.findById).toHaveBeenCalledWith('user-id');
      expect(repository.update).toHaveBeenCalledWith('user-id', updateUserDto);
      expect(result).not.toHaveProperty('password');
      expect(result.name).toBe('Updated Name');
    });

    it('should hash password if provided in update', async () => {
      const existingUser = {
        id: 'user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        password: 'old-hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updateWithPassword: UpdateUserDto = {
        password: 'new-password',
      };

      const updatedUser = {
        ...existingUser,
        password: 'new-hashed-password',
      };

      repository.findById.mockResolvedValue(existingUser as any);
      repository.update.mockResolvedValue(updatedUser as any);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('new-hashed-password' as never);

      await service.update('user-id', updateWithPassword);

      expect(bcrypt.hash).toHaveBeenCalledWith('new-password', 10);
      expect(repository.update).toHaveBeenCalledWith(
        'user-id',
        expect.objectContaining({
          password: 'new-hashed-password',
        }),
      );
    });

    it('should throw NotFoundException if user does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.update('non-existent-id', updateUserDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      repository.findById.mockResolvedValue(mockUser as any);
      repository.delete.mockResolvedValue(mockUser as any);

      await service.delete('user-id');

      expect(repository.findById).toHaveBeenCalledWith('user-id');
      expect(repository.delete).toHaveBeenCalledWith('user-id');
    });

    it('should throw NotFoundException if user does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.delete('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.delete).not.toHaveBeenCalled();
    });
  });
});

