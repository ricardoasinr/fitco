import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceRepository } from './attendance.repository';
import { PrismaService } from '../prisma/prisma.service';

describe('AttendanceRepository', () => {
    let repository: AttendanceRepository;
    let prisma: any;

    beforeEach(async () => {
        prisma = {
            attendance: {
                create: jest.fn(),
                findUnique: jest.fn(),
                findFirst: jest.fn(),
                findMany: jest.fn(),
                update: jest.fn(),
            },
            user: {
                findUnique: jest.fn(),
            },
            registration: {
                findUnique: jest.fn(),
                findFirst: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AttendanceRepository,
                {
                    provide: PrismaService,
                    useValue: prisma,
                },
            ],
        }).compile();

        repository = module.get<AttendanceRepository>(AttendanceRepository);
    });

    it('should be defined', () => {
        expect(repository).toBeDefined();
    });

    describe('markAttended', () => {
        it('should mark attendance as attended', async () => {
            const expected = { id: 'a1', attended: true };
            prisma.attendance.update.mockResolvedValue(expected);

            const result = await repository.markAttended('a1', 'admin-1');

            expect(result).toEqual(expected);
            expect(prisma.attendance.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'a1' },
                data: expect.objectContaining({ attended: true, checkedBy: 'admin-1' }),
            }));
        });
    });

    describe('findByQrCode', () => {
        it('should find attendance by QR code', async () => {
            const registration = { id: 'r1' };
            const expected = { id: 'a1' };

            prisma.registration.findUnique.mockResolvedValue(registration);
            prisma.attendance.findUnique.mockResolvedValue(expected);

            const result = await repository.findByQrCode('qr-123');

            expect(result).toEqual(expected);
            expect(prisma.registration.findUnique).toHaveBeenCalledWith({
                where: { qrCode: 'qr-123' },
                select: { id: true },
            });
            expect(prisma.attendance.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { registrationId: 'r1' } }));
        });

        it('should return null if registration not found', async () => {
            prisma.registration.findUnique.mockResolvedValue(null);
            const result = await repository.findByQrCode('qr-123');
            expect(result).toBeNull();
        });
    });

    describe('findByUserEmail', () => {
        it('should find attendance by user email and event', async () => {
            const user = { id: 'u1' };
            const registration = { id: 'r1' };
            const expected = { id: 'a1' };

            prisma.user.findUnique.mockResolvedValue(user);
            prisma.registration.findFirst.mockResolvedValue(registration);
            prisma.attendance.findUnique.mockResolvedValue(expected);

            const result = await repository.findByUserEmail('test@test.com', 'e1');

            expect(result).toEqual(expected);
        });
    });
});
