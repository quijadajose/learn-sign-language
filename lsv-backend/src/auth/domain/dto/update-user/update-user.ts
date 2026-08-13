import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'email@gmail.com', format: 'email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'google123456789' })
  @IsOptional()
  @IsNotEmpty()
  googleId?: string;

  @ApiPropertyOptional({
    description: 'Hash actual (interno)',
    example: 'hashedPassword',
  })
  @IsOptional()
  @IsNotEmpty()
  hashPassword?: string;

  @ApiPropertyOptional({
    description: 'Contraseña actual para cambio de clave',
  })
  @IsOptional()
  @IsNotEmpty()
  oldPassword?: string;

  @ApiPropertyOptional({ description: 'Nueva contraseña' })
  @IsOptional()
  @IsNotEmpty()
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

  @ApiPropertyOptional({ example: 'user' })
  @IsOptional()
  role?: string;
}
