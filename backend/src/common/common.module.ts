import { Global, Module } from '@nestjs/common';
import { OwnershipService } from './ownership.service';
import { AnalyticsService } from './analytics.service';

@Global()
@Module({
  providers: [OwnershipService, AnalyticsService],
  exports: [OwnershipService, AnalyticsService],
})
export class CommonModule {}
