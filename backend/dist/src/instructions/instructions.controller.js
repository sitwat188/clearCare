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
exports.InstructionsController = void 0;
const common_1 = require("@nestjs/common");
const instructions_service_1 = require("./instructions.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const create_instruction_dto_1 = require("./dto/create-instruction.dto");
const update_instruction_dto_1 = require("./dto/update-instruction.dto");
const acknowledge_instruction_dto_1 = require("./dto/acknowledge-instruction.dto");
let InstructionsController = class InstructionsController {
    instructionsService;
    constructor(instructionsService) {
        this.instructionsService = instructionsService;
    }
    async createInstruction(createDto, requestingUserId, requestingUserRole, req) {
        const ipAddress = req.ip || req.connection?.remoteAddress;
        const userAgent = req.headers['user-agent'];
        return this.instructionsService.createInstruction(createDto, requestingUserId, requestingUserRole, ipAddress, userAgent);
    }
    async getInstructions(requestingUserId, requestingUserRole, patientId, status, type) {
        return this.instructionsService.getInstructions(requestingUserId, requestingUserRole, {
            patientId,
            status,
            type,
        });
    }
    async getInstruction(instructionId, requestingUserId, requestingUserRole) {
        return this.instructionsService.getInstruction(instructionId, requestingUserId, requestingUserRole);
    }
    async updateInstruction(instructionId, updateDto, requestingUserId, requestingUserRole, req) {
        const ipAddress = req.ip || req.connection?.remoteAddress;
        const userAgent = req.headers['user-agent'];
        return this.instructionsService.updateInstruction(instructionId, updateDto, requestingUserId, requestingUserRole, ipAddress, userAgent);
    }
    async deleteInstruction(instructionId, requestingUserId, requestingUserRole, req) {
        const ipAddress = req.ip || req.connection?.remoteAddress;
        const userAgent = req.headers['user-agent'];
        return this.instructionsService.deleteInstruction(instructionId, requestingUserId, requestingUserRole, ipAddress, userAgent);
    }
    async acknowledgeInstruction(instructionId, acknowledgeDto, requestingUserId, requestingUserRole, req) {
        const ipAddress = req.ip || req.connection?.remoteAddress;
        const userAgent = req.headers['user-agent'];
        return this.instructionsService.acknowledgeInstruction(instructionId, acknowledgeDto, requestingUserId, requestingUserRole, ipAddress, userAgent);
    }
};
exports.InstructionsController = InstructionsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_instruction_dto_1.CreateInstructionDto, String, String, Object]),
    __metadata("design:returntype", Promise)
], InstructionsController.prototype, "createInstruction", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(2, (0, common_1.Query)('patientId')),
    __param(3, (0, common_1.Query)('status')),
    __param(4, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], InstructionsController.prototype, "getInstructions", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], InstructionsController.prototype, "getInstruction", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(3, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(4, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_instruction_dto_1.UpdateInstructionDto, String, String, Object]),
    __metadata("design:returntype", Promise)
], InstructionsController.prototype, "updateInstruction", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], InstructionsController.prototype, "deleteInstruction", null);
__decorate([
    (0, common_1.Post)(':id/acknowledge'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(3, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(4, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, acknowledge_instruction_dto_1.AcknowledgeInstructionDto, String, String, Object]),
    __metadata("design:returntype", Promise)
], InstructionsController.prototype, "acknowledgeInstruction", null);
exports.InstructionsController = InstructionsController = __decorate([
    (0, common_1.Controller)('instructions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [instructions_service_1.InstructionsService])
], InstructionsController);
//# sourceMappingURL=instructions.controller.js.map