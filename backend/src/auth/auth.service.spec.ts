import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';

describe('AuthService', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };
  const jwt = { sign: jest.fn().mockReturnValue('token') };
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: jwt },
        { provide: 'PrismaService', useValue: prisma },
      ],
    })
      .overrideProvider(AuthService)
      .useValue(new AuthService(prisma as never, jwt as unknown as JwtService))
      .compile();
    service = moduleRef.get(AuthService);
  });

  it('rejects duplicate registration', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: '1' });
    await expect(
      service.register({
        email: 'a@test.uz',
        password: 'password1',
        name: 'A',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects invalid login', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(
      service.login({ email: 'missing@test.uz', password: 'password1' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('issues a token for a valid mock user', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'u1',
      email: 'a@test.uz',
      role: Role.USER,
      name: 'A',
      plan: 'FREE',
      locale: 'uz',
    });
    const result = await service.register({
      email: 'a@test.uz',
      password: 'password1',
      name: 'A',
    });
    expect(result.accessToken).toBe('token');
    expect(result.user.email).toBe('a@test.uz');
  });
});
