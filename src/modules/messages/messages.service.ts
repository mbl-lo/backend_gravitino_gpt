import {ForbiddenException, Injectable, NotFoundException,} from '@nestjs/common';
import {PrismaService} from 'src/prisma/prisma.service';
import {CreateMessageDto, UpdateMessageDto} from './dto/messages.dto';
import axios from 'axios';
import * as url from "node:url";

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}
  private fixEncoding(str: string): string {
    return Buffer.from(str, 'latin1').toString('utf8');
  }

  async sendMessage(chatId: string, userId: string, dto: CreateMessageDto) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
    });
    if (!chat) {
      throw new NotFoundException('Чат не найден');
    }
    if (chat.userId !== userId) {
      throw new ForbiddenException('У вас нет доступа к этому чату');
    }
    console.log(dto.url.join('&|'));
    const filesUrl =  dto.url.join('&|');
    const message = await this.prisma.message.create({
      data: {
        chatId: chatId,
        role: 'USER',
        files: this.fixEncoding(filesUrl),
      },
    });

    const version = await this.prisma.messageVersion.create({
      data: {
        messageId: message.id,
        content: dto.content,
        type: dto.type,
      },
    });

    await this.prisma.message.update({
        where: {id: message.id},
        data: {
            currentVersionId: version.id,
        },
        include: {
            versions: true,
        },
    });

    const allMessages = await this.prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
      include: {
        currentVersion: true,
      },
    });

    const messagesList = allMessages.map((m) => {
      const role = (m.role === 'USER') ? 'USER' : 'AI';
      return {
        content: m.currentVersion?.content ?? '',
        role,
      };
    });
    let aiAnswer = "";
    const payload = {
      context: messagesList,
      files: dto.url,
    };
    try {
      const response = await axios.post(
          'https://chat-service.gravitino.ru/api/v1.0/gravitino/chat_helper_context', payload);
      console.log('Ответ сервиса:', response.data.answer);
      console.log(payload)
      aiAnswer = response.data.answer;
    } catch (err) {
      console.error('Ошибка при вызове внешнего сервиса:', err.message);
      console.error('Ошибка при вызове внешнего сервиса:', payload);
    }

    const message_chat = await this.prisma.message.create({
      data: {
        chatId: chatId,
        role: 'AI',
      },
    });

    const version_chat = await this.prisma.messageVersion.create({
      data: {
        messageId: message_chat.id,
        content: aiAnswer,
        type: dto.type,
      },
    });

    return this.prisma.message.update({
        where: {id: message_chat.id},
        data: {
            currentVersionId: version_chat.id,
        },
        include: {
            versions: true,
        },
    });
  }

  async editMessage(messageId: string, userId: string, dto: UpdateMessageDto) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { chat: true, versions: true },
    });
    if (!message) {
      throw new NotFoundException('Сообщение не найдено');
    }
    if (message.chat.userId !== userId) {
      throw new ForbiddenException('Нельзя редактировать чужое сообщение');
    }

    const newVersion = await this.prisma.messageVersion.create({
      data: {
        messageId: message.id,
        content: dto.content,
        type: dto.type,
      },
    });

    return this.prisma.message.update({
        where: {id: message.id},
        data: {
            currentVersionId: newVersion.id,
        },
        include: {versions: true},
    });
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { chat: true },
    });
    if (!message) {
      throw new NotFoundException('Сообщение не найдено');
    }
    if (message.chat.userId !== userId) {
      throw new ForbiddenException('Вы не можете удалять чужие сообщения');
    }

    await this.prisma.message.delete({
      where: { id: messageId },
    });
    return true;
  }

  async getMessagesInChat(chatId: string, userId: string, limit = 10, offset = 0) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
    });
    if (!chat) {
      throw new NotFoundException('Чат не найден');
    }
    if (chat.userId !== userId) {
      throw new ForbiddenException('Нет доступа к этому чату');
    }

    const total = await this.prisma.message.count({
      where: {
        chatId,
      },
    });

    const messages = await this.prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      include: {
        versions: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    console.log(messages);
    return { total, messages };
  }
}
