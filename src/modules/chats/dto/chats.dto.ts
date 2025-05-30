import { ApiProperty } from '@nestjs/swagger';

export class CreateChatDto {
  @ApiProperty({ example: 'Новый чат', description: 'Название чата' })
  title: string;
}

export class UpdateChatDto {
  @ApiProperty({ example: 'Новое название чата' })
  title: string;
}

export class ChatDto {
  @ApiProperty({ example: 'abc123-uuid' })
  id: string;

  @ApiProperty({ example: 'Название чата' })
  title: string;

  @ApiProperty({ example: '2023-03-01T12:00:00.000Z' })
  createdAt: Date;
}