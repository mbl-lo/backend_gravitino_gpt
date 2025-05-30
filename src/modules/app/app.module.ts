import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from "../auth/auth.module";
import { ChatsModule } from "../chats/chats.module";
import { PrismaModule } from "../../prisma/prisma.module";
import {UserModule} from "../user/user.module";
import {MessagesModule} from "../messages/messages.module";
import {AdminModule} from "../admin/admin.module";
import {RolesPermissionsModule} from "../roles-permissions/roles-permissions.module";
import {FilesModule} from "../files/files.module";

@Module({
  imports: [AuthModule, PrismaModule, ChatsModule, UserModule, MessagesModule, AdminModule, RolesPermissionsModule,
            FilesModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
