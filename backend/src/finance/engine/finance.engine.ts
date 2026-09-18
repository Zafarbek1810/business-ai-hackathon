export interface FixedCostInput {
  rent: number;
  salary: number;
  utilities: number;
  software: number;
  marketing: number;
  other: number;
}

export interface VariableMonthlyInput {
  delivery: number;
  packaging: number;
  transactionFees: number;
}

export interface FinanceInput {
  sellingPrice: number;
  variableCostPerUnit: number;
  expectedUnits: number;
  otherRevenue: number;
  initialInvestment: number;
  availableCapital: number;
  fixedCosts: FixedCostInput;
  variableMonthly: VariableMonthlyInput;
}

export interface FinanceWarning {
  code: string;
  message: string;
}

export interface FinanceResult {
  revenue: number;
  cogs: number;
  productCogs: number;
  variableOverheads: number;
  grossProfit: number;
  operatingExpenses: number;
  netProfit: number;
  grossMargin: number | null;
  operatingMargin: number | null;
  contributionMargin: number;
  breakEvenUnits: number | null;
  breakEvenRevenue: number | null;
  roiAnnualEstimate: number | null;
  cashCoverageMonths: number | null;
  valid: boolean;
  warnings: FinanceWarning[];
}

const MAX_SAFE_BUSINESS_NUMBER = 1e15;

export function roundMoney(value: number, digits = 2): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function isInvalidNumber(value: number): boolean {
  return !Number.isFinite(value) || Math.abs(value) > MAX_SAFE_BUSINESS_NUMBER;
}

export function sumFixedCosts(fixed: FixedCostInput): number {
  return (
    fixed.rent +
    fixed.salary +
    fixed.utilities +
    fixed.software +
    fixed.marketing +
    fixed.other
  );
}

export function sumVariableMonthly(variable: VariableMonthlyInput): number {
  return variable.delivery + variable.packaging + variable.transactionFees;
}

export function calculateBreakEvenUnits(
  fixedCosts: number,
  sellingPrice: number,
  variableCostPerUnit: number,
): number | null {
  const contribution = sellingPrice - variableCostPerUnit;
  if (
    contribution <= 0 ||
    !Number.isFinite(contribution) ||
    !Number.isFinite(fixedCosts)
  ) {
    return null;
  }
  return fixedCosts / contribution;
}

export function calculateBreakEvenRevenue(
  breakEvenUnits: number | null,
  sellingPrice: number,
): number | null {
  if (breakEvenUnits === null || !Number.isFinite(sellingPrice)) {
    return null;
  }
  return breakEvenUnits * sellingPrice;
}

export function calculateFinance(input: FinanceInput): FinanceResult {
  const warnings: FinanceWarning[] = [];
  const fields: Array<[string, number]> = [
    ['sellingPrice', input.sellingPrice],
    ['variableCostPerUnit', input.variableCostPerUnit],
    ['expectedUnits', input.expectedUnits],
    ['otherRevenue', input.otherRevenue],
    ['initialInvestment', input.initialInvestment],
    ['availableCapital', input.availableCapital],
    ['rent', input.fixedCosts.rent],
    ['salary', input.fixedCosts.salary],
    ['utilities', input.fixedCosts.utilities],
    ['software', input.fixedCosts.software],
    ['marketing', input.fixedCosts.marketing],
    ['other', input.fixedCosts.other],
    ['delivery', input.variableMonthly.delivery],
    ['packaging', input.variableMonthly.packaging],
    ['transactionFees', input.variableMonthly.transactionFees],
  ];

  let valid = true;
  for (const [name, value] of fields) {
    if (isInvalidNumber(value)) {
      valid = false;
      warnings.push({
        code: 'INVALID_NUMBER',
        message: `${name} is not a usable number.`,
      });
    }
    if (value < 0) {
      valid = false;
      warnings.push({
        code: 'NEGATIVE_VALUE',
        message: `${name} cannot be negative.`,
      });
    }
  }

  const contributionMargin = roundMoney(
    input.sellingPrice - input.variableCostPerUnit,
  );
  if (input.sellingPrice <= 0) {
    warnings.push({
      code: 'INVALID_PRICE',
      message: 'Selling price must be greater than zero.',
    });
    valid = false;
  }
  if (contributionMargin <= 0) {
    warnings.push({
      code: 'NON_POSITIVE_CONTRIBUTION',
      message:
        'Variable cost per unit is greater than or equal to selling price, so break-even cannot be calculated.',
    });
  }

  const operatingExpenses = roundMoney(sumFixedCosts(input.fixedCosts));
  const variableOverheads = roundMoney(
    sumVariableMonthly(input.variableMonthly),
  );
  const productCogs = roundMoney(
    input.variableCostPerUnit * input.expectedUnits,
  );
  const cogs = roundMoney(productCogs + variableOverheads);
  const revenue = roundMoney(
    input.sellingPrice * input.expectedUnits + input.otherRevenue,
  );
  const grossProfit = roundMoney(revenue - cogs);
  const netProfit = roundMoney(grossProfit - operatingExpenses);
  const grossMargin =
    revenue === 0 ? null : roundMoney(grossProfit / revenue, 6);
  const operatingMargin =
    revenue === 0 ? null : roundMoney(netProfit / revenue, 6);
  const breakEvenUnitsRaw = calculateBreakEvenUnits(
    operatingExpenses,
    input.sellingPrice,
    input.variableCostPerUnit,
  );
  const breakEvenUnits =
    breakEvenUnitsRaw === null ? null : roundMoney(breakEvenUnitsRaw, 4);
  const breakEvenRevenueRaw = calculateBreakEvenRevenue(
    breakEvenUnits,
    input.sellingPrice,
  );
  const breakEvenRevenue =
    breakEvenRevenueRaw === null ? null : roundMoney(breakEvenRevenueRaw);
  const roiAnnualEstimate =
    input.initialInvestment <= 0
      ? null
      : roundMoney((netProfit * 12) / input.initialInvestment, 6);
  const cashCoverageMonths =
    operatingExpenses <= 0
      ? null
      : roundMoney(input.availableCapital / operatingExpenses, 4);

  if (operatingExpenses === 0) {
    warnings.push({
      code: 'MISSING_EXPENSES',
      message: 'No fixed monthly expenses were provided.',
    });
  }

  return {
    revenue,
    cogs,
    productCogs,
    variableOverheads,
    grossProfit,
    operatingExpenses,
    netProfit,
    grossMargin,
    operatingMargin,
    contributionMargin,
    breakEvenUnits,
    breakEvenRevenue,
    roiAnnualEstimate,
    cashCoverageMonths,
    valid,
    warnings,
  };
}

