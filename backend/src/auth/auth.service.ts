import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { AuthUser } from '../common/decorators/current-user.decorator';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const registration = await this.prisma.systemSetting.findUnique({
      where: { key: 'registration_enabled' },
    });
    if (registration?.value === 'false') {
      throw new ForbiddenException('Ro‘yxatdan o‘tish hozircha yopiq.');
    }
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Bu email allaqachon ro‘yxatdan o‘tgan.');
    }
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        name: dto.name,
        locale: dto.locale ?? 'uz',
        role: Role.USER,
      },
    });
    return this.issue(
      user.id,
      user.email,
      user.role,
      user.name,
      user.plan,
      user.locale,
    );
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user) {
      throw new UnauthorizedException('Email yoki parol noto‘g‘ri.');
    }
    const matches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('Email yoki parol noto‘g‘ri.');
    }
    return this.issue(
      user.id,
      user.email,
      user.role,
      user.name,
      user.plan,
      user.locale,
    );
  }

  async me(authUser: AuthUser) {
    const user = await this.prisma.user.findUnique({
      where: { id: authUser.id },
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
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }

  private issue(
    id: string,
    email: string,
    role: Role,
    name: string,
    plan: string,
    locale: string,
  ) {
    const accessToken = this.jwt.sign({ sub: id, email, role });
    return {
      accessToken,
      user: { id, email, name, role, plan, locale },
    };
  }
}
