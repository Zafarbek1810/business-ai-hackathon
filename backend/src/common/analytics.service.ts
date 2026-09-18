import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async track(
    name: string,
    userId: string | null,
    payload?: Record<string, unknown>,
  ): Promise<void> {
    await this.prisma.analyticsEvent.create({
      data: {
        name,
        userId,
        payload: (payload ?? {}) as unknown as Prisma.InputJsonValue,
      },
    });
  }
}
