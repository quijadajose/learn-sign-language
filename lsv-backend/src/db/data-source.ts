import { DataSource } from 'typeorm';
import { User } from '../shared/domain/entities/user.js';
import { Language } from '../shared/domain/entities/language.js';
import { Stages } from '../shared/domain/entities/stage.js';
import { Lesson } from '../shared/domain/entities/lesson.js';
import { UserLesson } from '../shared/domain/entities/userLesson.js';
import { Quiz } from '../shared/domain/entities/quiz.js';
import { QuizSubmission } from '../shared/domain/entities/quizSubmission.js';
import { Question } from '../shared/domain/entities/question.js';
import { Option } from '../shared/domain/entities/option.js';
import { UserLanguage } from '../shared/domain/entities/userLanguage.js';
import { UserRegion } from '../shared/domain/entities/userRegion.js';
import { Region } from '../shared/domain/entities/region.js';
import { LessonVariant } from '../shared/domain/entities/lessonVariant.js';
import { QuizVariant } from '../shared/domain/entities/quizVariant.js';
import { QuestionVariant } from '../shared/domain/entities/questionVariant.js';
import { OptionVariant } from '../shared/domain/entities/optionVariant.js';
import { Country } from '../shared/domain/entities/iso-3166-2/countries.js';
import { Division } from '../shared/domain/entities/iso-3166-2/divisions.js';
import { ModeratorPermission } from '../shared/domain/entities/moderatorPermission.js';
import { Sign } from '../shared/domain/entities/sign.js';
import { SignVariant } from '../shared/domain/entities/signVariant.js';
import { SignRecording } from '../shared/domain/entities/signRecording.js';
import { LessonModel } from '../shared/domain/entities/lessonModel.js';

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
    Sign,
    SignVariant,
    SignRecording,
    LessonModel,
  ],
  migrations: [import.meta.dirname + '/migrations/*.{ts,js}'],
  synchronize: false,
});
