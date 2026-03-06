import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FindUserUseCase } from 'src/auth/domain/use-cases/find-user/find-user';
import { RegisterUserUseCase } from 'src/auth/domain/use-cases/register-user/register-user';
import { CreateLanguageUseCase } from 'src/language/application/use-cases/create-language-use-case/create-language-use-case';
import { LanguageRepositoryInterface } from 'src/language/domain/ports/language.repository.interface/language.repository.interface';
import { CreateLessonUseCase } from 'src/lesson/application/use-cases/create-lesson-use-case/create-lesson-use-case';
import { LessonRepositoryInterface } from 'src/lesson/domain/ports/lesson.repository.interface/lesson.repository.interface';
import { LessonService } from 'src/lesson/application/services/lesson/lesson.service';
import { CreateQuizWithQuestionsAndOptionsUseCase } from 'src/quiz/application/use-cases/create-quiz-with-questions-and-options-use-case/create-quiz-with-questions-and-options-use-case';
import { QuizVariantService } from 'src/quiz/application/services/quiz-variant.service';
import { CreateStageUseCase } from 'src/stage/application/use-cases/create-stage-use-case/create-stage-use-case';
import { StageRepositoryInterface } from 'src/stage/domain/ports/stage.repository.interface/stage.repository.interface';
import { RegionService } from 'src/region/application/services/region/region.service';
import { CountryDivisionService } from 'src/shared/application/services/country-division.service';
import * as countriesData from './iso-3166-2.json';

interface LanguageSeedData {
  countryCode: string;
  name: string;
  description: string;
  regions: Array<{
    name: string;
    code: string;
    divisionCode: string;
    description: string;
    isDefault: boolean;
  }>;
}

