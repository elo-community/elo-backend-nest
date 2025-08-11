import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export class RespondMatchResultDto {
    @ApiProperty({
        description: 'Action to take on the match result',
        enum: ['accept', 'reject', 'counter'],
        example: 'accept',
    })
    @IsEnum(['accept', 'reject', 'counter'])
    action!: 'accept' | 'reject' | 'counter';

    @ApiPropertyOptional({
        description: 'Partner\'s result (required if action is counter)',
        enum: ['win', 'lose', 'draw'],
        example: 'draw',
    })
    @IsOptional()
    @IsEnum(['win', 'lose', 'draw'])
    partnerResult?: 'win' | 'lose' | 'draw';
} 