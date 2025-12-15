import { Test, TestingModule } from '@nestjs/testing';
import { RegistrationsRepository } from './registrations.repository';
import { PrismaService } from '../prisma/prisma.service';

describe('RegistrationsRepository', () => {
    let repository: RegistrationsRepository;
    let prisma: any;

    beforeEach(async () => {
        prisma = {
            registration: {
                create: jest.fn(),
                findUnique: jest.fn(),
                findFirst: jest.fn(),
                findMany: jest.fn(),
                count: jest.fn(),
                delete: jest.fn(),
            },
            $transaction: jest.fn((callback) => callback(prisma)),
            attendance: { create: jest.fn() },
            wellnessAssessment: { create: jest.fn() },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RegistrationsRepository,
                {
                    provide: PrismaService,
                    useValue: prisma,
                },
            ],
        }).compile();

        repository = module.get<RegistrationsRepository>(RegistrationsRepository);
    });

    it('should be defined', () => {
        expect(repository).toBeDefined();
    });

    describe('create', () => {
        it('should create registration with transaction', async () => {
            const data = { userId: 'u1', eventId: 'e1', eventInstanceId: 'i1' };
            const expected = { id: 'r1' };

            prisma.registration.create.mockResolvedValue(expected);
            prisma.registration.findUnique.mockResolvedValue(expected);

            const result = await repository.create(data);

            expect(result).toEqual(expected);
            expect(prisma.registration.create).toHaveBeenCalled();
            expect(prisma.attendance.create).toHaveBeenCalled();
            expect(prisma.wellnessAssessment.create).toHaveBeenCalled();
        });
    });

    describe('findById', () => {
        it('should find by id', async () => {
            const expected = { id: 'r1' };
            prisma.registration.findUnique.mockResolvedValue(expected);
            const result = await repository.findById('r1');
            expect(result).toEqual(expected);
        });
    });

    describe('findByUserId', () => {
        it('should find by user id', async () => {
            const expected = [{ id: 'r1' }];
            prisma.registration.findMany.mockResolvedValue(expected);
            const result = await repository.findByUserId('u1');
            expect(result).toEqual(expected);
        });
    });

    describe('countByEventId', () => {
        it('should count registrations', async () => {
            prisma.registration.count.mockResolvedValue(5);
            const result = await repository.countByEventId('e1');
            expect(result).toBe(5);
        });
    });
});
