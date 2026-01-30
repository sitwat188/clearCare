import { ComplianceService } from './compliance.service';
import { CreateComplianceDto } from './dto/create-compliance.dto';
import { UpdateComplianceDto } from './dto/update-compliance.dto';
import { UpdateMedicationAdherenceDto } from './dto/update-medication-adherence.dto';
import { UpdateLifestyleComplianceDto } from './dto/update-lifestyle-compliance.dto';
export declare class ComplianceController {
    private readonly complianceService;
    constructor(complianceService: ComplianceService);
    createComplianceRecord(createDto: CreateComplianceDto, requestingUserId: string, requestingUserRole: string): Promise<{
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
    getComplianceRecords(requestingUserId: string, requestingUserRole: string, instructionId?: string, patientId?: string, type?: string): Promise<({
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
    getComplianceRecord(recordId: string, requestingUserId: string, requestingUserRole: string): Promise<{
        instruction: {
            patient: {
                id: string;
                deletedAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                medicalRecordNumber: string;
                dateOfBirth: string;
                phone: string | null;
                addressStreet: string | null;
                addressCity: string | null;
                addressState: string | null;
                addressZipCode: string | null;
                emergencyContactName: string | null;
                emergencyContactRelationship: string | null;
                emergencyContactPhone: string | null;
                assignedProviderIds: string[];
            };
        } & {
            id: string;
            deletedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            providerId: string;
            providerName: string;
            patientId: string;
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
    }>;
    updateComplianceRecord(recordId: string, updateDto: UpdateComplianceDto, requestingUserId: string, requestingUserRole: string): Promise<{
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
    updateMedicationAdherence(recordId: string, updateDto: UpdateMedicationAdherenceDto, requestingUserId: string, requestingUserRole: string): Promise<{
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
    updateLifestyleCompliance(recordId: string, updateDto: UpdateLifestyleComplianceDto, requestingUserId: string, requestingUserRole: string): Promise<{
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
    getComplianceMetrics(requestingUserId: string, requestingUserRole: string, patientId?: string, instructionId?: string): Promise<{
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
}
