import { InstructionsService } from '../instructions/instructions.service';
import { ComplianceService } from '../compliance/compliance.service';
import { UsersService } from '../users/users.service';
import { UpdateProfileDto } from '../users/dto/update-profile.dto';
import { AcknowledgeInstructionDto } from '../instructions/dto/acknowledge-instruction.dto';
import { UpdateComplianceDto } from '../compliance/dto/update-compliance.dto';
export declare class PatientsMeController {
    private readonly instructionsService;
    private readonly complianceService;
    private readonly usersService;
    constructor(instructionsService: InstructionsService, complianceService: ComplianceService, usersService: UsersService);
    getMyInstructions(userId: string, role: string): Promise<({
        acknowledgments: {
            id: string;
            patientId: string;
            instructionId: string;
            acknowledgmentType: string;
            ipAddress: string;
            userAgent: string;
            timestamp: Date;
        }[];
    } & {
        id: string;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        patientId: string;
        providerId: string;
        providerName: string;
        patientName: string;
        title: string;
        type: string;
        status: string;
        priority: string;
        content: string;
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
    getMyInstruction(id: string, userId: string, role: string): Promise<{
        patient: {
            id: string;
            userId: string;
            assignedProviderIds: string[];
        };
        acknowledgments: {
            id: string;
            patientId: string;
            instructionId: string;
            acknowledgmentType: string;
            ipAddress: string;
            userAgent: string;
            timestamp: Date;
        }[];
    } & {
        id: string;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        patientId: string;
        providerId: string;
        providerName: string;
        patientName: string;
        title: string;
        type: string;
        status: string;
        priority: string;
        content: string;
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
    acknowledgeInstruction(id: string, body: AcknowledgeInstructionDto, userId: string, role: string, req: any): Promise<{
        id: string;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        patientId: string;
        providerId: string;
        providerName: string;
        patientName: string;
        title: string;
        type: string;
        status: string;
        priority: string;
        content: string;
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
    getMyCompliance(userId: string, role: string): Promise<({
        instruction: {
            id: string;
            title: string;
            type: string;
            status: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        patientId: string;
        type: string;
        status: string;
        instructionId: string;
        overallPercentage: number;
        medicationAdherence: import("@prisma/client/runtime/library").JsonValue | null;
        lifestyleCompliance: import("@prisma/client/runtime/library").JsonValue | null;
        appointmentCompliance: import("@prisma/client/runtime/library").JsonValue | null;
        lastUpdatedBy: string;
    })[]>;
    getMyComplianceMetrics(userId: string, role: string): Promise<{
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
    updateMyCompliance(recordId: string, body: UpdateComplianceDto, userId: string, role: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        patientId: string;
        type: string;
        status: string;
        instructionId: string;
        overallPercentage: number;
        medicationAdherence: import("@prisma/client/runtime/library").JsonValue | null;
        lifestyleCompliance: import("@prisma/client/runtime/library").JsonValue | null;
        appointmentCompliance: import("@prisma/client/runtime/library").JsonValue | null;
        lastUpdatedBy: string;
    }>;
    getMyProfile(userId: string, role: string): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        twoFactorEnabled: boolean;
        createdAt: Date;
        updatedAt: Date;
        lastLoginAt: Date | null;
    }>;
    updateMyProfile(body: UpdateProfileDto, userId: string, role: string, req: any): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        updatedAt: Date;
    }>;
}
