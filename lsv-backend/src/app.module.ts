import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { validate } from './config/env.validation.js';
import { AuthModule } from './auth/auth.module.js';
import { User } from './shared/domain/entities/user.js';
import { UsersModule } from './users/users.module.js';
import { UserLesson } from './shared/domain/entities/userLesson.js';
import { Lesson } from './shared/domain/entities/lesson.js';
import { Stages } from './shared/domain/entities/stage.js';
import { Language } from './shared/domain/entities/language.js';
import { ImagesController } from './shared/infrastructure/controllers/images/images.controller.js';
import { LessonModule } from './lesson/lesson.module.js';
import { StageModule } from './stage/stage.module.js';
import { UserLessonModule } from './user-lesson/user-lesson.module.js';
import { Quiz } from './shared/domain/entities/quiz.js';
import { QuizSubmission } from './shared/domain/entities/quizSubmission.js';
import { Question } from './shared/domain/entities/question.js';
import { Option } from './shared/domain/entities/option.js';
import { QuizModule } from './quiz/quiz.module.js';
import { LeaderboardModule } from './leaderboard/leaderboard.module.js';
import { UploadPictureUseCase } from './shared/application/use-cases/upload-picture-use-case/upload-picture-use-case.js';
import { LanguageModule } from './language/language.module.js';
import { RegionModule } from './region/region.module.js';
import { CountryDivisionModule } from './shared/country-division.module.js';
import { UserLanguage } from './shared/domain/entities/userLanguage.js';
import { UserRegion } from './shared/domain/entities/userRegion.js';
import { Region } from './shared/domain/entities/region.js';
import { LessonVariant } from './shared/domain/entities/lessonVariant.js';
import { QuizVariant } from './shared/domain/entities/quizVariant.js';
import { QuestionVariant } from './shared/domain/entities/questionVariant.js';
import { OptionVariant } from './shared/domain/entities/optionVariant.js';
import { Country } from './shared/domain/entities/iso-3166-2/countries.js';
import { Division } from './shared/domain/entities/iso-3166-2/divisions.js';
import { SeederService } from './seeder/seeder.service.js';
import { Sign } from './shared/domain/entities/sign.js';
import { SignVariant } from './shared/domain/entities/signVariant.js';
import { LessonModel } from './shared/domain/entities/lessonModel.js';
import { SignRecording } from './shared/domain/entities/signRecording.js';
import { ModeratorPermission } from './shared/domain/entities/moderatorPermission.js';
import { ModeratorModule } from './moderator/moderator.module.js';
import { PermissionsModule } from './permissions/permissions.module.js';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { HealthModule } from './health/health.module.js';
import { SignRecordModule } from './sign-record/sign-record.module.js';
import { AppThrottlerGuard } from './auth/infrastructure/guards/app-throttler.guard.js';
import {
  I18nHttpExceptionFilter,
  I18nResponseInterceptor,
} from './i18n/index.js';

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      validate,
      isGlobal: true,
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('VALKEY_HOST'),
          port: config.get('VALKEY_PORT'),
          password: config.get('VALKEY_PASSWORD'),
        },
      }),
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: Number(configService.get('DB_PORT')),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [
          User,
          Language,
          Stages,
          Lesson,
          UserLesson,
          Quiz,
          QuizSubmission,
          Question,
          Option,
          UserLanguage,
          UserRegion,
          Region,
          LessonVariant,
          QuizVariant,
          QuestionVariant,
          OptionVariant,
          Country,
          Division,
          ModeratorPermission,
          Sign,
          SignVariant,
          SignRecording,
          LessonModel,
        ],
        synchronize: false,
        migrations: [join(import.meta.dirname, '/db/migrations/*.{ts,js}')],
        // Default true for single-instance deploys. Set RUN_MIGRATIONS=false
        // when running migrations as a separate job (multi-replica).
        migrationsRun: configService.get<string>('RUN_MIGRATIONS') !== 'false',
      }),
    }),
    PermissionsModule,
    AuthModule,
    UsersModule,
    LessonModule,
    StageModule,
    UserLessonModule,
    QuizModule,
    LeaderboardModule,
    LanguageModule,
    RegionModule,
    CountryDivisionModule,
    ModeratorModule,
    HealthModule,
    SignRecordModule,
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: 60000,
            // E2E suites share Valkey with many register/login calls.
            limit: config.get<string>('NODE_ENV') === 'test' ? 10_000 : 100,
          },
        ],
        storage: new ThrottlerStorageRedisService({
          host: config.get('VALKEY_HOST'),
          port: config.get('VALKEY_PORT'),
          password: config.get('VALKEY_PASSWORD'),
        }),
      }),
    }),
  ],
  controllers: [ImagesController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    {
      provide: APP_FILTER,
      useClass: I18nHttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: I18nResponseInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
    },
    UploadPictureUseCase,
    SeederService,
  ],
})
export class AppModule {}
