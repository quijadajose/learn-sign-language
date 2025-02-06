import { Module } from '@nestjs/common';
import { UsersService } from './application/users/users.service';
import { UsersController } from './infrastructure/users/users.controller';
import { AuthModule } from 'src/auth/auth.module';
import { LanguageModule } from 'src/language/language.module';
import { AuthService } from 'src/auth/application/auth.service';

@Module({
  imports: [AuthModule, LanguageModule],
  providers: [UsersService, AuthService],
  controllers: [UsersController],
})
export class UsersModule {}
