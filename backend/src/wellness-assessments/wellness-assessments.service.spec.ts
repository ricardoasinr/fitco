import { Test, TestingModule } from '@nestjs/testing';
import { WellnessAssessmentsService } from './wellness-assessments.service';
import { WellnessAssessmentsRepository } from './wellness-assessments.repository';
import { RegistrationsRepository } from '../registrations/registrations.repository';
import {
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { WellnessType, WellnessStatus } from '@prisma/client';

describe('WellnessAssessmentsService', () => {
    let service: WellnessAssessmentsService;
    let wellnessRepository: any;
    let registrationsRepository: any;

    beforeEach(async () => {
        wellnessRepository = {
            findPendingByUserId: jest.fn(),
            findCompletedByUserId: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            findByRegistrationId: jest.fn(),
        };

        registrationsRepository = {
            findById: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                WellnessAssessmentsService,
                {
                    provide: WellnessAssessmentsRepository,
                    useValue: wellnessRepository,
                },
                {
                    provide: RegistrationsRepository,
                    useValue: registrationsRepository,
                },
            ],
        }).compile();

        service = module.get<WellnessAssessmentsService>(WellnessAssessmentsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('completeAssessment', () => {
        const assessmentId = 'assessment-1';
        const userId = 'user-1';
        const completeDto = {
            sleepQuality: 8,
            stressLevel: 3,
            mood: 9,
        };
        const mockAssessment = {
            id: assessmentId,
            registrationId: 'reg-1',
            status: WellnessStatus.PENDING,
            type: WellnessType.PRE,
            registration: { userId },
        };

        it('should complete assessment successfully', async () => {
            wellnessRepository.findById.mockResolvedValue(mockAssessment);
            registrationsRepository.findById.mockResolvedValue({ id: 'reg-1', attendance: null });
            wellnessRepository.update.mockResolvedValue({ ...mockAssessment, status: WellnessStatus.COMPLETED });

            const result = await service.completeAssessment(assessmentId, userId, completeDto);

            expect(result).toBeDefined();
            expect(wellnessRepository.update).toHaveBeenCalledWith(assessmentId, expect.objectContaining({
                status: WellnessStatus.COMPLETED,
                ...completeDto,
            }));
        });

        it('should throw NotFoundException if assessment not found', async () => {
            wellnessRepository.findById.mockResolvedValue(null);

            await expect(service.completeAssessment(assessmentId, userId, completeDto)).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException if user is not the owner', async () => {
            wellnessRepository.findById.mockResolvedValue({
                ...mockAssessment,
                registration: { userId: 'other-user' },
            });

            await expect(service.completeAssessment(assessmentId, userId, completeDto)).rejects.toThrow(ForbiddenException);
        });

        it('should throw BadRequestException if already completed', async () => {
            wellnessRepository.findById.mockResolvedValue({
                ...mockAssessment,
                status: WellnessStatus.COMPLETED,
            });

            await expect(service.completeAssessment(assessmentId, userId, completeDto)).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if completing PRE after attendance', async () => {
            wellnessRepository.findById.mockResolvedValue(mockAssessment);
            registrationsRepository.findById.mockResolvedValue({
                id: 'reg-1',
                attendance: { attended: true },
            });

            await expect(service.completeAssessment(assessmentId, userId, completeDto)).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if completing POST before attendance', async () => {
            wellnessRepository.findById.mockResolvedValue({ ...mockAssessment, type: WellnessType.POST });
            registrationsRepository.findById.mockResolvedValue({
                id: 'reg-1',
                attendance: null,
            });

            await expect(service.completeAssessment(assessmentId, userId, completeDto)).rejects.toThrow(BadRequestException);
        });
    });

    describe('calculateImpact', () => {
        const registrationId = 'reg-1';

        it('should calculate impact correctly', async () => {
            wellnessRepository.findByRegistrationId.mockResolvedValue([
                { type: WellnessType.PRE, status: WellnessStatus.COMPLETED, sleepQuality: 5, stressLevel: 8, mood: 5 },
                { type: WellnessType.POST, status: WellnessStatus.COMPLETED, sleepQuality: 8, stressLevel: 4, mood: 8 },
            ]);

            const result = await service.calculateImpact(registrationId);

            expect(result).toEqual({
                sleepQualityChange: 3, // 8 - 5
                stressLevelChange: 4, // 8 - 4 (less stress is better)
                moodChange: 3, // 8 - 5
                overallImpact: 3.33, // (3 + 4 + 3) / 3
            });
        });

        it('should return nulls if assessments missing', async () => {
            wellnessRepository.findByRegistrationId.mockResolvedValue([]);

            const result = await service.calculateImpact(registrationId);

            expect(result).toEqual({
                sleepQualityChange: null,
                stressLevelChange: null,
                moodChange: null,
                overallImpact: null,
            });
        });
    });


    describe('findPendingByUser', () => {
        it('should return pending assessments', async () => {
            const mockAssessments = [{ id: 'wa-1' }];
            wellnessRepository.findPendingByUserId.mockResolvedValue(mockAssessments);
            const result = await service.findPendingByUser('user-1');
            expect(result).toEqual(mockAssessments);
        });
    });

    describe('findCompletedByUser', () => {
        it('should return completed assessments', async () => {
            const mockAssessments = [{ id: 'wa-1' }];
            wellnessRepository.findCompletedByUserId.mockResolvedValue(mockAssessments);
            const result = await service.findCompletedByUser('user-1');
            expect(result).toEqual(mockAssessments);
        });
    });

    describe('findById', () => {
        it('should return assessment if found', async () => {
            const mockAssessment = { id: 'wa-1' };
            wellnessRepository.findById.mockResolvedValue(mockAssessment);
            const result = await service.findById('wa-1');
            expect(result).toEqual(mockAssessment);
        });

        it('should throw NotFoundException if not found', async () => {
            wellnessRepository.findById.mockResolvedValue(null);
            await expect(service.findById('wa-1')).rejects.toThrow(NotFoundException);
        });
    });

    describe('getAssessmentsByRegistration', () => {
        it('should return assessments if authorized', async () => {
            registrationsRepository.findById.mockResolvedValue({ id: 'reg-1', userId: 'user-1' });
            wellnessRepository.findByRegistrationId.mockResolvedValue([]);

            const result = await service.getAssessmentsByRegistration('reg-1', 'user-1');
            expect(result).toEqual([]);
        });

        it('should throw NotFoundException if registration not found', async () => {
            registrationsRepository.findById.mockResolvedValue(null);
            await expect(service.getAssessmentsByRegistration('reg-1', 'user-1')).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException if user mismatch', async () => {
            registrationsRepository.findById.mockResolvedValue({ id: 'reg-1', userId: 'other-user' });
            await expect(service.getAssessmentsByRegistration('reg-1', 'user-1')).rejects.toThrow(ForbiddenException);
        });
    });

    describe('getImpactByRegistration', () => {
        it('should return impact if authorized', async () => {
            registrationsRepository.findById.mockResolvedValue({ id: 'reg-1', userId: 'user-1' });
            wellnessRepository.findByRegistrationId.mockResolvedValue([]);

            const result = await service.getImpactByRegistration('reg-1', 'user-1');
            expect(result.impact.overallImpact).toBeNull();
        });

        it('should throw NotFoundException if registration not found', async () => {
            registrationsRepository.findById.mockResolvedValue(null);
            await expect(service.getImpactByRegistration('reg-1', 'user-1')).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException if user mismatch', async () => {
            registrationsRepository.findById.mockResolvedValue({ id: 'reg-1', userId: 'other-user' });
            await expect(service.getImpactByRegistration('reg-1', 'user-1')).rejects.toThrow(ForbiddenException);
        });
    });
});
