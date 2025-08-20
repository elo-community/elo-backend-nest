import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateGeneralPostDto {
    @IsNumber()
    sportCategoryId!: number;

    @IsString()
    title!: string;

    @IsString()
    content!: string;

    @IsOptional()
    @IsString({ each: true })
    imageUrls?: string[];
}
