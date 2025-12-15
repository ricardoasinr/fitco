import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const mockUsersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };

    it('should register a new user successfully', async () => {
      const mockUser = {
        id: 'user-id',
        email: registerDto.email,
        name: registerDto.name,
        role: 'USER',
        password: 'hashed-password',
      };

      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(mockUser as any);
      jwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await service.register(registerDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(usersService.create).toHaveBeenCalledWith({
        ...registerDto,
        role: 'USER',
      });
      expect(jwtService.sign).toHaveBeenCalled();
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('user');
      expect(result.user.role).toBe('USER');
    });

    it('should throw ConflictException if email already exists', async () => {
      const existingUser = {
        id: 'existing-id',
        email: registerDto.email,
        name: 'Existing User',
        role: 'USER',
      };

      usersService.findByEmail.mockResolvedValue(existingUser as any);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('should force role to USER even if provided', async () => {
      const mockUser = {
        id: 'user-id',
        email: registerDto.email,
        name: registerDto.name,
        role: 'USER',
        password: 'hashed-password',
      };

      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(mockUser as any);
      jwtService.sign.mockReturnValue('mock-jwt-token');

      await service.register(registerDto);

      expect(usersService.create).toHaveBeenCalledWith({
        ...registerDto,
        role: 'USER',
      });
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login successfully with valid credentials', async () => {
      const mockUser = {
        id: 'user-id',
        email: loginDto.email,
        name: 'Test User',
        role: 'USER',
        password: 'hashed-password',
      };

      usersService.findByEmail.mockResolvedValue(mockUser as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await service.login(loginDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('user');
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const mockUser = {
        id: 'user-id',
        email: loginDto.email,
        name: 'Test User',
        role: 'USER',
        password: 'hashed-password',
      };

      usersService.findByEmail.mockResolvedValue(mockUser as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('validateUser', () => {
    it('should return user without password if credentials are valid', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        password: 'hashed-password',
      };

      usersService.findByEmail.mockResolvedValue(mockUser as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.validateUser('test@example.com', 'password123');

      expect(result).not.toHaveProperty('password');
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
    });

    it('should return null if user does not exist', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser('test@example.com', 'password123');

      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        password: 'hashed-password',
      };

      usersService.findByEmail.mockResolvedValue(mockUser as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      const result = await service.validateUser('test@example.com', 'wrong-password');

      expect(result).toBeNull();
    });
  });
});

