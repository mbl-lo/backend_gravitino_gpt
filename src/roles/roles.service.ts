import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
// @ts-ignore
import { Role } from '@prisma/client';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async setUserRole(userId: string, role: Role) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });
  }

  async getUserRole(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    return user?.role;
  }

}
