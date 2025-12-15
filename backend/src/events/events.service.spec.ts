import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { EventsRepository } from './events.repository';
import { ExerciseTypesService } from '../exercise-types/exercise-types.service';
import { EventInstancesService } from '../event-instances/event-instances.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RecurrenceType } from '@prisma/client';

describe('EventsService', () => {
    let service: EventsService;
    let eventsRepository: any;
    let exerciseTypesService: any;
    let eventInstancesService: any;

    beforeEach(async () => {
        eventsRepository = {
            create: jest.fn(),
            findAllNotDeleted: jest.fn(),
            findActiveAndNotDeleted: jest.fn(),
            findByIdForUser: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
            delete: jest.fn(),
        };

        exerciseTypesService = {
            findById: jest.fn(),
        };

        eventInstancesService = {
            generateDatesForEvent: jest.fn(),
            createInstancesForEvent: jest.fn(),
            deleteFutureInstancesWithoutRegistrations: jest.fn(),
            getFutureInstances: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EventsService,
                {
                    provide: EventsRepository,
                    useValue: eventsRepository,
                },
                {
                    provide: ExerciseTypesService,
                    useValue: exerciseTypesService,
                },
                {
                    provide: EventInstancesService,
                    useValue: eventInstancesService,
                },
            ],
        }).compile();

        service = module.get<EventsService>(EventsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        const userId = 'user-1';
        const createDto = {
            name: 'Test Event',
            description: 'Test Description',
            exerciseTypeId: 'type-1',
            startDate: new Date().toISOString(),
            endDate: new Date().toISOString(),
            time: '10:00',
            capacity: 10,
            recurrenceType: RecurrenceType.SINGLE,
        };
        const mockExerciseType = { id: 'type-1', isActive: true };
        const mockEvent = { id: 'event-1', ...createDto };

        it('should create an event successfully', async () => {
            exerciseTypesService.findById.mockResolvedValue(mockExerciseType);
            eventsRepository.create.mockResolvedValue(mockEvent);
            eventInstancesService.generateDatesForEvent.mockReturnValue([new Date()]);
            eventsRepository.findById.mockResolvedValue(mockEvent);

            const result = await service.create(createDto, userId);

            expect(result).toBeDefined();
            expect(eventsRepository.create).toHaveBeenCalledWith(createDto, userId);
            expect(eventInstancesService.createInstancesForEvent).toHaveBeenCalled();
        });

        it('should throw BadRequestException if exercise type is not active', async () => {
            exerciseTypesService.findById.mockResolvedValue({ ...mockExerciseType, isActive: false });

            await expect(service.create(createDto, userId)).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if no instances generated', async () => {
            exerciseTypesService.findById.mockResolvedValue(mockExerciseType);
            eventsRepository.create.mockResolvedValue(mockEvent);
            eventInstancesService.generateDatesForEvent.mockReturnValue([]);

            await expect(service.create(createDto, userId)).rejects.toThrow(BadRequestException);
        });
    });

    describe('findAll', () => {
        it('should return all not deleted events', async () => {
            const mockEvents = [{ id: 'event-1' }];
            eventsRepository.findAllNotDeleted.mockResolvedValue(mockEvents);

            const result = await service.findAll();

            expect(result).toEqual(mockEvents);
        });
    });

    describe('findById', () => {
        it('should return event if found', async () => {
            const mockEvent = { id: 'event-1' };
            eventsRepository.findByIdForUser.mockResolvedValue(mockEvent);

            const result = await service.findById('event-1');

            expect(result).toEqual(mockEvent);
        });

        it('should throw NotFoundException if not found', async () => {
            eventsRepository.findByIdForUser.mockResolvedValue(null);

            await expect(service.findById('event-1')).rejects.toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        const updateDto = { name: 'Updated Event' };
        const mockEvent = { id: 'event-1', name: 'Old Name' };

        it('should update event successfully', async () => {
            eventsRepository.findById.mockResolvedValue(mockEvent);
            eventsRepository.update.mockResolvedValue({ ...mockEvent, ...updateDto });

            const result = await service.update('event-1', updateDto);

            expect(result).toBeDefined();
            expect(eventsRepository.update).toHaveBeenCalledWith('event-1', expect.objectContaining(updateDto));
        });

        it('should throw NotFoundException if event not found', async () => {
            eventsRepository.findById.mockResolvedValue(null);

            await expect(service.update('event-1', updateDto)).rejects.toThrow(NotFoundException);
        });
    });

    describe('findAllActive', () => {
        it('should return all active events', async () => {
            const mockEvents = [{ id: 'event-1' }];
            eventsRepository.findActiveAndNotDeleted.mockResolvedValue(mockEvents);

            const result = await service.findAllActive();

            expect(result).toEqual(mockEvents);
        });
    });

    describe('delete', () => {
        it('should soft delete event', async () => {
            eventsRepository.findById.mockResolvedValue({ id: 'event-1' });

            await service.delete('event-1');

            expect(eventsRepository.softDelete).toHaveBeenCalledWith('event-1');
        });

        it('should throw NotFoundException if event not found', async () => {
            eventsRepository.findById.mockResolvedValue(null);

            await expect(service.delete('event-1')).rejects.toThrow(NotFoundException);
        });
    });

    describe('permanentDelete', () => {
        it('should permanently delete event', async () => {
            eventsRepository.findById.mockResolvedValue({ id: 'event-1' });

            await service.permanentDelete('event-1');

            expect(eventsRepository.delete).toHaveBeenCalledWith('event-1');
        });

        it('should throw NotFoundException if event not found', async () => {
            eventsRepository.findById.mockResolvedValue(null);

            await expect(service.permanentDelete('event-1')).rejects.toThrow(NotFoundException);
        });
    });

    describe('update with regeneration', () => {
        const updateDto = { name: 'Updated Event', regenerateInstances: true };
        const mockEvent = {
            id: 'event-1',
            name: 'Old Name',
            startDate: new Date(),
            endDate: new Date(),
            time: '10:00',
            recurrenceType: 'SINGLE',
            capacity: 10
        };

        it('should regenerate instances if requested', async () => {
            eventsRepository.findById.mockResolvedValue(mockEvent);
            eventsRepository.update.mockResolvedValue({ ...mockEvent, ...updateDto });
            eventInstancesService.generateDatesForEvent.mockReturnValue([new Date()]);
            eventInstancesService.getFutureInstances.mockResolvedValue([]);

            await service.update('event-1', updateDto);

            expect(eventInstancesService.deleteFutureInstancesWithoutRegistrations).toHaveBeenCalledWith('event-1');
            expect(eventInstancesService.createInstancesForEvent).toHaveBeenCalled();
        });
    });
});
