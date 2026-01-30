"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstructionsModule = void 0;
const common_1 = require("@nestjs/common");
const instructions_controller_1 = require("./instructions.controller");
const instructions_service_1 = require("./instructions.service");
const prisma_module_1 = require("../prisma/prisma.module");
let InstructionsModule = class InstructionsModule {
};
exports.InstructionsModule = InstructionsModule;
exports.InstructionsModule = InstructionsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [instructions_controller_1.InstructionsController],
        providers: [instructions_service_1.InstructionsService],
        exports: [instructions_service_1.InstructionsService],
    })
], InstructionsModule);
//# sourceMappingURL=instructions.module.js.map