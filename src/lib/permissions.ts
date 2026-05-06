// Define all available roles in the system
export type Role = 'super_admin' | 'lecturer' | 'student';

// Define all explicit permission keys based on Task #497
// This makes sure we don't make spelling mistakes when checking permissions later
export type Permission =
  // Course permissions
  | 'course.create'
  | 'course.read'
  | 'course.update'
  | 'course.delete'
  
  // Assignment permissions
  | 'assignment.create'
  | 'assignment.read'
  | 'assignment.update'
  | 'assignment.delete'
  | 'assignment.grade.assigned' // Specific permission from Task #497
  | 'assignment.submit'
  
  // Exam permissions
  | 'exam.create'
  | 'exam.read'
  | 'exam.update'
  | 'exam.delete'
  | 'exam.publish.department'   // Specific permission from Task #497
  | 'exam.take'
  
  // User & System Admin permissions
  | 'user.manage'
  | 'system.settings.manage';

// Map roles to their specific permissions (The Registry)
// Here we define exactly what each role can do
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: [
    'course.create', 'course.read', 'course.update', 'course.delete',
    'assignment.create', 'assignment.read', 'assignment.update', 'assignment.delete', 'assignment.grade.assigned',
    'exam.create', 'exam.read', 'exam.update', 'exam.delete', 'exam.publish.department',
    'user.manage', 'system.settings.manage'
  ],
  lecturer: [
    'course.read', 'course.update', // Lecturers might not create courses, but can update their assigned ones
    'assignment.create', 'assignment.read', 'assignment.update', 'assignment.delete', 'assignment.grade.assigned',
    'exam.create', 'exam.read', 'exam.update', 'exam.publish.department'
  ],
  student: [
    'course.read',
    'assignment.read', 'assignment.submit',
    'exam.read', 'exam.take'
  ]
};

/**
 * Helper function to check if a user role has a specific permission
 * We will use this function in our API routes and UI components
 * 
 * @param role The role of the user (e.g., 'student')
 * @param permission The permission key to check (e.g., 'course.create')
 * @returns boolean indicating if the role has the permission
 */
export function hasPermission(role: string | undefined, permission: Permission): boolean {
  // If no role is provided, return false immediately
  if (!role) return false;

  // Validate if the role exists in our registry
  if (!Object.keys(ROLE_PERMISSIONS).includes(role)) {
    return false;
  }

  // Cast the string role to our valid Role type
  const userRole = role as Role;
  const permissions = ROLE_PERMISSIONS[userRole];

  // Return true if the role's permission array includes the requested permission
  return permissions.includes(permission);
}

/**
 * Task #498: Scope and Boundary Checks
 * Checks if a user is authorized to perform an action on a specific resource.
 * It enforces "own-record" boundaries to ensure users only access their own data.
 * 
 * @param user The current logged-in user from the session
 * @param permission The required permission (e.g., 'course.update')
 * @param resourceOwnerId The ID of the user who owns the resource (e.g., Course Instructor's ID)
 * @returns boolean indicating if access is granted
 */
export function isAuthorized(
  user: { id: string; role: string } | undefined | null,
  permission: Permission,
  resourceOwnerId?: string
): boolean {
  // 1. Check if the user exists and has the basic RBAC permission first
  if (!user || !hasPermission(user.role, permission)) {
    return false;
  }

  // 2. Super Admins bypass scope checks (they have global access to everything)
  if (user.role === 'super_admin') {
    return true;
  }

  // 3. Own-Record Boundary Check (Scope Check)
  // If the resource belongs to someone specific (like a specific lecturer or student),
  // we check if the logged-in user's ID matches the resource's owner ID.
  if (resourceOwnerId) {
    // If IDs don't match, access is denied (Cross-record boundary enforcement)
    if (user.id !== resourceOwnerId.toString()) {
      return false;
    }
  }

  // If all checks pass, authorization is granted
  return true;
}