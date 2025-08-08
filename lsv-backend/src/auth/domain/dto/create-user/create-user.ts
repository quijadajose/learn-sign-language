import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsNotEmpty()
  googleId?: string;

  @IsOptional()
  @IsNotEmpty()
  password?: string;

  @IsNotEmpty()
  firstName: string;

  @IsNotEmpty()
  lastName: string;

  @IsInt()
  @Min(0)
  age: number;

  @IsOptional()
  @IsBoolean()
  isRightHanded?: boolean;

  @IsOptional()
  role?: string;
}
