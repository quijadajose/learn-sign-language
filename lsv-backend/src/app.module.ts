import { Module } from '@nestjs/common';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { validate } from './config/env.validation';
import { AuthModule } from './auth/auth.module';
import { User } from './shared/domain/entities/user';
import { MailerModule } from '@nestjs-modules/mailer';
import { UsersModule } from './users/users.module';
import { UserLesson } from './shared/domain/entities/userLesson';
import { Lesson } from './shared/domain/entities/lesson';
import { Stages } from './shared/domain/entities/stage';
import { Language } from './shared/domain/entities/language';
import { ImagesController } from './shared/infrastructure/controllers/images/images.controller';
import { LessonModule } from './lesson/lesson.module';
import { StageModule } from './stage/stage.module';
import { UserLessonModule } from './user-lesson/user-lesson.module';
import { Quiz } from './shared/domain/entities/quiz';
import { QuizSubmission } from './shared/domain/entities/quizSubmission';
import { Question } from './shared/domain/entities/question';
import { Option } from './shared/domain/entities/option';
import { QuizModule } from './quiz/quiz.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { UploadPictureUseCase } from './shared/application/use-cases/upload-picture-use-case/upload-picture-use-case';
import { LanguageModule } from './language/language.module';
import { RegionModule } from './region/region.module';
import { CountryDivisionModule } from './shared/country-division.module';
import { UserLanguage } from './shared/domain/entities/userLanguage';
import { UserRegion } from './shared/domain/entities/userRegion';
import { Region } from './shared/domain/entities/region';
import { LessonVariant } from './shared/domain/entities/lessonVariant';
import { QuizVariant } from './shared/domain/entities/quizVariant';
import { QuestionVariant } from './shared/domain/entities/questionVariant';
import { OptionVariant } from './shared/domain/entities/optionVariant';
import { Country } from './shared/domain/entities/iso-3166-2/countries';
import { Division } from './shared/domain/entities/iso-3166-2/divisions';
import { SeederService } from './seeder/seeder.service';
import { ModeratorPermission } from './shared/domain/entities/moderatorPermission';
import { ModeratorModule } from './moderator/moderator.module';

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
        ],
        synchronize: configService.get<string>('NODE_ENV') === 'development',
        migrations: [join(__dirname, '/db/migrations/*.{ts,js}')],
        migrationsRun: configService.get<string>('NODE_ENV') !== 'development',
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
    UserLessonModule,
    QuizModule,
    LeaderboardModule,
    LanguageModule,
    RegionModule,
    CountryDivisionModule,
    ModeratorModule,
  ],
  controllers: [ImagesController],
  providers: [UploadPictureUseCase, SeederService],
})
export class AppModule { }
