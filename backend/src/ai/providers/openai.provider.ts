import {
  AIInsightPayload,
  AIProvider,
  BusinessAIContext,
  CopilotReply,
  ProductEstimateInput,
  aiInsightSchema,
  copilotReplySchema,
  productEstimateSchema,
} from '../ai.types';
import {
  MarketResearchInput,
  marketResearchSchema,
} from '../../market-research/market-research.types';

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
}

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';

  constructor(
    private readonly apiKey: string,
    private readonly model: string,
    private readonly baseUrl: string,
  ) {}

  async generateInsights(
    context: BusinessAIContext,
  ): Promise<AIInsightPayload> {
    const content = await this.complete([
      {
        role: 'system',
        content:
          'You are a decision-support analyst for Biznes Radar AI. Never invent market statistics. Distinguish user-entered, calculated, demo, and AI-generated content. Cite assumptions. Return strict JSON with keys: summary, marketExplanation, financialExplanation, opportunities, risks, validationQuestions, recommendations, citations. Reply in Uzbek Latin.',
      },
      {
        role: 'user',
        content: JSON.stringify(context),
      },
    ]);
    return aiInsightSchema.parse(this.parseJson(content));
  }

  async chat(
    context: BusinessAIContext,
    question: string,
  ): Promise<CopilotReply> {
    const competitors = context.market?.competitors ?? [];
    const isCompetitorQuestion =
      /raqobat|konkurent|competitor/i.test(question);

    const content = await this.complete([
      {
        role: 'system',
        content:
          "Answer only from the supplied Business Radar JSON. If asked about competitors (raqobatchilar) — how many, who, their prices/locations — you MUST answer using the COMPETITORS array given separately below (each item has name, price, location, source: 'USER' means the entrepreneur entered it, 'MAP' means it was found on OpenStreetMap near the business's city (real business name/location, price usually unknown), 'AI_WEB' means it was found via automated web search and may be less precise). Never answer a competitor question with just a count — you MUST name every competitor from the array, one per line, e.g. '1. <name> — <price/location if known>'. Do not invent competitors not present in that array; if the array is empty, say so explicitly instead of inventing names. Return JSON {answer, citations}. Reply in Uzbek Latin.",
      },
      {
        role: 'user',
        content: JSON.stringify({
          COMPETITORS: competitors,
          context,
          question,
        }),
      },
    ]);
    const reply = copilotReplySchema.parse(this.parseJson(content));

    if (
      isCompetitorQuestion &&
      competitors.length > 0 &&
      !competitors.some((c) => reply.answer.includes(c.name))
    ) {
      const list = competitors
        .map((c, i) => {
          const details = [c.price ? `${c.price} so'm` : null, c.location]
            .filter(Boolean)
            .join(', ');
          return `${i + 1}. ${c.name}${details ? ` — ${details}` : ''}`;
        })
        .join('\n');
      reply.answer = `${reply.answer}\n\nRaqobatchilar ro'yxati:\n${list}`;
    }

    return reply;
  }

  async estimateProductNumbers(input: ProductEstimateInput): Promise<unknown> {
    const content = await this.complete([
      {
        role: 'system',
        content:
          "You help a first-time entrepreneur in Uzbekistan who does not yet know realistic numbers for their planned product. If the given productName is a broad category rather than one specific item (e.g. 'oziq-ovqat'/'grocery' instead of 'guruch 1 kg'), DO NOT average across the whole category — instead silently pick ONE realistic, representative, commonly-sold flagship item within that category/region and base every number on that single item, and name which item you picked at the start of reasoningUz (e.g. \"'guruch 1 kg' uchun taxmin: ...\"). Based on your general knowledge of typical small-retail prices, sales volumes, and monthly fixed operating costs (rent, utilities, minimal staff) in Uzbekistan, suggest REASONABLE STARTING-POINT estimates (not guarantees). Return strict JSON with keys: purchasePrice (number, UZS, wholesale/purchase cost per unit of the single item), sellingPrice (number, UZS, retail price per unit, must be greater than purchasePrice), expectedMonthlySales (number, units per month for a small shop), estimatedMonthlyFixedCost (number, UZS, typical total monthly fixed costs — rent+utilities+minimal staff — for a small shop of this type in this region), reasoningUz (a short Uzbek Latin explanation naming the specific item assumed and why these numbers are reasonable, with a reminder that these are estimates to be adjusted). Reply in Uzbek Latin for reasoningUz.",
      },
      {
        role: 'user',
        content: JSON.stringify(input),
      },
    ]);
    return productEstimateSchema.parse(this.parseJson(content));
  }

  async researchMarket(input: MarketResearchInput): Promise<unknown> {
    const content = await this.complete([
      {
        role: 'system',
        content:
          "You research the local small-retail market for an entrepreneur in Uzbekistan using REAL web search results provided to you (title/snippet/url for each), for a specific product (productName) in a category/city/region. Extract ONLY competitor businesses from the search results that plausibly sell or produce something in the SAME product line as productName — e.g. if productName is 'ruchka' (pens), a carpet shop or a jewelry/gold shop is NOT a relevant competitor even if it appears in the search results, and must be excluded. When category is generic ('OTHER'/'Boshqa'), rely on productName, not the category label, to judge relevance. Do NOT invent competitors not grounded in the search results, and do NOT include irrelevant businesses just to fill the list — an empty competitors array is the correct, honest answer when nothing relevant was found. For each kept competitor return name, an estimated price in UZS if mentioned or clearly implied (else null), and location if mentioned (else null). From the same search results, infer a rough demand score (0-100), demand trend (UP/STABLE/DOWN), and price trend percent only if the search results give some signal; otherwise return null for these. Return strict JSON with keys: competitors (array of {name, estimatedPrice (number or null), location (string or null)}, max 10), demandScore (0-100 or null), demandTrend ('UP'|'STABLE'|'DOWN' or null), trendPercent (number or null), summaryUz (a short Uzbek Latin summary of what was found and from where, explicitly noting this is based on web search, not verified real-time data, and noting if irrelevant results were filtered out). Reply in Uzbek Latin for summaryUz.",
      },
      {
        role: 'user',
        content: JSON.stringify(input),
      },
    ]);
    return marketResearchSchema.parse(this.parseJson(content));
  }

  private parseJson(content: string): unknown {
    const trimmed = content.trim();
    const fenced = trimmed.match(/```json([\s\S]*?)```/i);
    const raw = fenced ? fenced[1] : trimmed;
    return JSON.parse(raw) as unknown;
  }

  private async complete(
    messages: Array<{ role: string; content: string }>,
  ): Promise<string> {
    const response = await fetch(
      `${this.baseUrl.replace(/\/$/, '')}/chat/completions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          temperature: 0.2,
          messages,
          response_format: { type: 'json_object' },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`AI provider HTTP ${response.status}`);
    }

    const payload = (await response.json()) as ChatCompletionResponse;
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Empty AI response');
    }
    return content;
  }
}
