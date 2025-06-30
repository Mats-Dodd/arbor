import { env } from '@/env';
import { createAuthMiddleware } from '@repo/auth/middleware';
import { internationalizationMiddleware } from '@repo/internationalization/middleware';
import { parseError } from '@repo/observability/error';
import { secure } from '@repo/security';
import {
  noseconeMiddleware,
  noseconeOptions,
  noseconeOptionsWithToolbar,
} from '@repo/security/middleware';
import {
  type NextMiddleware,
  type NextRequest,
  NextResponse,
} from 'next/server';

export const config = {

  matcher: ['/((?!_next/static|_next/image|ingest|favicon.ico).*)'],
};

const securityHeaders = env.FLAGS_SECRET
  ? noseconeMiddleware(noseconeOptionsWithToolbar)
  : noseconeMiddleware(noseconeOptions);

const authMiddleware = createAuthMiddleware();

const middleware: NextMiddleware = async (request: NextRequest) => {
  const i18nResponse = internationalizationMiddleware(request);
  if (i18nResponse) {
    return i18nResponse;
  }

  const authResponse = await authMiddleware(request);
  if (authResponse.status === 307 || authResponse.status === 302) {
    return authResponse;
  }

  if (!env.ARCJET_KEY) {
    return securityHeaders();
  }

  try {
    await secure(
      [
        'CATEGORY:SEARCH_ENGINE',
        'CATEGORY:PREVIEW',
        'CATEGORY:MONITOR',
      ],
      request
    );

    return securityHeaders();
  } catch (error) {
    const message = parseError(error);

    return NextResponse.json({ error: message }, { status: 403 });
  }
};

export default middleware;
