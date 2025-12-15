import { Test, TestingModule } from '@nestjs/testing';
import { ExerciseTypesService } from './exercise-types.service';
import { ExerciseTypesRepository } from './exercise-types.repository';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

describe('ExerciseTypesService', () => {
    let service: ExerciseTypesService;
    let repository: any;

    beforeEach(async () => {
        repository = {
            create: jest.fn(),
            findAll: jest.fn(),
            findAllActive: jest.fn(),
            findById: jest.fn(),
            findByName: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ExerciseTypesService,
                {
                    provide: ExerciseTypesRepository,
                    useValue: repository,
                },
            ],
        }).compile();

        service = module.get<ExerciseTypesService>(ExerciseTypesService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        const createDto = { name: 'Yoga', description: 'Relaxing' };
        const userId = 'user-1';

        it('should create exercise type successfully', async () => {
            repository.findByName.mockResolvedValue(null);
            repository.create.mockResolvedValue({ id: 'type-1', ...createDto });

            const result = await service.create(createDto, userId);

            expect(result).toBeDefined();
            expect(repository.create).toHaveBeenCalledWith(createDto, userId);
        });

        it('should throw BadRequestException if name is empty', async () => {
            await expect(service.create({ ...createDto, name: '  ' }, userId)).rejects.toThrow(BadRequestException);
        });

        it('should throw ConflictException if name already exists', async () => {
            repository.findByName.mockResolvedValue({ id: 'existing' });

            await expect(service.create(createDto, userId)).rejects.toThrow(ConflictException);
        });
    });

    describe('findAll', () => {
        it('should return all types', async () => {
            repository.findAll.mockResolvedValue([]);
            await service.findAll();
            expect(repository.findAll).toHaveBeenCalled();
        });
    });

    describe('findById', () => {
        it('should return type if found', async () => {
            repository.findById.mockResolvedValue({ id: 'type-1' });
            await service.findById('type-1');
            expect(repository.findById).toHaveBeenCalledWith('type-1');
        });

        it('should throw NotFoundException if not found', async () => {
            repository.findById.mockResolvedValue(null);
            await expect(service.findById('type-1')).rejects.toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        const updateDto = { name: 'Pilates' };

        it('should update successfully', async () => {
            repository.findById.mockResolvedValue({ id: 'type-1' });
            repository.findByName.mockResolvedValue(null);
            repository.update.mockResolvedValue({ id: 'type-1', ...updateDto });

            await service.update('type-1', updateDto);
            expect(repository.update).toHaveBeenCalled();
        });

        it('should throw NotFoundException if not found', async () => {
            repository.findById.mockResolvedValue(null);
            await expect(service.update('type-1', updateDto)).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException if name is empty', async () => {
            repository.findById.mockResolvedValue({ id: 'type-1' });
            await expect(service.update('type-1', { name: ' ' })).rejects.toThrow(BadRequestException);
        });

        it('should throw ConflictException if name exists for other type', async () => {
            repository.findById.mockResolvedValue({ id: 'type-1' });
            repository.findByName.mockResolvedValue({ id: 'type-2' }); // Different ID

            await expect(service.update('type-1', updateDto)).rejects.toThrow(ConflictException);
        });
    });

    describe('delete', () => {
        it('should delete successfully', async () => {
            repository.findById.mockResolvedValue({ id: 'type-1' });
            await service.delete('type-1');
            expect(repository.delete).toHaveBeenCalledWith('type-1');
        });

        it('should throw NotFoundException if not found', async () => {
            repository.findById.mockResolvedValue(null);
            await expect(service.delete('type-1')).rejects.toThrow(NotFoundException);
        });
    });
});
