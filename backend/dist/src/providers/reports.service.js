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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ReportsService = class ReportsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getReports(providerId) {
        return [];
    }
    async generateReport(providerId, config) {
        const start = new Date(config.dateRange.start);
        const end = new Date(config.dateRange.end);
        const patients = await this.prisma.patient.findMany({
            where: { assignedProviderIds: { has: providerId }, deletedAt: null },
            include: { user: { select: { firstName: true, lastName: true, email: true } } },
        });
        const instructions = await this.prisma.careInstruction.findMany({
            where: {
                providerId,
                deletedAt: null,
                assignedDate: { gte: start, lte: end },
            },
            include: {
                patient: { include: { user: { select: { firstName: true, lastName: true } } } },
            },
        });
        const complianceRecords = await this.prisma.complianceRecord.findMany({
            where: {
                patient: { assignedProviderIds: { has: providerId } },
                updatedAt: { gte: start, lte: end },
            },
            include: {
                instruction: { select: { title: true, type: true } },
                patient: { include: { user: { select: { firstName: true, lastName: true } } } },
            },
        });
        const byPatient = new Map();
        for (const p of patients) {
            byPatient.set(p.id, { instructions: 0, acknowledged: 0, complianceAvg: 0 });
        }
        for (const i of instructions) {
            const entry = byPatient.get(i.patientId);
            if (entry) {
                entry.instructions += 1;
                if (i.acknowledgedDate)
                    entry.acknowledged += 1;
            }
        }
        let totalCompliance = 0;
        let complianceCount = 0;
        for (const c of complianceRecords) {
            totalCompliance += c.overallPercentage;
            complianceCount += 1;
        }
        const avgCompliance = complianceCount > 0 ? totalCompliance / complianceCount : 0;
        const summary = {
            dateRange: config.dateRange,
            totalPatients: patients.length,
            totalInstructions: instructions.length,
            acknowledgedInstructions: instructions.filter((i) => i.acknowledgedDate).length,
            complianceRecordsCount: complianceRecords.length,
            averageCompliancePercent: Math.round(avgCompliance * 10) / 10,
            byPatient: Array.from(byPatient.entries()).map(([patientId, stats]) => ({
                patientId,
                ...stats,
            })),
        };
        return {
            id: `report-${Date.now()}`,
            type: config.type,
            title: `${config.type} Report`,
            description: `Report for ${config.dateRange.start} to ${config.dateRange.end}`,
            generatedAt: new Date().toISOString(),
            generatedBy: providerId,
            dateRange: config.dateRange,
            data: summary,
            format: config.format,
        };
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map