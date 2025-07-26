import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
    let service: AuthService;
    let jwtService: JwtService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: JwtService,
                    useValue: {
                        sign: jest.fn().mockReturnValue('test-token'),
                    },
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        jwtService = module.get<JwtService>(JwtService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('login', () => {
        it('should return a valid login response', async () => {
            const user = {
                id: 1,
                username: 'test@example.com',
                walletAddress: '0x1234567890abcdef',
            };

            const result = await service.login(user);

            expect(result).toEqual({
                success: true,
                data: {
                    accessToken: 'test-token',
                },
                message: 'Login successful',
            });

            expect(jwtService.sign).toHaveBeenCalledWith({
                username: user.username,
                sub: user.id,
                walletAddress: user.walletAddress,
            });
        });
    });
}); 