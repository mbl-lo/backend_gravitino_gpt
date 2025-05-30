import { ApiProperty } from '@nestjs/swagger';
import {Role, UserStatus} from "@prisma/client";

export class UserProfileDto {
  @ApiProperty({ example: 'uuid-1234' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'John' })
  name: string;

  @ApiProperty({ enum: Role, example: Role.USER })
  role: Role;
  
  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
  status: UserStatus;

  @ApiProperty({ example: '2023-03-01T12:00:00.000Z' })
  createdAt: Date;

}
