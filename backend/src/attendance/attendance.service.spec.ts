import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceService } from './attendance.service';
import { AttendanceRepository } from './attendance.repository';
import { WellnessAssessmentsRepository } from '../wellness-assessments/wellness-assessments.repository';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';

describe('AttendanceService', () => {
    let service: AttendanceService;
    let attendanceRepository: Partial<AttendanceRepository>;
    let wellnessRepository: Partial<WellnessAssessmentsRepository>;

    beforeEach(async () => {
        attendanceRepository = {
            findByRegistrationId: jest.fn(),
            markAttended: jest.fn(),
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
            (attendanceRepository.findByRegistrationId as jest.Mock).mockResolvedValue({
                id: 'att-1',
                attended: true,
                registration: { id: 'reg-1', wellnessAssessments: [] },
            });

            await expect(service.markAttendance(mockAdminId, mockDto)).rejects.toThrow(
                BadRequestException,
            );
        });

        it('should throw BadRequestException if PRE wellness not completed', async () => {
            (attendanceRepository.findByRegistrationId as jest.Mock).mockResolvedValue({
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

            (attendanceRepository.findByRegistrationId as jest.Mock).mockResolvedValue(
                mockAttendance,
            );
            (attendanceRepository.markAttended as jest.Mock).mockResolvedValue({
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
    });
});
