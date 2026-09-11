import mongoose, { Schema, Document } from 'mongoose';

export interface IRestrictedZone extends Document {
  zoneId: string;
  name: string;
  zoneType: 'RED' | 'YELLOW' | 'GREEN' | 'RESTRICTED';
  description?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  geometry: {
    type: 'Polygon';
    coordinates: number[][][]; // GeoJSON standard: [longitude, latitude]
  };
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  expiresAt?: Date;
  expiresInMinutes?: number;
  createdBy: string;
  isSyntheticDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RestrictedZoneSchema = new Schema<IRestrictedZone>(
  {
    zoneId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    zoneType: {
      type: String,
      required: true,
      enum: ['RED', 'YELLOW', 'GREEN', 'RESTRICTED'],
      default: 'RED',
    },
    description: { type: String, default: 'Restricted Maritime Exclusion Zone' },
    status: {
      type: String,
      required: true,
      enum: ['ACTIVE', 'INACTIVE', 'EXPIRED'],
      default: 'ACTIVE',
      index: true,
    },
    geometry: {
      type: {
        type: String,
        enum: ['Polygon'],
        required: true,
        default: 'Polygon',
      },
      coordinates: {
        type: [[[Number]]],
        required: true,
      },
    },
    severity: {
      type: String,
      enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
      default: 'CRITICAL',
    },
    expiresAt: { type: Date },
    expiresInMinutes: { type: Number },
    createdBy: { type: String, default: 'SYSTEM' },
    isSyntheticDemo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// GeoJSON 2dsphere index for geospatial point-in-polygon queries ($geoIntersects)
RestrictedZoneSchema.index({ geometry: '2dsphere' });

export const RestrictedZone = mongoose.model<IRestrictedZone>('RestrictedZone', RestrictedZoneSchema);
