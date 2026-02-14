import { IsUUID, IsEnum, IsNotEmpty } from 'class-validator';
import { PermissionScope } from 'src/shared/domain/entities/moderatorPermission';

export class AssignPermissionDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsEnum(PermissionScope)
  @IsNotEmpty()
  scope: PermissionScope;

  @IsUUID()
  @IsNotEmpty()
  targetId: string; // UUID of language or region
}







