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
exports.UpdateInstructionDto = void 0;
const class_validator_1 = require("class-validator");
const create_instruction_dto_1 = require("./create-instruction.dto");
class UpdateInstructionDto {
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
    status;
    complianceTrackingEnabled;
    lifestyleTrackingEnabled;
}
exports.UpdateInstructionDto = UpdateInstructionDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Title must be a string' }),
    __metadata("design:type", String)
], UpdateInstructionDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(create_instruction_dto_1.InstructionType, { message: 'Type must be a valid instruction type' }),
    __metadata("design:type", String)
], UpdateInstructionDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(create_instruction_dto_1.InstructionPriority, {
        message: 'Priority must be a valid priority level',
    }),
    __metadata("design:type", String)
], UpdateInstructionDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Content must be a string' }),
    __metadata("design:type", String)
], UpdateInstructionDto.prototype, "content", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'Medication details must be an object' }),
    __metadata("design:type", Object)
], UpdateInstructionDto.prototype, "medicationDetails", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'Lifestyle details must be an object' }),
    __metadata("design:type", Object)
], UpdateInstructionDto.prototype, "lifestyleDetails", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'Follow-up details must be an object' }),
    __metadata("design:type", Object)
], UpdateInstructionDto.prototype, "followUpDetails", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'Warning details must be an object' }),
    __metadata("design:type", Object)
], UpdateInstructionDto.prototype, "warningDetails", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Assigned date must be a valid date' }),
    __metadata("design:type", String)
], UpdateInstructionDto.prototype, "assignedDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Acknowledgment deadline must be a valid date' }),
    __metadata("design:type", String)
], UpdateInstructionDto.prototype, "acknowledgmentDeadline", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Expiration date must be a valid date' }),
    __metadata("design:type", String)
], UpdateInstructionDto.prototype, "expirationDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Status must be a string' }),
    __metadata("design:type", String)
], UpdateInstructionDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'Compliance tracking enabled must be a boolean' }),
    __metadata("design:type", Boolean)
], UpdateInstructionDto.prototype, "complianceTrackingEnabled", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'Lifestyle tracking enabled must be a boolean' }),
    __metadata("design:type", Boolean)
], UpdateInstructionDto.prototype, "lifestyleTrackingEnabled", void 0);
//# sourceMappingURL=update-instruction.dto.js.map