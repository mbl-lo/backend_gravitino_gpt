import {ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class RolesListDto {
  @ApiProperty({
    isArray: true,
    example: ['ADMIN', 'USER'],
    description: 'Список доступных ролей',
  })
  roles: string[];
}

export class PermissionRefDto {
  @ApiProperty({ example: 'uuid-1234' })
  id: string;

  @ApiProperty({ example: 'USER', description: 'Для какой роли это разрешение' })
  role: Role;

  @ApiProperty({ example: 'CREATE_CHAT', description: 'Название разрешения' })
  permission: string;

  @ApiProperty({ example: true, description: 'Активно ли разрешение' })
  active: boolean;
}

export class AssignPermissionDto {
  @ApiProperty({ example: 'uuid-of-permissionRef', description: 'ID разрешения (PermissionRef)' })
  permissionRefId: string;

  @ApiPropertyOptional({ example: 10, description: 'Лимит (например, на кол-во действий)' })
  limitValue?: number;
}

export class UserPermissionDto {
  @ApiProperty({ example: 'uuid-5678' })
  id: string;

  @ApiProperty({ example: 'uuid-of-user' })
  userId: string;

  @ApiProperty({ example: 'uuid-of-permissionRef' })
  permissionRefId: string;

  @ApiProperty({ example: 10, nullable: true })
  limitValue: number | null;

  @ApiProperty({ example: 10, nullable: true })
  remainder: number | null;
}

export class RemovePermissionResponseDto {
  @ApiProperty({ example: 'Permission removed from user' })
  message: string;
}