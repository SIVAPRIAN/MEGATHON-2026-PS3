import mongoose, { Schema, Document } from 'mongoose';

export interface ITrackPoint {
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  timestamp: Date;
}

export interface ITrack extends Document {
  trackId: string;
  vesselId?: string | null;
  trackingStatus: 'ACTIVE' | 'CLOSED' | 'LOST';
  firstSeen: Date;
  lastSeen: Date;
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  source: string;
  confidence: number;
  cameraId?: string;
  restrictedZoneStatus: 'OUTSIDE' | 'INSIDE_RESTRICTED';
  history: ITrackPoint[];
  isSyntheticDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TrackPointSchema = new Schema<ITrackPoint>(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    speed: { type: Number, default: 0 },
    heading: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const TrackSchema = new Schema<ITrack>(
  {
    trackId: { type: String, required: true, unique: true, index: true },
    vesselId: { type: String, default: null, index: true },
    trackingStatus: {
      type: String,
      required: true,
      enum: ['ACTIVE', 'CLOSED', 'LOST'],
      default: 'ACTIVE',
    },
    firstSeen: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    heading: { type: Number, default: 0 },
    speed: { type: Number, default: 0 },
    source: { type: String, default: 'EO Camera' },
    confidence: { type: Number, min: 0, max: 100, default: 85 },
    cameraId: { type: String },
    restrictedZoneStatus: {
      type: String,
      enum: ['OUTSIDE', 'INSIDE_RESTRICTED'],
      default: 'OUTSIDE',
    },
    history: [TrackPointSchema],
    isSyntheticDemo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

TrackSchema.index({ trackingStatus: 1, lastSeen: -1 });

export const Track = mongoose.model<ITrack>('Track', TrackSchema);
