import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import {
  CurrentUser,
  AuthUser,
} from '../common/decorators/current-user.decorator';
import { AdminService } from './admin.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdatePlansDto } from './dto/update-plans.dto';
import { UpdatePricingPageDto } from './dto/update-pricing-page.dto';
import {
  UpdateAdminProfileDto,
  UpdateSettingsDto,
} from './dto/update-settings.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('dashboard')
  dashboard() {
    return this.admin.dashboard();
  }

  @Get('users')
  users(@Query() query: ListUsersQueryDto) {
    return this.admin.listUsers(query);
  }

  @Post('users')
  createUser(@Body() dto: CreateAdminUserDto) {
    return this.admin.createUser(dto);
  }

  @Get('users/:id')
  getUser(@Param('id') id: string) {
    return this.admin.getUser(id);
  }

  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() dto: UpdateAdminUserDto) {
    return this.admin.updateUser(id, dto);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.admin.deleteUser(id, user);
  }

  @Get('plans')
  plans() {
    return this.admin.getPlans();
  }

  @Patch('plans')
  updatePlans(@Body() dto: UpdatePlansDto) {
    return this.admin.updatePlans(dto);
  }

  @Get('pricing-page')
  pricingPage() {
    return this.admin.getPricingPage();
  }

  @Patch('pricing-page')
  updatePricingPage(@Body() dto: UpdatePricingPageDto) {
    return this.admin.updatePricingPage(dto);
  }

  @Get('plan-stats')
  planStats() {
    return this.admin.planStats();
  }

  @Get('settings')
  settings() {
    return this.admin.listSettings();
  }

  @Patch('settings')
  updateSettings(@Body() dto: UpdateSettingsDto) {
    return this.admin.updateSettings(dto);
  }

  @Patch('profile')
  updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateAdminProfileDto,
  ) {
    return this.admin.updateProfile(user, dto);
  }

  @Get('me-check')
  me(@CurrentUser() user: AuthUser) {
    return user;
  }
}
