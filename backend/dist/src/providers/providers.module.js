"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProvidersModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../prisma/prisma.module");
const roles_guard_1 = require("../auth/guards/roles.guard");
const providers_controller_1 = require("./providers.controller");
const patients_module_1 = require("../patients/patients.module");
const compliance_module_1 = require("../compliance/compliance.module");
const instructions_module_1 = require("../instructions/instructions.module");
const templates_service_1 = require("./templates.service");
const reports_service_1 = require("./reports.service");
let ProvidersModule = class ProvidersModule {
};
exports.ProvidersModule = ProvidersModule;
exports.ProvidersModule = ProvidersModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, patients_module_1.PatientsModule, compliance_module_1.ComplianceModule, instructions_module_1.InstructionsModule],
        controllers: [providers_controller_1.ProvidersController],
        providers: [templates_service_1.TemplatesService, reports_service_1.ReportsService, roles_guard_1.RolesGuard],
    })
], ProvidersModule);
//# sourceMappingURL=providers.module.js.map