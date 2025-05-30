import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPerms = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredPerms || requiredPerms.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('Пользователь не авторизован');
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        role: true,
      },
    });
    if (!dbUser) {
      throw new ForbiddenException('Пользователь не найден');
    }

    for (const perm of requiredPerms) {
      const ref = await this.prisma.permissionRef.findFirst({
        where: {
          role: dbUser.role,
          permission: perm,
          active: true,
        },
      });
      if (!ref) {
        throw new ForbiddenException(`У роли ${dbUser.role} нет разрешения: ${perm}`);
      }

      const userPerm = await this.prisma.userPermission.findUnique({
        where: {
          userId_permissionRefId: {
            userId: user.userId,
            permissionRefId: ref.id,
          },
        },
      });

      // if (userPerm) {
      //   if (userPerm.limitValue != null && userPerm.remainder != null && userPerm.remainder <= 0) {
      //     throw new ForbiddenException(`Лимит по разрешению ${perm} исчерпан`);
      //   }
      // }
      if (!userPerm) {
        throw new ForbiddenException(
      `У пользователя нет разрешения "${perm}" (отсутствует запись userPerm)`,
        );
      }
      if (userPerm.limitValue != null && userPerm.remainder != null) {
        if (userPerm.remainder <= 0) {
          throw new ForbiddenException(`Лимит по разрешению "${perm}" исчерпан`);
        }
      }
    }

    return true;
  }
}
