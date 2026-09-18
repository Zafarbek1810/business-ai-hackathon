import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  AuthUser,
} from '../common/decorators/current-user.decorator';
import { AIService } from './ai.service';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

class BusinessIdDto {
  @IsString()
  businessId!: string;
}

class CopilotDto extends BusinessIdDto {
  @IsString()
  @MinLength(3)
  question!: string;
}

class EstimateProductDto {
  @IsString()
  category!: string;

  @IsString()
  region!: string;

  @IsString()
  @MinLength(1)
  productName!: string;
}

class ChatHistoryEntryDto {
  @IsString()
  role!: string;

  @IsString()
  content!: string;
}

class StreamChatDto extends CopilotDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatHistoryEntryDto)
  history?: ChatHistoryEntryDto[];
}

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AIController {
  constructor(private readonly ai: AIService) {}

  @Post('business-summary')
  summary(@CurrentUser() user: AuthUser, @Body() dto: BusinessIdDto) {
    return this.ai.generateBusinessSummary(user, dto.businessId);
  }

  @Post('market-insights')
  market(@CurrentUser() user: AuthUser, @Body() dto: BusinessIdDto) {
    return this.ai.generateMarketInsights(user, dto.businessId);
  }

  @Post('financial-insights')
  finance(@CurrentUser() user: AuthUser, @Body() dto: BusinessIdDto) {
    return this.ai.generateFinancialInsights(user, dto.businessId);
  }

  @Post('risk-analysis')
  risks(@CurrentUser() user: AuthUser, @Body() dto: BusinessIdDto) {
    return this.ai.generateRiskInsights(user, dto.businessId);
  }

  @Post('validate-assumptions')
  validate(@CurrentUser() user: AuthUser, @Body() dto: BusinessIdDto) {
    return this.ai.generateValidationChecklist(user, dto.businessId);
  }

  @Post('copilot')
  copilot(@CurrentUser() user: AuthUser, @Body() dto: CopilotDto) {
    return this.ai.chat(user, dto.businessId, dto.question);
  }

  @Post('estimate-product')
  estimateProduct(
    @CurrentUser() user: AuthUser,
    @Body() dto: EstimateProductDto,
  ) {
    return this.ai.estimateProductNumbers(user, dto);
  }

  @Post('chat/stream')
  async chatStream(
    @CurrentUser() user: AuthUser,
    @Body() dto: StreamChatDto,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    try {
      const result = await this.ai.chat(user, dto.businessId, dto.question);
      const text = result.answer ?? '';
      const chunkSize = 24;
      for (let i = 0; i < text.length; i += chunkSize) {
        const delta = text.slice(i, i + chunkSize);
        res.write(`data: ${JSON.stringify({ delta })}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'AI javob bermadi.';
      res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
    } finally {
      res.end();
    }
  }
}
