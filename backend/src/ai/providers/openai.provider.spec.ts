import { OpenAIProvider } from './openai.provider';
import { BusinessAIContext } from '../ai.types';

function makeContext(
  competitors: BusinessAIContext['market']['competitors'],
): BusinessAIContext {
  return {
    business: {
      name: 'Moshina aksesuar dokon',
      category: 'OTHER',
      region: 'Xorazm',
      city: 'Urganch',
      availableCapital: 10_000_000,
      isDemo: true,
    },
    products: [
      {
        name: 'Moshina akksesuari',
        purchasePrice: 50_000,
        sellingPrice: 80_000,
        expectedMonthlySales: 30,
      },
    ],
    market: {
      provenance: 'AI_WEB',
      averagePrice: null,
      minPrice: null,
      maxPrice: null,
      trendPercent: null,
      competitorCount: competitors.length,
      competitors,
      demandScore: null,
      demandTrend: null,
      summaryUz: null,
    },
    financials: {
      revenue: 2_400_000,
      cogs: 1_500_000,
      grossProfit: 900_000,
      operatingExpenses: 400_000,
      netProfit: 500_000,
      grossMargin: 0.375,
      contributionMargin: 900_000,
      breakEvenUnits: null,
      breakEvenRevenue: null,
    },
    scenarios: [],
    risks: { overallScore: 0, overallLevel: 'LOW', items: [] },
  };
}

interface ChatRequestBody {
  messages: Array<{ role: string; content: string }>;
}

function getFetchMock(): jest.Mock {
  return (global as unknown as { fetch: jest.Mock }).fetch;
}

function lastRequestBody(): ChatRequestBody {
  const call = getFetchMock().mock.calls[0] as [string, { body: string }];
  return JSON.parse(call[1].body) as ChatRequestBody;
}

function mockFetchOnce(answer: string, citations: string[] = ['c1']) {
  (global as unknown as { fetch: jest.Mock }).fetch = jest
    .fn()
    .mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [
            {
              message: {
                content: JSON.stringify({ answer, citations }),
              },
            },
          ],
        }),
    });
}

describe('OpenAIProvider.chat — competitor questions', () => {
  const provider = new OpenAIProvider('key', 'model', 'https://example.com/v1');

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sends the competitors array as its own labeled block, not buried in context', async () => {
    const competitors = [
      {
        name: 'Samsung',
        price: 0,
        location: 'Al-Xorazmiy koʻchasi',
        source: 'MAP',
      },
    ];
    mockFetchOnce('Bitta raqobatchi bor: Samsung.');
    await provider.chat(
      makeContext(competitors),
      'ushbu biznesdagi raqobatchilar kimlar',
    );

    const body = lastRequestBody();
    const userMessage = body.messages.find((m) => m.role === 'user');
    const parsed = JSON.parse(userMessage!.content) as {
      COMPETITORS: unknown;
    };
    expect(parsed.COMPETITORS).toEqual(competitors);
  });

  it('passes through the model answer when it already names every competitor', async () => {
    const competitors = [
      {
        name: 'Darital Shoes',
        price: 120000,
        location: 'Urganch',
        source: 'MAP',
      },
      { name: 'GSM Master', price: 0, location: null, source: 'MAP' },
    ];
    mockFetchOnce(
      '1. Darital Shoes\n2. GSM Master — bular sizning raqobatchilaringiz.',
    );
    const reply = await provider.chat(
      makeContext(competitors),
      'raqobatchilarim kimlar',
    );

    expect(reply.answer).toContain('Darital Shoes');
    expect(reply.answer).toContain('GSM Master');
    // no duplicated fallback list appended
    expect(reply.answer.match(/Darital Shoes/g)?.length).toBe(1);
  });

  it('appends a deterministic competitor list when the model answers with only a count', async () => {
    const competitors = [
      { name: 'MAN Avtosalon', price: 0, location: null, source: 'MAP' },
      { name: 'Krytiy rynok', price: 0, location: null, source: 'MAP' },
    ];
    mockFetchOnce('Ushbu biznesda 2 ta raqobatchi mavjud.');
    const reply = await provider.chat(
      makeContext(competitors),
      'ushbu biznesdagi raqobatchilar kimlar',
    );

    expect(reply.answer).toContain('2 ta raqobatchi');
    expect(reply.answer).toContain('MAN Avtosalon');
    expect(reply.answer).toContain('Krytiy rynok');
  });

  it('does not append a fallback list for non-competitor questions', async () => {
    const competitors = [
      { name: 'MAN Avtosalon', price: 0, location: null, source: 'MAP' },
    ];
    mockFetchOnce('Bu oyda sof foydangiz 500 000 soʻm.');
    const reply = await provider.chat(
      makeContext(competitors),
      'sof foydam qancha',
    );

    expect(reply.answer).not.toContain('MAN Avtosalon');
  });

  it('does not append anything when there are no competitors at all', async () => {
    mockFetchOnce('Hozircha raqobatchilar bazada mavjud emas.');
    const reply = await provider.chat(
      makeContext([]),
      'raqobatchilarim kimlar',
    );

    expect(reply.answer).toBe('Hozircha raqobatchilar bazada mavjud emas.');
  });

  it('does not append a fallback when the answer already partially names competitors', async () => {
    const competitors = [
      { name: 'MAN Avtosalon', price: 0, location: null, source: 'MAP' },
      { name: 'Samsung', price: 0, location: null, source: 'MAP' },
    ];
    mockFetchOnce('Faqat MAN Avtosalon haqida maʻlumot bor.');
    const reply = await provider.chat(
      makeContext(competitors),
      'raqobatchilarim kimlar',
    );

    // model named at least one competitor verbatim -> fallback should not trigger
    expect(reply.answer).toBe('Faqat MAN Avtosalon haqida maʻlumot bor.');
  });
});
