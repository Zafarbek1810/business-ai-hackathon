import { Injectable } from '@nestjs/common';
import { Plan } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PLAN_BUSINESS_LIMITS } from './plans';
import {
  DEFAULT_PLAN_CATALOG,
  DEFAULT_PRICING_PAGE,
  PLAN_CATALOG_KEY,
  PRICING_PAGE_KEY,
  PlanCatalogItem,
  PricingFaq,
  PricingHighlight,
  PricingPageContent,
  PublicPlansResponse,
  buildPlanComparison,
  sortPlanCatalog,
} from './plan-catalog';

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  async getCatalog(): Promise<PlanCatalogItem[]> {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key: PLAN_CATALOG_KEY },
    });
    const parsed = setting ? parseCatalog(setting.value) : null;
    if (parsed) {
      return sortPlanCatalog(parsed);
    }
    await this.saveCatalog(DEFAULT_PLAN_CATALOG);
    return DEFAULT_PLAN_CATALOG;
  }

  async saveCatalog(items: PlanCatalogItem[]): Promise<PlanCatalogItem[]> {
    const catalog = sortPlanCatalog(items);
    await this.prisma.systemSetting.upsert({
      where: { key: PLAN_CATALOG_KEY },
      create: { key: PLAN_CATALOG_KEY, value: JSON.stringify(catalog) },
      update: { value: JSON.stringify(catalog) },
    });
    return catalog;
  }

  async getPageContent(): Promise<PricingPageContent> {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key: PRICING_PAGE_KEY },
    });
    const parsed = setting ? parsePage(setting.value) : null;
    if (parsed) {
      return parsed;
    }
    await this.savePageContent(DEFAULT_PRICING_PAGE);
    return DEFAULT_PRICING_PAGE;
  }

  async savePageContent(page: PricingPageContent): Promise<PricingPageContent> {
    const normalized = normalizePage(page);
    await this.prisma.systemSetting.upsert({
      where: { key: PRICING_PAGE_KEY },
      create: { key: PRICING_PAGE_KEY, value: JSON.stringify(normalized) },
      update: { value: JSON.stringify(normalized) },
    });
    return normalized;
  }

  async getPublic(): Promise<PublicPlansResponse> {
    const [plans, page] = await Promise.all([
      this.getCatalog(),
      this.getPageContent(),
    ]);
    return {
      plans,
      comparison: buildPlanComparison(plans, page),
      page,
    };
  }

  async getBusinessLimit(plan: Plan): Promise<number | null> {
    const catalog = await this.getCatalog();
    const item = catalog.find((entry) => entry.id === plan);
    return item?.businessLimit ?? PLAN_BUSINESS_LIMITS[plan];
  }
}

function isPlanId(value: unknown): value is Plan {
  return value === Plan.FREE || value === Plan.PRO || value === Plan.BUSINESS;
}

function parseCatalog(raw: string): PlanCatalogItem[] | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length !== 3) {
      return null;
    }
    const items: PlanCatalogItem[] = [];
    const seen = new Set<Plan>();
    for (const entry of parsed) {
      if (!entry || typeof entry !== 'object') {
        return null;
      }
      const row = entry as Record<string, unknown>;
      if (!isPlanId(row.id) || seen.has(row.id)) {
        return null;
      }
      seen.add(row.id);
      items.push({
        id: row.id,
        name: String(row.name ?? ''),
        tagline: String(row.tagline ?? ''),
        audience: String(row.audience ?? ''),
        monthlyPrice: Number(row.monthlyPrice ?? 0),
        yearlyPrice: Number(row.yearlyPrice ?? 0),
        highlighted: Boolean(row.highlighted),
        businessLimit:
          row.businessLimit === null || row.businessLimit === undefined
            ? null
            : Number(row.businessLimit),
        features: Array.isArray(row.features)
          ? row.features.map((item) => String(item))
          : [],
        missing: Array.isArray(row.missing)
          ? row.missing.map((item) => String(item))
          : [],
        cta: String(row.cta ?? ''),
      });
    }
    if (seen.size !== 3) {
      return null;
    }
    return items;
  } catch {
    return null;
  }
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function parseHighlights(value: unknown): PricingHighlight[] {
  if (!Array.isArray(value) || value.length === 0) {
    return DEFAULT_PRICING_PAGE.highlights;
  }
  return value.map((item, index) => {
    const row = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
    const fallback = DEFAULT_PRICING_PAGE.highlights[index] ?? {
      title: '',
      body: '',
    };
    return {
      title: asString(row.title, fallback.title),
      body: asString(row.body, fallback.body),
    };
  });
}

function parseFaqs(value: unknown): PricingFaq[] {
  if (!Array.isArray(value) || value.length === 0) {
    return DEFAULT_PRICING_PAGE.faqs;
  }
  return value.map((item, index) => {
    const row = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
    const fallback = DEFAULT_PRICING_PAGE.faqs[index] ?? { q: '', a: '' };
    return {
      q: asString(row.q, fallback.q),
      a: asString(row.a, fallback.a),
    };
  });
}

function parsePage(raw: string): PricingPageContent | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    return normalizePage(parsed as Partial<PricingPageContent>);
  } catch {
    return null;
  }
}

function normalizePage(input: Partial<PricingPageContent>): PricingPageContent {
  const base = DEFAULT_PRICING_PAGE;
  return {
    eyebrow: asString(input.eyebrow, base.eyebrow),
    title: asString(input.title, base.title),
    subtitle: asString(input.subtitle, base.subtitle),
    settingsTitle: asString(input.settingsTitle, base.settingsTitle),
    settingsSubtitle: asString(input.settingsSubtitle, base.settingsSubtitle),
    yearlyHint: asString(input.yearlyHint, base.yearlyHint),
    monthlyToggle: asString(input.monthlyToggle, base.monthlyToggle),
    yearlyToggle: asString(input.yearlyToggle, base.yearlyToggle),
    highlightedBadge: asString(input.highlightedBadge, base.highlightedBadge),
    freeForever: asString(input.freeForever, base.freeForever),
    perMonth: asString(input.perMonth, base.perMonth),
    perYear: asString(input.perYear, base.perYear),
    currentPlanLabel: asString(input.currentPlanLabel, base.currentPlanLabel),
    comparisonFeatureLabel: asString(
      input.comparisonFeatureLabel,
      base.comparisonFeatureLabel,
    ),
    comparisonLimitLabel: asString(
      input.comparisonLimitLabel,
      base.comparisonLimitLabel,
    ),
    comparisonMonthlyLabel: asString(
      input.comparisonMonthlyLabel,
      base.comparisonMonthlyLabel,
    ),
    comparisonYearlyLabel: asString(
      input.comparisonYearlyLabel,
      base.comparisonYearlyLabel,
    ),
    unlimitedLabel: asString(input.unlimitedLabel, base.unlimitedLabel),
    highlights: parseHighlights(input.highlights),
    faqs: parseFaqs(input.faqs),
  };
}
