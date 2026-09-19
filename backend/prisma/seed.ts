import { Plan, PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  DEFAULT_PLAN_CATALOG,
  DEFAULT_PRICING_PAGE,
  PLAN_CATALOG_KEY,
  PRICING_PAGE_KEY,
} from '../src/common/plan-catalog';

const prisma = new PrismaClient();

/**
 * No demo data. Market context (price/competition/demand) is generated live
 * by MarketEstimateService (AI), not read from seeded tables — see
 * backend/src/market-estimate/market-estimate.service.ts. This script only
 * clears the database and creates the one account needed for /admin access
 * (fresh signups always get Role.USER, so without this nobody could reach
 * the admin panel).
 */
async function main() {
  await prisma.analyticsEvent.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.businessReport.deleteMany();
  await prisma.aIAnalysis.deleteMany();
  await prisma.riskAnalysis.deleteMany();
  await prisma.financialScenario.deleteMany();
  await prisma.financialSnapshot.deleteMany();
  await prisma.businessExpense.deleteMany();
  await prisma.businessProduct.deleteMany();
  await prisma.business.deleteMany();
  await prisma.demandSignal.deleteMany();
  await prisma.marketPrice.deleteMany();
  await prisma.competitor.deleteMany();
  await prisma.marketProduct.deleteMany();
  await prisma.marketCategory.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.user.deleteMany();

  const adminHash = await bcrypt.hash('Admin1234!', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@biznesradar.uz',
      passwordHash: adminHash,
      name: 'Admin',
      role: Role.ADMIN,
      plan: Plan.BUSINESS,
      locale: 'uz',
    },
  });

  await prisma.systemSetting.createMany({
    data: [
      { key: 'default_currency', value: 'UZS' },
      { key: 'market_data_mode', value: 'AI' },
      { key: 'platform_name', value: 'Biznes Radar AI' },
      { key: 'support_email', value: 'admin@biznesradar.uz' },
      { key: 'registration_enabled', value: 'true' },
      { key: PLAN_CATALOG_KEY, value: JSON.stringify(DEFAULT_PLAN_CATALOG) },
      { key: PRICING_PAGE_KEY, value: JSON.stringify(DEFAULT_PRICING_PAGE) },
    ],
  });

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'SEED',
      entity: 'System',
      metadata: { note: 'Database reset, no demo data seeded' },
    },
  });

  console.log('Seed complete — database cleared.');
  console.log('Admin user: admin@biznesradar.uz / Admin1234!');
  console.log('All other accounts must be created via /register.');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
