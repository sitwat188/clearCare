import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
export declare class PatientsController {
    private readonly patientsService;
    constructor(patientsService: PatientsService);
    createPatient(createDto: CreatePatientDto, requestingUserId: string, requestingUserRole: string, req: any): Promise<any>;
    getPatients(requestingUserId: string, requestingUserRole: string): Promise<any[]>;
    getPatient(patientId: string, requestingUserId: string, requestingUserRole: string): Promise<any>;
    updatePatient(patientId: string, updateDto: UpdatePatientDto, requestingUserId: string, requestingUserRole: string, req: any): Promise<any>;
}
