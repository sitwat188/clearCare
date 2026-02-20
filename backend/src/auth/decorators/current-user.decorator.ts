import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

/** Shape of the user object attached to the request by JWT auth. */
export type CurrentUserPayload = { id: string; email: string; role: string };

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserPayload | undefined, ctx: ExecutionContext): CurrentUserPayload | string | undefined => {
    const request = ctx.switchToHttp().getRequest<Request & { user?: CurrentUserPayload }>();
    const user = request.user;
    if (data && user && typeof user === 'object' && data in user) {
      return user[data];
    }
    return user;
  },
);
