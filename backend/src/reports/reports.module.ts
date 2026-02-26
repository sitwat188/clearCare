import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EncryptionModule } from '../common/encryption/encryption.module';
import { ReportGeneratorService } from './report-generator.service';

@Module({
  imports: [PrismaModule, EncryptionModule],
  providers: [ReportGeneratorService],
  exports: [ReportGeneratorService],
})
export class ReportsModule {}
