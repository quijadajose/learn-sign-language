import { IsNotEmpty, IsString } from "class-validator";

export class CreateStageDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    description: string;
    
    @IsNotEmpty()
    @IsString()
    languageId: string;
}
