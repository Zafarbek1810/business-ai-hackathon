import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  AuthUser,
} from '../common/decorators/current-user.decorator';
import { OwnershipService } from '../common/ownership.service';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessesService } from '../businesses/businesses.service';
import { calculateScenario } from '../finance/engine/finance.engine';
import { ScenarioType } from '@prisma/client';
import { IsEnum, IsNumber, Min } from 'class-validator';
import { AnalyticsService } from '../common/analytics.service';

class UpdateScenarioDto {
  @IsEnum(ScenarioType)
  type!: ScenarioType;

  @IsNumber()
  @Min(0)
  monthlyUnits!: number;
}

@ApiTags('scenarios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ScenariosController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: OwnershipService,
    private readonly businesses: BusinessesService,
    private readonly analytics: AnalyticsService,
  ) {}

  @Get('businesses/:id/scenarios')
  async list(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.ownership.assertBusinessOwner(id, user);
    return this.prisma.financialScenario.findMany({
      where: { businessId: id },
      orderBy: { type: 'asc' },
    });
  }

  @Post('businesses/:id/scenarios')
  async upsert(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateScenarioDto,
  ) {
    await this.ownership.assertBusinessOwner(id, user);
    const business = await this.businesses.findOne(user, id);
    const input = this.businesses.toFinanceInput(business);
    const calculated = calculateScenario(input, {
      type: dto.type,
      monthlyUnits: dto.monthlyUnits,
    });
    const saved = await this.prisma.financialScenario.upsert({
      where: { businessId_type: { businessId: id, type: dto.type } },
      update: {
        monthlyUnits: calculated.monthlyUnits,
        sellingPrice: calculated.sellingPrice,
        variableCost: calculated.variableCost,
        fixedCosts: calculated.fixedCosts,
        revenue: calculated.revenue,
        costs: calculated.costs,
        profit: calculated.profit,
        breakEvenUnits: calculated.breakEvenUnits ?? 0,
        cashRequirement: calculated.cashRequirement,
      },
      create: {
        businessId: id,
        type: dto.type,
        monthlyUnits: calculated.monthlyUnits,
        sellingPrice: calculated.sellingPrice,
        variableCost: calculated.variableCost,
        fixedCosts: calculated.fixedCosts,
        revenue: calculated.revenue,
        costs: calculated.costs,
        profit: calculated.profit,
        breakEvenUnits: calculated.breakEvenUnits ?? 0,
        cashRequirement: calculated.cashRequirement,
      },
    });
    await this.analytics.track('scenario_created', user.id, {
      businessId: id,
      type: dto.type,
    });
    return saved;
  }

  @Patch('scenarios/:id')
  async patch(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateScenarioDto,
  ) {
    const existing = await this.prisma.financialScenario.findUniqueOrThrow({
      where: { id },
    });
    await this.ownership.assertBusinessOwner(existing.businessId, user);
    const business = await this.businesses.findOne(user, existing.businessId);
    const input = this.businesses.toFinanceInput(business);
    const calculated = calculateScenario(input, {
      type: dto.type,
      monthlyUnits: dto.monthlyUnits,
    });
    return this.prisma.financialScenario.update({
      where: { id },
      data: {
        type: dto.type,
        monthlyUnits: calculated.monthlyUnits,
        sellingPrice: calculated.sellingPrice,
        variableCost: calculated.variableCost,
        fixedCosts: calculated.fixedCosts,
        revenue: calculated.revenue,
        costs: calculated.costs,
        profit: calculated.profit,
        breakEvenUnits: calculated.breakEvenUnits ?? 0,
        cashRequirement: calculated.cashRequirement,
      },
    });
  }
}
