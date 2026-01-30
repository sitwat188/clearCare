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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const update_profile_dto_1 = require("./dto/update-profile.dto");
let UsersController = class UsersController {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    async getMyProfile(userId, role) {
        return this.usersService.getProfile(userId, userId, role);
    }
    async updateMyProfile(updateDto, userId, role, req) {
        const ipAddress = req.ip || req.connection?.remoteAddress;
        const userAgent = req.headers['user-agent'];
        return this.usersService.updateProfile(userId, updateDto, userId, role, ipAddress, userAgent);
    }
    async getProfile(userId, requestingUserId, requestingUserRole) {
        return this.usersService.getProfile(userId, requestingUserId, requestingUserRole);
    }
    async updateProfile(userId, updateDto, requestingUserId, requestingUserRole, req) {
        const ipAddress = req.ip || req.connection?.remoteAddress;
        const userAgent = req.headers['user-agent'];
        return this.usersService.updateProfile(userId, updateDto, requestingUserId, requestingUserRole, ipAddress, userAgent);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)('me/profile'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getMyProfile", null);
__decorate([
    (0, common_1.Put)('me/profile'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_profile_dto_1.UpdateProfileDto, String, String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateMyProfile", null);
__decorate([
    (0, common_1.Get)(':id/profile'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Put)(':id/profile'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(3, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(4, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_profile_dto_1.UpdateProfileDto, String, String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateProfile", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map