import {ForbiddenException, Injectable, NotFoundException,} from '@nestjs/common';
import {PrismaService} from 'src/prisma/prisma.service';
import {CreateChatDto, UpdateChatDto} from './dto/chats.dto';

@Injectable()
export class ChatsService {
  constructor(private readonly prisma: PrismaService) {}

  async createChat(dto: CreateChatDto, userId: string) {
    return this.prisma.chat.create({
      data: {
        title: dto.title,
        userId,
      },
    });
  }

  async updateChat(chatId: string, dto: UpdateChatDto, userId: string) {
    const chat = await this.findChatOrThrow(chatId, userId);

    return this.prisma.chat.update({
      where: { id: chatId },
      data: {
        title: dto.title,
      },
    });
  }

  async archiveChat(chatId: string, userId: string) {
    await this.findChatOrThrow(chatId, userId);

    return this.prisma.chat.update({
      where: { id: chatId },
      data: {
        archivedAt: new Date(),
      },
    });
  }

  async unarchiveChat(chatId: string, userId: string) {
    await this.findChatOrThrow(chatId, userId);

    return this.prisma.chat.update({
      where: { id: chatId },
      data: {
        archivedAt: null,
      },
    });
  }

  async softDeleteChat(chatId: string, userId: string) {
    await this.findChatOrThrow(chatId, userId);

    return this.prisma.chat.update({
      where: { id: chatId },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async hardDeleteChat(chatId: string, userId: string) {
    await this.findChatOrThrow(chatId, userId);

    return this.prisma.chat.delete({
      where: { id: chatId },
    });
  }

  async getAllChats(userId: string) {
    return this.prisma.chat.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: {createdAt: 'desc'},
    });
  }

  async getArchivedChats(userId: string) {
    return this.prisma.chat.findMany({
      where: {
        userId,
        deletedAt: null,
        archivedAt: { not: null },
      },
      orderBy: { archivedAt: 'desc' },
    });
  }

  private async findChatOrThrow(chatId: string, userId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
    });
    if (!chat) {
      throw new NotFoundException('Чат не найден');
    }
    if (chat.userId !== userId) {
      throw new ForbiddenException('Нет доступа к этому чату');
    }
    return chat;
  }
}
