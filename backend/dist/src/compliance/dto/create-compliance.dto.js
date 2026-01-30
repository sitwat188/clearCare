"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateComplianceDto = exports.ComplianceStatus = exports.ComplianceType = void 0;
const class_validator_1 = require("class-validator");
var ComplianceType;
(function (ComplianceType) {
    ComplianceType["MEDICATION"] = "medication";
    ComplianceType["LIFESTYLE"] = "lifestyle";
    ComplianceType["APPOINTMENT"] = "appointment";
})(ComplianceType || (exports.ComplianceType = ComplianceType = {}));
var ComplianceStatus;
(function (ComplianceStatus) {
    ComplianceStatus["COMPLIANT"] = "compliant";
    ComplianceStatus["NON_COMPLIANT"] = "non-compliant";
    ComplianceStatus["PARTIAL"] = "partial";
    ComplianceStatus["NOT_STARTED"] = "not-started";
})(ComplianceStatus || (exports.ComplianceStatus = ComplianceStatus = {}));
class CreateComplianceDto {
    instructionId;
    type;
    status;
    overallPercentage;
    medicationCompliance;
    lifestyleCompliance;
    appointmentCompliance;
}
exports.CreateComplianceDto = CreateComplianceDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Instruction ID is required' }),
    (0, class_validator_1.IsString)({ message: 'Instruction ID must be a string' }),
    __metadata("design:type", String)
], CreateComplianceDto.prototype, "instructionId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Type is required' }),
    (0, class_validator_1.IsEnum)(ComplianceType, {
        message: 'Type must be medication, lifestyle, or appointment',
    }),
    __metadata("design:type", String)
], CreateComplianceDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(ComplianceStatus, {
        message: 'Status must be a valid compliance status',
    }),
    __metadata("design:type", String)
], CreateComplianceDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Overall percentage must be a number' }),
    __metadata("design:type", Number)
], CreateComplianceDto.prototype, "overallPercentage", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'Medication compliance data must be an object' }),
    __metadata("design:type", Object)
], CreateComplianceDto.prototype, "medicationCompliance", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'Lifestyle compliance data must be an object' }),
    __metadata("design:type", Object)
], CreateComplianceDto.prototype, "lifestyleCompliance", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'Appointment compliance data must be an object' }),
    __metadata("design:type", Object)
], CreateComplianceDto.prototype, "appointmentCompliance", void 0);
//# sourceMappingURL=create-compliance.dto.js.map