import {Injectable, NotFoundException} from '@nestjs/common';
import {PrismaService} from 'src/prisma/prisma.service';
import {UserProfileDto} from './dto/user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserProfile(userId: string): Promise<UserProfileDto> {
    const authRecord = await this.prisma.auth.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!authRecord) {
      throw new NotFoundException('Пользователь не найден');
    }

    return {
        id: authRecord.user.id,
        email: authRecord.email,
        name: authRecord.user.name,
        createdAt: authRecord.user.createdAt,
        role: authRecord.user.role,
        status: authRecord.user.status
    };
  }

}
