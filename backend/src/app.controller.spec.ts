import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
    let appController: AppController;

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({
            controllers: [AppController],
            providers: [AppService],
        }).compile();

        appController = app.get<AppController>(AppController);
    });

    describe('root', () => {
        it('should return "FITCO Wellness Platform API - Running"', () => {
            expect(appController.getHello()).toBe('FITCO Wellness Platform API - Running');
        });
    });

    describe('healthCheck', () => {
        it('should return health status', () => {
            const result = appController.healthCheck();
            expect(result).toHaveProperty('status', 'ok');
            expect(result).toHaveProperty('service', 'FITCO Backend API');
            expect(result).toHaveProperty('timestamp');
        });
    });
});
