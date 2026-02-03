import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, throwError, tap } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

type RequestUser = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
};

function safeJson(value: unknown): unknown {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return undefined;
  }
}

function scrubObject(input: unknown): unknown {
  const sensitiveKey = /password|token|secret|code|otp|twofactor|2fa/i;
  if (!input || typeof input !== 'object') return input;
  if (Array.isArray(input)) return input.map(scrubObject);
  const obj = input as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (sensitiveKey.test(k)) {
      out[k] = '[redacted]';
      continue;
    }
    out[k] = scrubObject(v);
  }
  return out;
}

function inferAction(method: string, path: string): string {
  const p = path.toLowerCase();
  if (p.includes('/auth/login')) return 'login';
  if (p.includes('/auth/logout')) return 'logout';
  if (p.includes('/auth/refresh')) return 'refresh';
  if (p.includes('/auth/forgot-password')) return 'forgot_password';
  if (p.includes('/auth/reset-password')) return 'reset_password';

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

function inferResourceType(path: string): string {
  const cleaned = path.replace(/^\/+/, '');
  // Example: api/v1/admin/audit-logs → admin
  const parts = cleaned.split('?')[0].split('/').filter(Boolean);
  const idx = parts[0] === 'api' && parts[1] === 'v1' ? 2 : 0;
  const first = (parts[idx] || '').toLowerCase();

  if (first === 'patients') return 'patient';
  if (first === 'providers') return 'provider';
  if (first === 'instructions') return 'instruction';
  if (first === 'compliance') return 'compliance';
  if (first === 'notifications') return 'notification';
  if (first === 'users') return 'user';
  if (first === 'admin') return 'admin';
  if (first === 'auth') return 'auth';
  return first || 'unknown';
}

function inferResourceId(
  params: Record<string, unknown> | undefined,
): string | undefined {
  if (!params) return undefined;
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
    if (typeof v === 'string' && v.trim()) return v;
  }
  // fallback: first string param
  for (const v of Object.values(params)) {
    if (typeof v === 'string' && v.trim()) return v;
  }
  return undefined;
}

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req: any = http.getRequest();
    const res: any = http.getResponse();

    // Only log HTTP requests
    if (!req) return next.handle();

    const user = (req.user ?? null) as RequestUser | null;
    // Requirement: log actions by users. We only log authenticated users reliably.
    // Public endpoints (no req.user) are skipped to avoid invalid FK for userId.
    if (!user?.id) return next.handle();

    const path: string = req.originalUrl || req.url || '';
    const method: string = req.method || '';
    const ipAddress: string = req.ip || req.connection?.remoteAddress || '';
    const userAgent: string = req.headers?.['user-agent'] || '';

    const action = inferAction(method, path);
    const resourceType = inferResourceType(path);
    const resourceId = inferResourceId(req.params);
    const userName =
      `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() ||
      user.email ||
      user.id;

    const baseDetails = {
      method: method.toUpperCase(),
      path,
      query: scrubObject(safeJson(req.query)),
      // DO NOT log full bodies (may contain PHI). Log only keys (scrubbed), and only for non-GET.
      body:
        method.toUpperCase() === 'GET'
          ? undefined
          : scrubObject(safeJson(req.body)),
    };

    const writeLog = async (
      status: 'success' | 'failure' | 'denied',
      errorMessage?: string,
    ) => {
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
            details: detailsPayload as object,
          },
        });
      } catch (err) {
        // Never block the request if audit logging fails; log for debugging.
        console.error('[AuditLog] Failed to write audit log:', err);
      }
    };

    return next.handle().pipe(
      tap(() => {
        const statusCode = res?.statusCode ?? 200;
        const status: 'success' | 'failure' | 'denied' =
          statusCode >= 200 && statusCode < 400
            ? 'success'
            : statusCode === 401 || statusCode === 403
              ? 'denied'
              : 'failure';
        void writeLog(status);
      }),
      catchError((err) => {
        const statusCode =
          err?.status ?? err?.response?.statusCode ?? res?.statusCode;
        const status: 'success' | 'failure' | 'denied' =
          statusCode === 401 || statusCode === 403 ? 'denied' : 'failure';
        void writeLog(status, err?.message ?? String(err));
        return throwError(() => err);
      }),
    );
  }
}
