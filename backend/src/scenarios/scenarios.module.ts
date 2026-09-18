import { Module } from '@nestjs/common';
import { ScenariosController } from './scenarios.controller';
import { BusinessesModule } from '../businesses/businesses.module';

@Module({
  imports: [BusinessesModule],
  controllers: [ScenariosController],
})
export class ScenariosModule {}
