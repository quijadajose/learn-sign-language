import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FindUserUseCase } from 'src/auth/domain/use-cases/find-user/find-user';
import { RegisterUserUseCase } from 'src/auth/domain/use-cases/register-user/register-user';
import { CreateLanguageUseCase } from 'src/language/application/use-cases/create-language-use-case/create-language-use-case';
import { LanguageRepositoryInterface } from 'src/language/domain/ports/language.repository.interface/language.repository.interface';
import { CreateLessonUseCase } from 'src/lesson/application/use-cases/create-lesson-use-case/create-lesson-use-case';
import { LessonRepositoryInterface } from 'src/lesson/domain/ports/lesson.repository.interface/lesson.repository.interface';
import { CreateQuizWithQuestionsAndOptionsUseCase } from 'src/quiz/application/use-cases/create-quiz-with-questions-and-options-use-case/create-quiz-with-questions-and-options-use-case';
import { StageService } from 'src/stage/application/services/stage/stage.service';
import { CreateStageUseCase } from 'src/stage/application/use-cases/create-stage-use-case/create-stage-use-case';
import { StageRepositoryInterface } from 'src/stage/domain/ports/stage.repository.interface/stage.repository.interface';
import { RegionService } from 'src/region/application/services/region/region.service';
import { CountryDivisionService } from 'src/shared/application/services/country-division.service';
import * as countriesData from './iso-3166-2.json';

@Injectable()
export class SeederService implements OnModuleInit {
  private languageId: string;
  private stageId: string;
  private lessonId: string;
  constructor(
    private readonly configService: ConfigService,
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly findUserUseCase: FindUserUseCase,
    private readonly createLanguageUseCase: CreateLanguageUseCase,
    @Inject('LanguageRepositoryInterface')
    private readonly languageRepository: LanguageRepositoryInterface,
    private readonly createStageUseCase: CreateStageUseCase,
    private readonly StageService: StageService,

    @Inject('StageRepositoryInterface')
    private readonly stageRepository: StageRepositoryInterface,

    private readonly createLessonUseCase: CreateLessonUseCase,
    @Inject('LessonRepositoryInterface')
    private readonly lessonRepository: LessonRepositoryInterface,
    private readonly createQuizWithQuestionsAndOptionsUseCase: CreateQuizWithQuestionsAndOptionsUseCase,
    private readonly regionService: RegionService,
    private readonly countryDivisionService: CountryDivisionService,
  ) {}
  onModuleInit() {
    this.seed();
  }
  public async seed() {
    console.log('Seeding...');
    await this.seedAdminUser();
    await this.seedLanguages();
    await this.seedRegions();
    await this.seedCountriesAndDivisions();
    await this.seedStages();
    await this.seedLessons();
    await this.seedQuiz();
    console.log('Seeding completed.');
  }
  private async seedAdminUser() {
    if (
      !(await this.findUserUseCase.findByEmail(
        this.configService.get<string>('API_ADMIN_EMAIL'),
      ))
    ) {
      const admin = await this.registerUserUseCase.register({
        age: 20,
        email: this.configService.get<string>('API_ADMIN_EMAIL'),
        firstName: 'admin',
        lastName: 'admin',
        password: this.configService.get<string>('API_ADMIN_PASSWORD'),
        isRightHanded: true,
        role: 'admin',
      });
    }
  }
  private async seedLanguages() {
    const lang = await this.languageRepository.findByName(
      'Lenguaje de señas Venezolano',
    );

    this.languageId = lang?.id;

    if (!lang) {
      const language = await this.createLanguageUseCase.execute({
        name: 'Lenguaje de señas Venezolano',
        description:
          'El sistema de comunicación visual usado por la comunidad sorda',
      });

      this.languageId = language.id;
    }
  }

