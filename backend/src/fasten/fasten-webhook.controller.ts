/**
 * Fasten Connect webhook receiver.
 * When FASTEN_WEBHOOK_SECRET is set, requests must include a matching value in one of:
 * - x-fasten-signature
 * - x-webhook-secret
 * - webhook-signature (Standard-Webhooks)
 * Otherwise the request is rejected with 401.
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
    @Headers('x-fasten-signature') xFastenSignature?: string,
    @Headers('x-webhook-secret') xWebhookSecret?: string,
    @Headers('webhook-signature') webhookSignature?: string,
  ) {
    const signatureOrSecret = xFastenSignature ?? xWebhookSecret ?? webhookSignature;
    this.logger.log(
      `Webhook received: type=${payload?.type ?? 'missing'} id=${(payload as { id?: string })?.id ?? 'n/a'}`,
    );
    await this.webhookService.handle(payload, signatureOrSecret);
    return { received: true };
  }
}
