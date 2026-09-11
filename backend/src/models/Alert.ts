import mongoose, { Schema, Document } from 'mongoose';

export interface IAlertDisposition {
  operatorId: string;
  timestamp: Date;
  action: 'CONFIRM' | 'DISMISS' | 'ESCALATE';
  reason: string;
  notes?: string;
}

export interface IAlertEvidence {
  source: string;
  confidence?: number;
  zoneName?: string;
  details?: string;
  coordinates?: [number, number];
}

export interface IAlert extends Document {
  alertId: string;
  type: string;
  status: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description?: string;
  targetId: string;
  targetName: string;
  trackId?: string;
  vesselId?: string;
  cameraId?: string;
  zoneId?: string;
  latitude?: number;
  longitude?: number;
  currentState: 'ACTIVE' | 'CONFIRMED' | 'DISMISSED' | 'ESCALATED' | 'RESOLVED';
  suggestedAction: 'MONITOR' | 'INVESTIGATE' | 'VERIFY' | 'ESCALATE';
  evidence: IAlertEvidence;
  disposition?: IAlertDisposition;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  isSyntheticDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AlertDispositionSchema = new Schema<IAlertDisposition>(
  {
    operatorId: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    action: { type: String, enum: ['CONFIRM', 'DISMISS', 'ESCALATE'], required: true },
    reason: { type: String, required: true },
    notes: { type: String },
  },
  { _id: false }
);

const AlertEvidenceSchema = new Schema<IAlertEvidence>(
  {
    source: { type: String, default: 'Coastal Surveillance System' },
    confidence: { type: Number },
    zoneName: { type: String },
    details: { type: String },
    coordinates: { type: [Number] },
  },
  { _id: false }
);

const AlertSchema = new Schema<IAlert>(
  {
    alertId: { type: String, required: true, unique: true, index: true },
    type: { type: String, default: 'DARK_VESSEL' },
    status: { type: String, default: 'DARK_VESSEL' },
    priority: {
      type: String,
      required: true,
      enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
      default: 'HIGH',
      index: true,
    },
    title: { type: String, default: 'Maritime Surveillance Alert' },
    description: { type: String },
    targetId: { type: String, required: true, index: true },
    targetName: { type: String, default: 'TARGET CONTACT' },
    trackId: { type: String, index: true },
    vesselId: { type: String, index: true },
    cameraId: { type: String },
    zoneId: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    currentState: {
      type: String,
      required: true,
      enum: ['ACTIVE', 'CONFIRMED', 'DISMISSED', 'ESCALATED', 'RESOLVED'],
      default: 'ACTIVE',
      index: true,
    },
    suggestedAction: {
      type: String,
      enum: ['MONITOR', 'INVESTIGATE', 'VERIFY', 'ESCALATE'],
      default: 'INVESTIGATE',
    },
    evidence: { type: AlertEvidenceSchema, default: () => ({ source: 'System' }) },
    disposition: { type: AlertDispositionSchema },
    acknowledgedBy: { type: String },
    acknowledgedAt: { type: Date },
    isSyntheticDemo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

AlertSchema.index({ currentState: 1, priority: 1, createdAt: -1 });

export const Alert = mongoose.model<IAlert>('Alert', AlertSchema);
