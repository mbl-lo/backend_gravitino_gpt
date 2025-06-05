import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesService } from './messages.service';
import { CreateMessageDto, UpdateMessageDto, FullMessageDto } from './dto/messages.dto';
import { Permissions } from 'src/permissions/decorators/permissions.decorator';
import { JwtService } from '@nestjs/jwt';
import { WebSocket } from 'ws';

@WebSocketGateway({
  namespace: '/messages',
  cors: {
    origin: [
      'http://localhost:3001',
      'https://localhost:3001',
      'http://localhost:3000',
      'https://localhost:3000',
      'http://localhost:8080',
      'https://localhost:8080',
      'http://localhost',
      'https://localhost',
      'https://terminal.gravitino.ru',
      'http://terminal.gravitino.ru',
      'https://employer-ai.gravitino.ru',
      'http://employer-ai.gravitino.ru',
      'https://chat-ai.gravitino.ru'
    ]
  }
})
export class MessagesGateway {

  chatSocket: WebSocket;

  @WebSocketServer()
  server: Server;

  constructor(private readonly messagesService: MessagesService, private readonly jwtSevice: JwtService) {}

  @SubscribeMessage('send_message')
  @Permissions('SEND_MESSAGE')
  async handleSendMessage(
    client: any,
    payload: { chatId: string; dto: CreateMessageDto },
  ) {
    const data = this.jwtSevice.verify(client.handshake.headers.authorization, {
      secret: process.env.JWT_ACCESS_SECRET,
    })
    const userId = data.userId;
    const { chatId, dto } = payload;
    
    const message = await this.messagesService.sendMessage(chatId, userId, dto, client);
    const response = {
      message: `Вы отправили: ${dto.content}`,
      created: this.mapToFullMessageDto(message, false),
    };

    this.server.emit('new_message', response);
    return response;
  }

  private fixEncoding(str: string): string {
    return Buffer.from(str, 'latin1').toString('utf8');
  }

  private mapToFullMessageDto(message: any, roleFlag: boolean = true): FullMessageDto {
    return {
      id: message.id,
      role: roleFlag ? message.role : "AI",
      files: (message.files ?? '')
              .split('&|')
              .filter(Boolean)
              .map(s => this.fixEncoding(s.substring(s.indexOf('_') + 1))),
      versions: message.versions.map((v) => ({
        content: v.content,
        type: v.type,
        createdAt: v.createdAt,
      })),
    };
  }
}