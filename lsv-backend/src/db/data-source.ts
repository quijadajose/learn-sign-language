import { DataSource } from 'typeorm';
import { User } from '../shared/domain/entities/user';
import { Language } from '../shared/domain/entities/language';
import { Stages } from '../shared/domain/entities/stage';
import { Lesson } from '../shared/domain/entities/lesson';
import { UserLesson } from '../shared/domain/entities/userLesson';
import { Quiz } from '../shared/domain/entities/quiz';
import { QuizSubmission } from '../shared/domain/entities/quizSubmission';
import { Question } from '../shared/domain/entities/question';
import { Option } from '../shared/domain/entities/option';
import { UserLanguage } from '../shared/domain/entities/userLanguage';
import { UserRegion } from '../shared/domain/entities/userRegion';
import { Region } from '../shared/domain/entities/region';
import { LessonVariant } from '../shared/domain/entities/lessonVariant';
import { QuizVariant } from '../shared/domain/entities/quizVariant';
import { QuestionVariant } from '../shared/domain/entities/questionVariant';
import { OptionVariant } from '../shared/domain/entities/optionVariant';
import { Country } from '../shared/domain/entities/iso-3166-2/countries';
import { Division } from '../shared/domain/entities/iso-3166-2/divisions';
import { ModeratorPermission } from '../shared/domain/entities/moderatorPermission';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
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
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  synchronize: false,
});
