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
    const content = await this.complete([
      {
        role: 'system',
        content:
          "Answer only from the supplied Business Radar JSON. If asked about competitors (raqobatchilar) — how many, who, their prices/locations — answer using context.market.competitors (each has name, price, location, source: 'USER' means the entrepreneur entered it, 'MAP' means it was found on OpenStreetMap near the business's city (real business name/location, price usually unknown), 'AI_WEB' means it was found via automated web search and may be less precise). Do not invent numbers or competitors not present in that array. Return JSON {answer, citations}. Reply in Uzbek Latin.",
      },
      {
        role: 'user',
        content: JSON.stringify({ context, question }),
      },
    ]);
    return copilotReplySchema.parse(this.parseJson(content));
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
          'You research the local small-retail market for an entrepreneur in Uzbekistan using REAL web search results provided to you (title/snippet/url for each). Extract concrete competitor businesses mentioned in the search results (name, an estimated price in UZS if a price is mentioned or clearly implied, and location if mentioned) — do NOT invent competitors that are not grounded in the search results; if the search results contain no usable competitor names, return an empty competitors array. From the same search results, infer a rough demand score (0-100), demand trend (UP/STABLE/DOWN), and price trend percent only if the search results give some signal; otherwise return null for these. Return strict JSON with keys: competitors (array of {name, estimatedPrice (number or null), location (string or null)}, max 10), demandScore (0-100 or null), demandTrend (\'UP\'|\'STABLE\'|\'DOWN\' or null), trendPercent (number or null), summaryUz (a short Uzbek Latin summary of what was found and from where, explicitly noting this is based on web search, not verified real-time data). Reply in Uzbek Latin for summaryUz.',
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
