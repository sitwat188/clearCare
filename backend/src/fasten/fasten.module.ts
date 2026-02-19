import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { FastenConnectService } from './fasten-connect.service';
import { HealthConnectionsService } from './health-connections.service';
import { FastenEhiIngestService } from './fasten-ehi-ingest.service';
import { FastenWebhookService } from './fasten-webhook.service';
import { HealthConnectionsMeController } from './health-connections.controller';
import { HealthConnectionsPatientController } from './health-connections-patient.controller';
import { FastenWebhookController } from './fasten-webhook.controller';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [
    HealthConnectionsMeController,
    HealthConnectionsPatientController,
    FastenWebhookController,
  ],
  providers: [
    FastenConnectService,
    HealthConnectionsService,
    FastenEhiIngestService,
    FastenWebhookService,
  ],
  exports: [FastenConnectService, HealthConnectionsService],
})
export class FastenModule {}
