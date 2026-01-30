import { Module } from '@nestjs/common';
import { InstructionsController } from './instructions.controller';
import { InstructionsService } from './instructions.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InstructionsController],
  providers: [InstructionsService],
  exports: [InstructionsService], // Export if needed by other modules
})
export class InstructionsModule {}
