import { IsBoolean, IsDate, IsString, IsUUID } from 'class-validator';

export class UserLessonDto {
  @IsUUID()
  @IsString()
  id: string;

  @IsBoolean()
  isCompleted: boolean;

  @IsDate()
  completedAt: Date | null;

  @IsUUID()
  @IsString()
  userId: string;

  @IsUUID()
  @IsString()
  LessonId: string;
}
