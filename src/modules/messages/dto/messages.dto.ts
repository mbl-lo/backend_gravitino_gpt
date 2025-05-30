import { ApiProperty } from '@nestjs/swagger';
import { MessageType } from '@prisma/client';
import { IsEnum } from 'class-validator';


export class CreateMessageDto {
  @ApiProperty({
    example: 'TEXT',
    enum: MessageType,
    description: 'Тип сообщения, одно из значений: TEXT, FILE, PHOTO, VIDEO, VOICE, AUDIO',
  })
  @IsEnum(MessageType)
  type: MessageType;

  @ApiProperty({ example: 'Привет!', description: 'Текст сообщения' })
  content: string;

  @ApiProperty({ example: '[https://typescript.is.fooo!]', description: '[url]' })
  url: string[];
}

export class UpdateMessageDto {
  @ApiProperty({ example: 'Привет, мир!', description: 'Новая версия сообщения' })
  content: string;

  @ApiProperty({
    example: 'TEXT',
    enum: MessageType,
    description: 'Тип сообщения, одно из значений: TEXT, FILE, PHOTO, VIDEO, VOICE, AUDIO',
  })
  @IsEnum(MessageType)
  type: MessageType;
}

export class MessageVersionDto {
  @ApiProperty({ example: 'Привет!', description: 'Содержимое версии сообщения' })
  content: string;

  @ApiProperty({
    example: 'TEXT',
    enum: MessageType,
    description: 'Тип сообщения, одно из значений: TEXT, FILE, PHOTO, VIDEO, VOICE, AUDIO',
  })
  @IsEnum(MessageType)
  type: MessageType;

  @ApiProperty({ example: '2023-03-15T10:00:00.000Z' })
  createdAt: Date;
}

export class FullMessageDto {
  @ApiProperty({ example: 'uuid-1234' })
  id: string;

  @ApiProperty({ example: 'USER', description: 'Роль (USER или AI)' })
  role: string;

  @ApiProperty()
  files: string[];

  @ApiProperty({
    type: [MessageVersionDto],
    description: 'Список версий сообщения (от старой к новой или иной порядок)',
  })
  versions: MessageVersionDto[];
}

export class ListMessagesResponseDto {
  @ApiProperty({ example: 42, description: 'Общее кол-во сообщений (без учёта версий)' })
  total: number;

  @ApiProperty({ type: [FullMessageDto] })
  messages: FullMessageDto[];
}