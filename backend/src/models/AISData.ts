import mongoose, { Schema, Document } from 'mongoose';

export interface IAISData extends Document {
  mmsi: string;
  vesselName?: string;
  latitude: number;
  longitude: number;
  position?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  sog?: number;
  speed: number;
  cog?: number;
  heading: number;
  vesselType?: string;
  destination?: string;
  imo?: string;
  callSign?: string;
  callsign?: string; // alias
  flag?: string;
  status?: string;
  length?: number;
  width?: number;
  draft?: number;
  cargo?: string;
  transceiver?: string;
  timestamp: Date;
  dataSource: 'DEMO' | 'SYNTHETIC_DATASET';
  isSyntheticDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AISDataSchema = new Schema<IAISData>(
  {
    mmsi: { type: String, required: true, index: true },
    vesselName: { type: String, default: 'UNKNOWN AIS TARGET' },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    position: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    sog: { type: Number, default: 0 },
    speed: { type: Number, default: 0 },
    cog: { type: Number },
    heading: { type: Number, default: 0 },
    vesselType: { type: String, default: 'Cargo' },
    destination: { type: String },
    imo: { type: String },
    callSign: { type: String },
    callsign: { type: String },
    flag: { type: String },
    status: { type: String },
    length: { type: Number },
    width: { type: Number },
    draft: { type: Number },
    cargo: { type: String },
    transceiver: { type: String },
    timestamp: { type: Date, default: Date.now, index: true },
    dataSource: {
      type: String,
      enum: ['DEMO', 'SYNTHETIC_DATASET'],
      default: 'SYNTHETIC_DATASET',
      index: true,
    },
    isSyntheticDemo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Indexes:
// 1. GeoJSON 2dsphere index for geographic proximity and range queries
AISDataSchema.index({ position: '2dsphere' });

// 2. Composite unique index: An MMSI observation at a specific timestamp is unique (prevents duplicates)
AISDataSchema.index({ mmsi: 1, timestamp: 1 }, { unique: true });

// 3. Fast time-series and legacy lat/lon queries
AISDataSchema.index({ latitude: 1, longitude: 1 });
AISDataSchema.index({ timestamp: -1 });

export const AISData = mongoose.model<IAISData>('AISData', AISDataSchema);
