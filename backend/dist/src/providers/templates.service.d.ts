import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
export declare class TemplatesService {
    private prisma;
    constructor(prisma: PrismaService);
    getTemplates(providerId: string): Promise<{
        id: string;
        providerId: string;
        name: string;
        type: string;
        description: string | null;
        content: string;
        details: Prisma.JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getTemplate(id: string, providerId: string): Promise<{
        id: string;
        providerId: string;
        name: string;
        type: string;
        description: string | null;
        content: string;
        details: Prisma.JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createTemplate(providerId: string, dto: CreateTemplateDto): Promise<{
        id: string;
        providerId: string;
        name: string;
        type: string;
        description: string | null;
        content: string;
        details: Prisma.JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateTemplate(id: string, providerId: string, dto: UpdateTemplateDto): Promise<{
        id: string;
        providerId: string;
        name: string;
        type: string;
        description: string | null;
        content: string;
        details: Prisma.JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteTemplate(id: string, providerId: string): Promise<void>;
}