  private async seedRegions() {
    if (!this.languageId) {
      console.log('No language ID available for seeding regions');
      return;
    }

    const regions = [
      {
        name: 'Mérida',
        code: 'MD',
        description: 'Estado Mérida - Región andina venezolana',
        isDefault: false,
        languageId: this.languageId,
      },
      {
        name: 'Nueva Esparta',
        code: 'NV',
        description: 'Estado Nueva Esparta - Isla de Margarita',
        isDefault: true,
        languageId: this.languageId,
      },
      {
        name: 'Caracas',
        code: 'CCS',
        description: 'Distrito Capital - Caracas',
        isDefault: false,
        languageId: this.languageId,
      },
      {
        name: 'Zulia',
        code: 'ZU',
        description: 'Estado Zulia - Maracaibo',
        isDefault: false,
        languageId: this.languageId,
      },
      {
        name: 'Lara',
        code: 'LA',
        description: 'Estado Lara - Barquisimeto',
        isDefault: false,
        languageId: this.languageId,
      },
    ];

    for (const regionData of regions) {
      try {
        await this.regionService.createRegion(regionData);
        console.log(`Created region: ${regionData.name}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`Region ${regionData.name} already exists, skipping...`);
        } else {
          console.log(
            `Error creating region ${regionData.name}:`,
            error.message,
          );
        }
      }
    }
  }
  private async seedStages() {
    const stages = [
      {
        name: 'A I',
        description:
          'Puede utilizar señas básicas para comunicarse en tareas sencillas y rutinarias',
      },
      {
        name: 'A II',
        description:
          'Puede comprender señas frecuentes relacionadas con áreas de experiencia relevantes',
      },
      {
        name: 'B I',
        description:
          'Puede desenvolverse en situaciones comunes usando lenguaje de señas con fluidez básica',
      },
      {
        name: 'B II',
        description:
          'Puede interactuar con usuarios nativos de lenguaje de señas con fluidez y naturalidad',
      },
      {
        name: 'C I',
        description:
          'Puede comprender señas complejas y expresarse con claridad y estructura',
      },
      {
        name: 'C II',
        description:
          'Puede expresarse espontáneamente en lenguaje de señas con gran precisión y matices sutiles',
      },
    ];

    for (const stageData of stages) {
      let stage = await this.stageRepository.findByNameInLanguage(
        stageData.name,
        this.languageId,
      );

      if (!stage) {
        stage = await this.createStageUseCase.execute({
          languageId: this.languageId,
          name: stageData.name,
          description: stageData.description,
        });
      }
      if (stageData.name === 'A I') {
        this.stageId = stage.id;
      }
    }
  }
  private async seedLessons() {
    const lesson = await this.lessonRepository.findByNameInLanguage(
      'El abecedario',
      this.languageId,
    );
    this.lessonId = lesson?.id;
    if (!this.lessonId && this.languageId && this.stageId) {
      const lesson = await this.createLessonUseCase.execute({
        name: 'El abecedario',
        content: 'A,B,C ... , X,Y,Z',
        description: 'El abecedario de la A a la Z',
        languageId: this.languageId,
        stageId: this.stageId,
      });
      this.lessonId = lesson.id;
    }
  }
  private async seedQuiz() {
    if (this.lessonId) {
      await this.createQuizWithQuestionsAndOptionsUseCase.execute({
        lessonId: this.lessonId,
        questions: [
          {
            text: '¿Cual es 2 + 2?',
            options: [
              {
                text: '4',
                isCorrect: true,
              },
              {
                text: '5',
                isCorrect: false,
              },
            ],
          },
          {
            text: '¿Cual es 3 + 3?',
            options: [
              {
                text: '6',
                isCorrect: true,
              },
              {
                text: '5',
                isCorrect: false,
              },
            ],
          },
          {
            text: '¿Cual es 4 + 4?',
            options: [
              {
                text: '8',
                isCorrect: true,
              },
              {
                text: '5',
                isCorrect: false,
              },
            ],
          },
        ],
      });
    }
  }
  private async seedCountriesAndDivisions() {
    let countriesInserted = 0;
    let divisionsInserted = 0;

    for (const [countryCode, countryData] of Object.entries(countriesData)) {
      try {
        const country = await this.countryDivisionService.createCountry({
          code: countryCode,
          name: countryData.name,
        });
        countriesInserted++;

        for (const [divisionCode, divisionName] of Object.entries(
          countryData.divisions,
        )) {
          try {
            await this.countryDivisionService.createDivision({
              code: divisionCode,
              name: divisionName as string,
              countryCode: country.code,
            });
            divisionsInserted++;
          } catch (error) {
            if (!error.message.includes('already exists')) {
              console.error(
                `Error creating division ${divisionCode}:`,
                error.message,
              );
            }
          }
        }
      } catch (error) {
        if (!error.message.includes('already exists')) {
          console.error(
            `Error creating country ${countryCode}:`,
            error.message,
          );
        }
      }
    }

    console.log(
      `${countriesInserted} países insertados, ${divisionsInserted} divisiones insertadas`,
    );
  }
}
