import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Plan, Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { PlansService } from '../common/plans.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { PLAN_ORDER } from '../common/plan-catalog';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdatePlansDto } from './dto/update-plans.dto';
import { UpdatePricingPageDto } from './dto/update-pricing-page.dto';
import {
  UpdateAdminProfileDto,
  UpdateSettingsDto,
} from './dto/update-settings.dto';

const SALT_ROUNDS = 10;
const SETTING_KEYS = [
  'default_currency',
  'market_data_mode',
  'platform_name',
  'support_email',
  'registration_enabled',
] as const;

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  plan: true,
  locale: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { businesses: true } },
} satisfies Prisma.UserSelect;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly plans: PlansService,
  ) {}

  async dashboard() {
    const [users, businesses, analyses, reports, events, categories, catalog] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.business.count(),
        this.prisma.aIAnalysis.count(),
        this.prisma.businessReport.count(),
        this.prisma.analyticsEvent.count(),
        this.prisma.business.groupBy({
          by: ['category'],
          _count: { category: true },
          orderBy: { _count: { category: 'desc' } },
          take: 8,
        }),
        this.plans.getCatalog(),
      ]);

    const [recentUsers, userRows] = await Promise.all([
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: userSelect,
      }),
      this.prisma.user.findMany({
        select: {
          plan: true,
          _count: { select: { businesses: true } },
        },
      }),
    ]);

    const planBreakdown = PLAN_ORDER.map((plan) => {
      const rows = userRows.filter((row) => row.plan === plan);
      const item = catalog.find((entry) => entry.id === plan);
      return {
        plan,
        name: item?.name ?? plan,
        users: rows.length,
        businesses: rows.reduce((sum, row) => sum + row._count.businesses, 0),
        estimatedMrr: rows.length * (item?.monthlyPrice ?? 0),
      };
    });

    return {
      totalUsers: users,
      activeBusinesses: businesses,
      analysesCreated: events,
      aiAnalyses: analyses,
      reports,
      popularCategories: categories,
      planBreakdown,
      recentUsers,
    };
  }

  async listUsers(query: ListUsersQueryDto) {
    const q = query.q?.trim();
    return this.prisma.user.findMany({
      where: {
        AND: [
          q
            ? {
                OR: [
                  { email: { contains: q, mode: 'insensitive' } },
                  { name: { contains: q, mode: 'insensitive' } },
                ],
              }
            : {},
          query.role ? { role: query.role } : {},
          query.plan ? { plan: query.plan } : {},
        ],
      },
      orderBy: { createdAt: 'desc' },
      select: userSelect,
    });
  }

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi.');
    }
    return user;
  }

  async createUser(dto: CreateAdminUserDto) {
    const email = dto.email.toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Bu email allaqachon ro‘yxatdan o‘tgan.');
    }
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    return this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name: dto.name,
        role: dto.role ?? Role.USER,
        plan: dto.plan ?? Plan.FREE,
        locale: dto.locale ?? 'uz',
      },
      select: userSelect,
    });
  }

  async updateUser(id: string, dto: UpdateAdminUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi.');
    }
    if (dto.role && dto.role !== Role.ADMIN && user.role === Role.ADMIN) {
      await this.assertNotLastAdmin(id);
    }
    if (dto.email) {
      const email = dto.email.toLowerCase();
      const clash = await this.prisma.user.findFirst({
        where: { email, NOT: { id } },
      });
      if (clash) {
        throw new ConflictException('Bu email allaqachon ro‘yxatdan o‘tgan.');
      }
    }
    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.email !== undefined ? { email: dto.email.toLowerCase() } : {}),
        ...(dto.role !== undefined ? { role: dto.role } : {}),
        ...(dto.plan !== undefined ? { plan: dto.plan } : {}),
        ...(dto.locale !== undefined ? { locale: dto.locale } : {}),
        ...(dto.password
          ? { passwordHash: await bcrypt.hash(dto.password, SALT_ROUNDS) }
          : {}),
      },
      select: userSelect,
    });
  }

  async deleteUser(id: string, actor: AuthUser) {
    if (id === actor.id) {
      throw new ForbiddenException('O‘z hisobingizni o‘chira olmaysiz.');
    }
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi.');
    }
    if (user.role === Role.ADMIN) {
      await this.assertNotLastAdmin(id);
    }
    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }

  async getPlans() {
    return this.plans.getCatalog();
  }

  async updatePlans(dto: UpdatePlansDto) {
    const ids = dto.plans.map((item) => item.id);
    const unique = new Set(ids);
    if (unique.size !== 3 || PLAN_ORDER.some((id) => !unique.has(id))) {
      throw new BadRequestException(
        'FREE, PRO va BUSINESS tariflari bo‘lishi shart.',
      );
    }
    return this.plans.saveCatalog(dto.plans);
  }

  getPricingPage() {
    return this.plans.getPageContent();
  }

  updatePricingPage(dto: UpdatePricingPageDto) {
    return this.plans.savePageContent(dto);
  }

  async planStats() {
    const catalog = await this.plans.getCatalog();
    const userRows = await this.prisma.user.findMany({
      select: {
        plan: true,
        _count: { select: { businesses: true } },
      },
    });
    const totalUsers = userRows.length;
    const plans = catalog.map((item) => {
      const rows = userRows.filter((row) => row.plan === item.id);
      const users = rows.length;
      return {
        id: item.id,
        name: item.name,
        tagline: item.tagline,
        monthlyPrice: item.monthlyPrice,
        yearlyPrice: item.yearlyPrice,
        businessLimit: item.businessLimit,
        users,
        businesses: rows.reduce((sum, row) => sum + row._count.businesses, 0),
        estimatedMrr: users * item.monthlyPrice,
        share: totalUsers === 0 ? 0 : users / totalUsers,
      };
    });
    const estimatedMrr = plans.reduce((sum, item) => sum + item.estimatedMrr, 0);
    return {
      plans,
      totalUsers,
      paidUsers: plans
        .filter((item) => item.monthlyPrice > 0)
        .reduce((sum, item) => sum + item.users, 0),
      estimatedMrr,
      estimatedArr: estimatedMrr * 12,
    };
  }

  async listSettings() {
    const rows = await this.prisma.systemSetting.findMany({
      orderBy: { key: 'asc' },
    });
    const byKey = new Map(rows.map((row) => [row.key, row]));
    return SETTING_KEYS.map((key) => {
      const row = byKey.get(key);
      return {
        id: row?.id ?? key,
        key,
        value: row?.value ?? defaultSettingValue(key),
        updatedAt: row?.updatedAt ?? null,
      };
    });
  }

  async updateSettings(dto: UpdateSettingsDto) {
    const allowed = new Set<string>(SETTING_KEYS);
    for (const item of dto.items) {
      if (!allowed.has(item.key)) {
        throw new BadRequestException(`Noma’lum sozlama: ${item.key}`);
      }
      await this.prisma.systemSetting.upsert({
        where: { key: item.key },
        create: { key: item.key, value: item.value },
        update: { value: item.value },
      });
    }
    return this.listSettings();
  }

  async updateProfile(actor: AuthUser, dto: UpdateAdminProfileDto) {
    if (!dto.name && !dto.password) {
      throw new BadRequestException('O‘zgartirish uchun maydon kiriting.');
    }
    return this.prisma.user.update({
      where: { id: actor.id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.password
          ? { passwordHash: await bcrypt.hash(dto.password, SALT_ROUNDS) }
          : {}),
      },
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

  private async assertNotLastAdmin(userId: string) {
    const admins = await this.prisma.user.count({
      where: { role: Role.ADMIN, NOT: { id: userId } },
    });
    if (admins === 0) {
      throw new ForbiddenException('Oxirgi adminni o‘zgartirib bo‘lmaydi.');
    }
  }
}

function defaultSettingValue(key: (typeof SETTING_KEYS)[number]): string {
  switch (key) {
    case 'default_currency':
      return 'UZS';
    case 'market_data_mode':
      return 'AI';
    case 'platform_name':
      return 'Biznes Radar AI';
    case 'support_email':
      return 'admin@biznesradar.uz';
    case 'registration_enabled':
      return 'true';
    default:
      return '';
  }
}
