import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { BadRequestException } from '@nestjs/common';

describe('AttendanceController', () => {
    let controller: AttendanceController;
    let service: Partial<AttendanceService>;

    beforeEach(async () => {
        service = {
            markAttendance: jest.fn(),
            getAttendanceStats: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [AttendanceController],
            providers: [{ provide: AttendanceService, useValue: service }],
        }).compile();

        controller = module.get<AttendanceController>(AttendanceController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('markAttendance', () => {
        it('should call service.markAttendance with correct parameters', async () => {
            const mockDto: MarkAttendanceDto = { registrationId: 'uuid-123' };
            const mockUser = { id: 'admin-1', email: 'admin@test.com', name: 'Admin', role: 'ADMIN' } as any;
            const mockResult = { id: 'att-1', attended: true } as any;

            (service.markAttendance as jest.Mock).mockResolvedValue(mockResult);

            const result = await controller.markAttendance(mockUser, mockDto);

            expect(service.markAttendance).toHaveBeenCalledWith('admin-1', mockDto);
            expect(result).toEqual(mockResult);
        });
    });

    describe('getStats', () => {
        it('should return stats for an event', async () => {
            const mockStats = {
                total: 10,
                attended: 5,
                pending: 5,
                preCompleted: 8,
                postCompleted: 2,
            };
            (service.getAttendanceStats as jest.Mock).mockResolvedValue(mockStats);

            const result = await controller.getStats('event-1');

            expect(service.getAttendanceStats).toHaveBeenCalledWith('event-1');
            expect(result).toEqual(mockStats);
        });
    });
});
