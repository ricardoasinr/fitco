import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceService } from './attendance.service';
import { AttendanceRepository } from './attendance.repository';
import { WellnessAssessmentsRepository } from '../wellness-assessments/wellness-assessments.repository';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';

describe('AttendanceService', () => {
    let service: AttendanceService;
    let attendanceRepository: any;
    let wellnessRepository: any;

    beforeEach(async () => {
        attendanceRepository = {
            findByRegistrationId: jest.fn(),
            markAttended: jest.fn(),
            findByQrCode: jest.fn(),
            findByUserEmail: jest.fn(),
            findByEventId: jest.fn(),
        };
        wellnessRepository = {
            create: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AttendanceService,
                { provide: AttendanceRepository, useValue: attendanceRepository },
                { provide: WellnessAssessmentsRepository, useValue: wellnessRepository },
            ],
        }).compile();

        service = module.get<AttendanceService>(AttendanceService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('markAttendance', () => {
        const mockDto: MarkAttendanceDto = { registrationId: 'uuid-123' };
        const mockAdminId = 'admin-uuid';

        it('should throw BadRequestException if already attended', async () => {
            attendanceRepository.findByRegistrationId.mockResolvedValue({
                id: 'att-1',
                attended: true,
                registration: { id: 'reg-1', wellnessAssessments: [] },
            });

            await expect(service.markAttendance(mockAdminId, mockDto)).rejects.toThrow(
                BadRequestException,
            );
        });

        it('should throw BadRequestException if PRE wellness not completed', async () => {
            attendanceRepository.findByRegistrationId.mockResolvedValue({
                id: 'att-1',
                attended: false,
                registration: {
                    id: 'reg-1',
                    wellnessAssessments: [{ type: 'PRE', status: 'PENDING' }],
                },
            });

            await expect(service.markAttendance(mockAdminId, mockDto)).rejects.toThrow(
                BadRequestException,
            );
        });

        it('should mark attendance and create POST wellness if PRE is completed', async () => {
            const mockAttendance = {
                id: 'att-1',
                attended: false,
                registration: {
                    id: 'reg-1',
                    wellnessAssessments: [{ type: 'PRE', status: 'COMPLETED' }],
                },
            };

            attendanceRepository.findByRegistrationId.mockResolvedValue(mockAttendance);
            attendanceRepository.markAttended.mockResolvedValue({
                ...mockAttendance,
                attended: true,
            });

            const result = await service.markAttendance(mockAdminId, mockDto);

            expect(attendanceRepository.markAttended).toHaveBeenCalledWith(
                'att-1',
                mockAdminId,
            );
            expect(wellnessRepository.create).toHaveBeenCalledWith({
                registrationId: 'reg-1',
                type: 'POST',
            });
            expect(result.attended).toBe(true);
        });

        it('should find by QR code', async () => {
            const qrDto = { qrCode: 'qr-123' };
            const mockAttendance = {
                id: 'att-1',
                attended: false,
                registration: {
                    id: 'reg-1',
                    wellnessAssessments: [{ type: 'PRE', status: 'COMPLETED' }],
                },
            };
            attendanceRepository.findByQrCode.mockResolvedValue(mockAttendance);
            attendanceRepository.markAttended.mockResolvedValue({ ...mockAttendance, attended: true });

            await service.markAttendance(mockAdminId, qrDto);
            expect(attendanceRepository.findByQrCode).toHaveBeenCalledWith('qr-123');
        });

        it('should find by email and eventId', async () => {
            const emailDto = { email: 'test@test.com', eventId: 'evt-1' };
            const mockAttendance = {
                id: 'att-1',
                attended: false,
                registration: {
                    id: 'reg-1',
                    wellnessAssessments: [{ type: 'PRE', status: 'COMPLETED' }],
                },
            };
            attendanceRepository.findByUserEmail.mockResolvedValue(mockAttendance);
            attendanceRepository.markAttended.mockResolvedValue({ ...mockAttendance, attended: true });

            await service.markAttendance(mockAdminId, emailDto);
            expect(attendanceRepository.findByUserEmail).toHaveBeenCalledWith('test@test.com', 'evt-1');
        });

        it('should throw BadRequestException if no identifier provided', async () => {
            await expect(service.markAttendance(mockAdminId, {})).rejects.toThrow(BadRequestException);
        });

        it('should throw NotFoundException if registration not found by ID', async () => {
            attendanceRepository.findByRegistrationId.mockResolvedValue(null);
            await expect(service.markAttendance(mockAdminId, { registrationId: 'missing' })).rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException if registration not found by QR', async () => {
            attendanceRepository.findByQrCode.mockResolvedValue(null);
            await expect(service.markAttendance(mockAdminId, { qrCode: 'missing' })).rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException if registration not found by email', async () => {
            attendanceRepository.findByUserEmail.mockResolvedValue(null);
            await expect(service.markAttendance(mockAdminId, { email: 'missing', eventId: 'evt-1' })).rejects.toThrow(NotFoundException);
        });
    });

    describe('findByEventId', () => {
        it('should return attendances', async () => {
            attendanceRepository.findByEventId.mockResolvedValue([]);
            await service.findByEventId('evt-1');
            expect(attendanceRepository.findByEventId).toHaveBeenCalledWith('evt-1');
        });
    });

    describe('findByQrCode', () => {
        it('should return attendance', async () => {
            attendanceRepository.findByQrCode.mockResolvedValue({ id: 'att-1' });
            await service.findByQrCode('qr-1');
            expect(attendanceRepository.findByQrCode).toHaveBeenCalledWith('qr-1');
        });

        it('should throw NotFoundException if not found', async () => {
            attendanceRepository.findByQrCode.mockResolvedValue(null);
            await expect(service.findByQrCode('qr-1')).rejects.toThrow(NotFoundException);
        });
    });

    describe('getAttendanceStats', () => {
        it('should calculate stats correctly', async () => {
            const mockAttendances = [
                {
                    attended: true,
                    registration: {
                        wellnessAssessments: [
                            { type: 'PRE', status: 'COMPLETED' },
                            { type: 'POST', status: 'COMPLETED' },
                        ],
                    },
                },
                {
                    attended: false,
                    registration: {
                        wellnessAssessments: [
                            { type: 'PRE', status: 'PENDING' },
                        ],
                    },
                },
            ];
            attendanceRepository.findByEventId.mockResolvedValue(mockAttendances);

            const result = await service.getAttendanceStats('evt-1');

            expect(result).toEqual({
                total: 2,
                attended: 1,
                pending: 1,
                preCompleted: 1,
                postCompleted: 1,
            });
        });
    });
});
