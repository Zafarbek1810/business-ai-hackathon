import { Module } from '@nestjs/common';
import { RisksController } from './risks.controller';
import { BusinessesModule } from '../businesses/businesses.module';

@Module({
  imports: [BusinessesModule],
  controllers: [RisksController],
})
export class RisksModule {}
