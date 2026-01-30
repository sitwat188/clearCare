import { PrismaService } from '../prisma/prisma.service';
export declare class ReportsService {
    private prisma;
    constructor(prisma: PrismaService);
    getReports(providerId: string): Promise<never[]>;
    generateReport(providerId: string, config: {
        type: string;
        dateRange: {
            start: string;
            end: string;
        };
        format: string;
    }): Promise<{
        id: string;
        type: string;
        title: string;
        description: string;
        generatedAt: string;
        generatedBy: string;
        dateRange: {
            start: string;
            end: string;
        };
        data: {
            dateRange: {
                start: string;
                end: string;
            };
            totalPatients: number;
            totalInstructions: number;
            acknowledgedInstructions: number;
            complianceRecordsCount: number;
            averageCompliancePercent: number;
            byPatient: {
                instructions: number;
                acknowledged: number;
                complianceAvg: number;
                patientId: string;
            }[];
        };
        format: string;
    }>;
}
