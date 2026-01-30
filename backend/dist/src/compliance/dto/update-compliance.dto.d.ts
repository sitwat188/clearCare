import { ComplianceStatus } from './create-compliance.dto';
export declare class UpdateComplianceDto {
    status?: ComplianceStatus;
    overallPercentage?: number;
    medicationCompliance?: any;
    lifestyleCompliance?: any;
    appointmentCompliance?: any;
}
