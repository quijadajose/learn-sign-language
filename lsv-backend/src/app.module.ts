import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { validate } from './config/env.validation';
import { AuthModule } from './auth/auth.module';
import { User } from './shared/domain/entities/user';
import { MailerModule } from '@nestjs-modules/mailer';
import { UsersModule } from './users/users.module';
import { UsersService } from './users/application/users/users.service';
import { UserLesson } from './shared/domain/entities/userLesson';
import { Lesson } from './shared/domain/entities/lesson';
import { Stages } from './shared/domain/entities/stage';
import { Language } from './shared/domain/entities/language';
import { ImagesController } from './shared/infrastructure/controllers/images/images.controller';
import { LessonModule } from './lesson/lesson.module';
import { StageModule } from './stage/stage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate,
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
            user: configService.get<string>('EMAIL_USER'),
            pass: configService.get<string>('EMAIL_PASSWORD'),
          },
        },
      }),
    }),
    AuthModule,
    UsersModule,
    LessonModule,
    StageModule,
  ],
  controllers: [ImagesController],
  providers: [UsersService],
})
export class AppModule {}
