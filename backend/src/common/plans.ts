import { Plan } from '@prisma/client';

export const PLAN_BUSINESS_LIMITS: Record<Plan, number | null> = {
  FREE: 1,
  PRO: 5,
  BUSINESS: null,
};

export function planLimitMessage(plan: Plan, limit: number): string {
  return `Joriy tarif (${plan}) bo‘yicha maksimal ${limit} ta biznes. Sozlamalardan tarifni yangilang.`;
}
