import {
  Controller,
  Get,
  Query,
  Post,
  Param,
  Delete,
  UseGuards
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { AdminService } from './admin.service';
import { UsersList } from './dto/admin.dto';
// @ts-ignore
import {Role, UserStatus} from '@prisma/client';
import {RolesGuard} from "../../roles/guards/roles.guard";
import {Roles} from "../../roles/decorators/roles.decorator";

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@UseGuards(JwtAuthGuard)
@Controller('users')
export class AdminController {
  constructor(private readonly usersService: AdminService) {}

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Получить список пользователей с пагинацией' })
  @ApiResponse({
    status: 200,
    description: 'Список пользователей',
    schema: {
      example: {
        total: 42,
        users: [
          {
            id: 'uuid-1',
            email: 'user1@example.com',
            name: 'User1',
            status: UserStatus.ACTIVE,
            createdAt: '2023-03-01T12:00:00.000Z',
          },
        ],
      },
    },
  })
  async findAll(
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
  ) {
    const limit = parseInt(limitStr ?? '10', 10);
    const offset = parseInt(offsetStr ?? '0', 10);

    const { total, users } = await this.usersService.findAll(limit, offset);

    return {
      total,
      users: users.map((u) => this.mapUserToDto(u)),
    };
  }

  @Post(':id/block')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Блокировать пользователя' })
  async blockUser(@Param('id') id: string) {
    const user = await this.usersService.blockUser(id);
    return this.mapUserToDto(user);
  }

  @Post(':id/unblock')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Разблокировать пользователя' })
  async unblockUser(@Param('id') id: string) {
    const user = await this.usersService.unblockUser(id);
    return this.mapUserToDto(user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Удалить пользователя (soft-delete)' })
  async deleteUser(@Param('id') id: string) {
    const user = await this.usersService.deleteUser(id);
    return this.mapUserToDto(user);
  }

  private mapUserToDto(user: any): UsersList {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      createdAt: user.createdAt,
      role: user.role,
      userPermissions: user.userPermissions
    };
  }
}
