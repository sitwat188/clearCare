import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
export declare class PatientsService {
    private prisma;
    constructor(prisma: PrismaService);
    createPatient(createDto: CreatePatientDto, requestingUserId: string, requestingUserRole: string, ipAddress?: string, userAgent?: string): Promise<any>;
    getPatient(patientId: string, requestingUserId: string, requestingUserRole: string): Promise<any>;
    private toPatientResponse;
    getPatients(requestingUserId: string, requestingUserRole: string): Promise<any[]>;
    updatePatient(patientId: string, updateDto: UpdatePatientDto, requestingUserId: string, requestingUserRole: string, ipAddress?: string, userAgent?: string): Promise<any>;
}