const MERC_STAGES = [
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

const LESSONS = [
  {
    name: 'El abecedario',
    description: 'Aprende el abecedario en lenguaje de señas',
    content:
      'A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z',
  },
  {
    name: 'Saludos',
    description: 'Aprende a saludar en lenguaje de señas',
    content:
      'Hola, Buenos días, Buenas tardes, Buenas noches, Adiós, Hasta luego',
  },
  {
    name: 'Números',
    description: 'Aprende los números en lenguaje de señas',
    content: '0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 100',
  },
];

const LANGUAGES_DATA: LanguageSeedData[] = [
  {
    countryCode: 'VE',
    name: 'Lenguaje de señas Venezolano',
    description:
      'El sistema de comunicación visual usado por la comunidad sorda venezolana',
    regions: [
      {
        name: 'Distrito Federal',
        code: 'DF',
        divisionCode: 'VE-A',
        description: 'Distrito Federal - Caracas',
        isDefault: true,
      },
      {
        name: 'Zulia',
        code: 'ZU',
        divisionCode: 'VE-V',
        description: 'Estado Zulia - Maracaibo',
        isDefault: false,
      },
      {
        name: 'Mérida',
        code: 'ME',
        divisionCode: 'VE-L',
        description: 'Estado Mérida - Región andina venezolana',
        isDefault: false,
      },
    ],
  },
  {
    countryCode: 'CL',
    name: 'Lenguaje de señas Chileno',
    description:
      'El sistema de comunicación visual usado por la comunidad sorda chilena',
    regions: [
      {
        name: 'Región Metropolitana',
        code: 'RM',
        divisionCode: 'CL-RM',
        description: 'Región Metropolitana de Santiago',
        isDefault: true,
      },
      {
        name: 'Valparaíso',
        code: 'VS',
        divisionCode: 'CL-VS',
        description: 'Región de Valparaíso',
        isDefault: false,
      },
      {
        name: 'Bío-Bío',
        code: 'BI',
        divisionCode: 'CL-BI',
        description: 'Región del Bío-Bío',
        isDefault: false,
      },
    ],
  },
  {
    countryCode: 'CO',
    name: 'Lenguaje de señas Colombiano',
    description:
      'El sistema de comunicación visual usado por la comunidad sorda colombiana',
    regions: [
      {
        name: 'Distrito Capital',
        code: 'DC',
        divisionCode: 'CO-DC',
        description: 'Distrito Capital de Bogotá',
        isDefault: true,
      },
      {
        name: 'Antioquia',
        code: 'ANT',
        divisionCode: 'CO-ANT',
        description: 'Departamento de Antioquia - Medellín',
        isDefault: false,
      },
      {
        name: 'Valle del Cauca',
        code: 'VAC',
        divisionCode: 'CO-VAC',
        description: 'Departamento del Valle del Cauca - Cali',
        isDefault: false,
      },
    ],
  },
  {
    countryCode: 'MX',
    name: 'Lenguaje de señas Mexicano',
    description:
      'El sistema de comunicación visual usado por la comunidad sorda mexicana',
    regions: [
      {
        name: 'Distrito Federal',
        code: 'DF',
        divisionCode: 'MX-DIF',
        description: 'Ciudad de México',
        isDefault: true,
      },
      {
        name: 'Jalisco',
        code: 'JAL',
        divisionCode: 'MX-JAL',
        description: 'Estado de Jalisco - Guadalajara',
        isDefault: false,
      },
      {
        name: 'Nuevo León',
        code: 'NL',
        divisionCode: 'MX-NLE',
        description: 'Estado de Nuevo León - Monterrey',
        isDefault: false,
      },
    ],
  },
];

@Injectable()
export class SeederService implements OnModuleInit {
  // Maps para mantener coherencia de IDs
  private languageIds = new Map<string, string>();
  private stageIds = new Map<string, string>();
  private regionIds = new Map<string, string>();
  private lessonIds = new Map<string, string>();
  private lessonVariantIds = new Map<string, string>();

  constructor(
    private readonly configService: ConfigService,
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly findUserUseCase: FindUserUseCase,
    private readonly createLanguageUseCase: CreateLanguageUseCase,
    @Inject('LanguageRepositoryInterface')
    private readonly languageRepository: LanguageRepositoryInterface,
    private readonly createStageUseCase: CreateStageUseCase,
    @Inject('StageRepositoryInterface')
    private readonly stageRepository: StageRepositoryInterface,
    private readonly createLessonUseCase: CreateLessonUseCase,
    @Inject('LessonRepositoryInterface')
    private readonly lessonRepository: LessonRepositoryInterface,
    private readonly lessonService: LessonService,
    private readonly createQuizWithQuestionsAndOptionsUseCase: CreateQuizWithQuestionsAndOptionsUseCase,
    private readonly quizVariantService: QuizVariantService,
    private readonly regionService: RegionService,
    private readonly countryDivisionService: CountryDivisionService,
  ) {}

  async onModuleInit() {
    await this.seedCountriesAndDivisions();
    await this.seedAdminUser();

    const nodeEnv = this.configService.get<string>('NODE_ENV') || 'development';
    if (nodeEnv !== 'development') {
      console.log('Seed automático omitido: NODE_ENV no es "development"');
      return;
    }
    await this.seed();
  }

  public async seed() {
    console.log('Seeding...');
    try {
      await this.seedNormalUser();
      await this.seedothersUsers();
      await this.seedLanguages();
      await this.seedStages();
      await this.seedRegions();
      await this.seedLessons();
      await this.seedQuizzes();
      await this.seedLessonVariants();
      await this.seedQuizVariants();
    } catch (error) {
      console.error('Error en Seeder:', error?.message ?? error);
      throw error;
    }
  }

  private async seedAdminUser() {
    console.log('Seeding admin user...');
    const adminEmail = this.configService.get<string>('API_ADMIN_EMAIL');
    const adminPassword = this.configService.get<string>('API_ADMIN_PASSWORD');

    if (!adminEmail || !adminPassword) {
      console.warn(
        'API_ADMIN_EMAIL o API_ADMIN_PASSWORD no configurados, saltando creación de admin',
      );
      return;
    }

    const existingUser = await this.findUserUseCase.findByEmail(adminEmail);
    if (existingUser) {
      console.log('Usuario admin ya existe, saltando...');
      return;
    }

    await this.registerUserUseCase.register({
      age: 20,
      email: adminEmail,
      firstName: 'admin',
      lastName: 'admin',
      password: adminPassword,
      isRightHanded: true,
      role: 'admin',
    });
    console.log('Usuario admin creado exitosamente');
  }

  private async seedNormalUser() {
    console.log('Seeding usuario normal...');
    const normalUserEmail = this.configService.get<string>('API_USER_EMAIL');
    const normalUserPassword =
      this.configService.get<string>('API_USER_PASSWORD');

    if (!normalUserEmail || !normalUserPassword) {
      console.warn(
        'API_USER_EMAIL o API_USER_PASSWORD no configurados, saltando creación de usuario normal',
      );
      return;
    }

    const existingUser =
      await this.findUserUseCase.findByEmail(normalUserEmail);
    if (existingUser) {
      console.log('Usuario normal ya existe, saltando...');
      return;
    }

    await this.registerUserUseCase.register({
      age: 20,
      email: normalUserEmail,
      firstName: 'Usuario',
      lastName: 'Normal',
      password: normalUserPassword,
      isRightHanded: true,
      role: 'user',
    });
    console.log('Usuario normal creado exitosamente');
  }
  private async seedothersUsers() {
    console.log('Seeding usuario normal...');
    const normalUserEmail = 'moderator@gmail.com';
    const normalUserPassword =
      this.configService.get<string>('API_USER_PASSWORD');

    if (!normalUserEmail || !normalUserPassword) {
      console.warn(
        'API_USER_EMAIL o API_USER_PASSWORD no configurados, saltando creación de usuario normal',
      );
      return;
    }

    const existingUser =
      await this.findUserUseCase.findByEmail(normalUserEmail);
    if (existingUser) {
      console.log('Usuario normal ya existe, saltando...');
      return;
    }

    await this.registerUserUseCase.register({
      age: 20,
      email: normalUserEmail,
      firstName: 'Usuario',
      lastName: 'Normal',
      password: normalUserPassword,
      isRightHanded: true,
      role: 'user',
    });
    await this.registerUserUseCase.register({
      age: 20,
      email: 'localModeratorEmail@gmail.com',
      firstName: 'Usuario',
      lastName: 'Normal',
      password: normalUserPassword,
      isRightHanded: true,
      role: 'user',
    });
    console.log('Usuario normal creado exitosamente');
  }

  private async seedCountriesAndDivisions() {
    const countries = await this.countryDivisionService.getAllCountries();
    if (countries.length >= 237) {
      console.log('Países ya están en la base de datos, saltando seed.');
      return;
    }

    console.log('Seeding países y divisiones desde ISO-3166-2...');
    const countriesToCreate: { code: string; name: string }[] = [];
    const divisionsToCreate: {
      code: string;
      name: string;
      countryCode: string;
    }[] = [];

    for (const [countryCode, countryData] of Object.entries(countriesData)) {
      countriesToCreate.push({ code: countryCode, name: countryData.name });

      for (const [divisionCode, divisionName] of Object.entries(
        countryData.divisions,
      )) {
        divisionsToCreate.push({
          code: divisionCode,
          name: divisionName as string,
          countryCode: countryCode,
        });
      }
    }

    let createdCountries = [];
    try {
      createdCountries =
        await this.countryDivisionService.createCountries(countriesToCreate);
    } catch (error) {
      console.error('Error creando países en bulk:', error?.message ?? error);
    }

    let createdDivisions = [];
    try {
      createdDivisions =
        await this.countryDivisionService.createDivisions(divisionsToCreate);
    } catch (error) {
      console.error(
        'Error creando divisiones en bulk:',
        error?.message ?? error,
      );
    }

    console.log(
      `${createdCountries.length} países insertados, ${createdDivisions.length} divisiones insertadas`,
    );
  }

  private async seedLanguages() {
    console.log('Seeding lenguajes...');
    for (const langData of LANGUAGES_DATA) {
      const existingLang = await this.languageRepository.findByName(
        langData.name,
      );

      if (existingLang) {
        console.log(`Lenguaje ${langData.name} ya existe, usando ID existente`);
        this.languageIds.set(
          `language-${langData.countryCode}`,
          existingLang.id,
        );
        continue;
      }

      try {
        const language = await this.createLanguageUseCase.execute({
          name: langData.name,
          description: langData.description,
          countryCode: langData.countryCode,
        });
        this.languageIds.set(`language-${langData.countryCode}`, language.id);
        console.log(`Lenguaje ${langData.name} creado: ${language.id}`);
      } catch (error) {
        console.error(
          `Error creando lenguaje ${langData.name}:`,
          error?.message ?? error,
        );
      }
    }
    console.log(`Total lenguajes procesados: ${this.languageIds.size}`);
  }

  private async seedStages() {
    console.log('Seeding stages (niveles MERC)...');
    for (const langData of LANGUAGES_DATA) {
      const languageId = this.languageIds.get(
        `language-${langData.countryCode}`,
      );
      if (!languageId) {
        console.warn(
          `No se encontró ID de lenguaje para ${langData.countryCode}, saltando stages`,
        );
        continue;
      }

      for (const stageData of MERC_STAGES) {
        const stageKey = `stage-${languageId}-${stageData.name}`;
        const existingStage = await this.stageRepository.findByNameInLanguage(
          stageData.name,
          languageId,
        );

        if (existingStage) {
          console.log(
            `Stage ${stageData.name} para ${langData.name} ya existe`,
          );
          this.stageIds.set(stageKey, existingStage.id);
          continue;
        }

        try {
          const stage = await this.createStageUseCase.execute({
            languageId: languageId,
            name: stageData.name,
            description: stageData.description,
          });
          this.stageIds.set(stageKey, stage.id);
          console.log(
            `Stage ${stageData.name} creado para ${langData.name}: ${stage.id}`,
          );
        } catch (error) {
          console.error(
            `Error creando stage ${stageData.name} para ${langData.name}:`,
            error?.message ?? error,
          );
        }
      }
    }
    console.log(`Total stages procesados: ${this.stageIds.size}`);
  }

  private async seedRegions() {
    console.log('Seeding regions...');
    for (const langData of LANGUAGES_DATA) {
      const languageId = this.languageIds.get(
        `language-${langData.countryCode}`,
      );
      if (!languageId) {
        console.warn(
          `No se encontró ID de lenguaje para ${langData.countryCode}, saltando regions`,
        );
        continue;
      }

      for (const regionData of langData.regions) {
        const regionKey = `region-${languageId}-${regionData.code}`;
        try {
          const region = await this.regionService.createRegion({
            name: regionData.name,
            code: regionData.code,
            description: regionData.description,
            isDefault: regionData.isDefault,
            languageId: languageId,
            divisionCode: regionData.divisionCode,
          });
          this.regionIds.set(regionKey, region.id);
          console.log(
            `Región ${regionData.name} creada para ${langData.name}: ${region.id}`,
          );
        } catch (error) {
          if (error.message?.includes('already exists')) {
            // Si la región ya existe, intentar obtenerla por código
            // Necesitamos obtener todas las regiones del lenguaje y buscar por código
            const allRegions = await this.regionService.getAllRegions(
              { page: 1, limit: 1000 },
              languageId,
            );
            const existingRegion = allRegions.data.find(
              (r) => r.code === regionData.code,
            );
            if (existingRegion) {
              this.regionIds.set(regionKey, existingRegion.id);
              console.log(
                `Región ${regionData.name} ya existe, usando ID existente: ${existingRegion.id}`,
              );
            } else {
              console.log(
                `Región ${regionData.name} ya existe pero no se pudo obtener ID, saltando...`,
              );
            }
          } else {
            console.error(
              `Error creando región ${regionData.name} para ${langData.name}:`,
              error?.message ?? error,
            );
          }
        }
      }
    }
    console.log(`Total regions procesadas: ${this.regionIds.size}`);
  }

  private async seedLessons() {
    console.log('Seeding lessons...');
    for (const langData of LANGUAGES_DATA) {
      const languageId = this.languageIds.get(
        `language-${langData.countryCode}`,
      );
      if (!languageId) {
        console.warn(
          `No se encontró ID de lenguaje para ${langData.countryCode}, saltando lessons`,
        );
        continue;
      }

      for (const stageData of MERC_STAGES) {
        const stageId = this.stageIds.get(
          `stage-${languageId}-${stageData.name}`,
        );
        if (!stageId) {
          console.warn(
            `No se encontró ID de stage ${stageData.name} para ${langData.name}, saltando lessons`,
          );
          continue;
        }

        for (const lessonData of LESSONS) {
          const lessonKey = `lesson-${languageId}-${stageData.name}-${lessonData.name}`;
          const existingLesson =
            await this.lessonRepository.findByNameInLanguage(
              lessonData.name,
              languageId,
            );

          if (existingLesson) {
            // Verificar si pertenece al mismo stage
            const existingLessonWithStage =
              await this.lessonRepository.findById(existingLesson.id);
            if (
              existingLessonWithStage?.stage?.id === stageId &&
              existingLessonWithStage?.language?.id === languageId
            ) {
              console.log(
                `Lesson ${lessonData.name} para ${langData.name} - ${stageData.name} ya existe`,
              );
              this.lessonIds.set(lessonKey, existingLesson.id);
              continue;
            }
          }

          try {
            const lesson = await this.createLessonUseCase.execute({
              name: lessonData.name,
              description: lessonData.description,
              content: lessonData.content,
              languageId: languageId,
              stageId: stageId,
            });
            this.lessonIds.set(lessonKey, lesson.id);
            console.log(
              `Lesson ${lessonData.name} creada para ${langData.name} - ${stageData.name}: ${lesson.id}`,
            );
          } catch (error) {
            if (error.message?.includes('already in use')) {
              console.log(`Lesson ${lessonData.name} ya existe, saltando...`);
            } else {
              console.error(
                `Error creando lesson ${lessonData.name} para ${langData.name} - ${stageData.name}:`,
                error?.message ?? error,
              );
            }
          }
        }
      }
    }
    console.log(`Total lessons procesadas: ${this.lessonIds.size}`);
  }

  private async seedQuizzes() {
    console.log('Seeding quizzes base...');
    for (const langData of LANGUAGES_DATA) {
      const languageId = this.languageIds.get(
        `language-${langData.countryCode}`,
      );
      if (!languageId) {
        continue;
      }

      for (const stageData of MERC_STAGES) {
        for (const lessonData of LESSONS) {
          const lessonKey = `lesson-${languageId}-${stageData.name}-${lessonData.name}`;
          const lessonId = this.lessonIds.get(lessonKey);
          if (!lessonId) {
            continue;
          }

          // Crear quiz base con questions y options coherentes según el tipo de lesson
          const questions = this.generateBaseQuizQuestions(lessonData.name);

          try {
            await this.createQuizWithQuestionsAndOptionsUseCase.execute({
              lessonId: lessonId,
              questions: questions,
            });
            console.log(
              `Quiz base creado para ${lessonData.name} - ${langData.name} - ${stageData.name}`,
            );
          } catch (error) {
            console.error(
              `Error creando quiz para ${lessonData.name}:`,
              error?.message ?? error,
            );
          }
        }
      }
    }
    console.log('Quizzes base completados');
  }

  private async seedLessonVariants() {
    console.log('Seeding lesson variants...');
    for (const langData of LANGUAGES_DATA) {
      const languageId = this.languageIds.get(
        `language-${langData.countryCode}`,
      );
      if (!languageId) {
        continue;
      }

      // Obtener la región principal (isDefault: true)
      const defaultRegion = langData.regions.find((r) => r.isDefault);
      const otherRegions = langData.regions.filter((r) => !r.isDefault);

      if (!defaultRegion || otherRegions.length < 2) {
        console.warn(
          `No se encontraron suficientes regiones para ${langData.name}`,
        );
        continue;
      }

      const defaultRegionId = this.regionIds.get(
        `region-${languageId}-${defaultRegion.code}`,
      );
      const region1Id = this.regionIds.get(
        `region-${languageId}-${otherRegions[0].code}`,
      );
      const region2Id = this.regionIds.get(
        `region-${languageId}-${otherRegions[1].code}`,
      );

      if (!defaultRegionId || !region1Id || !region2Id) {
        console.warn(`No se encontraron IDs de regiones para ${langData.name}`);
        continue;
      }

      for (const stageData of MERC_STAGES) {
        for (const lessonData of LESSONS) {
          const lessonKey = `lesson-${languageId}-${stageData.name}-${lessonData.name}`;
          const lessonId = this.lessonIds.get(lessonKey);
          if (!lessonId) {
            continue;
          }

          // 1. Crear variant base para región principal
          try {
            const baseVariant = await this.lessonService.createLessonVariant(
              lessonId,
              {
                name: `${lessonData.name} - ${defaultRegion.name}`,
                description: `${lessonData.description} (Variante base)`,
                content: lessonData.content,
                isBase: true,
                isRegionalSpecific: false,
                regionId: defaultRegionId,
              },
            );
            const baseVariantKey = `variant-${lessonId}-${defaultRegion.code}-base`;
            this.lessonVariantIds.set(baseVariantKey, baseVariant.id);
            console.log(
              `Lesson variant base creada para ${lessonData.name} - ${defaultRegion.name}`,
            );
          } catch (error) {
            if (error.message?.includes('Ya existe una variante base')) {
              console.log(
                `Variante base ya existe para ${lessonData.name}, saltando...`,
              );
            } else {
              console.error(
                `Error creando variant base para ${lessonData.name}:`,
                error?.message ?? error,
              );
            }
          }

          // 2. Crear variant regional 1
          try {
            const regionalVariant1 =
              await this.lessonService.createLessonVariant(lessonId, {
                name: `${lessonData.name} - ${otherRegions[0].name}`,
                description: `${lessonData.description} (Variante regional)`,
                content: lessonData.content,
                isBase: false,
                isRegionalSpecific: true,
                regionId: region1Id,
                regionalNotes: `Variante específica para la región de ${otherRegions[0].name}`,
              });
            const variant1Key = `variant-${lessonId}-${otherRegions[0].code}-regional`;
            this.lessonVariantIds.set(variant1Key, regionalVariant1.id);
            console.log(
              `Lesson variant regional 1 creada para ${lessonData.name} - ${otherRegions[0].name}`,
            );
          } catch (error) {
            console.error(
              `Error creando variant regional 1 para ${lessonData.name}:`,
              error?.message ?? error,
            );
          }

          // 3. Crear variant regional 2
          try {
            const regionalVariant2 =
              await this.lessonService.createLessonVariant(lessonId, {
                name: `${lessonData.name} - ${otherRegions[1].name}`,
                description: `${lessonData.description} (Variante regional)`,
                content: lessonData.content,
                isBase: false,
                isRegionalSpecific: true,
                regionId: region2Id,
                regionalNotes: `Variante específica para la región de ${otherRegions[1].name}`,
              });
            const variant2Key = `variant-${lessonId}-${otherRegions[1].code}-regional`;
            this.lessonVariantIds.set(variant2Key, regionalVariant2.id);
            console.log(
              `Lesson variant regional 2 creada para ${lessonData.name} - ${otherRegions[1].name}`,
            );
          } catch (error) {
            console.error(
              `Error creando variant regional 2 para ${lessonData.name}:`,
              error?.message ?? error,
            );
          }
        }
      }
    }
    console.log(
      `Total lesson variants procesadas: ${this.lessonVariantIds.size}`,
    );
  }

  private async seedQuizVariants() {
    console.log('Seeding quiz variants...');
    for (const langData of LANGUAGES_DATA) {
      const languageId = this.languageIds.get(
        `language-${langData.countryCode}`,
      );
      if (!languageId) {
        continue;
      }

      for (const stageData of MERC_STAGES) {
        for (const lessonData of LESSONS) {
          const lessonKey = `lesson-${languageId}-${stageData.name}-${lessonData.name}`;
          const lessonId = this.lessonIds.get(lessonKey);
          if (!lessonId) {
            continue;
          }

          // Obtener todas las variants de esta lesson
          for (const regionData of langData.regions) {
            const variantKey = `variant-${lessonId}-${regionData.code}-base`;
            const variantKeyRegional = `variant-${lessonId}-${regionData.code}-regional`;
            const variantId =
              this.lessonVariantIds.get(variantKey) ||
              this.lessonVariantIds.get(variantKeyRegional);

            if (!variantId) {
              continue;
            }

            // Generar questions para el quiz variant
            const questions = this.generateVariantQuizQuestions(
              lessonData.name,
              regionData.code,
            );

            try {
              await this.quizVariantService.createQuizVariant({
                lessonVariantId: variantId,
                questions: questions,
              });
              console.log(
                `Quiz variant creado para ${lessonData.name} - ${regionData.name}`,
              );
            } catch (error) {
              console.error(
                `Error creando quiz variant para ${lessonData.name} - ${regionData.name}:`,
                error?.message ?? error,
              );
            }
          }
        }
      }
    }
    console.log('Quiz variants completados');
  }

  private generateBaseQuizQuestions(lessonName: string): Array<{
    text: string;
    options: Array<{ text: string; isCorrect: boolean }>;
  }> {
    // Generar questions coherentes según el tipo de lesson para quizzes base
    if (lessonName === 'El abecedario') {
      return [
        {
          text: '¿Cuál es la primera letra del abecedario?',
          options: [
            { text: 'A', isCorrect: true },
            { text: 'B', isCorrect: false },
            { text: 'C', isCorrect: false },
            { text: 'Z', isCorrect: false },
          ],
        },
        {
          text: '¿Cuál es la última letra del abecedario?',
          options: [
            { text: 'X', isCorrect: false },
            { text: 'Y', isCorrect: false },
            { text: 'Z', isCorrect: true },
            { text: 'W', isCorrect: false },
          ],
        },
        {
          text: '¿Cuántas letras tiene el abecedario?',
          options: [
            { text: '24', isCorrect: false },
            { text: '25', isCorrect: false },
            { text: '26', isCorrect: true },
            { text: '27', isCorrect: false },
          ],
        },
      ];
    } else if (lessonName === 'Saludos') {
      return [
        {
          text: '¿Cómo se saluda en la mañana?',
          options: [
            { text: 'Buenos días', isCorrect: true },
            { text: 'Buenas noches', isCorrect: false },
            { text: 'Adiós', isCorrect: false },
            { text: 'Hasta luego', isCorrect: false },
          ],
        },
        {
          text: '¿Cómo se saluda en la tarde?',
          options: [
            { text: 'Buenos días', isCorrect: false },
            { text: 'Buenas tardes', isCorrect: true },
            { text: 'Buenas noches', isCorrect: false },
            { text: 'Hola', isCorrect: false },
          ],
        },
        {
          text: '¿Cómo se despide?',
          options: [
            { text: 'Hola', isCorrect: false },
            { text: 'Buenos días', isCorrect: false },
            { text: 'Adiós', isCorrect: true },
            { text: 'Buenas tardes', isCorrect: false },
          ],
        },
      ];
    } else if (lessonName === 'Números') {
      return [
        {
          text: '¿Cuál es el número 5?',
          options: [
            { text: '4', isCorrect: false },
            { text: '5', isCorrect: true },
            { text: '6', isCorrect: false },
            { text: '7', isCorrect: false },
          ],
        },
        {
          text: '¿Cuál es el número 10?',
          options: [
            { text: '9', isCorrect: false },
            { text: '10', isCorrect: true },
            { text: '11', isCorrect: false },
            { text: '12', isCorrect: false },
          ],
        },
        {
          text: '¿Cuánto es 2 + 3?',
          options: [
            { text: '4', isCorrect: false },
            { text: '5', isCorrect: true },
            { text: '6', isCorrect: false },
            { text: '7', isCorrect: false },
          ],
        },
      ];
    }

    // Default questions
    return [
      {
        text: 'Pregunta 1',
        options: [
          { text: 'Opción correcta', isCorrect: true },
          { text: 'Opción incorrecta 1', isCorrect: false },
          { text: 'Opción incorrecta 2', isCorrect: false },
        ],
      },
    ];
  }

  private generateVariantQuizQuestions(
    lessonName: string,
    regionCode: string,
  ): Array<{
    question: string;
    options: Array<{ text: string; isCorrect: boolean }>;
  }> {
    // Función helper para agregar el código de región al final de la pregunta
    const addRegionCode = (question: string) => `${question} ${regionCode}`;

    // Generar questions coherentes según el tipo de lesson
    if (lessonName === 'El abecedario') {
      return [
        {
          question: addRegionCode('¿Cuál es la primera letra del abecedario?'),
          options: [
            { text: 'A', isCorrect: true },
            { text: 'B', isCorrect: false },
            { text: 'C', isCorrect: false },
            { text: 'Z', isCorrect: false },
          ],
        },
        {
          question: addRegionCode('¿Cuál es la última letra del abecedario?'),
          options: [
            { text: 'X', isCorrect: false },
            { text: 'Y', isCorrect: false },
            { text: 'Z', isCorrect: true },
            { text: 'W', isCorrect: false },
          ],
        },
        {
          question: addRegionCode('¿Cuántas letras tiene el abecedario?'),
          options: [
            { text: '24', isCorrect: false },
            { text: '25', isCorrect: false },
            { text: '26', isCorrect: true },
            { text: '27', isCorrect: false },
          ],
        },
      ];
    } else if (lessonName === 'Saludos') {
      return [
        {
          question: addRegionCode('¿Cómo se saluda en la mañana?'),
          options: [
            { text: 'Buenos días', isCorrect: true },
            { text: 'Buenas noches', isCorrect: false },
            { text: 'Adiós', isCorrect: false },
            { text: 'Hasta luego', isCorrect: false },
          ],
        },
        {
          question: addRegionCode('¿Cómo se saluda en la tarde?'),
          options: [
            { text: 'Buenos días', isCorrect: false },
            { text: 'Buenas tardes', isCorrect: true },
            { text: 'Buenas noches', isCorrect: false },
            { text: 'Hola', isCorrect: false },
          ],
        },
        {
          question: addRegionCode('¿Cómo se despide?'),
          options: [
            { text: 'Hola', isCorrect: false },
            { text: 'Buenos días', isCorrect: false },
            { text: 'Adiós', isCorrect: true },
            { text: 'Buenas tardes', isCorrect: false },
          ],
        },
      ];
    } else if (lessonName === 'Números') {
      return [
        {
          question: addRegionCode('¿Cuál es el número 5?'),
          options: [
            { text: '4', isCorrect: false },
            { text: '5', isCorrect: true },
            { text: '6', isCorrect: false },
            { text: '7', isCorrect: false },
          ],
        },
        {
          question: addRegionCode('¿Cuál es el número 10?'),
          options: [
            { text: '9', isCorrect: false },
            { text: '10', isCorrect: true },
            { text: '11', isCorrect: false },
            { text: '12', isCorrect: false },
          ],
        },
        {
          question: addRegionCode('¿Cuánto es 2 + 3?'),
          options: [
            { text: '4', isCorrect: false },
            { text: '5', isCorrect: true },
            { text: '6', isCorrect: false },
            { text: '7', isCorrect: false },
          ],
        },
      ];
    }

    // Default questions
    return [
      {
        question: addRegionCode('Pregunta 1'),
        options: [
          { text: 'Opción correcta', isCorrect: true },
          { text: 'Opción incorrecta 1', isCorrect: false },
          { text: 'Opción incorrecta 2', isCorrect: false },
        ],
      },
    ];
  }
}
