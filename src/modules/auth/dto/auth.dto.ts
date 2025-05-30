import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'john@example.com', description: 'Email пользователя' })
  email: string;

  @ApiProperty({ example: 'secret123' })
  password: string;

  @ApiProperty({ example: 'John' })
  name: string;
}

export class LoginDto {
  @ApiProperty({ example: 'john@example.com', description: 'Email пользователя' })
  email: string;

  @ApiProperty({ example: 'secret123' })
  password: string;
}
