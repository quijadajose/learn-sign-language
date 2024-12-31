import { IsEmail, IsNotEmpty, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';

export class UpdateUserDto {
    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsNotEmpty()
    googleId?: string;

    @IsOptional()
    @IsNotEmpty()
    password?: string;

    @IsOptional()
    @IsNotEmpty()
    firstName?: string;

    @IsOptional()
    @IsNotEmpty()
    lastName?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    age?: number;

    @IsOptional()
    @IsBoolean()
    isRightHanded?: boolean;

    @IsOptional()
    role?: string;
}