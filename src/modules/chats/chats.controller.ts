import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    UseGuards,
    Req, Put,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { ChatsService } from './chats.service';
import { CreateChatDto, UpdateChatDto, ChatDto } from './dto/chats.dto';
import {PermissionsGuard} from "../../permissions/guards/permissions.guard";
import { Permissions } from 'src/permissions/decorators/permissions.decorator';


@ApiTags('Chats')
@UseGuards(PermissionsGuard)
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Post()
  @ApiOperation({ summary: 'Создать новый чат' })
  @Permissions('CREATE_CHAT')
  @ApiResponse({ status: 201, description: 'Чат создан', type: ChatDto })
  async createChat(@Body() dto: CreateChatDto, @Req() req: any) {
    const userId = req.user.userId;
    const chat = await this.chatsService.createChat(dto, userId);
    return mapChatToDto(chat);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Изменить название чата' })
  @ApiResponse({ status: 200, description: 'Чат обновлён', type: ChatDto })
  async updateChat(
    @Param('id') chatId: string,
    @Body() dto: UpdateChatDto,
    @Req() req: any,
  ) {
    const userId = req.user.userId;
    const chat = await this.chatsService.updateChat(chatId, dto, userId);
    return mapChatToDto(chat);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить чат (deletedAt)' })
  @ApiResponse({ status: 200, description: 'Чат удалён' })
  async softDeleteChat(@Param('id') chatId: string, @Req() req: any) {
    const userId = req.user.userId;
    await this.chatsService.softDeleteChat(chatId, userId);
    return { message: 'Чат помечен как удалён' };
  }

  @Get()
  @ApiOperation({ summary: 'Получить список чатов' })
  @ApiResponse({ status: 200, description: 'Список чатов', type: [ChatDto] })
  async getChats(@Req() req: any) {
    const userId = req.user.userId;
    const chats = await this.chatsService.getAllChats(userId);
    return chats.map(mapChatToDto);
  }

  @Get('archived')
  @ApiOperation({ summary: 'Получить список заархивированных чатов' })
  @ApiResponse({ status: 200, description: 'Список чатов', type: [ChatDto] })
  async getArchivedChats(@Req() req: any) {
    const userId = req.user.userId;
    const chats = await this.chatsService.getArchivedChats(userId);
    return chats.map(mapChatToDto);
  }

  @Put(':id/archive')
  @ApiOperation({ summary: 'Заархивировать чат' })
  @ApiResponse({ status: 200, description: 'Чат заархивирован', type: ChatDto })
  async archiveChat(@Param('id') chatId: string, @Req() req: any) {
    const userId = req.user.userId;
    const chat = await this.chatsService.archiveChat(chatId, userId);
    return mapChatToDto(chat);
  }

  @Put(':id/unarchive')
  @ApiOperation({ summary: 'Восстановить чат из архива' })
  @ApiResponse({ status: 200, description: 'Чат восстановлен', type: ChatDto })
  async unarchiveChat(@Param('id') chatId: string, @Req() req: any) {
    const userId = req.user.userId;
    const chat = await this.chatsService.unarchiveChat(chatId, userId);
    return mapChatToDto(chat);
  }

  @Delete(':id/hard')
  @ApiOperation({ summary: 'Полностью удалить чат из БД (hard delete)' })
  @ApiResponse({ status: 200, description: 'Чат удалён из базы' })
  async hardDeleteChat(@Param('id') chatId: string, @Req() req: any) {
    const userId = req.user.userId;
    await this.chatsService.hardDeleteChat(chatId, userId);
    return { message: 'Чат полностью удалён из БД' };
  }
}

function mapChatToDto(chat: any): ChatDto {
  return {
    id: chat.id,
    title: chat.title,
    createdAt: chat.createdAt,
  };
}
