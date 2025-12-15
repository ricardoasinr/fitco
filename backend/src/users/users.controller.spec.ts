import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '@prisma/client';
import { ForbiddenException } from '@nestjs/common';

describe('UsersController', () => {
    let controller: UsersController;
    let service: any;

    beforeEach(async () => {
        service = {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [UsersController],
            providers: [
                {
                    provide: UsersService,
                    useValue: service,
                },
            ],
        }).compile();

        controller = module.get<UsersController>(UsersController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('should create a user', async () => {
            const dto: CreateUserDto = {
                email: 'test@test.com',
                password: 'password',
                name: 'Test',
                role: Role.USER,
            };
            const expected = { id: 'user-1', ...dto };
            service.create.mockResolvedValue(expected);

            const result = await controller.create(dto);

            expect(result).toEqual(expected);
            expect(service.create).toHaveBeenCalledWith(dto);
        });

        it('should throw ForbiddenException if trying to create ADMIN', async () => {
            const dto: CreateUserDto = {
                email: 'admin@test.com',
                password: 'password',
                name: 'Admin',
                role: Role.ADMIN,
            };

            expect(() => controller.create(dto)).toThrow(ForbiddenException);
        });
    });

    describe('findAll', () => {
        it('should return all users', async () => {
            const expected = [{ id: 'user-1' }];
            service.findAll.mockResolvedValue(expected);

            const result = await controller.findAll();

            expect(result).toEqual(expected);
            expect(service.findAll).toHaveBeenCalled();
        });
    });

    describe('findOne', () => {
        it('should return a user by id', async () => {
            const expected = { id: 'user-1' };
            service.findById.mockResolvedValue(expected);

            const result = await controller.findOne('user-1');

            expect(result).toEqual(expected);
            expect(service.findById).toHaveBeenCalledWith('user-1');
        });
    });

    describe('update', () => {
        it('should update a user', async () => {
            const dto: UpdateUserDto = { name: 'Updated' };
            const expected = { id: 'user-1', ...dto };
            const currentUser = { role: Role.ADMIN };
            service.update.mockResolvedValue(expected);

            const result = await controller.update('user-1', dto, currentUser);

            expect(result).toEqual(expected);
            expect(service.update).toHaveBeenCalledWith('user-1', dto);
        });

        it('should throw ForbiddenException if non-admin tries to assign ADMIN role', async () => {
            const dto: UpdateUserDto = { role: Role.ADMIN };
            const currentUser = { role: Role.USER };

            expect(() => controller.update('user-1', dto, currentUser)).toThrow(ForbiddenException);
        });

        it('should allow admin to assign ADMIN role', async () => {
            const dto: UpdateUserDto = { role: Role.ADMIN };
            const expected = { id: 'user-1', ...dto };
            const currentUser = { role: Role.ADMIN };
            service.update.mockResolvedValue(expected);

            const result = await controller.update('user-1', dto, currentUser);

            expect(result).toEqual(expected);
        });
    });

    describe('remove', () => {
        it('should remove a user', async () => {
            service.delete.mockResolvedValue(undefined);

            await controller.remove('user-1');

            expect(service.delete).toHaveBeenCalledWith('user-1');
        });
    });
});
