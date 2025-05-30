import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { MessagesService } from './messages.service';
import { CreateMessageDto, UpdateMessageDto, FullMessageDto, ListMessagesResponseDto, } from './dto/messages.dto';
import {PermissionsGuard} from "../../permissions/guards/permissions.guard";
import { Permissions } from 'src/permissions/decorators/permissions.decorator';


@ApiTags('Messages')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@UseGuards(JwtAuthGuard)
@Controller()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('chats/:chatId/messages')
  @Permissions('SEND_MESSAGE')
  @ApiOperation({ summary: 'Отправить новое сообщение' })
  @ApiResponse({ status: 201, type: FullMessageDto })
  async sendMessage(
    @Param('chatId') chatId: string,
    @Body() dto: CreateMessageDto,
    @Req() req: any,
  ) {
    const userId = req.user.userId;
    const message = await this.messagesService.sendMessage(chatId, userId, dto);

    return {
      message: `Вы отправили: ${dto.content}`,
      created: this.mapToFullMessageDto(message, false),
    };
  }

  @Patch('messages/:messageId')
  @ApiOperation({ summary: 'Редактировать сообщение' })
  @ApiResponse({ status: 200, type: FullMessageDto })
  async editMessage(
    @Param('messageId') messageId: string,
    @Body() dto: UpdateMessageDto,
    @Req() req: any,
  ) {
    const userId = req.user.userId;
    const updated = await this.messagesService.editMessage(messageId, userId, dto);
    return this.mapToFullMessageDto(updated);
  }

  @Delete('messages/:messageId')
  @ApiOperation({ summary: 'Удалить сообщение (только своё)' })
  async deleteMessage(@Param('messageId') messageId: string, @Req() req: any) {
    const userId = req.user.userId;
    await this.messagesService.deleteMessage(messageId, userId);
    return { message: 'Сообщение удалено' };
  }

  @Get('chats/:chatId/messages')
  @ApiOperation({ summary: 'Получить список сообщений в чате' })
  @ApiResponse({ status: 200, type: ListMessagesResponseDto })
  async getMessagesInChat(
    @Param('chatId') chatId: string,
    @Query('limit') limitStr: string,
    @Query('offset') offsetStr: string,
    @Req() req: any,
  ) {
    const userId = req.user.userId;
    const limit = parseInt(limitStr ?? '10', 10);
    const offset = parseInt(offsetStr ?? '0', 10);

    const { total, messages } = await this.messagesService.getMessagesInChat(
      chatId,
      userId,
      limit,
      offset,
    );

    return {
      total,
      messages: messages.map((m) => this.mapToFullMessageDto(m)),
    };
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
