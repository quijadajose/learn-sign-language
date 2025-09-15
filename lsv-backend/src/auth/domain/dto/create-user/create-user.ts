import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'Dirección de correo electrónico del usuario',
    example: 'email@gmail.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'ID de Google para autenticación OAuth (opcional)',
    example: 'google123456789',
    required: false,
  })
  @IsOptional()
  @IsNotEmpty()
  googleId?: string;

  @ApiProperty({
    description: 'Contraseña del usuario (opcional si se usa Google OAuth)',
    example: 'hashedPassword',
    required: false,
  })
  @IsOptional()
  @IsNotEmpty()
  password?: string;

  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'John',
  })
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'Apellido del usuario',
    example: 'Doe',
  })
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: 'Edad del usuario',
    example: 30,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  age: number;

  @ApiProperty({
    description: 'Indica si el usuario es diestro',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isRightHanded?: boolean;

  @ApiProperty({
    description: 'Rol del usuario en el sistema',
    example: 'user',
    required: false,
  })
  @IsOptional()
  role?: string;
}
