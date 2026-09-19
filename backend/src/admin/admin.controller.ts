import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CurrentUser,
  AuthUser,
} from '../common/decorators/current-user.decorator';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('dashboard')
  async dashboard() {
    const [users, businesses, analyses, reports, events, categories] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.business.count(),
        this.prisma.aIAnalysis.count(),
        this.prisma.businessReport.count(),
        this.prisma.analyticsEvent.count(),
        this.prisma.business.groupBy({
          by: ['category'],
          _count: { category: true },
          orderBy: { _count: { category: 'desc' } },
          take: 8,
        }),
      ]);
    return {
      totalUsers: users,
      activeBusinesses: businesses,
      analysesCreated: events,
      aiAnalyses: analyses,
      reports,
      popularCategories: categories,
    };
  }

  @Get('users')
  users() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        plan: true,
        createdAt: true,
        _count: { select: { businesses: true } },
      },
    });
  }

  @Get('businesses')
  businesses() {
    return this.prisma.business.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { email: true, name: true } } },
    });
  }

  @Get('datasets')
  datasets() {
    return this.prisma.marketProduct.findMany({
      include: {
        category: true,
        _count: { select: { prices: true } },
      },
    });
  }

  @Get('categories')
  categories() {
    return this.prisma.marketCategory.findMany();
  }

  @Get('ai-usage')
  aiUsage() {
    return this.prisma.aIAnalysis.groupBy({
      by: ['provider', 'type'],
      _count: { _all: true },
    });
  }

  @Get('reports')
  reports() {
    return this.prisma.businessReport.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true } },
        business: { select: { name: true } },
      },
    });
  }

  @Get('settings')
  settings() {
    return this.prisma.systemSetting.findMany();
  }

  @Patch('users/:id/role')
  async promote(@Param('id') id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { role: Role.ADMIN },
      select: { id: true, email: true, role: true },
    });
  }

  @Get('me-check')
  me(@CurrentUser() user: AuthUser) {
    return user;
  }
}
