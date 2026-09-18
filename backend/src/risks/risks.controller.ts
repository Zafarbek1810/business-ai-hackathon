import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  AuthUser,
} from '../common/decorators/current-user.decorator';
import { BusinessesService } from '../businesses/businesses.service';
import { PrismaService } from '../prisma/prisma.service';
import { OwnershipService } from '../common/ownership.service';

@ApiTags('risks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('businesses/:id/risks')
export class RisksController {
  constructor(
    private readonly businesses: BusinessesService,
    private readonly prisma: PrismaService,
    private readonly ownership: OwnershipService,
  ) {}

  @Get()
  async list(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.ownership.assertBusinessOwner(id, user);
    return this.prisma.riskAnalysis.findMany({
      where: { businessId: id },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('analyze')
  async analyze(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.ownership.assertBusinessOwner(id, user);
    await this.businesses.rebuildDerived(id);
    return this.prisma.riskAnalysis.findFirst({
      where: { businessId: id },
      orderBy: { createdAt: 'desc' },
    });
  }
}
