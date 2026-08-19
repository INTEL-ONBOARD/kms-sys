import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { UnauthorizedError, ForbiddenError } from "./errors";
import { Permission, isAuthorized } from "@/lib/permissions";

export interface AuthUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role: string;
  status?: string;
}

/**
 * Extracts and returns the authenticated user context from the incoming Next.js request.
 */
export async function getAuthContext(req: NextRequest | Request): Promise<AuthUser | null> {
  const token = await getToken({
    req: req as NextRequest,
    secret: process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET,
  });

  if (!token || (!token.id && !token.sub)) {
    return null;
  }

  return {
    id: (token.id || token.sub) as string,
    name: token.name || null,
    email: token.email || null,
    role: (token.role as string) || "student",
    status: token.status as string | undefined,
  };
}

/**
 * Enforces that a request has an active authenticated session.
 * Throws UnauthorizedError (401) if not logged in.
 */
export async function requireAuth(req: NextRequest | Request): Promise<AuthUser> {
  const user = await getAuthContext(req);
  if (!user) {
    throw new UnauthorizedError("Authentication required. Please log in.");
  }
  return user;
}

/**
 * Enforces that the authenticated user possesses one of the required roles.
 * Throws UnauthorizedError (401) if not logged in, or ForbiddenError (403) if role is insufficient.
 */
export async function requireRole(
  req: NextRequest | Request,
  allowedRoles: string | string[]
): Promise<AuthUser> {
  const user = await requireAuth(req);
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!roles.includes(user.role)) {
    throw new ForbiddenError(
      `Access denied. Requires one of the following roles: [${roles.join(", ")}]. Current role: '${user.role}'`
    );
  }

  return user;
}

/**
 * Enforces explicit RBAC and own-record boundary checks via permissions.ts.
 */
export async function requirePermission(
  req: NextRequest | Request,
  permission: Permission,
  resourceOwnerId?: string
): Promise<AuthUser> {
  const user = await requireAuth(req);

  const authorized = isAuthorized(
    { id: user.id, role: user.role },
    permission,
    resourceOwnerId
  );

  if (!authorized) {
    throw new ForbiddenError(
      `Access denied. Missing permission '${permission}' for this resource.`
    );
  }

  return user;
}
