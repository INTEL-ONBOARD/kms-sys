import AuditLog from '@/models/AuditLog';
import { connectToDatabase } from '@/lib/db';

interface LogParams {
  action: string;
  performedBy: string;
  targetId?: string;
  resourceType: 'User' | 'Course' | 'System' | 'Other';
  details?: Record<string, any>;
}

/**
 * Task #500: Audit Logging Utility
 * Logs sensitive actions to the database securely to preserve accountability.
 */
export async function logAuditAction({ action, performedBy, targetId, resourceType, details = {} }: LogParams) {
  try {
    await connectToDatabase();
    
    // Create a new secure log entry
    await AuditLog.create({
      action,
      performedBy,
      targetId,
      resourceType,
      details
    });
    
    console.log(`[AUDIT LOG]: ${action} performed by ${performedBy}`);
  } catch (error) {
    // We use console.error here so that an audit logging failure 
    // doesn't crash the main API response for the user
    console.error('Failed to write audit log:', error);
  }
}