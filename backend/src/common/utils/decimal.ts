import { Decimal } from '@prisma/client/runtime/library';

export function toNumber(
  value: Decimal | number | string | null | undefined,
): number {
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value === 'number') {
    return value;
  }
  return Number(value);
}

export function toNumberOrNull(
  value: Decimal | number | string | null | undefined,
): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
