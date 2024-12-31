import { IsString, IsNumber, IsPort, IsBoolean } from 'class-validator';

export class EnvConfig {
    @IsString()
    DB_HOST: string;

    @IsNumber()
    DB_PORT: number;

    @IsString()
    DB_USERNAME: string;

    @IsString()
    DB_PASSWORD: string;

    @IsString()
    DB_DATABASE: string;

    @IsString()
    FRONTEND_URL: string;

    @IsNumber()
    API_PORT: number;

    @IsString()
    JWT_SECRET: string;

    @IsString()
    JWT_EXPIRES_IN: string;

    @IsString()
    GOOGLE_CLIENT_ID: string;

    @IsString()
    GOOGLE_CLIENT_SECRET: string;

    @IsString()
    GOOGLE_CALLBACK_URL: string;

    @IsString()
    EMAIL_HOST: string;

    @IsNumber()
    EMAIL_PORT: number;

    @IsString()
    EMAIL_USER: string;

    @IsString()
    EMAIL_PASSWORD: string;

    @IsBoolean()
    EMAIL_SECURE: boolean;
}