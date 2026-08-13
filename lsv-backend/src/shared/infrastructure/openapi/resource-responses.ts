import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DivisionDto } from '../../domain/dto/country-with-divisions.dto';

const UUID = '8dc31a49-64ae-4c94-b867-d818ce9441e6';

export class MessageResponseDto {
  @ApiProperty({ example: 'Operación exitosa' })
  message: string;
}

export class LessonImageResponseDto {
  @ApiProperty({ example: 'Image uploaded successfully' })
  message: string;

  @ApiProperty({ example: '/images/lesson/abc.png' })
  imageUrl: string;
}

export class AssignLanguageResultDto {
  @ApiProperty({ example: 'Regiones actualizadas' })
  message: string;

  @ApiProperty({ example: 12 })
  updated: number;
}

export class LessonResponseDto {
  @ApiProperty({ format: 'uuid', example: UUID })
  id: string;

  @ApiProperty({ example: 'Saludos básicos' })
  name: string;

  @ApiProperty({ example: 'Lección introductoria' })
  description: string;

  @ApiProperty({ example: 'Contenido de la lección' })
  content: string;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt: Date;
}

export class PaginatedLessonResponseDto {
  @ApiProperty({ type: [LessonResponseDto] })
  data: LessonResponseDto[];

  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  pageSize: number;
}

export class StageResponseDto {
  @ApiProperty({ format: 'uuid', example: UUID })
  id: string;

  @ApiProperty({ example: 'Nivel 1' })
  name: string;

  @ApiProperty({ example: 'Etapa inicial' })
  description: string;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt: Date;
}

export class PaginatedStageResponseDto {
  @ApiProperty({ type: [StageResponseDto] })
  data: StageResponseDto[];

