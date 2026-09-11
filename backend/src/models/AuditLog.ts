import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  eventId: string;
  timestamp: Date;
  operatorId: string;
  eventType: string;
  targetId: string;
  action: string;
  reason: string;
  metadata?: Record<string, any>;
  isSyntheticDemo: boolean;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    timestamp: { type: Date, default: Date.now, index: true },
    operatorId: { type: String, default: 'SYSTEM' },
    eventType: { type: String, required: true, index: true },
    targetId: { type: String, required: true, index: true },
    action: { type: String, required: true },
    reason: { type: String, default: 'OPERATIONAL_EVENT' },
    metadata: { type: Schema.Types.Mixed },
    isSyntheticDemo: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditLogSchema.index({ eventType: 1, timestamp: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
