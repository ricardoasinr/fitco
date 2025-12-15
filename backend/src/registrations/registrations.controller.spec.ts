import { Test, TestingModule } from '@nestjs/testing';
import { RegistrationsController } from './registrations.controller';
import { RegistrationsService } from './registrations.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { Role } from '@prisma/client';

describe('RegistrationsController', () => {
    let controller: RegistrationsController;
    let service: any;

    beforeEach(async () => {
        service = {
            create: jest.fn(),
            findMyRegistrations: jest.fn(),
            findByEventId: jest.fn(),
            getEventAvailability: jest.fn(),
            findByEventInstanceId: jest.fn(),
            getInstanceAvailability: jest.fn(),
            findByQrCode: jest.fn(),
            findById: jest.fn(),
            cancelRegistration: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [RegistrationsController],
            providers: [
                {
                    provide: RegistrationsService,
                    useValue: service,
                },
            ],
        }).compile();

        controller = module.get<RegistrationsController>(RegistrationsController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('should create a registration', async () => {
            const dto: CreateRegistrationDto = {
                eventId: 'event-1',
                eventInstanceId: 'instance-1',
            };
            const user = { id: 'user-1', email: 'test@test.com', name: 'Test', role: Role.USER };
            const expected = { id: 'reg-1', ...dto };

            service.create.mockResolvedValue(expected);

            const result = await controller.create(user, dto);

            expect(result).toEqual(expected);
            expect(service.create).toHaveBeenCalledWith(user.id, dto);
        });
    });

    describe('findMyRegistrations', () => {
        it('should return user registrations', async () => {
            const user = { id: 'user-1', email: 'test@test.com', name: 'Test', role: Role.USER };
            const expected = [{ id: 'reg-1' }];
            service.findMyRegistrations.mockResolvedValue(expected);

            const result = await controller.findMyRegistrations(user);

            expect(result).toEqual(expected);
            expect(service.findMyRegistrations).toHaveBeenCalledWith(user.id);
        });
    });

    describe('findByEventId', () => {
        it('should return registrations for event', async () => {
            const expected = [{ id: 'reg-1' }];
            service.findByEventId.mockResolvedValue(expected);

            const result = await controller.findByEventId('event-1');

            expect(result).toEqual(expected);
            expect(service.findByEventId).toHaveBeenCalledWith('event-1');
        });
    });

    describe('getEventAvailability', () => {
        it('should return event availability', async () => {
            const expected = { capacity: 10, registered: 5, available: 5 };
            service.getEventAvailability.mockResolvedValue(expected);

            const result = await controller.getEventAvailability('event-1');

            expect(result).toEqual(expected);
            expect(service.getEventAvailability).toHaveBeenCalledWith('event-1');
        });
    });

    describe('findByInstanceId', () => {
        it('should return registrations for instance', async () => {
            const expected = [{ id: 'reg-1' }];
            service.findByEventInstanceId.mockResolvedValue(expected);

            const result = await controller.findByInstanceId('inst-1');

            expect(result).toEqual(expected);
            expect(service.findByEventInstanceId).toHaveBeenCalledWith('inst-1');
        });
    });

    describe('getInstanceAvailability', () => {
        it('should return instance availability', async () => {
            const expected = { capacity: 10, registered: 5, available: 5 };
            service.getInstanceAvailability.mockResolvedValue(expected);

            const result = await controller.getInstanceAvailability('inst-1');

            expect(result).toEqual(expected);
            expect(service.getInstanceAvailability).toHaveBeenCalledWith('inst-1');
        });
    });

    describe('findByQrCode', () => {
        it('should return registration by QR code', async () => {
            const expected = { id: 'reg-1' };
            service.findByQrCode.mockResolvedValue(expected);

            const result = await controller.findByQrCode('qr-123');

            expect(result).toEqual(expected);
            expect(service.findByQrCode).toHaveBeenCalledWith('qr-123');
        });
    });

    describe('findById', () => {
        it('should return registration by ID', async () => {
            const expected = { id: 'reg-1' };
            service.findById.mockResolvedValue(expected);

            const result = await controller.findById('reg-1');

            expect(result).toEqual(expected);
            expect(service.findById).toHaveBeenCalledWith('reg-1');
        });
    });

    describe('cancel', () => {
        it('should cancel registration', async () => {
            const user = { id: 'user-1', email: 'test@test.com', name: 'Test', role: Role.USER };
            service.cancelRegistration.mockResolvedValue(undefined);

            const result = await controller.cancel('reg-1', user);

            expect(result).toEqual({ message: 'Registration cancelled successfully' });
            expect(service.cancelRegistration).toHaveBeenCalledWith('reg-1', user.id);
        });
    });
});