  @ApiProperty({ example: 8 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  pageSize: number;
}

export class LessonVariantResponseDto {
  @ApiProperty({ format: 'uuid', example: UUID })
  id: string;

  @ApiProperty({ example: 'Variante Costa' })
  name: string;

  @ApiProperty({ example: 'Variante regional' })
  description: string;

  @ApiProperty({ example: 'Contenido regional' })
  content: string;

  @ApiProperty({ example: true })
  isRegionalSpecific: boolean;

  @ApiProperty({ example: false })
  isBase: boolean;

  @ApiPropertyOptional({ example: 'Notas de uso regional', nullable: true })
  regionalNotes?: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt: Date;
}

export class QuizOptionPublicDto {
  @ApiProperty({ format: 'uuid', example: UUID })
  id: string;

  @ApiProperty({ example: 'Hola' })
  text: string;
}

export class QuizQuestionPublicDto {
  @ApiProperty({ format: 'uuid', example: UUID })
  id: string;

  @ApiProperty({ example: '¿Cuál es la seña de hola?' })
  text: string;

  @ApiProperty({ type: [QuizOptionPublicDto] })
  options: QuizOptionPublicDto[];
}

export class QuizPublicDto {
  @ApiProperty({ format: 'uuid', example: UUID })
  id: string;

  @ApiProperty({ type: [QuizQuestionPublicDto] })
  questions: QuizQuestionPublicDto[];
}

export class QuizVariantResponseDto {
  @ApiProperty({ format: 'uuid', example: UUID })
  id: string;
}

export class RegionResponseDto {
  @ApiProperty({ format: 'uuid', example: UUID })
  id: string;

  @ApiProperty({ example: 'Andina' })
  name: string;

  @ApiProperty({ example: 'AND' })
  code: string;

  @ApiProperty({ example: 'Región andina' })
  description: string;

  @ApiProperty({ example: false })
  isDefault: boolean;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  languageId?: string | null;

  @ApiPropertyOptional({ example: 'CO-ANT', nullable: true })
  divisionCode?: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt: Date;
}

export class RegionListResponseDto {
  @ApiProperty({ type: [RegionResponseDto] })
  data: RegionResponseDto[];

  @ApiProperty({ example: 12 })
  total: number;
}

export class UserLessonResponseDto {
  @ApiProperty({ format: 'uuid', example: UUID })
  id: string;

  @ApiProperty({ example: false })
  isCompleted: boolean;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  completedAt?: Date | null;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;
}

export class PaginatedUserLessonResponseDto {
  @ApiProperty({ type: [UserLessonResponseDto] })
  data: UserLessonResponseDto[];

  @ApiProperty({ example: 10 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  pageSize: number;
}

export class UserRegionResponseDto {
  @ApiProperty({ format: 'uuid', example: UUID })
  userId: string;

  @ApiProperty({ format: 'uuid', example: UUID })
  regionId: string;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt: Date;
}

export class PaginatedUserRegionResponseDto {
  @ApiProperty({ type: [UserRegionResponseDto] })
  data: UserRegionResponseDto[];

  @ApiProperty({ example: 4 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  pageSize: number;
}

export class LeaderboardEntryResponseDto {
  @ApiProperty({ format: 'uuid', example: UUID })
  userId: string;

  @ApiProperty({ example: 'Ana' })
  firstName: string;

  @ApiProperty({ example: 'García' })
  lastName: string;

  @ApiProperty({ example: 1200, minimum: 0 })
  totalScore: number;
}

export class PaginatedLeaderboardResponseDto {
  @ApiProperty({ type: [LeaderboardEntryResponseDto] })
  data: LeaderboardEntryResponseDto[];

  @ApiProperty({ example: 50 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  pageSize: number;
}

export class IsoCountryDto {
  @ApiProperty({ example: 'CO' })
  code: string;

  @ApiProperty({ example: 'Colombia' })
  name: string;
}

export class PaginatedDivisionResponseDto {
  @ApiProperty({ type: [DivisionDto] })
  data: DivisionDto[];

  @ApiProperty({ example: 32 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 4 })
  totalPages: number;
}

export class LanguageResponseDto {
  @ApiProperty({ format: 'uuid', example: UUID })
  id: string;

  @ApiProperty({ example: 'Lenguaje de señas Colombiano' })
  name: string;

  @ApiProperty({
    example: 'Sistema de comunicación visual de la comunidad sorda',
  })
  description: string;

  @ApiPropertyOptional({ example: 'CO', nullable: true })
  countryCode?: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt: Date;
}

export class QuizOptionAdminDto {
  @ApiProperty({ format: 'uuid', example: UUID })
  id: string;

  @ApiProperty({ example: 'París' })
  text: string;

  @ApiProperty({ example: true })
  isCorrect: boolean;
}

export class QuizQuestionAdminDto {
  @ApiProperty({ format: 'uuid', example: UUID })
  id: string;

  @ApiProperty({ example: '¿Cuál es la capital de Francia?' })
  text: string;

  @ApiProperty({ type: [QuizOptionAdminDto] })
  options: QuizOptionAdminDto[];
}

export class QuizAdminDto {
  @ApiProperty({ format: 'uuid', example: UUID })
  id: string;

  @ApiProperty({ type: [QuizQuestionAdminDto] })
  questions: QuizQuestionAdminDto[];
}

export class QuizSubmissionAnswerDto {
  @ApiProperty({ format: 'uuid', example: UUID })
  questionId: string;

  @ApiProperty({ format: 'uuid', example: UUID })
  optionId: string;
}

export class QuizSubmissionResponseDto {
  @ApiProperty({ format: 'uuid', example: UUID })
  id: string;

  @ApiProperty({ type: [QuizSubmissionAnswerDto] })
  answers: QuizSubmissionAnswerDto[];

  @ApiProperty({ example: 77.78 })
  score: number;

  @ApiProperty({ format: 'date-time' })
  submittedAt: Date;
}

export class ModeratorUserSummaryDto {
  @ApiProperty({ format: 'uuid', example: UUID })
  id: string;

  @ApiProperty({ example: 'ana@example.com' })
  email: string;

  @ApiProperty({ example: 'Ana' })
  firstName: string;

  @ApiProperty({ example: 'García' })
  lastName: string;
}

export class ModeratorPermissionResponseDto {
  @ApiProperty({ format: 'uuid', example: UUID })
  id: string;

  @ApiProperty({ format: 'uuid', example: UUID })
  userId: string;

  @ApiProperty({ enum: ['language', 'region'], example: 'language' })
  scope: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  languageId?: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  regionId?: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;

  @ApiPropertyOptional({ type: ModeratorUserSummaryDto })
  user?: ModeratorUserSummaryDto;
}

export class PaginatedModeratorResponseDto {
  @ApiProperty({ type: [ModeratorPermissionResponseDto] })
  data: ModeratorPermissionResponseDto[];

  @ApiProperty({ example: 8 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  pageSize: number;
}

export class SuccessFlagDto {
  @ApiProperty({ example: true })
  success: boolean;
}

export class SignResponseDto {
  @ApiProperty({ format: 'uuid', example: UUID })
  id: string;

  @ApiProperty({ example: 'Hola' })
  name: string;

  @ApiProperty({ example: false })
  isGlobal: boolean;

  @ApiProperty({ enum: ['static', 'dynamic'], example: 'static' })
  detectionType: 'static' | 'dynamic';

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  languageId?: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt: Date;
}

export class SignRecordingResponseDto {
  @ApiProperty({ format: 'uuid', example: UUID })
  id: string;

  @ApiPropertyOptional({ example: 'right', nullable: true })
  dominantHand?: string | null;

  @ApiProperty({ example: true })
  isValidated: boolean;

  @ApiPropertyOptional({ example: 0.92, nullable: true })
  handConfidence?: number | null;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;
}

export class TrainingJobDto {
  @ApiProperty({ format: 'uuid', example: UUID })
  modelId: string;

  @ApiProperty({ enum: ['static', 'dynamic'], example: 'static' })
  modelType: 'static' | 'dynamic';
}

export class TrainingQueuedResponseDto {
  @ApiPropertyOptional({ example: true })
  success?: boolean;

  @ApiProperty({ type: [TrainingJobDto] })
  jobs: TrainingJobDto[];

  @ApiPropertyOptional({ format: 'uuid' })
  jobId?: string;

  @ApiPropertyOptional({ example: 'QUEUED' })
  status?: string;
}

export class LessonModelResponseDto {
  @ApiProperty({ format: 'uuid', example: UUID })
  id: string;

  @ApiPropertyOptional({ example: 'Modelo base', nullable: true })
  name?: string | null;

  @ApiProperty({
    enum: ['PENDING', 'TRAINING', 'READY', 'FAILED'],
    example: 'READY',
  })
  status: 'PENDING' | 'TRAINING' | 'READY' | 'FAILED';

  @ApiPropertyOptional({ nullable: true })
  modelJsonUrl?: string | null;

  @ApiPropertyOptional({ type: [String], nullable: true })
  binUrls?: string[] | null;

  @ApiPropertyOptional({ type: [String], nullable: true })
  labels?: string[] | null;

  @ApiPropertyOptional({ example: 0.91, nullable: true })
  accuracy?: number | null;

  @ApiProperty({ enum: ['static', 'dynamic'], example: 'static' })
  modelType: 'static' | 'dynamic';

  @ApiProperty({ example: 258 })
  featuresCount: number;

  @ApiPropertyOptional({ example: 'static-v2', nullable: true })
  featuresSchemaVersion?: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  lessonId?: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt: Date;
}

export class BulkSignSkippedDto {
  @ApiProperty({ example: 'Hola' })
  name: string;

  @ApiProperty({
    enum: ['duplicate_in_request', 'already_in_lesson'],
    example: 'already_in_lesson',
  })
  reason: 'duplicate_in_request' | 'already_in_lesson';
}

export class BulkSignsResultDto {
  @ApiProperty({ type: [SignResponseDto] })
  created: SignResponseDto[];

  @ApiProperty({ type: [BulkSignSkippedDto] })
  skipped: BulkSignSkippedDto[];
}
