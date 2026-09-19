import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  AuthUser,
} from '../common/decorators/current-user.decorator';
import { IsString } from 'class-validator';
import { BusinessesService } from '../businesses/businesses.service';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { OwnershipService } from '../common/ownership.service';
import { AnalyticsService } from '../common/analytics.service';
import { AIService } from '../ai/ai.service';
import { recommendSkills } from './engine/skill-recommender.engine';

class CreateReportDto {
  @IsString()
  businessId!: string;
}

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly businesses: BusinessesService,
    private readonly prisma: PrismaService,
    private readonly ownership: OwnershipService,
    private readonly analytics: AnalyticsService,
    private readonly ai: AIService,
  ) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.prisma.businessReport.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { business: { select: { name: true, isDemo: true } } },
    });
  }

  @Get(':id')
  async get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const report = await this.prisma.businessReport.findUniqueOrThrow({
      where: { id },
      include: { business: true },
    });
    await this.ownership.assertBusinessOwner(report.businessId, user);
    return report;
  }

  @Post()
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateReportDto) {
    const radar = await this.businesses.radar(user, dto.businessId);
    const insights = await this.ai.generateBusinessSummary(
      user,
      dto.businessId,
    );
    const sections = {
      overview: {
        name: radar.business.name,
        category: radar.business.category,
        location: `${radar.business.city}, ${radar.business.region}`,
        capital: radar.business.availableCapital,
        isDemo: radar.business.isDemo,
      },
      market: radar.market,
      competition: await this.prisma.competitor.findMany({
        where: { businessId: dto.businessId },
        take: 12,
      }),
      finance: radar.finance,
      scenarios: radar.scenarios,
      risks: radar.risks,
      insights,
      checklist: insights.validationQuestions,
      skillRecommendations: recommendSkills(radar.finance, radar.risks),
      disclaimer:
        'Bu hisobot qaror qo‘llab-quvvatlash vositasidir, moliyaviy maslahat yoki kafolat emas. Demo ma’lumotlar haqiqiy bozor statistikasi sifatida taqdim etilmaydi.',
    };
    const report = await this.prisma.businessReport.create({
      data: {
        businessId: dto.businessId,
        userId: user.id,
        title: `${radar.business.name} — Biznes Radar hisobot`,
        sections: sections as unknown as Prisma.InputJsonValue,
      },
    });
    await this.analytics.track('report_generated', user.id, {
      reportId: report.id,
    });
    return report;
  }
}
