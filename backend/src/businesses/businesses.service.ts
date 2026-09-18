import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ExpenseCategory, ExpenseKind, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateBusinessDto,
  UpdateBusinessDto,
} from './dto/create-business.dto';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { OwnershipService } from '../common/ownership.service';
import { AnalyticsService } from '../common/analytics.service';
import {
  FinanceInput,
  calculateFinance,
  calculateScenario,
  defaultScenarioAssumptions,
} from '../finance/engine/finance.engine';
import { analyzeRisks } from '../risks/engine/risk.engine';
import { toNumber } from '../common/utils/decimal';
import { MarketEstimateService } from '../market-estimate/market-estimate.service';
import { PLAN_BUSINESS_LIMITS, planLimitMessage } from '../common/plans';

const businessInclude = {
  products: true,
  expenses: true,
  scenarios: true,
  risks: { orderBy: { createdAt: 'desc' as const }, take: 1 },
  snapshots: { orderBy: { createdAt: 'desc' as const }, take: 1 },
} satisfies Prisma.BusinessInclude;

@Injectable()
export class BusinessesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: OwnershipService,
    private readonly analytics: AnalyticsService,
    private readonly marketEstimate: MarketEstimateService,
  ) {}

  async create(user: AuthUser, dto: CreateBusinessDto) {
    await this.assertPlanLimit(user, await this.countForUser(user.id));
    const business = await this.prisma.business.create({
      data: {
        userId: user.id,
        name: dto.name,
        category: dto.category,
        country: dto.country ?? "O'zbekiston",
        region: dto.region,
        city: dto.city,
        availableCapital: dto.availableCapital,
        startDate: new Date(dto.startDate),
        description: dto.description,
        products: { create: dto.products },
        expenses: { create: dto.expenses },
      },
      include: businessInclude,
    });
    await this.rebuildDerived(business.id);
    await this.analytics.track('business_created', user.id, {
      businessId: business.id,
    });
    return this.findOne(user, business.id);
  }

  async findAll(user: AuthUser) {
    const where = user.role === 'ADMIN' ? {} : { userId: user.id };
    return this.prisma.business.findMany({
      where,
      include: businessInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(user: AuthUser, id: string) {
    await this.ownership.assertBusinessOwner(id, user);
    const business = await this.prisma.business.findUnique({
      where: { id },
      include: {
        ...businessInclude,
        analyses: { orderBy: { createdAt: 'desc' }, take: 5 },
        reports: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
    if (!business) {
      throw new NotFoundException('Biznes topilmadi.');
    }
    return business;
  }

  async update(user: AuthUser, id: string, dto: UpdateBusinessDto) {
    await this.ownership.assertBusinessOwner(id, user);
    await this.prisma.business.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.category !== undefined ? { category: dto.category } : {}),
        ...(dto.region !== undefined ? { region: dto.region } : {}),
        ...(dto.city !== undefined ? { city: dto.city } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.availableCapital !== undefined
          ? { availableCapital: dto.availableCapital }
          : {}),
        ...(dto.startDate !== undefined
          ? { startDate: new Date(dto.startDate) }
          : {}),
        ...(dto.products
          ? {
              products: {
                deleteMany: {},
                create: dto.products,
              },
            }
          : {}),
        ...(dto.expenses
          ? {
              expenses: {
                deleteMany: {},
                create: dto.expenses,
              },
            }
          : {}),
      },
    });
    await this.rebuildDerived(id);
    return this.findOne(user, id);
  }

  async remove(user: AuthUser, id: string) {
    await this.ownership.assertBusinessOwner(id, user);
    await this.prisma.business.delete({ where: { id } });
    return { success: true };
  }

  async radar(user: AuthUser, id: string) {
    await this.ownership.assertBusinessOwner(id, user);
    const existing = await this.prisma.business.findUnique({
      where: { id },
      include: { snapshots: true, scenarios: true, risks: true },
    });
    if (
      existing &&
      (existing.snapshots.length === 0 || existing.scenarios.length === 0)
    ) {
      await this.rebuildDerived(id);
    }
    const business = await this.findOne(user, id);
    const market = await this.marketContext(business.category, business.region);
    const financeInput = this.toFinanceInput(business);
    const finance = calculateFinance(financeInput);
    const latestRisk = business.risks[0] ?? null;
    return {
      business,
      market,
      finance,
      scenarios: business.scenarios,
      risks: latestRisk,
      provenance: {
        market: market.provenance,
        finance: 'CALCULATED',
        business: business.isDemo ? 'DEMO' : 'USER',
      },
    };
  }

  async rebuildDerived(businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: { products: true, expenses: true },
    });
    if (!business) {
      throw new NotFoundException('Biznes topilmadi.');
    }

    const input = this.toFinanceInput(business);
    const finance = calculateFinance(input);
    const market = await this.marketContext(business.category, business.region);
    const primary = business.products[0];
    const risks = analyzeRisks({
      competitorCount: market.competitorCount,
      grossMargin: finance.grossMargin,
      fixedCosts: finance.operatingExpenses,
      revenue: finance.revenue,
      availableCapital: toNumber(business.availableCapital),
      expectedUnits: primary?.expectedMonthlySales ?? 0,
      variableCostPerUnit: primary ? toNumber(primary.purchasePrice) : 0,
      sellingPrice: primary ? toNumber(primary.sellingPrice) : 0,
      demandScore: market.demandScore,
      productCount: business.products.length,
      marketAveragePrice: market.averagePrice,
      seasonalFactor: market.seasonalFactor,
    });

    const assumptions = defaultScenarioAssumptions(
      primary?.expectedMonthlySales ?? 0,
    ).map((item) => calculateScenario(input, item));

    await this.prisma.$transaction([
      this.prisma.financialSnapshot.create({
        data: {
          businessId,
          revenue: finance.revenue,
          cogs: finance.cogs,
          grossProfit: finance.grossProfit,
          operatingExpenses: finance.operatingExpenses,
          netProfit: finance.netProfit,
          grossMargin: finance.grossMargin,
          operatingMargin: finance.operatingMargin,
          breakEvenUnits: finance.breakEvenUnits,
          breakEvenRevenue: finance.breakEvenRevenue,
          roiEstimate: finance.roiAnnualEstimate,
          payload: {
            ...finance,
            warnings: finance.warnings,
          } as unknown as Prisma.InputJsonValue,
        },
      }),
      this.prisma.riskAnalysis.create({
        data: {
          businessId,
          overallScore: risks.overallScore,
          overallLevel: risks.overallLevel,
          items: risks.items as unknown as Prisma.InputJsonValue,
        },
      }),
      this.prisma.financialScenario.deleteMany({ where: { businessId } }),
      ...assumptions.map((scenario) =>
        this.prisma.financialScenario.create({
          data: {
            businessId,
            type: scenario.type,
            monthlyUnits: scenario.monthlyUnits,
            sellingPrice: scenario.sellingPrice,
            variableCost: scenario.variableCost,
            fixedCosts: scenario.fixedCosts,
            revenue: scenario.revenue,
            costs: scenario.costs,
            profit: scenario.profit,
            breakEvenUnits: scenario.breakEvenUnits ?? 0,
            cashRequirement: scenario.cashRequirement,
          },
        }),
      ),
    ]);

    return { finance, risks };
  }

  toFinanceInput(business: {
    availableCapital: Prisma.Decimal | number;
    products: Array<{
      purchasePrice: Prisma.Decimal | number;
      sellingPrice: Prisma.Decimal | number;
      expectedMonthlySales: number;
    }>;
    expenses: Array<{
      kind: ExpenseKind;
      category: ExpenseCategory;
      amount: Prisma.Decimal | number;
    }>;
  }): FinanceInput {
    const primary = business.products[0];
    if (!primary) {
      throw new BadRequestException(
        'Biznesda kamida bitta mahsulot bo‘lishi kerak.',
      );
    }
    const fixed = {
      rent: 0,
      salary: 0,
      utilities: 0,
      software: 0,
      marketing: 0,
      other: 0,
    };
    const variableMonthly = {
      delivery: 0,
      packaging: 0,
      transactionFees: 0,
    };

    for (const expense of business.expenses) {
      const amount = toNumber(expense.amount);
      if (expense.kind === ExpenseKind.VARIABLE) {
        if (expense.category === ExpenseCategory.DELIVERY)
          variableMonthly.delivery += amount;
        else if (expense.category === ExpenseCategory.PACKAGING)
          variableMonthly.packaging += amount;
        else if (expense.category === ExpenseCategory.TRANSACTION_FEES)
          variableMonthly.transactionFees += amount;
        else variableMonthly.delivery += amount;
        continue;
      }
      if (expense.category === ExpenseCategory.RENT) fixed.rent += amount;
      else if (expense.category === ExpenseCategory.SALARY)
        fixed.salary += amount;
      else if (expense.category === ExpenseCategory.UTILITIES)
        fixed.utilities += amount;
      else if (expense.category === ExpenseCategory.SOFTWARE)
        fixed.software += amount;
      else if (expense.category === ExpenseCategory.MARKETING)
        fixed.marketing += amount;
      else fixed.other += amount;
    }

    const extraUnits = business.products.slice(1).reduce((sum, product) => {
      return (
        sum + toNumber(product.sellingPrice) * product.expectedMonthlySales
      );
    }, 0);

    return {
      sellingPrice: toNumber(primary.sellingPrice),
      variableCostPerUnit: toNumber(primary.purchasePrice),
      expectedUnits: primary.expectedMonthlySales,
      otherRevenue: extraUnits,
      initialInvestment: toNumber(business.availableCapital),
      availableCapital: toNumber(business.availableCapital),
      fixedCosts: fixed,
      variableMonthly,
    };
  }

  async marketContext(category: string, region: string) {
    return this.marketEstimate.estimateMarketContext(category, region);
  }

  private async countForUser(userId: string) {
    return this.prisma.business.count({ where: { userId } });
  }

  private async assertPlanLimit(user: AuthUser, count: number) {
    if (user.role === 'ADMIN') return;
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { plan: true },
    });
    const plan = dbUser?.plan ?? 'FREE';
    const limit = PLAN_BUSINESS_LIMITS[plan];
    if (limit !== null && count >= limit) {
      throw new ForbiddenException(planLimitMessage(plan, limit));
    }
  }
}
