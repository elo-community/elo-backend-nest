import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateMatchResultDto {
    @ApiProperty({
        description: 'Sport category ID',
        example: 1,
    })
    @IsNumber()
    @Min(1)
    sportCategoryId!: number;

    @ApiProperty({
        description: 'Partner nickname (opponent)',
        example: 'tennis_pro',
    })
    @IsString()
    partnerNickname!: string;

    @ApiProperty({
        description: 'Match result from sender\'s perspective',
        enum: ['win', 'lose', 'draw'],
        example: 'win',
    })
    @IsEnum(['win', 'lose', 'draw'])
    senderResult!: 'win' | 'lose' | 'draw';

    @ApiPropertyOptional({
        description: 'Whether the match has handicap',
        default: false,
        example: false,
    })
    @IsOptional()
    @IsBoolean()
    isHandicap?: boolean;

    @ApiPropertyOptional({
        description: 'When the match was played (ISO date string). If not provided, current time will be used.',
        example: '2025-08-10T14:00:00Z',
    })
    @IsOptional()
    @IsDateString()
    playedAt?: string | Date;
} 