import { Module } from '@nestjs/common';
import { PatientsController } from './patients.controller';
import { PatientsMeController } from './patients-me.controller';
import { PatientsService } from './patients.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { InstructionsModule } from '../instructions/instructions.module';
import { ComplianceModule } from '../compliance/compliance.module';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, InstructionsModule, ComplianceModule, UsersModule, NotificationsModule],
  controllers: [PatientsController, PatientsMeController],
  providers: [PatientsService, RolesGuard],
  exports: [PatientsService],
})
export class PatientsModule {}
