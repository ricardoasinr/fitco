import {
    registerDecorator,
    ValidationOptions,
    ValidationArguments,
} from 'class-validator';
import { RecurrenceType } from '@prisma/client';

export function IsValidRecurrencePattern(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isValidRecurrencePattern',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    const obj = args.object as any;
                    const type = obj.recurrenceType;

                    if (!type || type === RecurrenceType.SINGLE) return true;

                    if (type === RecurrenceType.WEEKLY) {
                        // Check if schedules exist, if so, they handle the weekdays validation
                        if (obj.schedules && obj.schedules.length > 0) return true;

                        // Otherwise, pattern must have weekdays
                        if (!value || !Array.isArray(value.weekdays) || value.weekdays.length === 0) {
                            return false;
                        }
                        // Validate weekdays range
                        return value.weekdays.every((d: number) => d >= 0 && d <= 6);
                    }

                    if (type === RecurrenceType.INTERVAL) {
                        if (!value || typeof value.intervalDays !== 'number' || value.intervalDays < 1) {
                            return false;
                        }
                    }

                    return true;
                },
                defaultMessage(args: ValidationArguments) {
                    const obj = args.object as any;
                    if (obj.recurrenceType === RecurrenceType.WEEKLY) {
                        return 'Weekly recurrence requires valid weekdays (0-6) in pattern or schedules';
                    }
                    if (obj.recurrenceType === RecurrenceType.INTERVAL) {
                        return 'Interval recurrence requires intervalDays >= 1';
                    }
                    return 'Invalid recurrence pattern';
                },
            },
        });
    };
}
