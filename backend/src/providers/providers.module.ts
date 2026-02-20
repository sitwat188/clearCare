import { Module } from '@nestjs/common';
import { EncryptionModule } from '../common/encryption/encryption.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ProvidersController } from './providers.controller';
import { PatientsModule } from '../patients/patients.module';
import { ComplianceModule } from '../compliance/compliance.module';
import { InstructionsModule } from '../instructions/instructions.module';
import { TemplatesService } from './templates.service';
import { ReportsService } from './reports.service';

@Module({
  imports: [PrismaModule, EncryptionModule, PatientsModule, ComplianceModule, InstructionsModule],
  controllers: [ProvidersController],
  providers: [TemplatesService, ReportsService, RolesGuard],
})
export class ProvidersModule {}
