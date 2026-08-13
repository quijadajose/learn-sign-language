import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Payload returned by the model trainer via BullMQ job completion.
 */
export class SaveModelResultsDto {
  @IsOptional()
  @IsUUID()
  modelId?: string;

  @IsString()
  modelJsonUrl: string;

  @IsArray()
  @IsString({ each: true })
  binUrls: string[];

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  accuracy: number;

  @IsArray()
  @IsString({ each: true })
  labels: string[];

  @IsOptional()
  logs?: unknown;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  featuresCount?: number;

  @IsOptional()
  @IsIn(['static', 'dynamic'])
  modelType?: 'static' | 'dynamic';

  @IsOptional()
  @IsString()
  featuresSchemaVersion?: string;
}
