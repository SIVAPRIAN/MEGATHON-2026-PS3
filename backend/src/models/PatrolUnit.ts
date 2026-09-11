import mongoose, { Schema, Document } from 'mongoose';

export interface IPatrolUnit extends Document {
  patrolId: string;
  name: string;
  status: 'AVAILABLE' | 'ON_PATROL' | 'RESPONDING' | 'OFFLINE';
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  assignedAlert?: string;
  baseStation?: string;
  availability: boolean;
  isSyntheticDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PatrolUnitSchema = new Schema<IPatrolUnit>(
  {
    patrolId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ['AVAILABLE', 'ON_PATROL', 'RESPONDING', 'OFFLINE'],
      default: 'AVAILABLE',
      index: true,
    },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    heading: { type: Number, default: 0 },
    speed: { type: Number, default: 0 },
    assignedAlert: { type: String },
    baseStation: { type: String, default: 'Coast Guard Sector Base' },
    availability: { type: Boolean, default: true },
    isSyntheticDemo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

PatrolUnitSchema.index({ latitude: 1, longitude: 1 });

export const PatrolUnit = mongoose.model<IPatrolUnit>('PatrolUnit', PatrolUnitSchema);
