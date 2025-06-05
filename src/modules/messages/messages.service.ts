import {ForbiddenException, Injectable, NotFoundException,} from '@nestjs/common';
import {PrismaService} from 'src/prisma/prisma.service';
import {CreateMessageDto, UpdateMessageDto} from './dto/messages.dto';
import axios from 'axios';
import { Server, Socket } from 'socket.io';
import * as url from "node:url";
import { JwtService } from '@nestjs/jwt';
import { WebSocket } from 'ws';

@Injectable()
export class MessagesService{
  chatSocket: WebSocket;
  
  server: Server;

  clients: Map<string, Socket>
  pendingQueue: any[];
  
  constructor(private readonly prisma: PrismaService, private readonly jwtSevice: JwtService) {
    this.chatSocket = new WebSocket("ws://localhost:10000");
    this.chatSocket.on('message', (data) => this.handleMessage(data));
  
    this.clients = new Map<string, Socket>();
    this.pendingQueue = [];
  }
  
  async handleMessage(data: WebSocket.Data) {
    const message = JSON.parse(data.toString());

    switch (message.event) {
      case 'ai_response':
        this.pendingQueue.push(message);
        console.log(message.payload);
        await this.processQueue();
        break;
      default:
        console.log('DONE!');
    }
  }

  async processQueue()
  {
    while (this.pendingQueue.length > 0) {
      let message = this.pendingQueue.pop();
      const userId = message.payload.userId
      const chatId = message.payload.chatId
      const client = this.clients.get(userId);
      
      let last_message_chat = await this.prisma.message.findFirst({
        where: {
          chatId: chatId
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      if (last_message_chat == null || last_message_chat.role == 'USER') {
        last_message_chat = await this.prisma.message.create({
          data: {
            chatId: message.payload.chatId,
            role: 'AI',
          }
        });
      }
      
      let version_chat = await this.prisma.messageVersion.findFirst({
        where: {
          messageId: last_message_chat.id
        },
      });
      
      if (version_chat == null) {
        version_chat = await this.prisma.messageVersion.create({
          data: {
            messageId: last_message_chat.id,
            content: message.payload.answer,
            type: message.payload.type,
          },
        });
      }
      else {
        version_chat = await this.prisma.messageVersion.update({
          where: {
            id: version_chat.id
          },
          data: {
            content: version_chat.content + message.payload.answer,
          },
        });
      }
      
      const response = this.prisma.message.update({
        where: {id: last_message_chat.id},
        data: {
          currentVersionId: version_chat.id,
        },
        include: {
          versions: true,
        },
      });
      
      if (client) client.emit('response', response);
    }
  }
  
  handleDone() {
    console.log("DONE!");
  }

  private fixEncoding(str: string): string {
    return Buffer.from(str, 'latin1').toString('utf8');
  }

  private async simulateResponse(content: string, client: Socket, chatId: string){
      const words = content.match(/\S+\s*/g) || [];

      for (const word of words){
        client.emit('response', {
          chatId,
          word,
          isLast: false
        });

        await new Promise(resolve => setTimeout(resolve, 300));
      }

      client.emit('response', {
        chatId,
        word: '',
        isLast: true
      })
    }

  async sendMessage(chatId: string, userId: string, dto: CreateMessageDto, clientSocket: Socket) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
    });
    if (!chat) {
      throw new NotFoundException('Чат не найден');
    }
    if (chat.userId !== userId) {
      throw new ForbiddenException('У вас нет доступа к этому чату');
    }

    console.log(userId);

    this.clients.set(userId, clientSocket);
    
    const filesUrl = dto.url.join('&|');
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
    
    const payload = {
      userId: userId,
      chatId: chatId,
      context: messagesList,
      files: dto.url,
    };

    this.chatSocket.send(JSON.stringify({ event: 'ai_request', payload: payload }));
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
