/**
 * Scheduled reminders: acknowledgment and instruction-expiring.
 * Runs daily and creates in-app notifications for patients when:
 * - An instruction has an acknowledgment deadline (past or within 2 days) and is not acknowledged.
 * - An instruction is expiring within the next 7 days.
 * Each reminder type is sent at most once per instruction (deduplicated by existing notifications).
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NOTIFICATION_TYPES, NOTIFICATION_ACTION_LABELS } from '../notifications/notification-types';

const ACKNOWLEDGMENT_REMINDER_WINDOW_DAYS = 2; // Remind if deadline is within 2 days or already passed
const EXPIRING_REMINDER_DAYS = 7; // Remind if expiring within 7 days

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  /**
   * Run reminder checks daily at 09:00 (server time).
   * Can be overridden via env REMINDERS_CRON_DISABLED=true to disable.
   */
  @Cron(process.env.REMINDERS_CRON_EXPRESSION ?? '0 9 * * *', {
    name: 'instruction-reminders',
  })
  async runReminders(): Promise<void> {
    if (process.env.REMINDERS_CRON_DISABLED === 'true') {
      this.logger.debug('Reminders cron is disabled (REMINDERS_CRON_DISABLED=true)');
      return;
    }
    try {
      await this.sendAcknowledgmentReminders();
      await this.sendExpiringReminders();
    } catch (err) {
      this.logger.error(`Reminders job failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Find active instructions with acknowledgment deadline (past or within window), not yet acknowledged.
   * Send at most one acknowledgment_reminder per instruction.
   */
  private async sendAcknowledgmentReminders(): Promise<void> {
    const now = new Date();
    const windowEnd = new Date(now);
    windowEnd.setDate(windowEnd.getDate() + ACKNOWLEDGMENT_REMINDER_WINDOW_DAYS);

    const instructions = await this.prisma.careInstruction.findMany({
      where: {
        deletedAt: null,
        status: 'active',
        acknowledgedDate: null,
        acknowledgmentDeadline: { not: null, lte: windowEnd },
      },
      include: { patient: { select: { userId: true } } },
    });

    let sent = 0;
    for (const instruction of instructions) {
      const userId = instruction.patient?.userId;
      if (!userId) continue;

      const alreadySent = await this.alreadySentReminder(
        userId,
        NOTIFICATION_TYPES.ACKNOWLEDGMENT_REMINDER,
        instruction.id,
      );
      if (alreadySent) continue;

      try {
        const deadline = instruction.acknowledgmentDeadline!;
        const isPast = deadline < now;
        await this.notifications.createNotification({
          userId,
          type: NOTIFICATION_TYPES.ACKNOWLEDGMENT_REMINDER,
          title: isPast ? 'Acknowledgment overdue' : 'Acknowledgment due soon',
          message: isPast
            ? `Please acknowledge the care instruction "${instruction.title}" by the deadline.`
            : `Please acknowledge the care instruction "${instruction.title}" by ${deadline.toLocaleDateString()}.`,
          priority: isPast ? 'high' : 'medium',
          actionUrl: `/patient/instructions/${instruction.id}`,
          actionLabel: NOTIFICATION_ACTION_LABELS[NOTIFICATION_TYPES.ACKNOWLEDGMENT_REMINDER] ?? 'Acknowledge',
          metadata: { instructionId: instruction.id },
        });
        sent++;
      } catch (err) {
        this.logger.warn(
          `Failed to create acknowledgment reminder for instruction ${instruction.id}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    if (sent > 0) {
      this.logger.log(`Acknowledgment reminders: sent ${sent} of ${instructions.length} eligible`);
    }
  }

  /**
   * Find active instructions expiring within the next EXPIRING_REMINDER_DAYS days.
   * Send at most one instruction_expiring per instruction.
   */
  private async sendExpiringReminders(): Promise<void> {
    const now = new Date();
    const windowEnd = new Date(now);
    windowEnd.setDate(windowEnd.getDate() + EXPIRING_REMINDER_DAYS);

    const instructions = await this.prisma.careInstruction.findMany({
      where: {
        deletedAt: null,
        status: 'active',
        expirationDate: { not: null, gte: now, lte: windowEnd },
      },
      include: { patient: { select: { userId: true } } },
    });

    let sent = 0;
    for (const instruction of instructions) {
      const userId = instruction.patient?.userId;
      if (!userId) continue;

      const alreadySent = await this.alreadySentReminder(
        userId,
        NOTIFICATION_TYPES.INSTRUCTION_EXPIRING,
        instruction.id,
      );
      if (alreadySent) continue;

      try {
        const expDate = instruction.expirationDate!;
        await this.notifications.createNotification({
          userId,
          type: NOTIFICATION_TYPES.INSTRUCTION_EXPIRING,
          title: 'Instruction expiring soon',
          message: `The care instruction "${instruction.title}" expires on ${expDate.toLocaleDateString()}. Review it before it expires.`,
          priority: 'medium',
          actionUrl: `/patient/instructions/${instruction.id}`,
          actionLabel: NOTIFICATION_ACTION_LABELS[NOTIFICATION_TYPES.INSTRUCTION_EXPIRING] ?? 'View instruction',
          metadata: { instructionId: instruction.id },
        });
        sent++;
      } catch (err) {
        this.logger.warn(
          `Failed to create expiring reminder for instruction ${instruction.id}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    if (sent > 0) {
      this.logger.log(`Expiring reminders: sent ${sent} of ${instructions.length} eligible`);
    }
  }

  /**
   * Check if we already sent a reminder of this type for this instruction (avoid duplicates).
   */
  private async alreadySentReminder(userId: string, type: string, instructionId: string): Promise<boolean> {
    const existing = await this.prisma.notification.findMany({
      where: { userId, type },
      select: { metadata: true },
    });
    return existing.some(
      (n) =>
        n.metadata &&
        typeof n.metadata === 'object' &&
        (n.metadata as { instructionId?: string }).instructionId === instructionId,
    );
  }
}
