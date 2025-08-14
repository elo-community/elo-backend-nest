import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class RespondMatchResultDto {
    @ApiProperty({
        description: 'Action to take on the match result',
        enum: ['accept', 'reject'],
        example: 'accept',
    })
    @IsEnum(['accept', 'reject'])
    action!: 'accept' | 'reject';
} 