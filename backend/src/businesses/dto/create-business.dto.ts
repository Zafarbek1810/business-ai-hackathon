import { BusinessCategory, ExpenseCategory, ExpenseKind } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class BusinessProductInputDto {
  @IsString()
  name!: string;

  @IsNumber()
  @Min(0)
  purchasePrice!: number;

  @IsNumber()
  @IsPositive()
  sellingPrice!: number;

  @IsNumber()
  @Min(0)
  expectedMonthlySales!: number;
}

export class BusinessExpenseInputDto {
  @IsEnum(ExpenseKind)
  kind!: ExpenseKind;

  @IsEnum(ExpenseCategory)
  category!: ExpenseCategory;

  @IsString()
  label!: string;

  @IsNumber()
  @Min(0)
  amount!: number;
}

export class CreateBusinessDto {
  @IsString()
  name!: string;

  @IsEnum(BusinessCategory)
  category!: BusinessCategory;

  @IsOptional()
  @IsString()
  country?: string;

  @IsString()
  region!: string;

  @IsString()
  city!: string;

  @IsNumber()
  @Min(0)
  availableCapital!: number;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BusinessProductInputDto)
  products!: BusinessProductInputDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BusinessExpenseInputDto)
  expenses!: BusinessExpenseInputDto[];
}

export class UpdateBusinessDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(BusinessCategory)
  category?: BusinessCategory;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  availableCapital?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BusinessProductInputDto)
  products?: BusinessProductInputDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BusinessExpenseInputDto)
  expenses?: BusinessExpenseInputDto[];
}
