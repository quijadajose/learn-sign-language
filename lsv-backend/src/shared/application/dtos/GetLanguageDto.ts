import { IsString } from "class-validator";

export class GetLanguageDto{
    @IsString()
    id: string;
}