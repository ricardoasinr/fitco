import { Test, TestingModule } from '@nestjs/testing';
import { EventsRepository } from './events.repository';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { RecurrenceType } from '@prisma/client';

describe('EventsRepository', () => {
    let repository: EventsRepository;
    let prisma: any;

    beforeEach(async () => {
        prisma = {
            event: {
                create: jest.fn(),
                findUnique: jest.fn(),
                findMany: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EventsRepository,
                {
                    provide: PrismaService,
                    useValue: prisma,
                },
            ],
        }).compile();

        repository = module.get<EventsRepository>(EventsRepository);
    });

    it('should be defined', () => {
        expect(repository).toBeDefined();
    });

    describe('create', () => {
        it('should create an event', async () => {
            const dto: CreateEventDto = {
                name: 'Test Event',
                description: 'Test Description',
                startDate: '2023-01-01',
                endDate: '2023-01-01',
                time: '10:00',
                capacity: 10,
                exerciseTypeId: 'type-1',
                recurrenceType: RecurrenceType.SINGLE,
            };
            const expected = { id: 'event-1', ...dto };
            prisma.event.create.mockResolvedValue(expected);

            const result = await repository.create(dto, 'user-1');

            expect(result).toEqual(expected);
            expect(prisma.event.create).toHaveBeenCalled();
        });
    });

    describe('findById', () => {
        it('should find event by id', async () => {
            const expected = { id: 'event-1' };
            prisma.event.findUnique.mockResolvedValue(expected);

            const result = await repository.findById('event-1');

            expect(result).toEqual(expected);
            expect(prisma.event.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'event-1' } }));
        });
    });

    describe('findAll', () => {
        it('should return all events', async () => {
            const expected = [{ id: 'event-1' }];
            prisma.event.findMany.mockResolvedValue(expected);

            const result = await repository.findAll();

            expect(result).toEqual(expected);
            expect(prisma.event.findMany).toHaveBeenCalled();
        });
    });

    describe('update', () => {
        it('should update event', async () => {
            const expected = { id: 'event-1', name: 'Updated' };
            prisma.event.update.mockResolvedValue(expected);

            const result = await repository.update('event-1', { name: 'Updated' });

            expect(result).toEqual(expected);
            expect(prisma.event.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'event-1' } }));
        });
    });

    describe('delete', () => {
        it('should delete event', async () => {
            const expected = { id: 'event-1' };
            prisma.event.delete.mockResolvedValue(expected);

            const result = await repository.delete('event-1');

            expect(result).toEqual(expected);
            expect(prisma.event.delete).toHaveBeenCalledWith({ where: { id: 'event-1' } });
        });
    });
});
