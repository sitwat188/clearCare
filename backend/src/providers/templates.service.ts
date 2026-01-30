import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

@Injectable()
export class TemplatesService {
  constructor(private prisma: PrismaService) {}

  async getTemplates(providerId: string) {
    return this.prisma.instructionTemplate.findMany({
      where: { providerId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getTemplate(id: string, providerId: string) {
    const template = await this.prisma.instructionTemplate.findFirst({
      where: { id, providerId },
    });
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async createTemplate(providerId: string, dto: CreateTemplateDto) {
    return this.prisma.instructionTemplate.create({
      data: {
        providerId,
        name: dto.name,
        type: dto.type,
        description: dto.description ?? null,
        content: dto.content,
        details: (dto.details ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async updateTemplate(id: string, providerId: string, dto: UpdateTemplateDto) {
    await this.getTemplate(id, providerId);
    return this.prisma.instructionTemplate.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.details !== undefined && { details: dto.details as Prisma.InputJsonValue }),
      },
    });
  }

  async deleteTemplate(id: string, providerId: string) {
    await this.getTemplate(id, providerId);
    await this.prisma.instructionTemplate.delete({
      where: { id },
    });
  }
}
