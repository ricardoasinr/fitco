import { Test, TestingModule } from '@nestjs/testing';
import { ExerciseTypesRepository } from './exercise-types.repository';
import { PrismaService } from '../prisma/prisma.service';

describe('ExerciseTypesRepository', () => {
    let repository: ExerciseTypesRepository;
    let prisma: any;

    beforeEach(async () => {
        prisma = {
            exerciseType: {
                create: jest.fn(),
                findUnique: jest.fn(),
                findMany: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ExerciseTypesRepository,
                {
                    provide: PrismaService,
                    useValue: prisma,
                },
            ],
        }).compile();

        repository = module.get<ExerciseTypesRepository>(ExerciseTypesRepository);
    });

    it('should be defined', () => {
        expect(repository).toBeDefined();
    });

    describe('create', () => {
        it('should create exercise type', async () => {
            const data = { name: 'Yoga', isActive: true };
            const expected = { id: 'et1', ...data, createdBy: 'u1' };
            prisma.exerciseType.create.mockResolvedValue(expected);

            const result = await repository.create(data, 'u1');

            expect(result).toEqual(expected);
            expect(prisma.exerciseType.create).toHaveBeenCalled();
        });
    });

    describe('findById', () => {
        it('should find by id', async () => {
            const expected = { id: 'et1' };
            prisma.exerciseType.findUnique.mockResolvedValue(expected);
            const result = await repository.findById('et1');
            expect(result).toEqual(expected);
        });
    });

    describe('findByName', () => {
        it('should find by name', async () => {
            const expected = { id: 'et1', name: 'Yoga' };
            prisma.exerciseType.findUnique.mockResolvedValue(expected);
            const result = await repository.findByName('Yoga');
            expect(result).toEqual(expected);
        });
    });

    describe('findAll', () => {
        it('should return all types', async () => {
            const expected = [{ id: 'et1' }];
            prisma.exerciseType.findMany.mockResolvedValue(expected);
            const result = await repository.findAll();
            expect(result).toEqual(expected);
        });
    });

    describe('findAllActive', () => {
        it('should return active types', async () => {
            const expected = [{ id: 'et1', isActive: true }];
            prisma.exerciseType.findMany.mockResolvedValue(expected);
            const result = await repository.findAllActive();
            expect(result).toEqual(expected);
        });
    });

    describe('update', () => {
        it('should update type', async () => {
            const expected = { id: 'et1', name: 'Pilates' };
            prisma.exerciseType.update.mockResolvedValue(expected);
            const result = await repository.update('et1', { name: 'Pilates' });
            expect(result).toEqual(expected);
        });
    });

    describe('delete', () => {
        it('should delete type', async () => {
            const expected = { id: 'et1' };
            prisma.exerciseType.delete.mockResolvedValue(expected);
            const result = await repository.delete('et1');
            expect(result).toEqual(expected);
        });
    });
});
