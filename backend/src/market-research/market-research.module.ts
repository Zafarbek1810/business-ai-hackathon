import { Module } from '@nestjs/common';
import { MarketResearchService } from './market-research.service';

@Module({
  providers: [MarketResearchService],
  exports: [MarketResearchService],
})
export class MarketResearchModule {}
