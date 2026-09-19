import { Plan } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class PlanCatalogItemDto {
  @IsEnum(Plan)
  id!: Plan;

  @IsString()
  name!: string;

  @IsString()
  tagline!: string;

  @IsString()
  audience!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  monthlyPrice!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  yearlyPrice!: number;

  @IsBoolean()
  highlighted!: boolean;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  businessLimit!: number | null;

  @IsArray()
  @IsString({ each: true })
  features!: string[];

  @IsArray()
  @IsString({ each: true })
  missing!: string[];

  @IsString()
  cta!: string;
}

export class UpdatePlansDto {
  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => PlanCatalogItemDto)
  plans!: PlanCatalogItemDto[];
}
