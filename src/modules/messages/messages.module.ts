import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { JwtModule } from '@nestjs/jwt';
import { MessagesGateway } from './messages.websocket';

@Module({
  imports: [PrismaModule, JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' }
    })],
  controllers: [MessagesController],
  providers: [MessagesService, MessagesGateway],
  exports: [MessagesService],
})
export class MessagesModule {}
