import { Global, Module } from '@nestjs/common';
import { OwnershipService } from './ownership.service';
import { AnalyticsService } from './analytics.service';
import { PlansService } from './plans.service';

@Global()
@Module({
  providers: [OwnershipService, AnalyticsService, PlansService],
  exports: [OwnershipService, AnalyticsService, PlansService],
})
export class CommonModule {}
