import { Test, TestingModule } from '@nestjs/testing';
import { WellnessAssessmentsRepository } from './wellness-assessments.repository';
import { PrismaService } from '../prisma/prisma.service';
import { WellnessType, WellnessStatus } from '@prisma/client';

describe('WellnessAssessmentsRepository', () => {
    let repository: WellnessAssessmentsRepository;
    let prisma: any;

    beforeEach(async () => {
        prisma = {
            wellnessAssessment: {
                create: jest.fn(),
                findUnique: jest.fn(),
                findMany: jest.fn(),
                update: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                WellnessAssessmentsRepository,
                {
                    provide: PrismaService,
                    useValue: prisma,
                },
            ],
        }).compile();

        repository = module.get<WellnessAssessmentsRepository>(WellnessAssessmentsRepository);
    });

    it('should be defined', () => {
        expect(repository).toBeDefined();
    });

    describe('create', () => {
        it('should create assessment', async () => {
            const data = { registrationId: 'r1', type: WellnessType.PRE };
            const expected = { id: 'wa1', ...data, status: WellnessStatus.PENDING };
            prisma.wellnessAssessment.create.mockResolvedValue(expected);

            const result = await repository.create(data);

            expect(result).toEqual(expected);
            expect(prisma.wellnessAssessment.create).toHaveBeenCalled();
        });
    });

    describe('findById', () => {
        it('should find by id', async () => {
            const expected = { id: 'wa1' };
            prisma.wellnessAssessment.findUnique.mockResolvedValue(expected);
            const result = await repository.findById('wa1');
            expect(result).toEqual(expected);
        });
    });

    describe('findByRegistrationId', () => {
        it('should find by registration id', async () => {
            const expected = [{ id: 'wa1' }];
            prisma.wellnessAssessment.findMany.mockResolvedValue(expected);
            const result = await repository.findByRegistrationId('r1');
            expect(result).toEqual(expected);
        });
    });

    describe('update', () => {
        it('should update assessment', async () => {
            const expected = { id: 'wa1', status: WellnessStatus.COMPLETED };
            prisma.wellnessAssessment.update.mockResolvedValue(expected);
            const result = await repository.update('wa1', { status: WellnessStatus.COMPLETED });
            expect(result).toEqual(expected);
        });
    });
});
