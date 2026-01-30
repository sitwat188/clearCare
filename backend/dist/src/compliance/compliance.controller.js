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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceController = void 0;
const common_1 = require("@nestjs/common");
const compliance_service_1 = require("./compliance.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const create_compliance_dto_1 = require("./dto/create-compliance.dto");
const update_compliance_dto_1 = require("./dto/update-compliance.dto");
const update_medication_adherence_dto_1 = require("./dto/update-medication-adherence.dto");
const update_lifestyle_compliance_dto_1 = require("./dto/update-lifestyle-compliance.dto");
let ComplianceController = class ComplianceController {
    complianceService;
    constructor(complianceService) {
        this.complianceService = complianceService;
    }
    async createComplianceRecord(createDto, requestingUserId, requestingUserRole) {
        return this.complianceService.createComplianceRecord(createDto, requestingUserId, requestingUserRole);
    }
    async getComplianceRecords(requestingUserId, requestingUserRole, instructionId, patientId, type) {
        return this.complianceService.getComplianceRecords(requestingUserId, requestingUserRole, {
            instructionId,
            patientId,
            type,
        });
    }
    async getComplianceRecord(recordId, requestingUserId, requestingUserRole) {
        return this.complianceService.getComplianceRecord(recordId, requestingUserId, requestingUserRole);
    }
    async updateComplianceRecord(recordId, updateDto, requestingUserId, requestingUserRole) {
        return this.complianceService.updateComplianceRecord(recordId, updateDto, requestingUserId, requestingUserRole);
    }
    async updateMedicationAdherence(recordId, updateDto, requestingUserId, requestingUserRole) {
        return this.complianceService.updateMedicationAdherence(recordId, updateDto, requestingUserId, requestingUserRole);
    }
    async updateLifestyleCompliance(recordId, updateDto, requestingUserId, requestingUserRole) {
        return this.complianceService.updateLifestyleCompliance(recordId, updateDto, requestingUserId, requestingUserRole);
    }
    async getComplianceMetrics(requestingUserId, requestingUserRole, patientId, instructionId) {
        return this.complianceService.getComplianceMetrics(requestingUserId, requestingUserRole, {
            patientId,
            instructionId,
        });
    }
};
exports.ComplianceController = ComplianceController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_compliance_dto_1.CreateComplianceDto, String, String]),
    __metadata("design:returntype", Promise)
], ComplianceController.prototype, "createComplianceRecord", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(2, (0, common_1.Query)('instructionId')),
    __param(3, (0, common_1.Query)('patientId')),
    __param(4, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ComplianceController.prototype, "getComplianceRecords", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ComplianceController.prototype, "getComplianceRecord", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(3, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_compliance_dto_1.UpdateComplianceDto, String, String]),
    __metadata("design:returntype", Promise)
], ComplianceController.prototype, "updateComplianceRecord", null);
__decorate([
    (0, common_1.Put)(':id/medication'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(3, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_medication_adherence_dto_1.UpdateMedicationAdherenceDto, String, String]),
    __metadata("design:returntype", Promise)
], ComplianceController.prototype, "updateMedicationAdherence", null);
__decorate([
    (0, common_1.Put)(':id/lifestyle'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(3, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_lifestyle_compliance_dto_1.UpdateLifestyleComplianceDto, String, String]),
    __metadata("design:returntype", Promise)
], ComplianceController.prototype, "updateLifestyleCompliance", null);
__decorate([
    (0, common_1.Get)('metrics'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(2, (0, common_1.Query)('patientId')),
    __param(3, (0, common_1.Query)('instructionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], ComplianceController.prototype, "getComplianceMetrics", null);
exports.ComplianceController = ComplianceController = __decorate([
    (0, common_1.Controller)('compliance'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [compliance_service_1.ComplianceService])
], ComplianceController);
//# sourceMappingURL=compliance.controller.js.map