import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmResetPasswordDto {
  @ApiProperty({
    description: 'Token recibido por correo',
    example: 'reset-token-uuid',
  })
  @IsString()
  token: string;

  @ApiProperty({
    description: 'Nueva contraseña (mínimo 8 caracteres)',
    example: 'NuevaClaveSegura1',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
