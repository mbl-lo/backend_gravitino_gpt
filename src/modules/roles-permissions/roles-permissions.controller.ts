import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RolesPermissionsService } from './roles-permissions.service';
import {
    AssignPermissionDto,
    PermissionRefDto,
    RemovePermissionResponseDto,
    RolesListDto,
    UserPermissionDto
} from "./dto/roles-permissions.dto";

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('roles-permissions')
export class RolesPermissionsController {
  constructor(private readonly rpService: RolesPermissionsService) {}

  @Get('roles')
  @ApiOperation({ summary: 'Получить все роли' })
  @ApiResponse({ status: 200, type: RolesListDto })
  getAllRoles() {
    return this.rpService.getAllRoles();
  }

  @Get('permissions')
  @ApiOperation({ summary: 'Получить все доступные разрешения (PermissionRef)' })
  @ApiResponse({ status: 200, type: [PermissionRefDto] })
  async getAllPermissions() {
    return this.rpService.getAllPermissions();
  }

  @Post('users/:userId/permissions')
@ApiOperation({ summary: 'Назначить разрешение пользователю' })
@ApiResponse({ status: 201, type: UserPermissionDto })
async assignPermission(
  @Param('userId') userId: string,
  @Body() dto: AssignPermissionDto,
): Promise<UserPermissionDto> {
  const up = await this.rpService.assignPermissionToUser({
    userId,
    permissionRefId: dto.permissionRefId,
    limitValue: dto.limitValue,
  });

  return {
    id: up.id,
    userId: up.userId,
    permissionRefId: up.permissionRefId,
    limitValue: up.limitValue,
    remainder: up.remainder,
  };
}

  @Delete('users/:userId/permissions/:permissionRefId')
  @ApiOperation({ summary: 'Удалить разрешение у пользователя' })
  @ApiResponse({ status: 200, type: RemovePermissionResponseDto})
  async removePermission(
    @Param('userId') userId: string,
    @Param('permissionRefId') permissionRefId: string,
  ) {
    return this.rpService.removePermissionFromUser(userId, permissionRefId);
  }
}
