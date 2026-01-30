"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientsModule = void 0;
const common_1 = require("@nestjs/common");
const patients_controller_1 = require("./patients.controller");
const patients_me_controller_1 = require("./patients-me.controller");
const patients_service_1 = require("./patients.service");
const prisma_module_1 = require("../prisma/prisma.module");
const instructions_module_1 = require("../instructions/instructions.module");
const compliance_module_1 = require("../compliance/compliance.module");
const users_module_1 = require("../users/users.module");
let PatientsModule = class PatientsModule {
};
exports.PatientsModule = PatientsModule;
exports.PatientsModule = PatientsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, instructions_module_1.InstructionsModule, compliance_module_1.ComplianceModule, users_module_1.UsersModule],
        controllers: [patients_controller_1.PatientsController, patients_me_controller_1.PatientsMeController],
        providers: [patients_service_1.PatientsService],
        exports: [patients_service_1.PatientsService],
    })
], PatientsModule);
//# sourceMappingURL=patients.module.js.map