export type ScenarioType = 'PESSIMISTIC' | 'BASE' | 'OPTIMISTIC';

export interface ScenarioAssumption {
  type: ScenarioType;
  monthlyUnits: number;
  sellingPrice?: number;
  variableCostPerUnit?: number;
  fixedCosts?: number;
}

export interface ScenarioResult {
  type: ScenarioType;
  monthlyUnits: number;
  sellingPrice: number;
  variableCost: number;
  fixedCosts: number;
  revenue: number;
  costs: number;
  profit: number;
  breakEvenUnits: number | null;
  cashRequirement: number;
}

export function calculateScenario(
  base: FinanceInput,
  assumption: ScenarioAssumption,
): ScenarioResult {
  const sellingPrice = assumption.sellingPrice ?? base.sellingPrice;
  const variableCost =
    assumption.variableCostPerUnit ?? base.variableCostPerUnit;
  const fixedCosts = assumption.fixedCosts ?? sumFixedCosts(base.fixedCosts);
  const units = assumption.monthlyUnits;
  const variableOverheads = sumVariableMonthly(base.variableMonthly);
  const revenue = roundMoney(sellingPrice * units + base.otherRevenue);
  const costs = roundMoney(
    variableCost * units + variableOverheads + fixedCosts,
  );
  const profit = roundMoney(revenue - costs);
  const breakEvenUnitsRaw = calculateBreakEvenUnits(
    fixedCosts,
    sellingPrice,
    variableCost,
  );
  const inventoryNeed = variableCost * units;
  const operatingBuffer = fixedCosts * 3;
  const cashRequirement = roundMoney(
    Math.max(0, inventoryNeed + operatingBuffer),
  );

  return {
    type: assumption.type,
    monthlyUnits: units,
    sellingPrice,
    variableCost,
    fixedCosts,
    revenue,
    costs,
    profit,
    breakEvenUnits:
      breakEvenUnitsRaw === null ? null : roundMoney(breakEvenUnitsRaw, 4),
    cashRequirement,
  };
}

export function defaultScenarioAssumptions(
  expectedUnits: number,
): ScenarioAssumption[] {
  const base = Math.max(0, expectedUnits);
  return [
    { type: 'PESSIMISTIC', monthlyUnits: Math.round(base * 0.67) },
    { type: 'BASE', monthlyUnits: base },
    { type: 'OPTIMISTIC', monthlyUnits: Math.round(base * 1.42) },
  ];
}

export function businessInputFromTotals(params: {
  sellingPrice: number;
  variableCostPerUnit: number;
  expectedUnits: number;
  otherRevenue?: number;
  initialInvestment: number;
  availableCapital: number;
  fixedCostsTotal: number;
  variableMonthlyTotal?: number;
}): FinanceInput {
  return {
    sellingPrice: params.sellingPrice,
    variableCostPerUnit: params.variableCostPerUnit,
    expectedUnits: params.expectedUnits,
    otherRevenue: params.otherRevenue ?? 0,
    initialInvestment: params.initialInvestment,
    availableCapital: params.availableCapital,
    fixedCosts: {
      rent: params.fixedCostsTotal,
      salary: 0,
      utilities: 0,
      software: 0,
      marketing: 0,
      other: 0,
    },
    variableMonthly: {
      delivery: params.variableMonthlyTotal ?? 0,
      packaging: 0,
      transactionFees: 0,
    },
  };
}
