import { Test, TestingModule } from '@nestjs/testing';
import { EventInstancesService } from './event-instances.service';
import { EventInstancesRepository } from './event-instances.repository';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('EventInstancesService', () => {
    let service: EventInstancesService;
    let repository: any;

    beforeEach(async () => {
        repository = {
            findById: jest.fn(),
            findByEventId: jest.fn(),
            findAvailableByEventId: jest.fn(),
            countRegistrations: jest.fn(),
            createMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EventInstancesService,
                {
                    provide: EventInstancesRepository,
                    useValue: repository,
                },
            ],
        }).compile();

        service = module.get<EventInstancesService>(EventInstancesService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findById', () => {
        it('should return instance if found', async () => {
            const mockInstance = { id: 'instance-1' };
            repository.findById.mockResolvedValue(mockInstance);

            const result = await service.findById('instance-1');
            expect(result).toEqual(mockInstance);
        });

        it('should throw NotFoundException if not found', async () => {
            repository.findById.mockResolvedValue(null);
            await expect(service.findById('instance-1')).rejects.toThrow(NotFoundException);
        });
    });

    describe('getAvailability', () => {
        it('should calculate availability correctly', async () => {
            const mockInstance = { id: 'instance-1', capacity: 10 };
            repository.findById.mockResolvedValue(mockInstance);
            repository.countRegistrations.mockResolvedValue(3);

            const result = await service.getAvailability('instance-1');

            expect(result).toEqual({
                capacity: 10,
                registered: 3,
                available: 7,
            });
        });
    });

    describe('generateInstanceDates', () => {
        it('should generate single date for SINGLE recurrence', () => {
            const startDate = new Date('2024-01-01T00:00:00Z');
            const endDate = new Date('2024-01-01T23:59:59Z');
            const time = '10:00';

            const dates = service.generateInstanceDates(startDate, endDate, time, 'SINGLE', null);

            expect(dates).toHaveLength(1);
            expect(dates[0].getUTCHours()).toBe(10);
            expect(dates[0].getUTCMinutes()).toBe(0);
        });

        it('should throw BadRequestException for invalid time', () => {
            const startDate = new Date();
            expect(() => service.generateInstanceDates(startDate, startDate, '25:00', 'SINGLE', null)).toThrow(BadRequestException);
        });

        it('should generate weekly dates', () => {
            const startDate = new Date('2024-01-01T00:00:00Z'); // Monday
            const endDate = new Date('2024-01-14T23:59:59Z'); // 2 weeks later
            const time = '10:00';
            const pattern = { weekdays: [1, 3] }; // Monday, Wednesday

            const dates = service.generateInstanceDates(startDate, endDate, time, 'WEEKLY', pattern);

            // Should be Mon 1, Wed 3, Mon 8, Wed 10
            expect(dates.length).toBeGreaterThanOrEqual(4);
            dates.forEach(date => {
                const day = date.getUTCDay();
                expect([1, 3]).toContain(day);
                expect(date.getUTCHours()).toBe(10);
            });
        });

        it('should generate interval dates', () => {
            const startDate = new Date('2024-01-01T00:00:00Z');
            const endDate = new Date('2024-01-10T23:59:59Z');
            const time = '10:00';
            const pattern = { intervalDays: 2 }; // Every 2 days

            const dates = service.generateInstanceDates(startDate, endDate, time, 'INTERVAL', pattern);

            // Should be 1, 3, 5, 7, 9
            expect(dates.length).toBe(5);
            expect(dates[0].getUTCDate()).toBe(1);
            expect(dates[1].getUTCDate()).toBe(3);
        });

        it('should fallback to daily if no pattern provided for WEEKLY/INTERVAL', () => {
            const startDate = new Date('2024-01-01T00:00:00Z');
            const endDate = new Date('2024-01-03T23:59:59Z');
            const time = '10:00';

            const dates = service.generateInstanceDates(startDate, endDate, time, 'WEEKLY', null);

            expect(dates.length).toBe(3); // Daily
        });
    });

    describe('generateDatesForEvent', () => {
        it('should generate dates from multiple schedules', () => {
            const config = {
                startDate: '2024-01-01T00:00:00Z',
                endDate: '2024-01-07T23:59:59Z',
                time: '10:00',
                recurrenceType: 'WEEKLY' as any,
                schedules: [
                    { time: '08:00', weekdays: [1] }, // Mon 8am
                    { time: '18:00', weekdays: [3] }  // Wed 6pm
                ]
            };

            const dates = service.generateDatesForEvent(config);
            expect(dates.length).toBe(2);
            expect(dates[0].getUTCHours()).toBe(8);
            expect(dates[1].getUTCHours()).toBe(18);
        });
    });

    describe('createInstancesForEvent', () => {
        it('should create instances', async () => {
            const dates = [new Date(), new Date()];
            repository.createMany.mockResolvedValue(2);

            const result = await service.createInstancesForEvent('event-1', dates, 10);

            expect(result).toBe(2);
            expect(repository.createMany).toHaveBeenCalled();
        });
    });

    describe('deactivateInstance', () => {
        it('should deactivate instance', async () => {
            repository.findById.mockResolvedValue({ id: 'inst-1' });
            repository.update.mockResolvedValue({ id: 'inst-1', isActive: false });

            await service.deactivateInstance('inst-1');
            expect(repository.update).toHaveBeenCalledWith('inst-1', { isActive: false });
        });
    });

    describe('deleteFutureInstancesWithoutRegistrations', () => {
        it('should delete future instances with no registrations', async () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 1);

            const instances = [
                { id: 'inst-1', dateTime: futureDate },
            ];

            repository.findByEventId.mockResolvedValue(instances);
            repository.countRegistrations.mockResolvedValue(0);
            repository.delete.mockResolvedValue({});

            const result = await service.deleteFutureInstancesWithoutRegistrations('event-1');

            expect(result.deleted).toBe(1);
            expect(repository.delete).toHaveBeenCalledWith('inst-1');
        });

        it('should preserve instances with registrations', async () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 1);

            const instances = [
                { id: 'inst-1', dateTime: futureDate },
            ];

            repository.findByEventId.mockResolvedValue(instances);
            repository.countRegistrations.mockResolvedValue(5);

            const result = await service.deleteFutureInstancesWithoutRegistrations('event-1');

            expect(result.deleted).toBe(0);
            expect(result.preserved).toBe(1);
            expect(repository.delete).not.toHaveBeenCalled();
        });
    });

    describe('deleteAllFutureInstances', () => {
        it('should delete all future instances', async () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 1);
            repository.findByEventId.mockResolvedValue([{ id: 'inst-1', dateTime: futureDate }]);
            repository.delete.mockResolvedValue({});

            const result = await service.deleteAllFutureInstances('evt-1');
            expect(result).toBe(1);
            expect(repository.delete).toHaveBeenCalledWith('inst-1');
        });
    });

    describe('getFutureInstances', () => {
        it('should return future instances', async () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 1);
            repository.findByEventId.mockResolvedValue([{ id: 'inst-1', dateTime: futureDate }]);

            const result = await service.getFutureInstances('evt-1');
            expect(result).toHaveLength(1);
        });
    });
});
