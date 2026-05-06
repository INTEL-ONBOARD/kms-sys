import mongoose, { Schema, Document } from 'mongoose';

// Define the structure of an Audit Log entry
export interface IAuditLog extends Document {
  action: string;               // e.g., 'UPDATE_ROLE', 'IMPERSONATE_USER', 'DELETE_COURSE'
  performedBy: mongoose.Types.ObjectId; // The Admin who performed the action
  targetId?: mongoose.Types.ObjectId;   // The User or Course that was affected
  resourceType: 'User' | 'Course' | 'System' | 'Other'; // What type of record was changed
  details: Record<string, any>; // JSON object containing changes (e.g., { oldRole: 'student', newRole: 'lecturer' })
  createdAt: Date;              // When it happened
}

// Create the Mongoose Schema
const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, required: true },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetId: { type: Schema.Types.ObjectId },
    resourceType: { type: String, required: true, enum: ['User', 'Course', 'System', 'Other'] },
    details: { type: Schema.Types.Mixed, default: {} },
  },
  // We only need createdAt for audit logs (they should never be updated)
  { timestamps: { createdAt: true, updatedAt: false } } 
);

// Prevent Next.js hot-reload from creating multiple models
export default mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);