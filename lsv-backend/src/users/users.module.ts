import { Module } from '@nestjs/common';
import { UsersService } from './application/users/users.service';
import { UsersController } from './infrastructure/users/users.controller';
import { AuthModule } from 'src/auth/auth.module';
import { AdminModule } from 'src/admin/admin.module';

@Module({
  imports: [AuthModule, AdminModule], // Añade AuthModule aquí
  providers: [UsersService],
  controllers: [UsersController]
})
export class UsersModule { }
