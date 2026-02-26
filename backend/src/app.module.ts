import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { EncryptionModule } from './common/encryption/encryption.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PatientsModule } from './patients/patients.module';
import { InstructionsModule } from './instructions/instructions.module';
import { ComplianceModule } from './compliance/compliance.module';
import { ProvidersModule } from './providers/providers.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RemindersModule } from './reminders/reminders.module';
import { AdminModule } from './admin/admin.module';
import { AuditModule } from './audit/audit.module';
import { MedplumModule } from './medplum/medplum.module';
import { FastenModule } from './fasten/fasten.module';
import { AuditLogInterceptor } from './audit/audit-log.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60000, limit: 100 },
      { name: 'auth', ttl: 60000, limit: 10 },
    ]),
    PrismaModule,
    EncryptionModule,
    AuthModule,
    UsersModule,
    PatientsModule,
    InstructionsModule,
    ComplianceModule,
    ProvidersModule,
    NotificationsModule,
    RemindersModule,
    AdminModule,
    AuditModule,
    MedplumModule,
    FastenModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
  ],
})
export class AppModule {}
