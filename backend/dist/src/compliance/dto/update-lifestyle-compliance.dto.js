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
exports.UpdateLifestyleComplianceDto = void 0;
const class_validator_1 = require("class-validator");
class UpdateLifestyleComplianceDto {
    date;
    completed;
    notes;
    progress;
    metrics;
}
exports.UpdateLifestyleComplianceDto = UpdateLifestyleComplianceDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Date is required' }),
    (0, class_validator_1.IsDateString)({}, { message: 'Date must be a valid date' }),
    __metadata("design:type", String)
], UpdateLifestyleComplianceDto.prototype, "date", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'Completed must be a boolean' }),
    __metadata("design:type", Boolean)
], UpdateLifestyleComplianceDto.prototype, "completed", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Notes must be a string' }),
    __metadata("design:type", String)
], UpdateLifestyleComplianceDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Progress must be a number' }),
    __metadata("design:type", Number)
], UpdateLifestyleComplianceDto.prototype, "progress", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'Metrics must be an object' }),
    __metadata("design:type", Object)
], UpdateLifestyleComplianceDto.prototype, "metrics", void 0);
//# sourceMappingURL=update-lifestyle-compliance.dto.js.map