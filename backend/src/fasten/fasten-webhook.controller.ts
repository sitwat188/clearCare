/**
 * Fasten Connect webhook receiver.
 * When FASTEN_WEBHOOK_SECRET is set, requests must include a matching value in one of:
 * - x-fasten-signature
 * - x-webhook-secret
 * - webhook-signature (Standard-Webhooks)
 * Otherwise the request is rejected with 401.
 */

import { Controller, Post, Body, Headers } from '@nestjs/common';
import { FastenWebhookService } from './fasten-webhook.service';
import type { FastenWebhookPayload } from './dto/fasten-webhook.dto';

@Controller('fasten/webhook')
export class FastenWebhookController {
  constructor(private readonly webhookService: FastenWebhookService) {}

  @Post()
  async handleWebhook(
    @Body() payload: FastenWebhookPayload,
    @Headers('x-fasten-signature') xFastenSignature?: string,
    @Headers('x-webhook-secret') xWebhookSecret?: string,
    @Headers('webhook-signature') webhookSignature?: string,
  ) {
    const signatureOrSecret = xFastenSignature ?? xWebhookSecret ?? webhookSignature;
    await this.webhookService.handle(payload, signatureOrSecret);
    return { received: true };
  }
}
