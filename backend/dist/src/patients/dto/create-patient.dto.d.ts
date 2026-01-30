export declare enum Gender {
    MALE = "male",
    FEMALE = "female",
    OTHER = "other",
    PREFER_NOT_TO_SAY = "prefer_not_to_say"
}
export declare class CreatePatientDto {
    userId: string;
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
