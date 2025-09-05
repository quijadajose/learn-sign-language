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
  ) {}
  onModuleInit() {
    this.seed();
  }
  public async seed() {
    console.log('Seeding...');
    await this.seedAdminUser();
    await this.seedLanguages();
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
      await this.registerUserUseCase.register({
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
      // guardamos el id del primer stage
      if (stageData.name === 'A I') {
        this.stageId = stage.id;
      }
    }
  }
  private async seedLessons() {
    const lessons = [
      {
        name: 'El abecedario',
        content: 'A,B,C ... , X,Y,Z',
        description: 'El abecedario de la A a la Z',
      },
      {
        name: 'Saludos básicos',
        content: 'Hola, Adiós, Buenos días, Buenas noches',
        description: 'Frases comunes para saludar y despedirse',
      },
      {
        name: 'Los números del 1 al 20',
        content: '1, 2, 3, ..., 20',
        description: 'Aprende a contar del uno al veinte',
      },
      {
        name: 'Colores primarios',
        content: 'Rojo, Azul, Amarillo',
        description: 'Identificación de colores básicos',
      },
      {
        name: 'Días de la semana',
        content: 'Lunes, Martes, ..., Domingo',
        description: 'Los siete días de la semana',
      },
      {
        name: 'Meses del año',
        content: 'Enero, Febrero, ..., Diciembre',
        description: 'Los doce meses del calendario',
      },
      {
        name: 'Partes del cuerpo',
        content: 'Cabeza, Brazos, Piernas, Manos',
        description: 'Vocabulario sobre el cuerpo humano',
      },
      {
        name: 'La familia',
        content: 'Madre, Padre, Hermano, Hermana',
        description: 'Miembros de la familia',
      },
      {
        name: 'Animales domésticos',
        content: 'Perro, Gato, Pez, Pájaro',
        description: 'Mascotas comunes',
      },
      {
        name: 'Frutas y verduras',
        content: 'Manzana, Plátano, Zanahoria, Tomate',
        description: 'Alimentos saludables',
      },
      {
        name: 'Objetos de la casa',
        content: 'Mesa, Silla, Cama, Puerta',
        description: 'Vocabulario del hogar',
      },
      {
        name: 'Ropa y accesorios',
        content: 'Camisa, Pantalón, Zapatos, Sombrero',
        description: 'Vestimenta básica',
      },
      {
        name: 'Clima y estaciones',
        content: 'Soleado, Lluvioso, Invierno, Verano',
        description: 'Condiciones climáticas y estaciones del año',
      },
      {
        name: 'Transporte',
        content: 'Carro, Bicicleta, Autobús, Avión',
        description: 'Medios de transporte comunes',
      },
      {
        name: 'Profesiones',
        content: 'Doctor, Maestro, Policía, Cocinero',
        description: 'Ocupaciones y trabajos',
      },
      {
        name: 'Acciones cotidianas',
        content: 'Comer, Dormir, Leer, Escribir',
        description: 'Verbos comunes en la rutina diaria',
      },
      {
        name: 'Formas geométricas',
        content: 'Círculo, Cuadrado, Triángulo, Rectángulo',
        description: 'Identificación de formas básicas',
      },
      {
        name: 'Preposiciones de lugar',
        content: 'Encima, Debajo, Dentro, Fuera',
        description: 'Ubicación espacial',
      },
      {
        name: 'Emociones y sentimientos',
        content: 'Feliz, Triste, Enojado, Asustado',
        description: 'Cómo expresar estados emocionales',
      },
      {
        name: 'Comida y bebida',
        content: 'Pan, Agua, Jugo, Arroz',
        description: 'Vocabulario de alimentos y bebidas',
      },
    ];

    for (const lessonData of lessons) {
      const existingLesson = await this.lessonRepository.findByNameInLanguage(
        lessonData.name,
        this.languageId,
      );

      if (!existingLesson && this.languageId && this.stageId) {
        const lesson = await this.createLessonUseCase.execute({
          name: lessonData.name,
          content: lessonData.content,
          description: lessonData.description,
          languageId: this.languageId,
          stageId: this.stageId,
        });

        // Guardamos el ID de la primera lección para el quiz
        if (lessonData.name === 'El abecedario') {
          this.lessonId = lesson.id;
        }
      }
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
}
