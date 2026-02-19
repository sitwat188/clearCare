/**
 * Fasten Connect webhook receiver.
 * No auth guard – Fasten servers POST here. Optionally verify FASTEN_WEBHOOK_SECRET header if configured.
 */

import { Controller, Post, Body, Headers, Logger } from '@nestjs/common';
import { FastenWebhookService } from './fasten-webhook.service';
import type { FastenWebhookPayload } from './dto/fasten-webhook.dto';

@Controller('fasten/webhook')
export class FastenWebhookController {
  private readonly logger = new Logger(FastenWebhookController.name);

  constructor(private readonly webhookService: FastenWebhookService) {}

  @Post()
  async handleWebhook(
    @Body() payload: FastenWebhookPayload,
    @Headers('x-fasten-signature') signature?: string,
    @Headers('x-webhook-secret') webhookSecret?: string,
  ) {
    this.logger.log(
      `Webhook received: type=${payload?.type ?? 'missing'} id=${(payload as { id?: string })?.id ?? 'n/a'}`,
    );
    await this.webhookService.handle(payload, signature ?? webhookSecret);
    return { received: true };
  }
}
