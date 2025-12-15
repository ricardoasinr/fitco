import { Test, TestingModule } from '@nestjs/testing';
import { RegistrationsService } from './registrations.service';
import { RegistrationsRepository } from './registrations.repository';
import { EventsRepository } from '../events/events.repository';
import { EventInstancesRepository } from '../event-instances/event-instances.repository';
import {
    NotFoundException,
    BadRequestException,
    ConflictException,
    ForbiddenException,
} from '@nestjs/common';

describe('RegistrationsService', () => {
    let service: RegistrationsService;
    let registrationsRepository: any;
    let eventsRepository: any;
    let eventInstancesRepository: any;

    beforeEach(async () => {
        registrationsRepository = {
            create: jest.fn(),
            findByUserAndInstance: jest.fn(),
            countByEventInstanceId: jest.fn(),
            findById: jest.fn(),
            findByQrCode: jest.fn(),
            findByUserId: jest.fn(),
            findByEventId: jest.fn(),
            findByEventInstanceId: jest.fn(),
            delete: jest.fn(),
            countByEventId: jest.fn(),
        };

        eventsRepository = {
            findById: jest.fn(),
        };

        eventInstancesRepository = {
            findById: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RegistrationsService,
                {
                    provide: RegistrationsRepository,
                    useValue: registrationsRepository,
                },
                {
                    provide: EventsRepository,
                    useValue: eventsRepository,
                },
                {
                    provide: EventInstancesRepository,
                    useValue: eventInstancesRepository,
                },
            ],
        }).compile();

        service = module.get<RegistrationsService>(RegistrationsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        const userId = 'user-1';
        const createDto = { eventId: 'event-1', eventInstanceId: 'instance-1' };
        const mockEvent = { id: 'event-1', isActive: true };
        const mockInstance = {
            id: 'instance-1',
            eventId: 'event-1',
            isActive: true,
            dateTime: new Date(Date.now() + 100000), // Future date
            capacity: 10,
        };

        it('should create a registration successfully', async () => {
            eventsRepository.findById.mockResolvedValue(mockEvent);
            eventInstancesRepository.findById.mockResolvedValue(mockInstance);
            registrationsRepository.findByUserAndInstance.mockResolvedValue(null);
            registrationsRepository.countByEventInstanceId.mockResolvedValue(5);
            registrationsRepository.create.mockResolvedValue({ id: 'reg-1', ...createDto, userId });

            const result = await service.create(userId, createDto);

            expect(result).toBeDefined();
            expect(registrationsRepository.create).toHaveBeenCalledWith({ userId, ...createDto });
        });

        it('should throw NotFoundException if event not found', async () => {
            eventsRepository.findById.mockResolvedValue(null);

            await expect(service.create(userId, createDto)).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException if event is not active', async () => {
            eventsRepository.findById.mockResolvedValue({ ...mockEvent, isActive: false });

            await expect(service.create(userId, createDto)).rejects.toThrow(BadRequestException);
        });

        it('should throw NotFoundException if instance not found', async () => {
            eventsRepository.findById.mockResolvedValue(mockEvent);
            eventInstancesRepository.findById.mockResolvedValue(null);

            await expect(service.create(userId, createDto)).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException if instance does not belong to event', async () => {
            eventsRepository.findById.mockResolvedValue(mockEvent);
            eventInstancesRepository.findById.mockResolvedValue({ ...mockInstance, eventId: 'other-event' });

            await expect(service.create(userId, createDto)).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if instance is not active', async () => {
            eventsRepository.findById.mockResolvedValue(mockEvent);
            eventInstancesRepository.findById.mockResolvedValue({ ...mockInstance, isActive: false });

            await expect(service.create(userId, createDto)).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if instance is in the past', async () => {
            eventsRepository.findById.mockResolvedValue(mockEvent);
            eventInstancesRepository.findById.mockResolvedValue({
                ...mockInstance,
                dateTime: new Date(Date.now() - 100000), // Past date
            });

            await expect(service.create(userId, createDto)).rejects.toThrow(BadRequestException);
        });

        it('should throw ConflictException if user already registered', async () => {
            eventsRepository.findById.mockResolvedValue(mockEvent);
            eventInstancesRepository.findById.mockResolvedValue(mockInstance);
            registrationsRepository.findByUserAndInstance.mockResolvedValue({ id: 'existing-reg' });

            await expect(service.create(userId, createDto)).rejects.toThrow(ConflictException);
        });

        it('should throw BadRequestException if instance is full', async () => {
            eventsRepository.findById.mockResolvedValue(mockEvent);
            eventInstancesRepository.findById.mockResolvedValue(mockInstance);
            registrationsRepository.findByUserAndInstance.mockResolvedValue(null);
            registrationsRepository.countByEventInstanceId.mockResolvedValue(10); // Full capacity

            await expect(service.create(userId, createDto)).rejects.toThrow(BadRequestException);
        });
    });

    describe('cancelRegistration', () => {
        const registrationId = 'reg-1';
        const userId = 'user-1';
        const mockRegistration = {
            id: registrationId,
            userId: userId,
            attendance: null,
        };

        it('should cancel registration successfully', async () => {
            registrationsRepository.findById.mockResolvedValue(mockRegistration);
            registrationsRepository.delete.mockResolvedValue(mockRegistration);

            await service.cancelRegistration(registrationId, userId);

            expect(registrationsRepository.delete).toHaveBeenCalledWith(registrationId);
        });

        it('should throw NotFoundException if registration not found', async () => {
            registrationsRepository.findById.mockResolvedValue(null);

            await expect(service.cancelRegistration(registrationId, userId)).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException if user is not the owner', async () => {
            registrationsRepository.findById.mockResolvedValue({ ...mockRegistration, userId: 'other-user' });

            await expect(service.cancelRegistration(registrationId, userId)).rejects.toThrow(ForbiddenException);
        });

        it('should throw BadRequestException if attendance already marked', async () => {
            registrationsRepository.findById.mockResolvedValue({
                ...mockRegistration,
                attendance: { attended: true },
            });

            await expect(service.cancelRegistration(registrationId, userId)).rejects.toThrow(BadRequestException);
        });
    });

    describe('getEventAvailability', () => {
        const eventId = 'event-1';
        const mockEvent = {
            id: eventId,
            instances: [
                { capacity: 10 },
                { capacity: 20 },
            ],
        };

        it('should return availability correctly', async () => {
            eventsRepository.findById.mockResolvedValue(mockEvent);
            registrationsRepository.countByEventId.mockResolvedValue(5);

            const result = await service.getEventAvailability(eventId);

            expect(result).toEqual({
                capacity: 30,
                registered: 5,
                available: 25,
            });
        });

        it('should throw NotFoundException if event not found', async () => {
            eventsRepository.findById.mockResolvedValue(null);

            await expect(service.getEventAvailability(eventId)).rejects.toThrow(NotFoundException);
        });
    });


    describe('findByQrCode', () => {
        it('should return registration if found', async () => {
            const mockReg = { id: 'reg-1' };
            registrationsRepository.findByQrCode.mockResolvedValue(mockReg);

            const result = await service.findByQrCode('qr-123');
            expect(result).toEqual(mockReg);
        });

        it('should throw NotFoundException if not found', async () => {
            registrationsRepository.findByQrCode.mockResolvedValue(null);
            await expect(service.findByQrCode('qr-123')).rejects.toThrow(NotFoundException);
        });
    });

    describe('findMyRegistrations', () => {
        it('should return registrations for user', async () => {
            const mockRegs = [{ id: 'reg-1' }];
            registrationsRepository.findByUserId.mockResolvedValue(mockRegs);

            const result = await service.findMyRegistrations('user-1');
            expect(result).toEqual(mockRegs);
        });
    });

    describe('findByEventId', () => {
        it('should return registrations for event', async () => {
            const mockRegs = [{ id: 'reg-1' }];
            registrationsRepository.findByEventId.mockResolvedValue(mockRegs);

            const result = await service.findByEventId('event-1');
            expect(result).toEqual(mockRegs);
        });
    });

    describe('findByEventInstanceId', () => {
        it('should return registrations for instance', async () => {
            const mockRegs = [{ id: 'reg-1' }];
            registrationsRepository.findByEventInstanceId.mockResolvedValue(mockRegs);

            const result = await service.findByEventInstanceId('inst-1');
            expect(result).toEqual(mockRegs);
        });
    });

    describe('getInstanceAvailability', () => {
        it('should return availability', async () => {
            eventInstancesRepository.findById.mockResolvedValue({ id: 'inst-1', capacity: 10 });
            registrationsRepository.countByEventInstanceId.mockResolvedValue(5);

            const result = await service.getInstanceAvailability('inst-1');
            expect(result).toEqual({ capacity: 10, registered: 5, available: 5 });
        });

        it('should throw NotFoundException if instance not found', async () => {
            eventInstancesRepository.findById.mockResolvedValue(null);
            await expect(service.getInstanceAvailability('inst-1')).rejects.toThrow(NotFoundException);
        });
    });
});
