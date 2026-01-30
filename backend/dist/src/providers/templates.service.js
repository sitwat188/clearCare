"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplatesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TemplatesService = class TemplatesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getTemplates(providerId) {
        return this.prisma.instructionTemplate.findMany({
            where: { providerId },
            orderBy: { updatedAt: 'desc' },
        });
    }
    async getTemplate(id, providerId) {
        const template = await this.prisma.instructionTemplate.findFirst({
            where: { id, providerId },
        });
        if (!template)
            throw new common_1.NotFoundException('Template not found');
        return template;
    }
    async createTemplate(providerId, dto) {
        return this.prisma.instructionTemplate.create({
            data: {
                providerId,
                name: dto.name,
                type: dto.type,
                description: dto.description ?? null,
                content: dto.content,
                details: (dto.details ?? undefined),
            },
        });
    }
    async updateTemplate(id, providerId, dto) {
        await this.getTemplate(id, providerId);
        return this.prisma.instructionTemplate.update({
            where: { id },
            data: {
                ...(dto.name !== undefined && { name: dto.name }),
                ...(dto.type !== undefined && { type: dto.type }),
                ...(dto.description !== undefined && { description: dto.description }),
                ...(dto.content !== undefined && { content: dto.content }),
                ...(dto.details !== undefined && { details: dto.details }),
            },
        });
    }
    async deleteTemplate(id, providerId) {
        await this.getTemplate(id, providerId);
        await this.prisma.instructionTemplate.delete({
            where: { id },
        });
    }
};
exports.TemplatesService = TemplatesService;
exports.TemplatesService = TemplatesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TemplatesService);
//# sourceMappingURL=templates.service.js.map