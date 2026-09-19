import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PlansController } from './plans.controller';

@Module({
  controllers: [AdminController, PlansController],
  providers: [AdminService],
})
export class AdminModule {}
