import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { Roles } from 'src/auth/infrastructure/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/infrastructure/guards/roles/roles.guard';
import { QuizDto } from 'src/quiz/domain/dto/quiz/quiz-dto';
import { SubmissionDto } from 'src/quiz/application/dto/submission/submission-dto';
import { QuizService } from 'src/quiz/application/services/quiz/quiz.service';
import { PaginationDto } from 'src/shared/domain/dto/PaginationDto';
import { Quiz } from 'src/shared/domain/entities/quiz';

@ApiTags('Quiz')
@Controller('quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear un nuevo quiz',
    description:
      'Crea un nuevo quiz con preguntas y opciones para una lección específica',
  })
  @ApiBody({
    type: QuizDto,
    description: 'Datos del quiz a crear',
    examples: {
      'quiz-ejemplo': {
        summary: 'Ejemplo de quiz con preguntas',
        description:
          'Ejemplo de un quiz con dos preguntas sobre geografía y matemáticas',
        value: {
          lessonId: '693df282-93dd-4ed8-91e3-09893d5ac879',
          questions: [
            {
              text: '¿Cuál es la capital de Francia?',
              options: [
                {
                  text: 'Madrid',
                  isCorrect: false,
                },
                {
                  text: 'París',
                  isCorrect: true,
                },
                {
                  text: 'Berlín',
                  isCorrect: false,
                },
                {
                  text: 'Roma',
                  isCorrect: false,
                },
              ],
            },
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
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Quiz creado exitosamente',
    type: Quiz,
    examples: {
      'quiz-creado': {
        summary: 'Quiz creado exitosamente',
        value: {
          lesson: {
            id: '693df282-93dd-4ed8-91e3-09893d5ac879',
            createdAt: '2025-09-20T00:20:12.352Z',
            updatedAt: '2025-09-20T00:20:12.352Z',
            name: 'El abecedario',
            description: 'El abecedario de la A a la Z',
            content: 'A,B,C ... , X,Y,Z',
          },
          id: 'cd9412e8-a176-4393-b5a2-53c045668163',
          questions: [
            {
              text: '¿Cuál es la capital de Francia?',
              quiz: {
                id: 'cd9412e8-a176-4393-b5a2-53c045668163',
                lesson: {
                  id: '693df282-93dd-4ed8-91e3-09893d5ac879',
                  createdAt: '2025-09-20T00:20:12.352Z',
                  updatedAt: '2025-09-20T00:20:12.352Z',
                  name: 'El abecedario',
                  description: 'El abecedario de la A a la Z',
                  content: 'A,B,C ... , X,Y,Z',
                },
              },
              id: '5e9426fd-7545-4282-8c98-c982c7e5bb68',
              options: [
                {
                  text: 'Madrid',
                  isCorrect: false,
                  question: {
                    id: '5e9426fd-7545-4282-8c98-c982c7e5bb68',
                    text: '¿Cuál es la capital de Francia?',
                    quiz: {
                      id: 'cd9412e8-a176-4393-b5a2-53c045668163',
                      lesson: {
                        id: '693df282-93dd-4ed8-91e3-09893d5ac879',
                        createdAt: '2025-09-20T00:20:12.352Z',
                        updatedAt: '2025-09-20T00:20:12.352Z',
                        name: 'El abecedario',
                        description: 'El abecedario de la A a la Z',
                        content: 'A,B,C ... , X,Y,Z',
                      },
                    },
                  },
                  id: 'e9a43e2a-81e1-4312-aa40-9d02c64635d7',
                },
                {
                  text: 'París',
                  isCorrect: true,
                  question: {
                    id: '5e9426fd-7545-4282-8c98-c982c7e5bb68',
                    text: '¿Cuál es la capital de Francia?',
                    quiz: {
                      id: 'cd9412e8-a176-4393-b5a2-53c045668163',
                      lesson: {
                        id: '693df282-93dd-4ed8-91e3-09893d5ac879',
                        createdAt: '2025-09-20T00:20:12.352Z',
                        updatedAt: '2025-09-20T00:20:12.352Z',
                        name: 'El abecedario',
                        description: 'El abecedario de la A a la Z',
                        content: 'A,B,C ... , X,Y,Z',
                      },
                    },
                  },
                  id: 'd598fe6c-001f-4e63-a870-aecbd9b1bd28',
                },
                {
                  text: 'Berlín',
                  isCorrect: false,
                  question: {
                    id: '5e9426fd-7545-4282-8c98-c982c7e5bb68',
                    text: '¿Cuál es la capital de Francia?',
                    quiz: {
                      id: 'cd9412e8-a176-4393-b5a2-53c045668163',
                      lesson: {
                        id: '693df282-93dd-4ed8-91e3-09893d5ac879',
                        createdAt: '2025-09-20T00:20:12.352Z',
                        updatedAt: '2025-09-20T00:20:12.352Z',
                        name: 'El abecedario',
                        description: 'El abecedario de la A a la Z',
                        content: 'A,B,C ... , X,Y,Z',
                      },
                    },
                  },
                  id: 'c197e5ae-0f7f-4fa2-b70c-b29652c95c95',
                },
                {
                  text: 'Roma',
                  isCorrect: false,
                  question: {
                    id: '5e9426fd-7545-4282-8c98-c982c7e5bb68',
                    text: '¿Cuál es la capital de Francia?',
                    quiz: {
                      id: 'cd9412e8-a176-4393-b5a2-53c045668163',
                      lesson: {
                        id: '693df282-93dd-4ed8-91e3-09893d5ac879',
                        createdAt: '2025-09-20T00:20:12.352Z',
                        updatedAt: '2025-09-20T00:20:12.352Z',
                        name: 'El abecedario',
                        description: 'El abecedario de la A a la Z',
                        content: 'A,B,C ... , X,Y,Z',
                      },
                    },
                  },
                  id: '8efe5688-6458-4a2d-b298-f5539aec91d6',
                },
              ],
            },
            {
              text: '¿Cual es 2 + 2?',
              quiz: {
                id: 'cd9412e8-a176-4393-b5a2-53c045668163',
                lesson: {
                  id: '693df282-93dd-4ed8-91e3-09893d5ac879',
                  createdAt: '2025-09-20T00:20:12.352Z',
                  updatedAt: '2025-09-20T00:20:12.352Z',
                  name: 'El abecedario',
                  description: 'El abecedario de la A a la Z',
                  content: 'A,B,C ... , X,Y,Z',
                },
              },
              id: '7114d837-c589-49eb-b3e4-4f97bd6291ef',
              options: [
                {
                  text: '4',
                  isCorrect: true,
                  question: {
                    id: '7114d837-c589-49eb-b3e4-4f97bd6291ef',
                    text: '¿Cual es 2 + 2?',
                    quiz: {
                      id: 'cd9412e8-a176-4393-b5a2-53c045668163',
                      lesson: {
                        id: '693df282-93dd-4ed8-91e3-09893d5ac879',
                        createdAt: '2025-09-20T00:20:12.352Z',
                        updatedAt: '2025-09-20T00:20:12.352Z',
                        name: 'El abecedario',
                        description: 'El abecedario de la A a la Z',
                        content: 'A,B,C ... , X,Y,Z',
                      },
                    },
                  },
                  id: 'ad3a2f98-f9de-4545-a95c-f699ff1ac5e7',
                },
                {
                  text: '5',
                  isCorrect: false,
                  question: {
                    id: '7114d837-c589-49eb-b3e4-4f97bd6291ef',
                    text: '¿Cual es 2 + 2?',
                    quiz: {
                      id: 'cd9412e8-a176-4393-b5a2-53c045668163',
                      lesson: {
                        id: '693df282-93dd-4ed8-91e3-09893d5ac879',
                        createdAt: '2025-09-20T00:20:12.352Z',
                        updatedAt: '2025-09-20T00:20:12.352Z',
                        name: 'El abecedario',
                        description: 'El abecedario de la A a la Z',
                        content: 'A,B,C ... , X,Y,Z',
                      },
                    },
                  },
                  id: 'f3f86816-1fce-4316-84c8-12ac9827c8e5',
                },
              ],
            },
          ],
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Datos de entrada inválidos',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error interno del servidor',
  })
  async createQuiz(@Body() quizDto: QuizDto): Promise<Quiz> {
    return this.quizService.createQuiz(quizDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todos los quizzes',
    description:
      'Obtiene una lista paginada de todos los quizzes disponibles. Todos los parámetros de paginación son opcionales.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de quizzes obtenida exitosamente',
    examples: {
      'lista-quizzes': {
        summary: 'Lista de quizzes obtenida exitosamente',
        value: [
          {
            id: '0225bc64-fc41-4b8c-9a52-20dde9af71eb',
          },
          {
            id: '052fa573-828d-476f-875b-7c579af16a0f',
          },
          {
            id: '07cdc638-4485-4d41-adbc-169f6a1b282e',
          },
          {
            id: '0979a454-3270-4299-a6bf-af33c6060139',
          },
          {
            id: '09d5410a-58c8-4f24-8384-3bf9a27f86d3',
          },
          {
            id: '0a962aac-d94f-4f2c-bec6-0f7c561df637',
          },
          {
            id: '0bf9dd86-8193-4404-9804-583fb77c8d01',
          },
          {
            id: '0c3a27f1-7e7e-4bfe-be03-907fa77c4079',
          },
          {
            id: '0eede6df-64be-4886-9923-f50b16667d43',
          },
          {
            id: '28fa7d35-c91c-4a33-8244-5c0adcac265b',
          },
        ],
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Parámetros de paginación inválidos',
  })
  @ApiBearerAuth()
  async getAllQuizzes(@Query() pagination: PaginationDto) {
    return this.quizService.getAllQuizzes(pagination);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('admin/:id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener detalles completos del quiz',
    description:
      'Retorna el quiz con todas las opciones y sus indicadores de corrección (isCorrect). Solo para administradores.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID único del quiz',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Quiz obtenido exitosamente para administrador',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticación inválido o faltante',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Se requiere rol de administrador',
  })
  @ApiNotFoundResponse({
    description: 'Quiz no encontrado',
  })
  @ApiBadRequestResponse({
    description: 'ID de quiz inválido',
  })
  async getQuizForAdmin(@Param('id', ParseUUIDPipe) id: string) {
    return this.quizService.getQuizForAdmin(id);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Actualizar quiz',
    description: 'Actualiza un quiz existente con nuevos datos',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID único del quiz a actualizar',
    format: 'uuid',
    example: '0225bc64-fc41-4b8c-9a52-20dde9af71eb',
  })
  @ApiBody({
    type: QuizDto,
    description: 'Nuevos datos del quiz',
    examples: {
      'quiz-actualizar': {
        summary: 'Ejemplo de actualización de quiz',
        description:
          'Ejemplo de actualización de un quiz con preguntas sobre geografía y matemáticas',
        value: {
          lessonId: '693df282-93dd-4ed8-91e3-09893d5ac879',
          questions: [
            {
              text: '¿Cuál es la capital de España?',
              options: [
                {
                  text: 'Madrid',
                  isCorrect: true,
                },
                {
                  text: 'Barcelona',
                  isCorrect: false,
                },
                {
                  text: 'Valencia',
                  isCorrect: false,
                },
              ],
            },
            {
              text: '¿Cuál es 5 + 5?',
              options: [
                {
                  text: '10',
                  isCorrect: true,
                },
                {
                  text: '9',
                  isCorrect: false,
                },
                {
                  text: '11',
                  isCorrect: false,
                },
              ],
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Quiz actualizado exitosamente',
    type: Quiz,
    examples: {
      'quiz-actualizado': {
        summary: 'Quiz actualizado exitosamente',
        value: {
          id: '0225bc64-fc41-4b8c-9a52-20dde9af71eb',
          questions: [
            {
              text: '¿Cuál es la capital de España?',
              id: 'aa548547-93da-4f4d-8ffb-647e66504c2c',
              options: [
                {
                  text: 'Madrid',
                  isCorrect: true,
                  id: '0bd46f5f-67d3-494e-8042-222e2649fa69',
                },
                {
                  text: 'Barcelona',
                  isCorrect: false,
                  id: '69e4da5a-65b3-4793-8d3e-bf47bf1e5911',
                },
                {
                  text: 'Valencia',
                  isCorrect: false,
                  id: '3e3baa65-bc5b-4398-9d96-fa2cebf1528f',
                },
              ],
            },
            {
              text: '¿Cuál es 5 + 5?',
              id: 'eff68fe7-2099-47ce-9ebb-e0262f134d4e',
              options: [
                {
                  text: '10',
                  isCorrect: true,
                  id: '2c758245-621e-4112-b08e-f22826947413',
                },
                {
                  text: '9',
                  isCorrect: false,
                  id: '225b8193-65f8-4974-95c1-fa1a2e8b2050',
                },
                {
                  text: '11',
                  isCorrect: false,
                  id: '98c646e1-1db4-4fcc-8668-18ddb6a15536',
                },
              ],
            },
          ],
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticación inválido o faltante',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Se requiere rol de administrador',
  })
  @ApiNotFoundResponse({
    description: 'Quiz no encontrado',
  })
  @ApiBadRequestResponse({
    description: 'Datos de entrada inválidos o ID de quiz inválido',
  })
  async updateQuiz(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() quizDto: QuizDto,
  ): Promise<Quiz> {
    return this.quizService.updateQuiz(id, quizDto);
  }
  @Get('/:quizId')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener quiz por ID',
    description: 'Obtiene un quiz específico por su ID único',
  })
  @ApiParam({
    name: 'quizId',
    type: String,
    description: 'ID único del quiz',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Quiz obtenido exitosamente',
  })
  @ApiNotFoundResponse({
    description: 'Quiz no encontrado',
  })
  @ApiBadRequestResponse({
    description: 'ID de quiz inválido',
  })
  async getQuizById(@Param('quizId', ParseUUIDPipe) quizId: string) {
    return this.quizService.getQuizById(quizId);
  }
  @Post('/:quizId/submissions')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Enviar respuesta de quiz',
    description:
      'Envía las respuestas de un usuario para un quiz específico. La puntuación se calcula sobre 100 puntos.',
  })
  @ApiParam({
    name: 'quizId',
    type: String,
    description: 'ID único del quiz',
    format: 'uuid',
  })
  @ApiBody({
    type: SubmissionDto,
    description: 'Respuestas del usuario para el quiz',
    examples: {
      'submission-example': {
        summary: 'Ejemplo de envío de respuestas',
        description: 'Ejemplo de respuestas del usuario para un quiz',
        value: {
          answers: [
            {
              questionId: '35208c60-4bce-4410-8a80-f7344c6b1e0c',
              optionId: '3dace497-80cc-4e69-b64d-79ecaf043dea',
            },
            {
              questionId: '436f6f67-9690-433a-bb9c-1b05f71f098e',
              optionId: '73f36b60-7b06-413c-938b-d929a412ca41',
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description:
      'Respuesta enviada exitosamente. La puntuación es sobre 100 puntos.',
    examples: {
      'submission-response': {
        summary: 'Respuesta exitosa con puntuación sobre 100',
        value: {
          id: '71d96c69-1fec-47ad-b28a-d8361bccb4cd',
          submittedAt: '2025-10-10T00:34:14.040Z',
          score: 77.77777777777777,
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticación inválido o faltante',
  })
  @ApiBadRequestResponse({
    description:
      'Datos de entrada inválidos, ID de quiz inválido o ID de usuario faltante',
  })
  @ApiNotFoundResponse({
    description: 'Quiz no encontrado',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error interno del servidor al procesar la respuesta',
  })
  async submission(
    @Req() req,
    @Param('quizId', ParseUUIDPipe) quizId: string,
    @Body() submissionDto: SubmissionDto,
  ) {
    try {
      const userId = req.user.sub;
      if (!req.user || !userId) {
        throw new BadRequestException('User ID is missing from the request.');
      }

      return await this.quizService.submissionTest(
        userId,
        quizId,
        submissionDto,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Submission failed: ${error.message}`,
      );
    }
  }
  @Get('/:quizId/submissions')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener respuestas de quiz',
    description:
      'Obtiene las respuestas enviadas por un usuario para un quiz específico. Todos los parámetros de paginación son opcionales.',
  })
  @ApiParam({
    name: 'quizId',
    type: String,
    description: 'ID único del quiz',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Respuestas obtenidas exitosamente',
    examples: {
      'submission-list': {
        summary: 'Lista de respuestas enviadas por el usuario',
        value: [
          {
            id: '434d4978-73ba-480b-a7b7-554de6bb141a',
            answers: [
              {
                questionId: '35208c60-4bce-4410-8a80-f7344c6b1e0c',
                optionId: '3dace497-80cc-4e69-b64d-79ecaf043dea',
              },
              {
                questionId: '436f6f67-9690-433a-bb9c-1b05f71f098e',
                optionId: '73f36b60-7b06-413c-938b-d929a412ca41',
              },
            ],
            score: 67,
            submittedAt: '2025-10-10T00:42:25.927Z',
          },
          {
            id: '71d96c69-1fec-47ad-b28a-d8361bccb4cd',
            answers: [
              {
                questionId: '35208c60-4bce-4410-8a80-f7344c6b1e0c',
                optionId: '3dace497-80cc-4e69-b64d-79ecaf043dea',
              },
              {
                questionId: '436f6f67-9690-433a-bb9c-1b05f71f098e',
                optionId: '73f36b60-7b06-413c-938b-d929a412ca41',
              },
            ],
            score: 67,
            submittedAt: '2025-10-10T00:34:14.040Z',
          },
        ],
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticación inválido o faltante',
  })
  @ApiBadRequestResponse({
    description:
      'ID de quiz inválido, ID de usuario faltante o parámetros de paginación inválidos',
  })
  @ApiNotFoundResponse({
    description: 'Quiz no encontrado',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error interno del servidor al obtener las respuestas',
  })
  async getSubmission(
    @Req() req,
    @Param('quizId', ParseUUIDPipe) quizId: string,
    @Query() pagination: PaginationDto,
  ) {
    try {
      const userId = req.user.sub;
      if (!req.user || !userId) {
        throw new BadRequestException('User ID is missing from the request.');
      }
      return await this.quizService.getQuizSubmissionTestFromUser(
        userId,
        quizId,
        pagination,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Get submission tests failed: ${error.message}`,
      );
    }
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Eliminar quiz',
    description: 'Elimina un quiz específico del sistema',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID único del quiz a eliminar',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Quiz eliminado exitosamente',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticación inválido o faltante',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Se requiere rol de administrador',
  })
  @ApiNotFoundResponse({
    description: 'Quiz no encontrado',
  })
  @ApiBadRequestResponse({
    description: 'ID de quiz inválido',
  })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.quizService.deleteQuiz(id);
  }
}
