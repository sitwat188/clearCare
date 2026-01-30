import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
export declare class TemplatesService {
    private prisma;
    constructor(prisma: PrismaService);
    getTemplates(providerId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        providerId: string;
        type: string;
        content: string;
        description: string | null;
        details: Prisma.JsonValue | null;
    }[]>;
    getTemplate(id: string, providerId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        providerId: string;
        type: string;
        content: string;
        description: string | null;
        details: Prisma.JsonValue | null;
    }>;
    createTemplate(providerId: string, dto: CreateTemplateDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        providerId: string;
        type: string;
        content: string;
        description: string | null;
        details: Prisma.JsonValue | null;
    }>;
    updateTemplate(id: string, providerId: string, dto: UpdateTemplateDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        providerId: string;
        type: string;
        content: string;
        description: string | null;
        details: Prisma.JsonValue | null;
    }>;
    deleteTemplate(id: string, providerId: string): Promise<void>;
}
