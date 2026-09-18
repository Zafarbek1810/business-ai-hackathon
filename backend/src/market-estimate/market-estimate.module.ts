import { Module } from '@nestjs/common';
import { MarketEstimateService } from './market-estimate.service';

@Module({
  providers: [MarketEstimateService],
  exports: [MarketEstimateService],
})
export class MarketEstimateModule {}
