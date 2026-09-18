import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Plan } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  AuthUser,
} from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { IsEnum, IsOptional, IsString } from 'class-validator';

class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  locale?: string;
}

class UpdatePlanDto {
  @IsEnum(Plan)
  plan!: Plan;
}

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        plan: true,
        locale: true,
        createdAt: true,
      },
    });
  }

  @Patch('me')
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: user.id },
      data: dto,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        plan: true,
        locale: true,
      },
    });
  }

  @Patch('me/plan')
  updatePlan(@CurrentUser() user: AuthUser, @Body() dto: UpdatePlanDto) {
    return this.prisma.user.update({
      where: { id: user.id },
      data: { plan: dto.plan },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        plan: true,
        locale: true,
      },
    });
  }
}
