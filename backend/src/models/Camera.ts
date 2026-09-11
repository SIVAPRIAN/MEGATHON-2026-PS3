import mongoose, { Schema, Document } from 'mongoose';

export interface ICamera extends Document {
  cameraId: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  altitude: number;
  cameraType: string;
  status: 'ONLINE' | 'OFFLINE' | 'STALE' | 'DEMO ACTIVE' | 'REFERENCE' | 'SELECTED';
  rtspStreamUrl?: string;
  ptzCapability: boolean;
  pan: number;
  tilt: number;
  zoom: number;
  heading: number;
  fov: number;
  rangeKm: number;
  coverageGeometry?: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  model: string;
  stationCode?: string;
  lastFrame?: string;
  detectionsCount: number;
  isSyntheticDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CameraSchema = new Schema<ICamera>(
  {
    cameraId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    location: { type: String, default: 'Coastal Station' },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    altitude: { type: Number, default: 25 },
    cameraType: { type: String, default: 'EO/IR Coastal Camera' },
    status: {
      type: String,
      enum: ['ONLINE', 'OFFLINE', 'STALE', 'DEMO ACTIVE', 'REFERENCE', 'SELECTED'],
      default: 'ONLINE',
    },
    rtspStreamUrl: { type: String, default: 'rtsp://stream.coastal.internal/cam' },
    ptzCapability: { type: Boolean, default: true },
    pan: { type: Number, default: 0 },
    tilt: { type: Number, default: 0 },
    zoom: { type: Number, default: 1 },
    heading: { type: Number, default: 90 },
    fov: { type: Number, default: 46 },
    rangeKm: { type: Number, default: 12.0 },
    coverageGeometry: {
      type: {
        type: String,
        enum: ['Polygon'],
        default: 'Polygon',
      },
      coordinates: {
        type: [[[Number]]],
      },
    },
    model: { type: String, default: 'HD-PTZ-Coastal-X100' },
    stationCode: { type: String },
    lastFrame: { type: String, default: 'ONLINE STREAM' },
    detectionsCount: { type: Number, default: 0 },
    isSyntheticDemo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CameraSchema.index({ latitude: 1, longitude: 1 });
CameraSchema.index({ status: 1 });

export const Camera = mongoose.model<ICamera>('Camera', CameraSchema);
