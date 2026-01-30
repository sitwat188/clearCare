import { Module } from '@nestjs/common';
import { PatientsController } from './patients.controller';
import { PatientsMeController } from './patients-me.controller';
import { PatientsService } from './patients.service';
import { PrismaModule } from '../prisma/prisma.module';
import { InstructionsModule } from '../instructions/instructions.module';
import { ComplianceModule } from '../compliance/compliance.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PrismaModule, InstructionsModule, ComplianceModule, UsersModule],
  controllers: [PatientsController, PatientsMeController],
  providers: [PatientsService],
  exports: [PatientsService],
})
export class PatientsModule {}
