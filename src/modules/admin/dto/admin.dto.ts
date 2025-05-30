import { ApiProperty } from '@nestjs/swagger';
// @ts-ignore
import {Role, UserStatus} from '@prisma/client';


export class PermissionRefDto {
  @ApiProperty({ example: 'uuid-ref-1' })
  id: string;

  @ApiProperty({ example: 'CREATE_CHAT' })
  permission: string;

  @ApiProperty({ example: true })
  active: boolean;

  @ApiProperty({ example: 'USER' })
  role: Role;
}

export class UserPermissionDto {
  @ApiProperty({ example: 'uuid-up-1' })
  id: string;

  @ApiProperty({ example: 10, nullable: true })
  limitValue: number | null;

  @ApiProperty({ example: 5, nullable: true })
  remainder: number | null;

  @ApiProperty({
    type: PermissionRefDto,
    description: 'Ссылка на PermissionRef',
  })
  permissionRef: PermissionRefDto;
}

export class UsersList {
  @ApiProperty({ example: 'uuid-1234' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'John' })
  name: string;

  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
  status: UserStatus;

  @ApiProperty({ enum: Role, example: Role.USER })
  role: Role;

  @ApiProperty({ example: '2023-03-01T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ type: [UserPermissionDto], description: 'Список разрешений' })
  userPermissions: UserPermissionDto[];
}

