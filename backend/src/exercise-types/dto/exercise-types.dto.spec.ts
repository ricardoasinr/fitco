import { validate } from 'class-validator';
import { CreateExerciseTypeDto } from './create-exercise-type.dto';
import { UpdateExerciseTypeDto } from './update-exercise-type.dto';

describe('ExerciseTypes DTOs', () => {
    describe('CreateExerciseTypeDto', () => {
        it('should validate valid dto', async () => {
            const dto = new CreateExerciseTypeDto();
            dto.name = 'Yoga';
            dto.isActive = true;
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should fail if name is missing', async () => {
            const dto = new CreateExerciseTypeDto();
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('name');
        });

        it('should fail if name is not a string', async () => {
            const dto = new CreateExerciseTypeDto();
            (dto as any).name = 123;
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
        });
    });

    describe('UpdateExerciseTypeDto', () => {
        it('should validate partial update', async () => {
            const dto = new UpdateExerciseTypeDto();
            dto.name = 'Pilates';
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });
});
