import { IsEmail } from 'class-validator';
export class ResetPassword {
  @IsEmail()
  email: string;
}
