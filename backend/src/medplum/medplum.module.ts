import { Module } from '@nestjs/common';
import { MedplumService } from './medplum.service';
import { MedplumController } from './medplum.controller';

@Module({
  providers: [MedplumService],
  controllers: [MedplumController],
  exports: [MedplumService],
})
export class MedplumModule {}
