import { validate } from 'class-validator';
import { IsAfterDate, IsNotInPast } from './date.validators';

class TestDto {
    @IsNotInPast()
    startDate: string;

    @IsAfterDate('startDate')
    endDate: string;

    constructor(startDate: string, endDate: string) {
        this.startDate = startDate;
        this.endDate = endDate;
    }
}

describe('DateValidators', () => {
    describe('IsNotInPast', () => {
        it('should validate future date', async () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 1);
            const endDate = new Date(futureDate);
            endDate.setMinutes(endDate.getMinutes() + 1);
            const dto = new TestDto(futureDate.toISOString(), endDate.toISOString());
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should fail for past date', async () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 1);
            const dto = new TestDto(pastDate.toISOString(), pastDate.toISOString());
            const errors = await validate(dto);
            expect(errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        property: 'startDate',
                        constraints: { isNotInPast: 'startDate cannot be in the past' },
                    }),
                ]),
            );
        });
    });

    describe('IsAfterDate', () => {
        it('should validate end date after start date', async () => {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() + 1);
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 2);

            const dto = new TestDto(startDate.toISOString(), endDate.toISOString());
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should fail if end date is before start date', async () => {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() + 2);
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 1);

            const dto = new TestDto(startDate.toISOString(), endDate.toISOString());
            const errors = await validate(dto);
            expect(errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        property: 'endDate',
                        constraints: { isAfterDate: 'endDate must be after startDate' },
                    }),
                ]),
            );
        });
    });
});
