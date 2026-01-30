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
exports.AcknowledgeInstructionDto = exports.AcknowledgmentType = void 0;
const class_validator_1 = require("class-validator");
var AcknowledgmentType;
(function (AcknowledgmentType) {
    AcknowledgmentType["RECEIPT"] = "receipt";
    AcknowledgmentType["UNDERSTANDING"] = "understanding";
    AcknowledgmentType["COMMITMENT"] = "commitment";
})(AcknowledgmentType || (exports.AcknowledgmentType = AcknowledgmentType = {}));
class AcknowledgeInstructionDto {
    acknowledgmentType;
}
exports.AcknowledgeInstructionDto = AcknowledgeInstructionDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Acknowledgment type is required' }),
    (0, class_validator_1.IsEnum)(AcknowledgmentType, {
        message: 'Acknowledgment type must be receipt, understanding, or commitment',
    }),
    __metadata("design:type", String)
], AcknowledgeInstructionDto.prototype, "acknowledgmentType", void 0);
//# sourceMappingURL=acknowledge-instruction.dto.js.map