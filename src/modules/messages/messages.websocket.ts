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
  cors: true
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {

  chatSocket: WebSocket;

  @WebSocketServer()
  server: Server;

  constructor(private readonly messagesService: MessagesService, private readonly jwtSevice: JwtService) {
    messagesService.server = this.server;
  }
    
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('send_message')
  @Permissions('SEND_MESSAGE')
  async handleSendMessage(
    client: Socket,
    payload: { chatId: string; dto: CreateMessageDto },
  ) {
    if (!client.handshake.headers.authorization) throw new Error('Пользователь не авторизован');
    
    const data = this.jwtSevice.verify(client.handshake.headers.authorization, {
      secret: process.env.JWT_ACCESS_SECRET,
    })
    const userId = data.userId;
    const { chatId, dto } = payload;
    
    await this.messagesService.sendMessage(chatId, userId, dto, client);
    // const response = {
    //   message: `Вы отправили: ${dto.content}`,
    //   created: this.mapToFullMessageDto(message, false),
    // };

    // this.server.emit('response', response);
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