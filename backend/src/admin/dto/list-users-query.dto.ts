import { Plan, Role } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';

const emptyToUndefined = ({ value }: { value: unknown }) =>
  value === '' || value === undefined || value === null ? undefined : value;

export class ListUsersQueryDto {
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  q?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsEnum(Plan)
  plan?: Plan;
}
