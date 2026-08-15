import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/** Public profile update. Password hash, role and googleId are not client-assignable. */
export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'email@gmail.com', format: 'email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Contraseña actual para cambio de clave',
  })
  @IsOptional()
  @IsNotEmpty()
  oldPassword?: string;

  @ApiPropertyOptional({ description: 'Nueva contraseña', minLength: 8 })
  @ValidateIf((_, value) => value != null && value !== '')
  @IsOptional()
  @IsNotEmpty()
  @MinLength(8)
  newPassword?: string;

  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsNotEmpty()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsNotEmpty()
  lastName?: string;

  @ApiPropertyOptional({ example: 30, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  age?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isRightHanded?: boolean;
}

export type UpdateUserPatch = Omit<
  UpdateUserDto,
  'oldPassword' | 'newPassword'
> & {
  passwordHash?: string;
  revokeSessions?: boolean;
};
