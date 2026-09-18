import {
  AIInsightPayload,
  AIProvider,
  BusinessAIContext,
  CopilotReply,
  MarketContextEstimateInput,
  ProductEstimateInput,
  aiInsightSchema,
  copilotReplySchema,
  marketContextEstimateSchema,
  productEstimateSchema,
} from '../ai.types';

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
          'Answer only from the supplied Business Radar JSON. Do not invent numbers. Return JSON {answer, citations}. Reply in Uzbek Latin.',
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

  async estimateMarketContext(
    input: MarketContextEstimateInput,
  ): Promise<unknown> {
    const content = await this.complete([
      {
        role: 'system',
        content:
          "Based on your general knowledge of the Uzbekistan small-retail market, provide a REASONABLE, CLEARLY-LABELED-AS-ESTIMATE snapshot of typical market conditions for the given business category and region: an average/min/max retail price range in UZS for a typical product in that category, a rough recent price trend percent (can be 0 if unknown), a typical number of visible local competitors for a small shop in that category/region, and a demand score (0-100) with trend. Never present these as verified real-time statistics. Return strict JSON with keys: averagePrice, minPrice, maxPrice (numbers, UZS, or null if truly unknown), trendPercent (number or null), competitorCount (integer), demandScore (0-100 or null), demandTrend ('UP'|'STABLE'|'DOWN' or null), reasoningUz (short Uzbek Latin explanation, must state this is an AI estimate, not verified data). Reply in Uzbek Latin for reasoningUz.",
      },
      {
        role: 'user',
        content: JSON.stringify(input),
      },
    ]);
    return marketContextEstimateSchema.parse(this.parseJson(content));
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
