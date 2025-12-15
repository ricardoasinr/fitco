import { Test, TestingModule } from '@nestjs/testing';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { RecurrenceType, Role } from '@prisma/client';

describe('EventsController', () => {
    let controller: EventsController;
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
            controllers: [EventsController],
            providers: [
                {
                    provide: EventsService,
                    useValue: service,
                },
            ],
        }).compile();

        controller = module.get<EventsController>(EventsController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('should create an event', async () => {
            const createDto: CreateEventDto = {
                name: 'Test Event',
                description: 'Desc',
                exerciseTypeId: 'type-1',
                startDate: new Date().toISOString(),
                endDate: new Date().toISOString(),
                time: '10:00',
                capacity: 10,
                recurrenceType: RecurrenceType.SINGLE,
            };
            const user = { id: 'user-1', email: 'test@test.com', name: 'Test', role: Role.ADMIN };
            const expectedResult = { id: 'event-1', ...createDto };

            service.create.mockResolvedValue(expectedResult);

            const result = await controller.create(createDto, user);

            expect(result).toEqual(expectedResult);
            expect(service.create).toHaveBeenCalledWith(createDto, user.id);
        });
    });

    describe('findAll', () => {
        it('should return an array of events', async () => {
            const result = [{ id: 'event-1' }];
            service.findAll.mockResolvedValue(result);

            expect(await controller.findAll()).toBe(result);
        });
    });

    describe('findOne', () => {
        it('should return a single event', async () => {
            const result = { id: 'event-1' };
            service.findById.mockResolvedValue(result);

            expect(await controller.findOne('event-1')).toBe(result);
            expect(service.findById).toHaveBeenCalledWith('event-1', undefined);
        });

        it('should pass user id if authenticated', async () => {
            const user = { id: 'user-1', email: 'test@test.com', name: 'Test', role: Role.USER };
            await controller.findOne('event-1', user);
            expect(service.findById).toHaveBeenCalledWith('event-1', 'user-1');
        });
    });

    describe('update', () => {
        it('should update an event', async () => {
            const updateDto: UpdateEventDto = { name: 'Updated' };
            const result = { id: 'event-1', ...updateDto };
            service.update.mockResolvedValue(result);

            expect(await controller.update('event-1', updateDto)).toBe(result);
            expect(service.update).toHaveBeenCalledWith('event-1', updateDto);
        });
    });

    describe('remove', () => {
        it('should remove an event', async () => {
            service.delete.mockResolvedValue(undefined);

            await controller.remove('event-1');

            expect(service.delete).toHaveBeenCalledWith('event-1');
        });
    });
});
