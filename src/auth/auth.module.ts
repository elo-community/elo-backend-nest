import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { UserService } from '../services/user.service';
import { AuthService } from './auth.service';
import { jwtConstants } from './constants';
import { JwtStrategy } from './jwt.strategy';

@Module({
    imports: [
        PassportModule,
        TypeOrmModule.forFeature([User]),
        JwtModule.register({
            secret: jwtConstants.secret,
            signOptions: { expiresIn: '24h' },
        }),
    ],
    providers: [AuthService, JwtStrategy, UserService],
    exports: [AuthService],
})
export class AuthModule { } 