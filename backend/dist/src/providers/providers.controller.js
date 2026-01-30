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
exports.ProvidersController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const patients_service_1 = require("../patients/patients.service");
const compliance_service_1 = require("../compliance/compliance.service");
const instructions_service_1 = require("../instructions/instructions.service");
const templates_service_1 = require("./templates.service");
const reports_service_1 = require("./reports.service");
const create_instruction_dto_1 = require("../instructions/dto/create-instruction.dto");
const update_instruction_dto_1 = require("../instructions/dto/update-instruction.dto");
const create_template_dto_1 = require("./dto/create-template.dto");
const update_template_dto_1 = require("./dto/update-template.dto");
let ProvidersController = class ProvidersController {
    patientsService;
    complianceService;
    instructionsService;
    templatesService;
    reportsService;
    constructor(patientsService, complianceService, instructionsService, templatesService, reportsService) {
        this.patientsService = patientsService;
        this.complianceService = complianceService;
        this.instructionsService = instructionsService;
        this.templatesService = templatesService;
        this.reportsService = reportsService;
    }
    async getReports(userId, role) {
        if (role !== 'provider')
            return [];
        return this.reportsService.getReports(userId);
    }
    async generateReport(userId, body) {
        return this.reportsService.generateReport(userId, body);
    }
    async getTemplates(userId, role) {
        if (role !== 'provider')
            return [];
        return this.templatesService.getTemplates(userId);
    }
    async createTemplate(userId, dto) {
        return this.templatesService.createTemplate(userId, dto);
    }
    async getTemplate(id, userId) {
        return this.templatesService.getTemplate(id, userId);
    }
    async updateTemplate(id, userId, dto) {
        return this.templatesService.updateTemplate(id, userId, dto);
    }
    async deleteTemplate(id, userId) {
        await this.templatesService.deleteTemplate(id, userId);
    }
    async getInstructions(userId, role) {
        return this.instructionsService.getInstructions(userId, role, {});
    }
    async getInstruction(id, userId, role) {
        return this.instructionsService.getInstruction(id, userId, role);
    }
    async createInstruction(body, userId, role, req) {
        const ipAddress = req.ip || req.connection?.remoteAddress;
        const userAgent = req.headers['user-agent'];
        return this.instructionsService.createInstruction(body, userId, role, ipAddress, userAgent);
    }
    async updateInstruction(id, body, userId, role, req) {
        const ipAddress = req.ip || req.connection?.remoteAddress;
        const userAgent = req.headers['user-agent'];
        return this.instructionsService.updateInstruction(id, body, userId, role, ipAddress, userAgent);
    }
    async deleteInstruction(id, userId, role, req) {
        const ipAddress = req.ip || req.connection?.remoteAddress;
        const userAgent = req.headers['user-agent'];
        return this.instructionsService.deleteInstruction(id, userId, role, ipAddress, userAgent);
    }
    async getPatients(userId, role) {
        return this.patientsService.getPatients(userId, role);
    }
    async getPatientComplianceMetrics(patientId, userId, role) {
        return this.complianceService.getComplianceMetrics(userId, role, {
            patientId,
        });
    }
    async getPatientCompliance(patientId, userId, role) {
        return this.complianceService.getComplianceRecords(userId, role, {
            patientId,
        });
    }
    async getPatient(id, userId, role) {
        return this.patientsService.getPatient(id, userId, role);
    }
};
exports.ProvidersController = ProvidersController;
__decorate([
    (0, common_1.Get)('reports'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProvidersController.prototype, "getReports", null);
__decorate([
    (0, common_1.Post)('reports'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProvidersController.prototype, "generateReport", null);
__decorate([
    (0, common_1.Get)('templates'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProvidersController.prototype, "getTemplates", null);
__decorate([
    (0, common_1.Post)('templates'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_template_dto_1.CreateTemplateDto]),
    __metadata("design:returntype", Promise)
], ProvidersController.prototype, "createTemplate", null);
__decorate([
    (0, common_1.Get)('templates/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProvidersController.prototype, "getTemplate", null);
__decorate([
    (0, common_1.Put)('templates/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_template_dto_1.UpdateTemplateDto]),
    __metadata("design:returntype", Promise)
], ProvidersController.prototype, "updateTemplate", null);
__decorate([
    (0, common_1.Delete)('templates/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProvidersController.prototype, "deleteTemplate", null);
__decorate([
    (0, common_1.Get)('instructions'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProvidersController.prototype, "getInstructions", null);
__decorate([
    (0, common_1.Get)('instructions/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ProvidersController.prototype, "getInstruction", null);
__decorate([
    (0, common_1.Post)('instructions'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_instruction_dto_1.CreateInstructionDto, String, String, Object]),
    __metadata("design:returntype", Promise)
], ProvidersController.prototype, "createInstruction", null);
__decorate([
    (0, common_1.Put)('instructions/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(3, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(4, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_instruction_dto_1.UpdateInstructionDto, String, String, Object]),
    __metadata("design:returntype", Promise)
], ProvidersController.prototype, "updateInstruction", null);
__decorate([
    (0, common_1.Delete)('instructions/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ProvidersController.prototype, "deleteInstruction", null);
__decorate([
    (0, common_1.Get)('patients'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProvidersController.prototype, "getPatients", null);
__decorate([
    (0, common_1.Get)('patients/:patientId/compliance/metrics'),
    __param(0, (0, common_1.Param)('patientId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ProvidersController.prototype, "getPatientComplianceMetrics", null);
__decorate([
    (0, common_1.Get)('patients/:patientId/compliance'),
    __param(0, (0, common_1.Param)('patientId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ProvidersController.prototype, "getPatientCompliance", null);
__decorate([
    (0, common_1.Get)('patients/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ProvidersController.prototype, "getPatient", null);
exports.ProvidersController = ProvidersController = __decorate([
    (0, common_1.Controller)('providers'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('provider'),
    __metadata("design:paramtypes", [patients_service_1.PatientsService,
        compliance_service_1.ComplianceService,
        instructions_service_1.InstructionsService,
        templates_service_1.TemplatesService,
        reports_service_1.ReportsService])
], ProvidersController);
//# sourceMappingURL=providers.controller.js.map