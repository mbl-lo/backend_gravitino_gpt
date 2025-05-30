import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role, PermissionRef, UserPermission } from '@prisma/client';

@Injectable()
export class RolesPermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  getAllRoles(): string[] {
    return Object.values(Role); // ['ADMIN', 'USER']
  }

  async getAllPermissions(): Promise<PermissionRef[]> {
    return this.prisma.permissionRef.findMany({
      orderBy: { permission: 'asc' },
    });
  }

  async assignPermissionToUser(params: {
    userId: string;
    permissionRefId: string;
    limitValue?: number;
  }): Promise<UserPermission> {
    const { userId, permissionRefId, limitValue } = params;
    const ref = await this.prisma.permissionRef.findUnique({
      where: { id: permissionRefId },
    });
    if (!ref) {
      throw new NotFoundException('PermissionRef not found');
    }

    return this.prisma.userPermission.upsert({
      where: {
        userId_permissionRefId: {
          userId,
          permissionRefId,
        },
      },
      update: {
        limitValue: limitValue ?? null,
        remainder: limitValue ?? null,
      },
      create: {
        userId,
        permissionRefId,
        limitValue: limitValue ?? null,
        remainder: limitValue ?? null,
      },
    });
  }

  async removePermissionFromUser(userId: string, permissionRefId: string) {
    const userPerm = await this.prisma.userPermission.findUnique({
      where: {
        userId_permissionRefId: {
          userId,
          permissionRefId,
        },
      },
    });
    if (!userPerm) {
      throw new NotFoundException('UserPermission not found');
    }
    await this.prisma.userPermission.delete({
      where: { id: userPerm.id },
    });
    return { message: 'Permission removed from user' };
  }
}
