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
exports.CreateInstructionDto = exports.InstructionPriority = exports.InstructionType = void 0;
const class_validator_1 = require("class-validator");
var InstructionType;
(function (InstructionType) {
    InstructionType["MEDICATION"] = "medication";
    InstructionType["LIFESTYLE"] = "lifestyle";
    InstructionType["FOLLOW_UP"] = "follow-up";
    InstructionType["WARNING"] = "warning";
})(InstructionType || (exports.InstructionType = InstructionType = {}));
var InstructionPriority;
(function (InstructionPriority) {
    InstructionPriority["LOW"] = "low";
    InstructionPriority["MEDIUM"] = "medium";
    InstructionPriority["HIGH"] = "high";
    InstructionPriority["URGENT"] = "urgent";
})(InstructionPriority || (exports.InstructionPriority = InstructionPriority = {}));
class CreateInstructionDto {
    patientId;
    title;
    type;
    priority;
    content;
    medicationDetails;
    lifestyleDetails;
    followUpDetails;
    warningDetails;
    assignedDate;
    acknowledgmentDeadline;
    expirationDate;
    complianceTrackingEnabled;
    lifestyleTrackingEnabled;
}
exports.CreateInstructionDto = CreateInstructionDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Patient ID is required' }),
    (0, class_validator_1.IsString)({ message: 'Patient ID must be a string' }),
    __metadata("design:type", String)
], CreateInstructionDto.prototype, "patientId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Title is required' }),
    (0, class_validator_1.IsString)({ message: 'Title must be a string' }),
    __metadata("design:type", String)
], CreateInstructionDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Type is required' }),
    (0, class_validator_1.IsEnum)(InstructionType, { message: 'Type must be a valid instruction type' }),
    __metadata("design:type", String)
], CreateInstructionDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(InstructionPriority, {
        message: 'Priority must be a valid priority level',
    }),
    __metadata("design:type", String)
], CreateInstructionDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Content is required' }),
    (0, class_validator_1.IsString)({ message: 'Content must be a string' }),
    __metadata("design:type", String)
], CreateInstructionDto.prototype, "content", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'Medication details must be an object' }),
    __metadata("design:type", Object)
], CreateInstructionDto.prototype, "medicationDetails", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'Lifestyle details must be an object' }),
    __metadata("design:type", Object)
], CreateInstructionDto.prototype, "lifestyleDetails", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'Follow-up details must be an object' }),
    __metadata("design:type", Object)
], CreateInstructionDto.prototype, "followUpDetails", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'Warning details must be an object' }),
    __metadata("design:type", Object)
], CreateInstructionDto.prototype, "warningDetails", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Assigned date must be a valid date' }),
    __metadata("design:type", String)
], CreateInstructionDto.prototype, "assignedDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Acknowledgment deadline must be a valid date' }),
    __metadata("design:type", String)
], CreateInstructionDto.prototype, "acknowledgmentDeadline", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Expiration date must be a valid date' }),
    __metadata("design:type", String)
], CreateInstructionDto.prototype, "expirationDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'Compliance tracking enabled must be a boolean' }),
    __metadata("design:type", Boolean)
], CreateInstructionDto.prototype, "complianceTrackingEnabled", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'Lifestyle tracking enabled must be a boolean' }),
    __metadata("design:type", Boolean)
], CreateInstructionDto.prototype, "lifestyleTrackingEnabled", void 0);
//# sourceMappingURL=create-instruction.dto.js.map