import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPassword {
  @ApiProperty({
    description: 'Correo asociado a la cuenta',
    example: 'email@gmail.com',
    format: 'email',
  })
  @IsEmail()
  email: string;
}
