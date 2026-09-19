import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsString,
  ValidateNested,
} from 'class-validator';

export class PricingHighlightDto {
  @IsString()
  title!: string;

  @IsString()
  body!: string;
}

export class PricingFaqDto {
  @IsString()
  q!: string;

  @IsString()
  a!: string;
}

export class UpdatePricingPageDto {
  @IsString()
  eyebrow!: string;

  @IsString()
  title!: string;

  @IsString()
  subtitle!: string;

  @IsString()
  settingsTitle!: string;

  @IsString()
  settingsSubtitle!: string;

  @IsString()
  yearlyHint!: string;

  @IsString()
  monthlyToggle!: string;

  @IsString()
  yearlyToggle!: string;

  @IsString()
  highlightedBadge!: string;

  @IsString()
  freeForever!: string;

  @IsString()
  perMonth!: string;

  @IsString()
  perYear!: string;

  @IsString()
  currentPlanLabel!: string;

  @IsString()
  comparisonFeatureLabel!: string;

  @IsString()
  comparisonLimitLabel!: string;

  @IsString()
  comparisonMonthlyLabel!: string;

  @IsString()
  comparisonYearlyLabel!: string;

  @IsString()
  unlimitedLabel!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PricingHighlightDto)
  highlights!: PricingHighlightDto[];

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PricingFaqDto)
  faqs!: PricingFaqDto[];
}
