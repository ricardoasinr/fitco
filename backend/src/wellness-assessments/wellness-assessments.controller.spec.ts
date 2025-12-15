import { Test, TestingModule } from '@nestjs/testing';
import { WellnessAssessmentsController } from './wellness-assessments.controller';
import { WellnessAssessmentsService } from './wellness-assessments.service';
import { CompleteWellnessDto } from './dto/complete-wellness.dto';
import { Role } from '@prisma/client';

describe('WellnessAssessmentsController', () => {
    let controller: WellnessAssessmentsController;
    let service: any;

    beforeEach(async () => {
        service = {
            findPendingByUser: jest.fn(),
            findCompletedByUser: jest.fn(),
            getAssessmentsByRegistration: jest.fn(),
            getImpactByRegistration: jest.fn(),
            findById: jest.fn(),
            completeAssessment: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [WellnessAssessmentsController],
            providers: [
                {
                    provide: WellnessAssessmentsService,
                    useValue: service,
                },
            ],
        }).compile();

        controller = module.get<WellnessAssessmentsController>(WellnessAssessmentsController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('findPending', () => {
        it('should return pending assessments', async () => {
            const user = { id: 'user-1', email: 'test@test.com', name: 'Test', role: Role.USER };
            const expected = [{ id: 'wa-1' }];
            service.findPendingByUser.mockResolvedValue(expected);

            const result = await controller.findPending(user);

            expect(result).toEqual(expected);
            expect(service.findPendingByUser).toHaveBeenCalledWith(user.id);
        });
    });

    describe('findCompleted', () => {
        it('should return completed assessments', async () => {
            const user = { id: 'user-1', email: 'test@test.com', name: 'Test', role: Role.USER };
            const expected = [{ id: 'wa-2' }];
            service.findCompletedByUser.mockResolvedValue(expected);

            const result = await controller.findCompleted(user);

            expect(result).toEqual(expected);
            expect(service.findCompletedByUser).toHaveBeenCalledWith(user.id);
        });
    });

    describe('findByRegistration', () => {
        it('should return assessments by registration', async () => {
            const user = { id: 'user-1', email: 'test@test.com', name: 'Test', role: Role.USER };
            const expected = [{ id: 'wa-1' }];
            service.getAssessmentsByRegistration.mockResolvedValue(expected);

            const result = await controller.findByRegistration('reg-1', user);

            expect(result).toEqual(expected);
            expect(service.getAssessmentsByRegistration).toHaveBeenCalledWith('reg-1', user.id);
        });
    });

    describe('getImpact', () => {
        it('should return impact by registration', async () => {
            const user = { id: 'user-1', email: 'test@test.com', name: 'Test', role: Role.USER };
            const expected = { impact: 10 };
            service.getImpactByRegistration.mockResolvedValue(expected);

            const result = await controller.getImpact('reg-1', user);

            expect(result).toEqual(expected);
            expect(service.getImpactByRegistration).toHaveBeenCalledWith('reg-1', user.id);
        });
    });

    describe('findById', () => {
        it('should return assessment by ID', async () => {
            const expected = { id: 'wa-1' };
            service.findById.mockResolvedValue(expected);

            const result = await controller.findById('wa-1');

            expect(result).toEqual(expected);
            expect(service.findById).toHaveBeenCalledWith('wa-1');
        });
    });

    describe('complete', () => {
        it('should complete assessment', async () => {
            const user = { id: 'user-1', email: 'test@test.com', name: 'Test', role: Role.USER };
            const dto: CompleteWellnessDto = { sleepQuality: 8, stressLevel: 3, mood: 8 };
            const expected = { id: 'wa-1', status: 'COMPLETED' };

            service.completeAssessment.mockResolvedValue(expected);

            const result = await controller.complete('wa-1', user, dto);

            expect(result).toEqual(expected);
            expect(service.completeAssessment).toHaveBeenCalledWith('wa-1', user.id, dto);
        });
    });
});
