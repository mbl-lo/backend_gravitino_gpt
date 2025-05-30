import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
// @ts-ignore
import { UserStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(limit = 10, offset = 0) {
    const total = await this.prisma.user.count();

    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      where: { status: { not: UserStatus.DELETED } },
      include: {
        userPermissions: {
          include: {
            permissionRef: true,
          },
        },
      },
    });

    return { total, users };
  }

  async blockUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.BLOCKED },
    });
  }

  async unblockUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    if (user.status === UserStatus.DELETED) {
      throw new NotFoundException('Пользователь удалён. Разблокировать нельзя');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.ACTIVE },
    });
  }

  async deleteUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.DELETED },
    });
  }
}
