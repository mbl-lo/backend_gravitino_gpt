import { Module } from '@nestjs/common';
import { MessagesService } from '../messages/messages.service';

@Module ({
    imports : [MessagesService],
})
export class GatewayModule {}