import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserElo } from '../entities/user-elo.entity';
import { EloController } from './elo.controller';
import { EloService } from './elo.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserElo])],
  controllers: [EloController],
  providers: [EloService],
  exports: [EloService, TypeOrmModule],
})
export class EloModule {}
