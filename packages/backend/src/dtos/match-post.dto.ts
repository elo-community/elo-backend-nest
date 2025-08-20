import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateMatchPostDto {
    @IsNumber()
    sportCategoryId!: number;

    @IsString()
    title!: string;

    @IsString()
    content!: string;

    @IsString()
    matchLocation!: string;

    @IsNumber()
    @Min(0)
    @Max(3000)
    myElo!: number;

    @IsString()
    @IsEnum(['similar', 'any', 'higher', 'lower'])
    preferredElo!: string;

    @IsNumber()
    @Min(2)
    @Max(10)
    participantCount!: number;

    @IsOptional()
    @IsDateString()
    deadline?: string;

    @IsOptional()
    @IsDateString()
    matchDate?: string;

    @IsOptional()
    @IsString({ each: true })
    imageUrls?: string[];
}

export class MatchRequestDto {
    @IsNumber()
    postId!: number;

    @IsOptional()
    @IsString()
    message?: string;
}

export class MatchResponseDto {
    @IsNumber()
    postId!: number;

    @IsEnum(['accept', 'reject'])
    action!: string;

    @IsOptional()
    @IsString()
    responseMessage?: string;
}

export class GetRecommendedMatchPostsDto {
    sport?: number;
    limit?: number;
}
