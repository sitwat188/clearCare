import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { EncryptionService } from '../common/encryption/encryption.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

@Injectable()
export class TemplatesService {
  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
  ) {}

  private decryptTemplate<
    T extends {
      name: string;
      description: string | null;
      content: string;
      details?: unknown;
    },
  >(row: T): T {
    const view = this.encryption.decryptedView(row as Record<string, unknown>, ['name', 'description', 'content']);
    const details =
      row.details != null &&
      typeof row.details === 'object' &&
      '_encrypted' in row.details &&
      typeof (row.details as { _encrypted: string })._encrypted === 'string'
        ? (() => {
            try {
              return JSON.parse(this.encryption.decrypt((row.details as { _encrypted: string })._encrypted)) as unknown;
            } catch {
              return row.details;
            }
          })()
        : row.details;
    return { ...row, name: view.name, description: view.description ?? null, content: view.content, details };
  }

  private encryptDetails(details: unknown): Prisma.InputJsonValue | undefined {
    if (details == null) return undefined;
    try {
      return {
        _encrypted: this.encryption.encrypt(JSON.stringify(details)),
      } as Prisma.InputJsonValue;
    } catch {
      return undefined;
    }
  }

  async getTemplates(providerId: string) {
    const list = await this.prisma.instructionTemplate.findMany({
      where: { providerId },
      orderBy: { updatedAt: 'desc' },
    });
    return list.map((t) => this.decryptTemplate(t));
  }

  async getTemplate(id: string, providerId: string) {
    const template = await this.prisma.instructionTemplate.findFirst({
      where: { id, providerId },
    });
    if (!template) throw new NotFoundException('Template not found');
    return this.decryptTemplate(template);
  }

  async createTemplate(providerId: string, dto: CreateTemplateDto) {
    const enc = this.encryption.encryptFields(
      {
        name: dto.name,
        description: dto.description ?? undefined,
        content: dto.content,
      },
      ['name', 'description', 'content'],
    ) as { name: string; description?: string; content: string };
    const created = await this.prisma.instructionTemplate.create({
      data: {
        providerId,
        name: enc.name,
        content: enc.content,
        description: enc.description ?? null,
        type: dto.type,
        details: this.encryptDetails(dto.details ?? undefined),
      },
    });
    return this.decryptTemplate(created);
  }

  async updateTemplate(id: string, providerId: string, dto: UpdateTemplateDto) {
    await this.prisma.instructionTemplate.findFirstOrThrow({
      where: { id, providerId },
    });
    const enc =
      dto.name !== undefined || dto.description !== undefined || dto.content !== undefined
        ? this.encryption.encryptFields(
            {
              name: dto.name,
              description: dto.description,
              content: dto.content,
            },
            ['name', 'description', 'content'],
          )
        : null;
    const data: Prisma.InstructionTemplateUpdateInput = {
      ...(enc?.name !== undefined && { name: enc.name }),
      ...(dto.type !== undefined && { type: dto.type }),
      ...(enc?.description !== undefined && { description: enc.description }),
      ...(dto.description === null && { description: null }),
      ...(enc?.content !== undefined && { content: enc.content }),
      ...(dto.details !== undefined && {
        details: this.encryptDetails(dto.details),
      }),
    };
    const updated = await this.prisma.instructionTemplate.update({
      where: { id },
      data,
    });
    return this.decryptTemplate(updated);
  }

  async deleteTemplate(id: string, providerId: string) {
    await this.getTemplate(id, providerId);
    await this.prisma.instructionTemplate.delete({
      where: { id },
    });
  }
}
