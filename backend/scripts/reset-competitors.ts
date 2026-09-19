import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { MarketResearchService } from '../src/market-research/market-research.service';

async function main() {
  const prisma = new PrismaClient();
  const businessName = process.argv[2];
  if (!businessName) {
    console.error('Usage: ts-node scripts/reset-competitors.ts "<business name>"');
    process.exit(1);
  }

  const business = await prisma.business.findFirst({
    where: { name: { equals: businessName, mode: 'insensitive' } },
  });
  if (!business) {
    console.error(`Business not found: ${businessName}`);
    process.exit(1);
  }

  const deletedCompetitors = await prisma.competitor.deleteMany({
    where: { businessId: business.id },
  });
  const deletedResearch = await prisma.marketResearch.deleteMany({
    where: { businessId: business.id },
  });
  console.log(
    `Deleted ${deletedCompetitors.count} competitors and ${deletedResearch.count} market research record(s) for "${business.name}".`,
  );

  const config = new ConfigService({});
  const service = new MarketResearchService(prisma as any, config);
  const ran = await service.researchIfNeeded(business.id);
  console.log(`researchIfNeeded returned: ${ran}`);

  const fresh = await prisma.competitor.findMany({
    where: { businessId: business.id },
  });
  console.log('New competitors:', fresh.map((c) => ({ name: c.name, price: c.price.toString(), location: c.location, source: c.source })));

  const research = await prisma.marketResearch.findUnique({ where: { businessId: business.id } });
  console.log('Research summary:', research?.summaryUz);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
