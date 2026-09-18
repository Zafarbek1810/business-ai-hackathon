import { ForbiddenException } from '@nestjs/common';
import { OwnershipService } from './ownership.service';
import { Role } from '@prisma/client';

describe('OwnershipService', () => {
  const prisma = {
    business: {
      findUnique: jest.fn(),
    },
  };
  const service = new OwnershipService(prisma as never);

  it('allows the owner', async () => {
    prisma.business.findUnique.mockResolvedValue({ userId: 'u1' });
    await expect(
      service.assertBusinessOwner('b1', {
        id: 'u1',
        email: 'a@test.uz',
        role: Role.USER,
      }),
    ).resolves.toBeUndefined();
  });

  it('blocks a different user', async () => {
    prisma.business.findUnique.mockResolvedValue({ userId: 'u1' });
    await expect(
      service.assertBusinessOwner('b1', {
        id: 'u2',
        email: 'b@test.uz',
        role: Role.USER,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows admin', async () => {
    prisma.business.findUnique.mockResolvedValue({ userId: 'u1' });
    await expect(
      service.assertBusinessOwner('b1', {
        id: 'admin',
        email: 'admin@test.uz',
        role: Role.ADMIN,
      }),
    ).resolves.toBeUndefined();
  });
});
