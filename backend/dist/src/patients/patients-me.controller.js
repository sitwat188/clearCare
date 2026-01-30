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
exports.PatientsMeController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const instructions_service_1 = require("../instructions/instructions.service");
const compliance_service_1 = require("../compliance/compliance.service");
const users_service_1 = require("../users/users.service");
const update_profile_dto_1 = require("../users/dto/update-profile.dto");
const acknowledge_instruction_dto_1 = require("../instructions/dto/acknowledge-instruction.dto");
const update_compliance_dto_1 = require("../compliance/dto/update-compliance.dto");
let PatientsMeController = class PatientsMeController {
    instructionsService;
    complianceService;
    usersService;
    constructor(instructionsService, complianceService, usersService) {
        this.instructionsService = instructionsService;
        this.complianceService = complianceService;
        this.usersService = usersService;
    }
    async getMyInstructions(userId, role) {
        return this.instructionsService.getInstructions(userId, role, {});
    }
    async getMyInstruction(id, userId, role) {
        return this.instructionsService.getInstruction(id, userId, role);
    }
    async acknowledgeInstruction(id, body, userId, role, req) {
        const ipAddress = req.ip || req.connection?.remoteAddress;
        const userAgent = req.headers['user-agent'];
        return this.instructionsService.acknowledgeInstruction(id, body, userId, role, ipAddress, userAgent);
    }
    async getMyCompliance(userId, role) {
        return this.complianceService.getComplianceRecords(userId, role, {});
    }
    async getMyComplianceMetrics(userId, role) {
        return this.complianceService.getComplianceMetrics(userId, role, {});
    }
    async updateMyCompliance(recordId, body, userId, role) {
        return this.complianceService.updateComplianceRecord(recordId, body, userId, role);
    }
    async getMyProfile(userId, role) {
        return this.usersService.getProfile(userId, userId, role);
    }
    async updateMyProfile(body, userId, role, req) {
        const ipAddress = req.ip || req.connection?.remoteAddress;
        const userAgent = req.headers['user-agent'];
        return this.usersService.updateProfile(userId, body, userId, role, ipAddress, userAgent);
    }
};
exports.PatientsMeController = PatientsMeController;
__decorate([
    (0, common_1.Get)('instructions'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PatientsMeController.prototype, "getMyInstructions", null);
__decorate([
    (0, common_1.Get)('instructions/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], PatientsMeController.prototype, "getMyInstruction", null);
__decorate([
    (0, common_1.Post)('instructions/:id/acknowledge'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(3, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(4, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, acknowledge_instruction_dto_1.AcknowledgeInstructionDto, String, String, Object]),
    __metadata("design:returntype", Promise)
], PatientsMeController.prototype, "acknowledgeInstruction", null);
__decorate([
    (0, common_1.Get)('compliance'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PatientsMeController.prototype, "getMyCompliance", null);
__decorate([
    (0, common_1.Get)('compliance/metrics'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PatientsMeController.prototype, "getMyComplianceMetrics", null);
__decorate([
    (0, common_1.Put)('compliance/:recordId'),
    __param(0, (0, common_1.Param)('recordId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(3, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_compliance_dto_1.UpdateComplianceDto, String, String]),
    __metadata("design:returntype", Promise)
], PatientsMeController.prototype, "updateMyCompliance", null);
__decorate([
    (0, common_1.Get)('profile'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PatientsMeController.prototype, "getMyProfile", null);
__decorate([
    (0, common_1.Put)('profile'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_profile_dto_1.UpdateProfileDto, String, String, Object]),
    __metadata("design:returntype", Promise)
], PatientsMeController.prototype, "updateMyProfile", null);
exports.PatientsMeController = PatientsMeController = __decorate([
    (0, common_1.Controller)('patients/me'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [instructions_service_1.InstructionsService,
        compliance_service_1.ComplianceService,
        users_service_1.UsersService])
], PatientsMeController);
//# sourceMappingURL=patients-me.controller.js.map