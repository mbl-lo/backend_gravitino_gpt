import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RolesPermissionsService } from './roles-permissions.service';
import { RolesPermissionsController } from './roles-permissions.controller';

@Module({
  imports: [PrismaModule],
  controllers: [RolesPermissionsController],
  providers: [RolesPermissionsService],
  exports: [RolesPermissionsService],
})
export class RolesPermissionsModule {}
