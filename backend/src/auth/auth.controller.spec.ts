import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

describe('AuthController', () => {
    let controller: AuthController;
    let service: any;

    beforeEach(async () => {
        service = {
            register: jest.fn(),
            login: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                {
                    provide: AuthService,
                    useValue: service,
                },
            ],
        }).compile();

        controller = module.get<AuthController>(AuthController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('register', () => {
        it('should register a user', async () => {
            const dto: RegisterDto = {
                email: 'test@test.com',
                password: 'password',
                name: 'Test',
            };
            const expected = { id: 'user-1', ...dto };
            service.register.mockResolvedValue(expected);

            const result = await controller.register(dto);

            expect(result).toEqual(expected);
            expect(service.register).toHaveBeenCalledWith(dto);
        });
    });

    describe('login', () => {
        it('should login a user', async () => {
            const dto: LoginDto = {
                email: 'test@test.com',
                password: 'password',
            };
            const expected = { accessToken: 'token' };
            service.login.mockResolvedValue(expected);

            const result = await controller.login(dto);

            expect(result).toEqual(expected);
            expect(service.login).toHaveBeenCalledWith(dto);
        });
    });

    describe('getProfile', () => {
        it('should return the user profile', () => {
            const user = { id: 'user-1', email: 'test@test.com' };
            const result = controller.getProfile(user);
            expect(result).toEqual(user);
        });
    });
});
