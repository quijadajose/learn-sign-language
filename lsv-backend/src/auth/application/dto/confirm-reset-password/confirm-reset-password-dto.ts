import { IsString, MinLength } from 'class-validator';

export class ConfirmResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}
