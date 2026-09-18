import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BusinessesService } from './businesses.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  AuthUser,
} from '../common/decorators/current-user.decorator';
import {
  CreateBusinessDto,
  UpdateBusinessDto,
} from './dto/create-business.dto';

@ApiTags('businesses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('businesses')
export class BusinessesController {
  constructor(private readonly businesses: BusinessesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.businesses.findAll(user);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateBusinessDto) {
    return this.businesses.create(user, dto);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.businesses.findOne(user, id);
  }

  @Get(':id/radar')
  radar(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.businesses.radar(user, id);
  }

  @Get(':id/finance')
  async finance(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const radar = await this.businesses.radar(user, id);
    return radar.finance;
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateBusinessDto,
  ) {
    return this.businesses.update(user, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.businesses.remove(user, id);
  }
}
