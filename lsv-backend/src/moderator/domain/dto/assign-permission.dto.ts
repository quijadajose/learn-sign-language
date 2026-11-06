import { IsUUID, IsEnum, IsNotEmpty } from 'class-validator';
import { PermissionScope } from '../../../shared/domain/entities/moderatorPermission.js';
import { ApiProperty } from '@nestjs/swagger';

export class AssignPermissionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ enum: PermissionScope, example: PermissionScope.LANGUAGE })
  @IsEnum(PermissionScope)
  @IsNotEmpty()
  scope: PermissionScope;

  @ApiProperty({
    format: 'uuid',
    description: 'UUID del lenguaje o de la región',
  })
  @IsUUID()
  @IsNotEmpty()
  targetId: string;
}
