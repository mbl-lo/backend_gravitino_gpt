import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET || 'fallbackSecret',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [UserController],
  providers: [
    UserService,
  ],
  exports: [UserService],
})
export class UserModule {}
