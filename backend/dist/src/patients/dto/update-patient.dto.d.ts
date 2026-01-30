import { Gender } from './create-patient.dto';
export declare class UpdatePatientDto {
    dateOfBirth?: string;
    gender?: Gender;
    medicalRecordNumber?: string;
    phone?: string;
    addressStreet?: string;
    addressCity?: string;
    addressState?: string;
    addressZipCode?: string;
    emergencyContact?: string;
    emergencyContactName?: string;
    emergencyContactRelationship?: string;
    emergencyContactPhone?: string;
    assignedProviderIds?: string[];
}
