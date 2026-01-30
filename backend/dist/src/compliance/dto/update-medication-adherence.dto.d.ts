export declare enum DoseStatus {
    TAKEN = "taken",
    MISSED = "missed",
    PENDING = "pending"
}
export declare class UpdateMedicationAdherenceDto {
    date: string;
    time?: string;
    status?: DoseStatus;
    reason?: string;
    progress?: number;
}
