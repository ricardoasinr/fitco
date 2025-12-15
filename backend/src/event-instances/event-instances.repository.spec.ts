import { Test, TestingModule } from '@nestjs/testing';
import { EventInstancesRepository } from './event-instances.repository';
import { PrismaService } from '../prisma/prisma.service';

describe('EventInstancesRepository', () => {
    let repository: EventInstancesRepository;
    let prisma: any;

    beforeEach(async () => {
        prisma = {
            eventInstance: {
                create: jest.fn(),
                createMany: jest.fn(),
                findUnique: jest.fn(),
                findMany: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
                deleteMany: jest.fn(),
            },
            registration: {
                count: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EventInstancesRepository,
                {
                    provide: PrismaService,
                    useValue: prisma,
                },
            ],
        }).compile();

        repository = module.get<EventInstancesRepository>(EventInstancesRepository);
    });

    it('should be defined', () => {
        expect(repository).toBeDefined();
    });

    describe('create', () => {
        it('should create instance', async () => {
            const data = { eventId: 'e1', dateTime: new Date(), capacity: 10 };
            const expected = { id: 'i1', ...data };
            prisma.eventInstance.create.mockResolvedValue(expected);

            const result = await repository.create(data);

            expect(result).toEqual(expected);
            expect(prisma.eventInstance.create).toHaveBeenCalled();
        });
    });

    describe('createMany', () => {
        it('should create many instances', async () => {
            const data = [{ eventId: 'e1', dateTime: new Date(), capacity: 10 }];
            prisma.eventInstance.createMany.mockResolvedValue({ count: 1 });

            const result = await repository.createMany(data);

            expect(result).toBe(1);
            expect(prisma.eventInstance.createMany).toHaveBeenCalled();
        });
    });

    describe('findById', () => {
        it('should find by id', async () => {
            const expected = { id: 'i1' };
            prisma.eventInstance.findUnique.mockResolvedValue(expected);
            const result = await repository.findById('i1');
            expect(result).toEqual(expected);
        });
    });

    describe('findByEventId', () => {
        it('should find by event id', async () => {
            const expected = [{ id: 'i1' }];
            prisma.eventInstance.findMany.mockResolvedValue(expected);
            const result = await repository.findByEventId('e1');
            expect(result).toEqual(expected);
        });
    });

    describe('findAvailableByEventId', () => {
        it('should find available instances', async () => {
            const expected = [{ id: 'i1' }];
            prisma.eventInstance.findMany.mockResolvedValue(expected);
            const result = await repository.findAvailableByEventId('e1');
            expect(result).toEqual(expected);
        });
    });

    describe('update', () => {
        it('should update instance', async () => {
            const expected = { id: 'i1', capacity: 20 };
            prisma.eventInstance.update.mockResolvedValue(expected);
            const result = await repository.update('i1', { capacity: 20 });
            expect(result).toEqual(expected);
        });
    });

    describe('delete', () => {
        it('should delete instance', async () => {
            const expected = { id: 'i1' };
            prisma.eventInstance.delete.mockResolvedValue(expected);
            const result = await repository.delete('i1');
            expect(result).toEqual(expected);
        });
    });

    describe('deleteByEventId', () => {
        it('should delete instances by event id', async () => {
            prisma.eventInstance.deleteMany.mockResolvedValue({ count: 5 });
            const result = await repository.deleteByEventId('e1');
            expect(result).toBe(5);
        });
    });

    describe('countRegistrations', () => {
        it('should count registrations', async () => {
            prisma.registration.count.mockResolvedValue(10);
            const result = await repository.countRegistrations('i1');
            expect(result).toBe(10);
        });
    });
});
