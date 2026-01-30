import { PatientsService } from '../patients/patients.service';
import { ComplianceService } from '../compliance/compliance.service';
import { InstructionsService } from '../instructions/instructions.service';
import { TemplatesService } from './templates.service';
import { ReportsService } from './reports.service';
import { CreateInstructionDto } from '../instructions/dto/create-instruction.dto';
import { UpdateInstructionDto } from '../instructions/dto/update-instruction.dto';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
export declare class ProvidersController {
    private readonly patientsService;
    private readonly complianceService;
    private readonly instructionsService;
    private readonly templatesService;
    private readonly reportsService;
    constructor(patientsService: PatientsService, complianceService: ComplianceService, instructionsService: InstructionsService, templatesService: TemplatesService, reportsService: ReportsService);
    getReports(userId: string, role: string): Promise<never[]>;
    generateReport(userId: string, body: {
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
    getTemplates(userId: string, role: string): Promise<{
        id: string;
        providerId: string;
        name: string;
        type: string;
        description: string | null;
        content: string;
        details: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    createTemplate(userId: string, dto: CreateTemplateDto): Promise<{
        id: string;
        providerId: string;
        name: string;
        type: string;
        description: string | null;
        content: string;
        details: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getTemplate(id: string, userId: string): Promise<{
        id: string;
        providerId: string;
        name: string;
        type: string;
        description: string | null;
        content: string;
        details: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateTemplate(id: string, userId: string, dto: UpdateTemplateDto): Promise<{
        id: string;
        providerId: string;
        name: string;
        type: string;
        description: string | null;
        content: string;
        details: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteTemplate(id: string, userId: string): Promise<void>;
    getInstructions(userId: string, role: string): Promise<({
        acknowledgments: {
            id: string;
            patientId: string;
            instructionId: string;
            timestamp: Date;
            acknowledgmentType: string;
            ipAddress: string;
            userAgent: string;
        }[];
    } & {
        id: string;
        providerId: string;
        type: string;
        content: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        providerName: string;
        patientId: string;
        patientName: string;
        title: string;
        status: string;
        priority: string;
        medicationDetails: import("@prisma/client/runtime/library").JsonValue | null;
        lifestyleDetails: import("@prisma/client/runtime/library").JsonValue | null;
        followUpDetails: import("@prisma/client/runtime/library").JsonValue | null;
        warningDetails: import("@prisma/client/runtime/library").JsonValue | null;
        assignedDate: Date;
        acknowledgmentDeadline: Date | null;
        acknowledgedDate: Date | null;
        expirationDate: Date | null;
        complianceTrackingEnabled: boolean;
        lifestyleTrackingEnabled: boolean;
        version: number;
    })[]>;
    getInstruction(id: string, userId: string, role: string): Promise<{
        patient: {
            id: string;
            userId: string;
            assignedProviderIds: string[];
        };
        acknowledgments: {
            id: string;
            patientId: string;
            instructionId: string;
            timestamp: Date;
            acknowledgmentType: string;
            ipAddress: string;
            userAgent: string;
        }[];
    } & {
        id: string;
        providerId: string;
        type: string;
        content: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        providerName: string;
        patientId: string;
        patientName: string;
        title: string;
        status: string;
        priority: string;
        medicationDetails: import("@prisma/client/runtime/library").JsonValue | null;
        lifestyleDetails: import("@prisma/client/runtime/library").JsonValue | null;
        followUpDetails: import("@prisma/client/runtime/library").JsonValue | null;
        warningDetails: import("@prisma/client/runtime/library").JsonValue | null;
        assignedDate: Date;
        acknowledgmentDeadline: Date | null;
        acknowledgedDate: Date | null;
        expirationDate: Date | null;
        complianceTrackingEnabled: boolean;
        lifestyleTrackingEnabled: boolean;
        version: number;
    }>;
    createInstruction(body: CreateInstructionDto, userId: string, role: string, req: any): Promise<{
        id: string;
        providerId: string;
        type: string;
        content: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        providerName: string;
        patientId: string;
        patientName: string;
        title: string;
        status: string;
        priority: string;
        medicationDetails: import("@prisma/client/runtime/library").JsonValue | null;
        lifestyleDetails: import("@prisma/client/runtime/library").JsonValue | null;
        followUpDetails: import("@prisma/client/runtime/library").JsonValue | null;
        warningDetails: import("@prisma/client/runtime/library").JsonValue | null;
        assignedDate: Date;
        acknowledgmentDeadline: Date | null;
        acknowledgedDate: Date | null;
        expirationDate: Date | null;
        complianceTrackingEnabled: boolean;
        lifestyleTrackingEnabled: boolean;
        version: number;
    }>;
    updateInstruction(id: string, body: UpdateInstructionDto, userId: string, role: string, req: any): Promise<{
        id: string;
        providerId: string;
        type: string;
        content: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        providerName: string;
        patientId: string;
        patientName: string;
        title: string;
        status: string;
        priority: string;
        medicationDetails: import("@prisma/client/runtime/library").JsonValue | null;
        lifestyleDetails: import("@prisma/client/runtime/library").JsonValue | null;
        followUpDetails: import("@prisma/client/runtime/library").JsonValue | null;
        warningDetails: import("@prisma/client/runtime/library").JsonValue | null;
        assignedDate: Date;
        acknowledgmentDeadline: Date | null;
        acknowledgedDate: Date | null;
        expirationDate: Date | null;
        complianceTrackingEnabled: boolean;
        lifestyleTrackingEnabled: boolean;
        version: number;
    }>;
    deleteInstruction(id: string, userId: string, role: string, req: any): Promise<{
        message: string;
    }>;
    getPatients(userId: string, role: string): Promise<any[]>;
    getPatientComplianceMetrics(patientId: string, userId: string, role: string): Promise<{
        patientId: string;
        overallScore: number;
        medicationAdherence: number;
        lifestyleCompliance: number;
        appointmentCompliance: number;
        activeInstructions: number;
        compliantInstructions: number;
        trends: {
            date: string;
            score: number;
        }[];
    }>;
    getPatientCompliance(patientId: string, userId: string, role: string): Promise<({
        instruction: {
            id: string;
            type: string;
            title: string;
            status: string;
        };
    } & {
        id: string;
        type: string;
        createdAt: Date;
        updatedAt: Date;
        patientId: string;
        status: string;
        instructionId: string;
        overallPercentage: number;
        medicationAdherence: import("@prisma/client/runtime/library").JsonValue | null;
        lifestyleCompliance: import("@prisma/client/runtime/library").JsonValue | null;
        appointmentCompliance: import("@prisma/client/runtime/library").JsonValue | null;
        lastUpdatedBy: string;
    })[]>;
    getPatient(id: string, userId: string, role: string): Promise<any>;
}
