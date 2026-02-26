import { Module } from '@nestjs/common';
import { InstructionsController } from './instructions.controller';
import { InstructionsService } from './instructions.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [InstructionsController],
  providers: [InstructionsService],
  exports: [InstructionsService],
})
export class InstructionsModule {}
