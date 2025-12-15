import { Test, TestingModule } from '@nestjs/testing';
import { UsersRepository } from './users.repository';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Role } from '@prisma/client';

describe('UsersRepository', () => {
    let repository: UsersRepository;
    let prisma: any;

    beforeEach(async () => {
        prisma = {
            user: {
                create: jest.fn(),
                findUnique: jest.fn(),
                findMany: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersRepository,
                {
                    provide: PrismaService,
                    useValue: prisma,
                },
            ],
        }).compile();

        repository = module.get<UsersRepository>(UsersRepository);
    });

    it('should be defined', () => {
        expect(repository).toBeDefined();
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
            prisma.user.create.mockResolvedValue(expected);

            const result = await repository.create(dto);

            expect(result).toEqual(expected);
            expect(prisma.user.create).toHaveBeenCalledWith({ data: dto });
        });
    });

    describe('findByEmail', () => {
        it('should find user by email', async () => {
            const expected = { id: 'user-1', email: 'test@test.com' };
            prisma.user.findUnique.mockResolvedValue(expected);

            const result = await repository.findByEmail('test@test.com');

            expect(result).toEqual(expected);
            expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@test.com' } });
        });
    });

    describe('findById', () => {
        it('should find user by id', async () => {
            const expected = { id: 'user-1' };
            prisma.user.findUnique.mockResolvedValue(expected);

            const result = await repository.findById('user-1');

            expect(result).toEqual(expected);
            expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-1' } });
        });
    });

    describe('findAll', () => {
        it('should return all users without password', async () => {
            const expected = [{ id: 'user-1', email: 'test@test.com' }];
            prisma.user.findMany.mockResolvedValue(expected);

            const result = await repository.findAll();

            expect(result).toEqual(expected);
            expect(prisma.user.findMany).toHaveBeenCalledWith({
                select: expect.objectContaining({ password: false }),
            });
        });
    });

    describe('update', () => {
        it('should update user', async () => {
            const expected = { id: 'user-1', name: 'Updated' };
            prisma.user.update.mockResolvedValue(expected);

            const result = await repository.update('user-1', { name: 'Updated' });

            expect(result).toEqual(expected);
            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: 'user-1' },
                data: { name: 'Updated' },
            });
        });
    });

    describe('delete', () => {
        it('should delete user', async () => {
            const expected = { id: 'user-1' };
            prisma.user.delete.mockResolvedValue(expected);

            const result = await repository.delete('user-1');

            expect(result).toEqual(expected);
            expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user-1' } });
        });
    });
});
