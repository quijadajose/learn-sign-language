import { Module } from '@nestjs/common';
import { AuthService } from './application/auth.service';
import { AuthController } from './infrastructure/auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/shared/domain/entities/user';
import { RegisterUserUseCase } from './domain/use-cases/register-user/register-user';
import { UserRepository } from './infrastructure/typeorm/user.repository/user.repository';
import { BcryptService } from './infrastructure/services/bcrypt.service';
import { JwtAuthService } from './infrastructure/services/jwt-auth.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [
    AuthService,
    RegisterUserUseCase,
    {
      provide: 'TokenService',
      useClass: JwtAuthService
    },
    {
      provide: 'HashService',
      useClass: BcryptService
    },
    {
      provide: 'UserRepositoryInterface',
      useClass: UserRepository,
    }
  ],
  controllers: [AuthController]
})
export class AuthModule { }
