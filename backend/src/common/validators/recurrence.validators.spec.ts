import { validate } from 'class-validator';
import { IsValidRecurrencePattern } from './recurrence.validators';
import { RecurrenceType } from '@prisma/client';

class TestDto {
    recurrenceType: RecurrenceType;
    schedules?: any[];

    @IsValidRecurrencePattern()
    pattern: any;

    constructor(type: RecurrenceType, pattern: any, schedules?: any[]) {
        this.recurrenceType = type;
        this.pattern = pattern;
        this.schedules = schedules;
    }
}

describe('RecurrenceValidators', () => {
    it('should validate SINGLE recurrence (no pattern needed)', async () => {
        const dto = new TestDto(RecurrenceType.SINGLE, null);
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    describe('WEEKLY', () => {
        it('should validate valid weekly pattern', async () => {
            const dto = new TestDto(RecurrenceType.WEEKLY, { weekdays: [1, 3, 5] });
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should validate if schedules are present', async () => {
            const dto = new TestDto(RecurrenceType.WEEKLY, null, [{ dayOfWeek: 1 }]);
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should fail if no weekdays and no schedules', async () => {
            const dto = new TestDto(RecurrenceType.WEEKLY, {});
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isValidRecurrencePattern');
        });

        it('should fail if invalid weekdays', async () => {
            const dto = new TestDto(RecurrenceType.WEEKLY, { weekdays: [8] });
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
        });
    });

    describe('INTERVAL', () => {
        it('should validate valid interval', async () => {
            const dto = new TestDto(RecurrenceType.INTERVAL, { intervalDays: 2 });
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should fail if intervalDays missing', async () => {
            const dto = new TestDto(RecurrenceType.INTERVAL, {});
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
        });

        it('should fail if intervalDays < 1', async () => {
            const dto = new TestDto(RecurrenceType.INTERVAL, { intervalDays: 0 });
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
        });
    });
});
