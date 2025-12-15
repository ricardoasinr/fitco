import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../../users/users.service';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';

describe('JwtStrategy', () => {
    let strategy: JwtStrategy;
    let usersService: any;
    let configService: any;

    beforeEach(async () => {
        usersService = {
            findById: jest.fn(),
        };
        configService = {
            get: jest.fn().mockReturnValue('secret'),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                JwtStrategy,
                { provide: UsersService, useValue: usersService },
                { provide: ConfigService, useValue: configService },
            ],
        }).compile();

        strategy = module.get<JwtStrategy>(JwtStrategy);
    });

    it('should be defined', () => {
        expect(strategy).toBeDefined();
    });

    describe('validate', () => {
        it('should validate and return user', async () => {
            const payload = { sub: 'user-1', email: 'test@test.com', role: Role.USER };
            const user = { id: 'user-1', email: 'test@test.com', name: 'Test', role: Role.USER };
            usersService.findById.mockResolvedValue(user);

            const result = await strategy.validate(payload);

            expect(result).toEqual({
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            });
            expect(usersService.findById).toHaveBeenCalledWith('user-1');
        });

        it('should throw UnauthorizedException if user not found', async () => {
            const payload = { sub: 'user-1', email: 'test@test.com', role: Role.USER };
            usersService.findById.mockResolvedValue(null);

            await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
        });
    });
});
