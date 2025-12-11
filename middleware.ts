import { authMiddleware } from './lib/middleware/auth-middleware';

export default authMiddleware;

export const config = {
  matcher: [
    '/((?!api/auth|api/setup|auth/signin|auth/error|auth/unauthorized|terms|privacy|_next/static|_next/image|favicon.ico).*)',
  ],
};
