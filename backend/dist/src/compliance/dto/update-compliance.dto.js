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
exports.UpdateComplianceDto = void 0;
const class_validator_1 = require("class-validator");
const create_compliance_dto_1 = require("./create-compliance.dto");
class UpdateComplianceDto {
    status;
    overallPercentage;
    medicationCompliance;
    lifestyleCompliance;
    appointmentCompliance;
}
exports.UpdateComplianceDto = UpdateComplianceDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(create_compliance_dto_1.ComplianceStatus, {
        message: 'Status must be a valid compliance status',
    }),
    __metadata("design:type", String)
], UpdateComplianceDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Overall percentage must be a number' }),
    __metadata("design:type", Number)
], UpdateComplianceDto.prototype, "overallPercentage", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'Medication compliance data must be an object' }),
    __metadata("design:type", Object)
], UpdateComplianceDto.prototype, "medicationCompliance", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'Lifestyle compliance data must be an object' }),
    __metadata("design:type", Object)
], UpdateComplianceDto.prototype, "lifestyleCompliance", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'Appointment compliance data must be an object' }),
    __metadata("design:type", Object)
], UpdateComplianceDto.prototype, "appointmentCompliance", void 0);
//# sourceMappingURL=update-compliance.dto.js.map