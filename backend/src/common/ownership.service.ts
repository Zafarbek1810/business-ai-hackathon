import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from './decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Injectable()
export class OwnershipService {
  constructor(private readonly prisma: PrismaService) {}

  async assertBusinessOwner(businessId: string, user: AuthUser): Promise<void> {
    if (user.role === Role.ADMIN) {
      return;
    }
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { userId: true },
    });
    if (!business || business.userId !== user.id) {
      throw new ForbiddenException('You can only access your own businesses.');
    }
  }
}
