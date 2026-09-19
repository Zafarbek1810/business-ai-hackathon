import { MarketResearchService } from './market-research.service';
import { ConfigService } from '@nestjs/config';

function makeConfig(overrides: Record<string, string> = {}) {
  const values: Record<string, string> = { USE_MOCK_AI: 'true', ...overrides };
  return {
    get: (key: string, def: string) => values[key] ?? def,
  } as unknown as ConfigService;
}

describe('MarketResearchService.researchIfNeeded — concurrency', () => {
  it('does not run a second research pass when another call already claimed the business', async () => {
    const prisma = {
      marketResearch: {
        create: jest
          .fn()
          .mockResolvedValueOnce({}) // first caller claims it
          .mockRejectedValueOnce(new Error('Unique constraint failed')), // second caller loses the race
      },
      business: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };
    (prisma.marketResearch as { delete?: jest.Mock }).delete = jest
      .fn()
      .mockResolvedValue({});
    const service = new MarketResearchService(prisma as never, makeConfig());

    const [first, second] = await Promise.all([
      service.researchIfNeeded('biz-1'),
      service.researchIfNeeded('biz-1'),
    ]);

    // second caller must bail out immediately without touching business/AI at all
    expect(second).toBe(false);
    expect(prisma.marketResearch.create).toHaveBeenCalledTimes(2);
    // only the winner may have gone on to look up the business
    expect(prisma.business.findUnique).toHaveBeenCalledTimes(1);
    void first;
  });

  it('deletes the PENDING claim row when the business no longer exists', async () => {
    const prisma = {
      marketResearch: {
        create: jest.fn().mockResolvedValue({}),
        delete: jest.fn().mockResolvedValue({}),
      },
      business: { findUnique: jest.fn().mockResolvedValue(null) },
    };
    const service = new MarketResearchService(prisma as never, makeConfig());

    const result = await service.researchIfNeeded('missing-biz');

    expect(result).toBe(false);
    expect(prisma.marketResearch.delete).toHaveBeenCalledWith({
      where: { businessId: 'missing-biz' },
    });
  });
});
