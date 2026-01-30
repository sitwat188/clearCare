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
exports.UpdateMedicationAdherenceDto = exports.DoseStatus = void 0;
const class_validator_1 = require("class-validator");
var DoseStatus;
(function (DoseStatus) {
    DoseStatus["TAKEN"] = "taken";
    DoseStatus["MISSED"] = "missed";
    DoseStatus["PENDING"] = "pending";
})(DoseStatus || (exports.DoseStatus = DoseStatus = {}));
class UpdateMedicationAdherenceDto {
    date;
    time;
    status;
    reason;
    progress;
}
exports.UpdateMedicationAdherenceDto = UpdateMedicationAdherenceDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Date is required' }),
    (0, class_validator_1.IsDateString)({}, { message: 'Date must be a valid date' }),
    __metadata("design:type", String)
], UpdateMedicationAdherenceDto.prototype, "date", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Time must be a string' }),
    __metadata("design:type", String)
], UpdateMedicationAdherenceDto.prototype, "time", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(DoseStatus, { message: 'Status must be taken, missed, or pending' }),
    __metadata("design:type", String)
], UpdateMedicationAdherenceDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Reason must be a string' }),
    __metadata("design:type", String)
], UpdateMedicationAdherenceDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Progress must be a number' }),
    __metadata("design:type", Number)
], UpdateMedicationAdherenceDto.prototype, "progress", void 0);
//# sourceMappingURL=update-medication-adherence.dto.js.map