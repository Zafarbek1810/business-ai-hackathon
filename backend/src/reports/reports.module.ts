import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { BusinessesModule } from '../businesses/businesses.module';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [BusinessesModule, AIModule],
  controllers: [ReportsController],
})
export class ReportsModule {}
