import {ForbiddenException, Injectable, UnauthorizedException} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto, LoginDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import {Role, UserStatus} from "@prisma/client";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}


  async register(dto: CreateUserDto) {
    const candidate = await this.prisma.auth.findUnique({
      where: { email: dto.email },
      include: { user: true },

    });
    if (candidate) {
      if (candidate.user.status === UserStatus.DELETED) {
        throw new ForbiddenException('Пользователь удалён');
      }
      throw new UnauthorizedException('Пользователь с таким email уже существует');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);
    const users = await this.prisma.user.create({
      data: {
        name: dto.name,
        auth: {
          create: {
            email: dto.email,
            hashedPassword,
            salt,
          },
        },
      },
    });

    await this.createDefaultUserPermissions(users.id, users.role);


    const tokens = await this.issueTokens(users.id, dto.email, users.role);
    return {
      user: {
        id: users.id,
        name: users.name,
        email: dto.email,
      },
      ...tokens,
    };
  }

  private async createDefaultUserPermissions(userId: string, role: Role) {
  const refs = await this.prisma.permissionRef.findMany({
    where: {
      role,
      active: true,
    },
  });

  for (const ref of refs) {
    await this.prisma.userPermission.upsert({
      where: {
        userId_permissionRefId: {
          userId,
          permissionRefId: ref.id,
        },
      },
      update: {
        limitValue: null,
        remainder: null,
      },
      create: {
        userId,
        permissionRefId: ref.id,
        limitValue: null,
        remainder: null,
      },
    });
  }
}


  async login(dto: LoginDto) {
    const authRecord = await this.prisma.auth.findUnique({
      where: { email: dto.email },
      include: { user: true },
    });
    if (!authRecord) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    const isValid = await bcrypt.compare(dto.password, authRecord.hashedPassword);
    if (!isValid) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    if (authRecord.user.status === UserStatus.BLOCKED) {
      throw new ForbiddenException('Пользователь заблокирован');
    }
    if (authRecord.user.status === UserStatus.DELETED) {
      throw new ForbiddenException('Пользователь удалён');
    }

    await this.createDefaultUserPermissions(authRecord.user.id, authRecord.user.role);

    const tokens = await this.issueTokens(authRecord.userId, authRecord.email,
        authRecord.user.role);

    return {
      user: {
        id: authRecord.user.id,
        name: authRecord.user.name,
        email: authRecord.email,
      },
      ...tokens,
    };
  }


  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
      const { userId, email, role } = payload;

      const tokens = await this.issueTokens(userId, email, role);
      return { ...tokens };
    } catch (err) {
      throw new UnauthorizedException('Невалидный или просроченный refresh токен');
    }
  }


  private async issueTokens(userId: string, email: string, role: Role) {
    const payload = { userId, email, role };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '1440m',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '2880m',
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
