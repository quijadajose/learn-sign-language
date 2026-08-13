import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginUserDto {
  @ApiProperty({
    description: 'Correo electrónico del usuario',
    example: 'email@gmail.com',
    format: 'email',
  })
  @IsEmail()
  @IsString()
  email: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'hashedPassword',
  })
  @IsString()
  password: string;
}
