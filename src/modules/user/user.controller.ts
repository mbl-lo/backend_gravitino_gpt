import {Controller, Get, Req, UseGuards} from '@nestjs/common';
import {ApiBearerAuth, ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {JwtAuthGuard} from 'src/modules/auth/guards/jwt-auth.guard';
import {UserService} from './user.service';
import {UserProfileDto} from './dto/user.dto';

@ApiTags('Users')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить профиль текущего пользователя (без пароля)' })
  @ApiResponse({ status: 200, description: 'Успешно', type: UserProfileDto })
  async getProfile(@Req() req: any) {
    const userId = req.user.userId;

    return await this.userService.getUserProfile(userId);
  }
}
