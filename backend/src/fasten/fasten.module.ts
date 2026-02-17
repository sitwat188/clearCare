import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { FastenConnectService } from './fasten-connect.service';
import { HealthConnectionsService } from './health-connections.service';
import { HealthConnectionsMeController } from './health-connections.controller';
import { HealthConnectionsPatientController } from './health-connections-patient.controller';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [
    HealthConnectionsMeController,
    HealthConnectionsPatientController,
  ],
  providers: [FastenConnectService, HealthConnectionsService],
  exports: [FastenConnectService, HealthConnectionsService],
})
export class FastenModule {}
