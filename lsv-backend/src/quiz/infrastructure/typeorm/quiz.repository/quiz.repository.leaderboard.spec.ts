import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { QuizRepository } from './quiz.repository.js';
import {
  PaginationDto,
  SortOrder,
} from '../../../../shared/domain/dto/PaginationDto.js';
import { User } from '../../../../shared/domain/entities/user.js';
import { UserLesson } from '../../../../shared/domain/entities/userLesson.js';
import { Lesson } from '../../../../shared/domain/entities/lesson.js';
import { Stages } from '../../../../shared/domain/entities/stage.js';
import { Language } from '../../../../shared/domain/entities/language.js';
import { Quiz } from '../../../../shared/domain/entities/quiz.js';
import { QuizSubmission } from '../../../../shared/domain/entities/quizSubmission.js';
import { Question } from '../../../../shared/domain/entities/question.js';
import { Option } from '../../../../shared/domain/entities/option.js';
import { UserLanguage } from '../../../../shared/domain/entities/userLanguage.js';
import { UserRegion } from '../../../../shared/domain/entities/userRegion.js';
import { Region } from '../../../../shared/domain/entities/region.js';
import { LessonVariant } from '../../../../shared/domain/entities/lessonVariant.js';
import { QuizVariant } from '../../../../shared/domain/entities/quizVariant.js';
import { QuestionVariant } from '../../../../shared/domain/entities/questionVariant.js';
import { OptionVariant } from '../../../../shared/domain/entities/optionVariant.js';
import { Country } from '../../../../shared/domain/entities/iso-3166-2/countries.js';
import { Division } from '../../../../shared/domain/entities/iso-3166-2/divisions.js';
import { Sign } from '../../../../shared/domain/entities/sign.js';
import { SignVariant } from '../../../../shared/domain/entities/signVariant.js';
import { LessonModel } from '../../../../shared/domain/entities/lessonModel.js';
import { SignRecording } from '../../../../shared/domain/entities/signRecording.js';
import { ModeratorPermission } from '../../../../shared/domain/entities/moderatorPermission.js';

/**
 * BE-07: estas pruebas generan el SQL real del leaderboard con el driver de
 * Postgres (sin conexión) y verifican que:
 *  - la suma se haga solo sobre el subquery de máximos por quiz, sin volver a
 *    unir todas las filas de quiz_submission (eso multiplicaba el total por el
 *    número de envíos);
 *  - se emita LIMIT/OFFSET de verdad.
 * El comportamiento con datos reales queda cubierto en test/leaderboard.e2e-spec.ts.
 */
describe('QuizRepository leaderboard (BE-07)', () => {
  let dataSource: DataSource;
  let repository: QuizRepository;
  let queries: string[];
  let parameters: unknown[][];
  let rawRows: Record<string, unknown>[];

  const record = (qb: SelectQueryBuilder<unknown>) => {
    const [sql, params] = qb.getQueryAndParameters();
    queries.push(sql);
    parameters.push(params);
  };

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'postgres',
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
    });
    // Construye la metadata sin abrir conexión a la base de datos.
    await (
      dataSource as unknown as { buildMetadatas(): Promise<void> }
    ).buildMetadatas();
  });

  beforeEach(() => {
    queries = [];
    parameters = [];
    rawRows = [];
    jest
      .spyOn(SelectQueryBuilder.prototype, 'getRawOne')
      .mockImplementation(function (this: SelectQueryBuilder<unknown>) {
        record(this);
        return Promise.resolve({ count: '3' });
      });
    jest
      .spyOn(SelectQueryBuilder.prototype, 'getRawMany')
      .mockImplementation(function (this: SelectQueryBuilder<unknown>) {
        record(this);
        return Promise.resolve(rawRows);
      });

    const unused = {} as Repository<never>;
    repository = new QuizRepository(
      unused,
      unused,
      unused,
      unused,
      dataSource.getRepository(QuizSubmission),
    );
  });

  afterEach(() => jest.restoreAllMocks());

  const pagination = (overrides: Partial<PaginationDto> = {}) =>
    Object.assign(new PaginationDto(), overrides);

  const dataQuery = () => {
    const sql = queries.find((q) => q.includes('SUM('));
    expect(sql).toBeDefined();
    return sql as string;
  };

  const countOccurrences = (haystack: string, needle: string) =>
    haystack.split(needle).length - 1;

  it.each([
    ['general', (r: QuizRepository, p: PaginationDto) => r.getLeaderboard(p)],
    [
      'por lenguaje',
      (r: QuizRepository, p: PaginationDto) =>
        r.getLeaderboardByLanguageId('7f1d2c64-8a5e-4e0e-9d55-0d5a3f0f2b11', p),
    ],
  ])(
    '%s: suma solo el máximo por quiz, sin re-unir todos los envíos',
    async (_name, call) => {
      await call(repository, pagination());

      const sql = dataQuery();
      // quiz_submission debe aparecer una sola vez: dentro del subquery de
      // máximos. Si aparece también en el FROM externo, cada máximo se repite
      // una vez por envío y el total se infla.
      expect(countOccurrences(sql, '"quiz_submission"')).toBe(1);
      expect(sql).toMatch(/SUM\("best"\."maxScore"\)/);
    },
  );

  it.each([
    ['general', (r: QuizRepository, p: PaginationDto) => r.getLeaderboard(p)],
    [
      'por lenguaje',
      (r: QuizRepository, p: PaginationDto) =>
        r.getLeaderboardByLanguageId('7f1d2c64-8a5e-4e0e-9d55-0d5a3f0f2b11', p),
    ],
  ])('%s: pagina con LIMIT/OFFSET reales', async (_name, call) => {
    await call(repository, pagination({ page: 3, limit: 25 }));

    expect(dataQuery()).toMatch(/LIMIT 25 OFFSET 50$/);
  });

  it('el filtro por lenguaje va dentro del subquery y el total cuenta usuarios distintos', async () => {
    await repository.getLeaderboardByLanguageId(
      '7f1d2c64-8a5e-4e0e-9d55-0d5a3f0f2b11',
      pagination(),
    );

    expect(queries).toHaveLength(2);
    expect(queries.some((q) => q.includes('COUNT(DISTINCT'))).toBe(true);
    queries.forEach((sql, i) => {
      expect(sql).toMatch(/"languageId"\) = \$1 GROUP BY/);
      expect(parameters[i]).toEqual(['7f1d2c64-8a5e-4e0e-9d55-0d5a3f0f2b11']);
      expect(countOccurrences(sql, '"quiz_submission"')).toBe(1);
    });
  });

  it('ordena por alias permitido con desempate estable y mapea la respuesta', async () => {
    rawRows = [
      { userId: 'u1', firstName: 'Ana', lastName: 'García', totalScore: '200' },
    ];

    const result = await repository.getLeaderboard(
      pagination({ page: 1, limit: 10, sortOrder: SortOrder.ASC }),
    );

    expect(dataQuery()).toMatch(
      /ORDER BY "totalScore" ASC, "userId" ASC LIMIT 10 OFFSET 0$/,
    );
    expect(result).toEqual({
      data: [
        { userId: 'u1', firstName: 'Ana', lastName: 'García', totalScore: 200 },
      ],
      total: 3,
      page: 1,
      pageSize: 10,
    });
  });

  it('ignora orderBy fuera de la lista permitida', async () => {
    await repository.getLeaderboard(
      pagination({ orderBy: 'password', sortOrder: SortOrder.DESC }),
    );

    expect(dataQuery()).toMatch(/ORDER BY "totalScore" DESC, "userId" ASC/);
    expect(dataQuery()).not.toContain('password');
  });
});
