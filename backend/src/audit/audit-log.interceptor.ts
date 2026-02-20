import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Request, Response } from 'express';
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

/** Keys that must never be stored in audit (credentials, secrets). */
const SENSITIVE_KEY = /password|token|secret|code|otp|twofactor|2fa/i;
/** PHI/PII field names – redact values in audit details. */
const PHI_KEY =
  /dateofbirth|medicalrecordnumber|phone|address|emergencycontact|content|medicationdetails|lifestyledetails|followupdetails|warningdetails|firstname|lastname|email/i;

function scrubObject(input: unknown): unknown {
  if (!input || typeof input !== 'object') return input;
  if (Array.isArray(input)) return input.map(scrubObject);
  const obj = input as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const keyLower = k.toLowerCase().replace(/_/g, '');
    if (SENSITIVE_KEY.test(k)) {
      out[k] = '[redacted]';
      continue;
    }
    if (PHI_KEY.test(keyLower)) {
      out[k] = '[PHI]';
      continue;
    }
    out[k] = scrubObject(v);
  }
  return out;
}

/** Resource types that may contain PHI – do not store request body in audit details. */
const PHI_RESOURCE_TYPES = new Set(['patient', 'instruction', 'compliance', 'user']);

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

/** Path segment that looks like an ID (UUID, hex, or long opaque string). */
const ID_LIKE = /^[0-9a-zA-Z_-]{8,}$/;
/** Path segments that are route names, not IDs. */
const NOT_IDS = new Set([
  'by-user',
  'audit-logs',
  'me',
  'login',
  'logout',
  'refresh',
  'forgot-password',
  'reset-password',
]);

function inferResourceId(params: Record<string, unknown> | undefined, path: string): string | undefined {
  const candidates = ['id', 'userId', 'patientId', 'instructionId', 'recordId', 'notificationId'];
  if (params && typeof params === 'object') {
    for (const key of candidates) {
      const v = params[key];
      if (typeof v === 'string' && v.trim()) return v;
    }
    for (const v of Object.values(params)) {
      if (typeof v === 'string' && v.trim()) return v;
    }
  }

  // Fallback: extract from path (req.params is often empty in global interceptor)
  const cleaned = path.replace(/^\/+/, '').split('?')[0];
  const parts = cleaned.split('/').filter(Boolean);
  const skip = parts[0] === 'api' && parts[1] === 'v1' ? 2 : 0;
  const rest = parts.slice(skip);
  if (rest.length < 2) return undefined;
  const last = rest[rest.length - 1];
  if (typeof last !== 'string' || NOT_IDS.has(last.toLowerCase())) return undefined;
  if (ID_LIKE.test(last)) return last;
  return undefined;
}

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request & { user?: RequestUser }>();
    const res = http.getResponse<Response>();

    // Only log HTTP requests
    if (!req) return next.handle();

    const user = (req.user ?? null) as RequestUser | null;
    // Requirement: log actions by users. We only log authenticated users reliably.
    // Public endpoints (no req.user) are skipped to avoid invalid FK for userId.
    if (!user?.id) return next.handle();

    const path: string = req.originalUrl ?? req.url ?? '';
    const method: string = req.method ?? '';
    const ipAddress: string = req.ip ?? req.socket?.remoteAddress ?? '';
    const userAgent: string = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : '';

    const action = inferAction(method, path);
    const resourceType = inferResourceType(path);
    const resourceId = inferResourceId(req.params, path);

    const isPhiResource = PHI_RESOURCE_TYPES.has(resourceType);
    const baseDetails: Record<string, unknown> = {
      method: method.toUpperCase(),
      path,
      query: scrubObject(safeJson(req.query)),
      // For PHI resource types, never store body. Otherwise store scrubbed body for non-GET only.
      body: method.toUpperCase() === 'GET' ? undefined : isPhiResource ? undefined : scrubObject(safeJson(req.body)),
    };

    const writeLog = async (status: 'success' | 'failure' | 'denied', errorMessage?: string) => {
      try {
        const detailsPayload = {
          ...baseDetails,
          statusCode: res?.statusCode,
          error: errorMessage ? String(errorMessage).slice(0, 500) : undefined,
        };
        await this.prisma.auditLog.create({
          data: {
            userId: user.id,
            action,
            resourceType,
            resourceId: resourceId ?? undefined,
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
      catchError((err: unknown) => {
        const e = err as { status?: number; response?: { statusCode?: number }; message?: string };
        const statusCode = e?.status ?? e?.response?.statusCode ?? res?.statusCode;
        const status: 'success' | 'failure' | 'denied' =
          statusCode === 401 || statusCode === 403 ? 'denied' : 'failure';
        const errorMessage =
          e?.message ?? (err instanceof Error ? err.message : typeof err === 'string' ? err : 'Unknown error');
        void writeLog(status, errorMessage);
        return throwError(() => err);
      }),
    );
  }
}
