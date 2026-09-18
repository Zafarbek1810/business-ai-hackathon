export interface LoanInput {
  principal: number;
  annualRatePercent: number;
  termMonths: number;
}

export interface LoanWarning {
  code: string;
  message: string;
}

export interface LoanScheduleEntry {
  month: number;
  payment: number;
  principalPaid: number;
  interestPaid: number;
  remainingBalance: number;
}

export interface LoanResult {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  schedule: LoanScheduleEntry[];
  valid: boolean;
  warnings: LoanWarning[];
}

const MAX_SAFE_BUSINESS_NUMBER = 1e15;
const MAX_SCHEDULE_MONTHS = 600;

function isInvalidNumber(value: number): boolean {
  return !Number.isFinite(value) || Math.abs(value) > MAX_SAFE_BUSINESS_NUMBER;
}

export function roundMoney(value: number, digits = 2): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function calculateLoan(input: LoanInput): LoanResult {
  const warnings: LoanWarning[] = [];
  const fields: Array<[string, number]> = [
    ['principal', input.principal],
    ['annualRatePercent', input.annualRatePercent],
    ['termMonths', input.termMonths],
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

  if (!Number.isInteger(input.termMonths) || input.termMonths <= 0) {
    valid = false;
    warnings.push({
      code: 'INVALID_TERM',
      message: 'termMonths must be a positive integer.',
    });
  }

  if (input.principal <= 0) {
    valid = false;
    warnings.push({
      code: 'INVALID_PRINCIPAL',
      message: 'principal must be greater than zero.',
    });
  }

  if (!valid) {
    return {
      monthlyPayment: 0,
      totalPayment: 0,
      totalInterest: 0,
      schedule: [],
      valid,
      warnings,
    };
  }

  if (input.termMonths > MAX_SCHEDULE_MONTHS) {
    warnings.push({
      code: 'TERM_TOO_LONG',
      message: `termMonths exceeds ${MAX_SCHEDULE_MONTHS}; schedule was truncated in generation.`,
    });
  }

  const monthlyRate = input.annualRatePercent / 12 / 100;
  const n = Math.min(input.termMonths, MAX_SCHEDULE_MONTHS);

  let monthlyPayment: number;
  if (monthlyRate === 0) {
    monthlyPayment = input.principal / input.termMonths;
  } else {
    const factor = (1 + monthlyRate) ** input.termMonths;
    monthlyPayment = (input.principal * monthlyRate * factor) / (factor - 1);
  }
  monthlyPayment = roundMoney(monthlyPayment);

  const schedule: LoanScheduleEntry[] = [];
  let remainingBalance = input.principal;
  let totalInterest = 0;

  for (let month = 1; month <= n; month += 1) {
    const interestPaid = roundMoney(remainingBalance * monthlyRate);
    let principalPaid = roundMoney(monthlyPayment - interestPaid);
    if (month === n) {
      principalPaid = roundMoney(remainingBalance);
    }
    remainingBalance = roundMoney(remainingBalance - principalPaid);
    totalInterest = roundMoney(totalInterest + interestPaid);

    schedule.push({
      month,
      payment: roundMoney(principalPaid + interestPaid),
      principalPaid,
      interestPaid,
      remainingBalance: Math.max(0, remainingBalance),
    });
  }

  const totalPayment = roundMoney(input.principal + totalInterest);

  return {
    monthlyPayment,
    totalPayment,
    totalInterest,
    schedule,
    valid,
    warnings,
  };
}
