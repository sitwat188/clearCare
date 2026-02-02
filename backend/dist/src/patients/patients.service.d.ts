import { EncryptionService } from '../common/encryption/encryption.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
export declare class PatientsService {
    private prisma;
    private encryption;
    constructor(prisma: PrismaService, encryption: EncryptionService);
    createPatient(createDto: CreatePatientDto, requestingUserId: string, requestingUserRole: string, ipAddress?: string, userAgent?: string): Promise<any>;
    getPatient(patientId: string, requestingUserId: string, requestingUserRole: string): Promise<any>;
    private toPatientResponse;
    getPatients(requestingUserId: string, requestingUserRole: string): Promise<any[]>;
    updatePatient(patientId: string, updateDto: UpdatePatientDto, requestingUserId: string, requestingUserRole: string, ipAddress?: string, userAgent?: string): Promise<any>;
}
