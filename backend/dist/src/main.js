"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const response_wrapper_interceptor_1 = require("./common/response-wrapper.interceptor");
function getCorsOrigin() {
    const origins = process.env.CORS_ORIGINS;
    if (origins && origins.trim()) {
        return origins
            .split(',')
            .map((o) => o.trim())
            .filter(Boolean);
    }
    return process.env.FRONTEND_URL || 'http://localhost:5173';
}
async function bootstrap() {
    if (process.env.NODE_ENV === 'production') {
        if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
            throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be set in production. See .env.example.');
        }
    }
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalInterceptors(new response_wrapper_interceptor_1.ResponseWrapperInterceptor());
    app.enableCors({
        origin: getCorsOrigin(),
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`🚀 Application is running on: http://localhost:${port}/api/v1`);
}
bootstrap();
//# sourceMappingURL=main.js.map