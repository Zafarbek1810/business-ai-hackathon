import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BusinessCategory } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
  ValidateNested,
} from 'class-validator';
import { calculateFinance, FinanceInput } from './engine/finance.engine';
import { calculateLoan, LoanInput } from './engine/credit.engine';
import {
  calculateTax,
  MchjRegime,
  TaxEntityType,
  TaxInput,
} from './engine/tax.engine';
import { AnalyticsService } from '../common/analytics.service';
import {
  CurrentUser,
  AuthUser,
} from '../common/decorators/current-user.decorator';

class FixedCostDto {
  @IsNumber() @Min(0) rent!: number;
  @IsNumber() @Min(0) salary!: number;
  @IsNumber() @Min(0) utilities!: number;
  @IsNumber() @Min(0) software!: number;
  @IsNumber() @Min(0) marketing!: number;
  @IsNumber() @Min(0) other!: number;
}

class VariableMonthlyDto {
  @IsNumber() @Min(0) delivery!: number;
  @IsNumber() @Min(0) packaging!: number;
  @IsNumber() @Min(0) transactionFees!: number;
}

class CalculateFinanceDto implements FinanceInput {
  @IsNumber() @Min(0) sellingPrice!: number;
  @IsNumber() @Min(0) variableCostPerUnit!: number;
  @IsNumber() @Min(0) expectedUnits!: number;
  @IsNumber() @Min(0) otherRevenue!: number;
  @IsNumber() @Min(0) initialInvestment!: number;
  @IsNumber() @Min(0) availableCapital!: number;
  @ValidateNested() @Type(() => FixedCostDto) fixedCosts!: FixedCostDto;
  @ValidateNested()
  @Type(() => VariableMonthlyDto)
  variableMonthly!: VariableMonthlyDto;
}

class CalculateCreditDto implements LoanInput {
  @IsNumber() @IsPositive() principal!: number;
  @IsNumber() @Min(0) annualRatePercent!: number;
  @IsInt() @IsPositive() termMonths!: number;
}

class CalculateTaxDto implements TaxInput {
  @IsEnum(['YATT', 'MCHJ']) entityType!: TaxEntityType;
  @IsNumber() @Min(0) revenue!: number;
  @IsOptional() @IsNumber() @Min(0) expenses?: number;
  @IsOptional() @IsEnum(['SIMPLIFIED', 'GENERAL']) mchjRegime?: MchjRegime;
  @IsOptional() @IsEnum(BusinessCategory) category?: BusinessCategory;
  @IsOptional() @IsBoolean() isVatPayer?: boolean;
}

@ApiTags('finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('finance')
export class FinanceController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Post('calculate')
  calculate(@CurrentUser() user: AuthUser, @Body() dto: CalculateFinanceDto) {
    const result = calculateFinance(dto);
    void this.analytics.track('finance_calculated', user.id, {
      breakEvenUnits: result.breakEvenUnits,
      valid: result.valid,
    });
    return result;
  }

  @Post('credit-calculate')
  creditCalculate(
    @CurrentUser() user: AuthUser,
    @Body() dto: CalculateCreditDto,
  ) {
    const result = calculateLoan(dto);
    void this.analytics.track('credit_calculated', user.id, {
      monthlyPayment: result.monthlyPayment,
      valid: result.valid,
    });
    return result;
  }

  @Post('tax-calculate')
  taxCalculate(@CurrentUser() user: AuthUser, @Body() dto: CalculateTaxDto) {
    const result = calculateTax(dto);
    void this.analytics.track('tax_calculated', user.id, {
      taxAmount: result.taxAmount,
      entityType: result.entityType,
      mchjRegime: result.mchjRegime,
      valid: result.valid,
    });
    return result;
  }
}
