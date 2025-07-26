import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth/auth.service';
import { User } from '../entities/user.entity';
import { UserService } from '../services/user.service';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
    let controller: AuthController;
    let authService: AuthService;
    let userService: UserService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                {
                    provide: AuthService,
                    useValue: {
                        login: jest.fn(),
                    },
                },
                {
                    provide: UserService,
                    useValue: {
                        findByWalletUserId: jest.fn(),
                        create: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<AuthController>(AuthController);
        authService = module.get<AuthService>(AuthService);
        userService = module.get<UserService>(UserService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('login', () => {
        it('should login existing user', async () => {
            const loginDto = {
                walletUserId: 'test-user-123',
                walletAddress: '0x1234567890abcdef',
            };

            const mockUser: User = {
                id: 1,
                walletUserId: 'test-user-123',
                walletAddress: '0x1234567890abcdef',
                nickname: 'TestUser',
                email: 'test@example.com',
                createdAt: new Date(),
                tokenAmount: 1000,
                availableToken: 500,
            } as User;

            const mockLoginResponse = {
                success: true,
                data: {
                    accessToken: 'test-token',
                },
                message: 'Login successful',
            };

            //
            jest.spyOn(userService, 'findByWalletUserId').mockResolvedValue(mockUser);
            jest.spyOn(authService, 'login').mockResolvedValue(mockLoginResponse);

            const result = await controller.login(loginDto);

            expect(userService.findByWalletUserId).toHaveBeenCalledWith(loginDto.walletUserId);
            expect(authService.login).toHaveBeenCalledWith({
                id: mockUser.id,
                username: mockUser.email || mockUser.walletUserId,
                walletAddress: mockUser.walletAddress,
            });
            expect(result).toEqual(mockLoginResponse);
        });

        it('should create new user if not exists', async () => {
            const loginDto = {
                walletUserId: 'new-user-123',
                walletAddress: '0xabcdef1234567890',
            };

            const mockUser: User = {
                id: 2,
                walletUserId: 'new-user-123',
                walletAddress: '0xabcdef1234567890',
                nickname: 'User1234567890',
                email: 'user1234567890@example.com',
                createdAt: new Date(),
                tokenAmount: 1000,
                availableToken: 500,
            } as User;

            const mockLoginResponse = {
                success: true,
                data: {
                    accessToken: 'new-token',
                },
                message: 'Login successful',
            };

            jest.spyOn(userService, 'findByWalletUserId').mockResolvedValue(null);
            jest.spyOn(userService, 'create').mockResolvedValue(mockUser);
            jest.spyOn(authService, 'login').mockResolvedValue(mockLoginResponse);

            const result = await controller.login(loginDto);

            expect(userService.findByWalletUserId).toHaveBeenCalledWith(loginDto.walletUserId);
            expect(userService.create).toHaveBeenCalledWith({
                walletUserId: loginDto.walletUserId,
                walletAddress: loginDto.walletAddress,
                nickname: expect.stringMatching(/^User\d+$/),
                email: expect.stringMatching(/^user\d+@example\.com$/),
            });
            expect(authService.login).toHaveBeenCalledWith({
                id: mockUser.id,
                username: mockUser.email || mockUser.walletUserId,
                walletAddress: mockUser.walletAddress,
            });
            expect(result).toEqual(mockLoginResponse);
        });
    });

    describe('createTestUser', () => {
        it('should create test user with token', async () => {
            const mockUser: User = {
                id: 3,
                walletUserId: 'test-user-1234567890',
                walletAddress: '0x1234567890abcdef',
                nickname: 'TestUser1234567890',
                email: 'test1234567890@example.com',
                createdAt: new Date(),
                tokenAmount: 1000,
                availableToken: 500,
            } as User;

            const mockLoginResponse = {
                success: true,
                data: {
                    accessToken: 'test-token',
                },
                message: 'Login successful',
            };

            jest.spyOn(userService, 'create').mockResolvedValue(mockUser);
            jest.spyOn(authService, 'login').mockResolvedValue(mockLoginResponse);

            const result = await controller.createTestUser();

            expect(userService.create).toHaveBeenCalledWith({
                walletUserId: expect.stringMatching(/^test-user-\d+$/),
                walletAddress: expect.stringMatching(/^0x[a-f0-9]+$/),
                nickname: expect.stringMatching(/^TestUser\d+$/),
                email: expect.stringMatching(/^test\d+@example\.com$/),
            });
            expect(authService.login).toHaveBeenCalledWith({
                id: mockUser.id,
                username: mockUser.email || mockUser.walletUserId,
                walletAddress: mockUser.walletAddress,
            });
            expect(result).toEqual({
                success: true,
                data: {
                    user: {
                        id: mockUser.id,
                        walletUserId: mockUser.walletUserId,
                        walletAddress: mockUser.walletAddress,
                        nickname: mockUser.nickname,
                        email: mockUser.email,
                    },
                    accessToken: mockLoginResponse.data?.accessToken,
                    message: 'Test user created successfully',
                },
            });
        });
    });

    describe('verifyToken', () => {
        it('should return success message', async () => {
            const result = await controller.verifyToken();

            expect(result).toEqual({
                success: true,
                message: 'Token is valid',
            });
        });
    });
}); 