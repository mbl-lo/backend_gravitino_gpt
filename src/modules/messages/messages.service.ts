import {ForbiddenException, Injectable, NotFoundException,} from '@nestjs/common';
import {PrismaService} from 'src/prisma/prisma.service';
import {CreateMessageDto, UpdateMessageDto} from './dto/messages.dto';
import axios from 'axios';
import { Server, Socket, } from 'socket.io';
import * as url from "node:url";
import { OnGatewayConnection, OnGatewayDisconnect, WebSocketServer } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { WebSocket } from 'ws';

@Injectable()
export class MessagesService implements OnGatewayConnection, OnGatewayDisconnect{
  chatSocket: WebSocket;
  @WebSocketServer()
  server: Server;
  
  constructor(private readonly prisma: PrismaService, private readonly jwtSevice: JwtService) {this.chatSocket = new WebSocket("ws://localhost:10000");
    this.chatSocket = new WebSocket("ws://localhost:10000");
    this.chatSocket.on('message', this.handleMessage);
  
    this.chatSocket.on('open', () => this.chatSocket.send(JSON.stringify({ event: 'splitText' })));
    }
     handleConnection(client: Socket) {
    
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }
  
    handleMessage(data: WebSocket.Data) {
      const message = JSON.parse(data.toString());
  
      switch (message.event) {
        case 'word':
          console.log(message.content);
          break;
        default:
          console.log('DONE!');
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

  async sendMessage(chatId: string, userId: string, dto: CreateMessageDto, clientSocket: Socket | undefined = undefined) {
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
    
    const payload = {
      context: messagesList,
      files: dto.url,
    };
    
    const aiMessage = await this.prisma.message.create({
      data: {
        chatId: chatId,
        role: 'AI',
      },
    });

const message_chat = await this.prisma.message.create({
      data: {
        chatId: chatId,
        role: 'AI',
      },
    });

    if (clientSocket != undefined) {
      const aiAnswer = 'Имитация ответа: Когда первые колонисты Марса, изнурённые долгим перелётом сквозь радиационные пояса, наконец ступили на ржавую поверхность Красной планеты и установили купола биодомов с искусственной гравитацией, они вдруг осознали, что всё это время их сопровождал таинственный сигнал — возможно, след древней цивилизации, оставленный в кристаллах под поверхностью Долины Маринер, где роботы-разведчики уже обнаружили странные симметричные структуры, напоминающие то ли храм, то ли гигантский квантовый компьютер, способный, согласно гипотезам, искривлять пространство-время.'
      
      await this.simulateResponse(aiAnswer, clientSocket, chatId);

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
  throw new Error('Клиент не подключен через WebSocket');
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
