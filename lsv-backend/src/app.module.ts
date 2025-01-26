import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { validate } from './config/env.validation';
import { AuthModule } from './auth/auth.module';
import { User } from './shared/domain/entities/user';
import { MailerModule } from '@nestjs-modules/mailer';
import { UsersModule } from './users/users.module';
import { UsersService } from './users/application/users/users.service';
import { UserLesson } from './shared/domain/entities/userLesson';
import { Lesson } from './shared/domain/entities/lesson';
import { AdminModule } from './admin/admin.module';
import { Stages } from './shared/domain/entities/stage';
import { Language } from './shared/domain/entities/language';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate, // Usa la función de validación con class-validator
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: Number(configService.get('DB_PORT')),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [User, Language, Stages, Lesson, UserLesson],
        synchronize: true,
      }),

    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('EMAIL_HOST'),
          port: configService.get<number>('EMAIL_PORT', 587),
          auth: {
            user: configService.get<string>('EMAIL_USER'), // Usuario SMTP desde .env
            pass: configService.get<string>('EMAIL_PASSWORD'), // Contraseña SMTP desde .env
          },
        },
      }),
    }),
    AuthModule,
    UsersModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService, UsersService],
})
export class AppModule { }
