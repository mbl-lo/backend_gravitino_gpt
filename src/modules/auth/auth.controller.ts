import {Body, Controller, Post, Headers, UseGuards, UnauthorizedException} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginDto } from './dto/auth.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import {ApiBearerAuth, ApiOperation, ApiResponse} from "@nestjs/swagger";

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Создать пользователя' })
  @ApiResponse({ status: 201, description: 'Пользователь создан' })
  @ApiResponse({ status: 400, description: 'Неверные данные' })
  async signup(@Body() dto: CreateUserDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Вход пользователя, получение access,refresh токенов' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновление токенов по refresh-токену в заголовке Authorization' })
  async refreshTokens(@Headers('authorization') authorization?: string) {
    if (!authorization) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const [bearer, token] = authorization.split(' ');
    if (bearer !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid Authorization format');
    }

    return this.authService.refreshTokens(token);
  }
}