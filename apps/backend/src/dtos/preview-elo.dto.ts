import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';

export class PreviewEloDto {
    @ApiProperty({
        description: 'Sport category ID',
        example: 1,
    })
    @IsNumber()
    @Min(1)
    sportCategoryId!: number;

    @ApiProperty({
        description: 'Player A ID (reporter)',
        example: 10,
    })
    @IsNumber()
    @Min(1)
    aId!: number;

    @ApiProperty({
        description: 'Player B ID (opponent)',
        example: 22,
    })
    @IsNumber()
    @Min(1)
    bId!: number;

    @ApiProperty({
        description: 'Match result from A\'s perspective',
        enum: ['win', 'lose', 'draw'],
        example: 'lose',
    })
    @IsEnum(['win', 'lose', 'draw'])
    result!: 'win' | 'lose' | 'draw';

    @ApiPropertyOptional({
        description: 'Whether the match has handicap',
        default: false,
        example: true,
    })
    @IsOptional()
    @IsBoolean()
    isHandicap?: boolean;
} 