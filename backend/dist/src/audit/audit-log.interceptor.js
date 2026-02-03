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
exports.AuditLogInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const prisma_service_1 = require("../prisma/prisma.service");
function safeJson(value) {
    try {
        return JSON.parse(JSON.stringify(value));
    }
    catch {
        return undefined;
    }
}
function scrubObject(input) {
    const sensitiveKey = /password|token|secret|code|otp|twofactor|2fa/i;
    if (!input || typeof input !== 'object')
        return input;
    if (Array.isArray(input))
        return input.map(scrubObject);
    const obj = input;
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
        if (sensitiveKey.test(k)) {
            out[k] = '[redacted]';
            continue;
        }
        out[k] = scrubObject(v);
    }
    return out;
}
function inferAction(method, path) {
    const p = path.toLowerCase();
    if (p.includes('/auth/login'))
        return 'login';
    if (p.includes('/auth/logout'))
        return 'logout';
    if (p.includes('/auth/refresh'))
        return 'refresh';
    if (p.includes('/auth/forgot-password'))
        return 'forgot_password';
    if (p.includes('/auth/reset-password'))
        return 'reset_password';
    switch (method.toUpperCase()) {
        case 'GET':
            return 'read';
        case 'POST':
        case 'PUT':
        case 'PATCH':
            return 'write';
        case 'DELETE':
            return 'delete';
        default:
            return method.toLowerCase();
    }
}
function inferResourceType(path) {
    const cleaned = path.replace(/^\/+/, '');
    const parts = cleaned.split('?')[0].split('/').filter(Boolean);
    const idx = parts[0] === 'api' && parts[1] === 'v1' ? 2 : 0;
    const first = (parts[idx] || '').toLowerCase();
    if (first === 'patients')
        return 'patient';
    if (first === 'providers')
        return 'provider';
    if (first === 'instructions')
        return 'instruction';
    if (first === 'compliance')
        return 'compliance';
    if (first === 'notifications')
        return 'notification';
    if (first === 'users')
        return 'user';
    if (first === 'admin')
        return 'admin';
    if (first === 'auth')
        return 'auth';
    return first || 'unknown';
}
function inferResourceId(params) {
    if (!params)
        return undefined;
    const candidates = [
        'id',
        'userId',
        'patientId',
        'instructionId',
        'recordId',
        'notificationId',
    ];
    for (const key of candidates) {
        const v = params[key];
        if (typeof v === 'string' && v.trim())
            return v;
    }
    for (const v of Object.values(params)) {
        if (typeof v === 'string' && v.trim())
            return v;
    }
    return undefined;
}
let AuditLogInterceptor = class AuditLogInterceptor {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    intercept(context, next) {
        const http = context.switchToHttp();
        const req = http.getRequest();
        const res = http.getResponse();
        if (!req)
            return next.handle();
        const user = (req.user ?? null);
        if (!user?.id)
            return next.handle();
        const path = req.originalUrl || req.url || '';
        const method = req.method || '';
        const ipAddress = req.ip || req.connection?.remoteAddress || '';
        const userAgent = req.headers?.['user-agent'] || '';
        const action = inferAction(method, path);
        const resourceType = inferResourceType(path);
        const resourceId = inferResourceId(req.params);
        const userName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() ||
            user.email ||
            user.id;
        const baseDetails = {
            method: method.toUpperCase(),
            path,
            query: scrubObject(safeJson(req.query)),
            body: method.toUpperCase() === 'GET'
                ? undefined
                : scrubObject(safeJson(req.body)),
        };
        const writeLog = async (status, errorMessage) => {
            try {
                const detailsPayload = {
                    ...baseDetails,
                    statusCode: res?.statusCode,
                    error: errorMessage ? String(errorMessage).slice(0, 500) : undefined,
                };
                await this.prisma.auditLog.create({
                    data: {
                        userId: user.id,
                        userEmail: user.email || '',
                        userName,
                        action,
                        resourceType,
                        resourceId: resourceId ?? undefined,
                        resourceName: undefined,
                        ipAddress: ipAddress || 'unknown',
                        userAgent: userAgent || '',
                        status,
                        details: detailsPayload,
                    },
                });
            }
            catch (err) {
                console.error('[AuditLog] Failed to write audit log:', err);
            }
        };
        return next.handle().pipe((0, rxjs_1.tap)(() => {
            const statusCode = res?.statusCode ?? 200;
            const status = statusCode >= 200 && statusCode < 400
                ? 'success'
                : statusCode === 401 || statusCode === 403
                    ? 'denied'
                    : 'failure';
            void writeLog(status);
        }), (0, rxjs_1.catchError)((err) => {
            const statusCode = err?.status ?? err?.response?.statusCode ?? res?.statusCode;
            const status = statusCode === 401 || statusCode === 403 ? 'denied' : 'failure';
            void writeLog(status, err?.message ?? String(err));
            return (0, rxjs_1.throwError)(() => err);
        }));
    }
};
exports.AuditLogInterceptor = AuditLogInterceptor;
exports.AuditLogInterceptor = AuditLogInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditLogInterceptor);
//# sourceMappingURL=audit-log.interceptor.js.map