export declare enum AcknowledgmentType {
    RECEIPT = "receipt",
    UNDERSTANDING = "understanding",
    COMMITMENT = "commitment"
}
export declare class AcknowledgeInstructionDto {
    acknowledgmentType: AcknowledgmentType;
}
