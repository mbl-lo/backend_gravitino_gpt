import { SetMetadata } from '@nestjs/common';
// @ts-ignore
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
