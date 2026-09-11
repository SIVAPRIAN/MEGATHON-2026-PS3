import mongoose, { Schema, Document } from 'mongoose';

export interface IVessel extends Document {
  vesselId: string;
  name: string;
  mmsi?: string;
  vesselType: string;
  flag?: string;
  status: 'CORRELATED' | 'DARK' | 'UNCONFIRMED' | 'INCONSISTENT';
  lat: number;
  lon: number;
  heading: number;
  speed: number;
  length: number;
  detectionSource?: string;
  detectedByCamera?: string;
  geofenceStatus: 'OUTSIDE' | 'INSIDE_RESTRICTED';
  restrictedAreaIds: string[];
  restrictedAreaNames: string[];
  displayStatus: 'CORRELATED' | 'DARK' | 'RESTRICTED';
  authorizationStatus: 'AUTHORISED' | 'UNREGISTERED' | 'DARK_VESSEL';
  organisation?: string;
  isSyntheticDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VesselSchema = new Schema<IVessel>(
  {
    vesselId: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: 'UNIDENTIFIED VESSEL' },
    mmsi: { type: String, index: true },
    vesselType: {
      type: String,
      default: 'Unknown',
      enum: ['Cargo', 'Tanker', 'Fishing', 'Tug', 'Bulk Carrier', 'Passenger', 'Skiff', 'Trawler', 'Commercial Vessel', 'Unknown'],
    },
    flag: { type: String },
    status: {
      type: String,
      required: true,
      enum: ['CORRELATED', 'DARK', 'UNCONFIRMED', 'INCONSISTENT'],
      default: 'DARK',
    },
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
    heading: { type: Number, default: 0 },
    speed: { type: Number, default: 0 },
    length: { type: Number, default: 0 },
    detectionSource: { type: String, default: 'EO Camera' },
    detectedByCamera: { type: String },
    geofenceStatus: {
      type: String,
      enum: ['OUTSIDE', 'INSIDE_RESTRICTED'],
      default: 'OUTSIDE',
    },
    restrictedAreaIds: [{ type: String }],
    restrictedAreaNames: [{ type: String }],
    displayStatus: {
      type: String,
      enum: ['CORRELATED', 'DARK', 'RESTRICTED'],
      default: 'DARK',
    },
    authorizationStatus: {
      type: String,
      enum: ['AUTHORISED', 'UNREGISTERED', 'DARK_VESSEL'],
      default: 'UNREGISTERED',
    },
    organisation: { type: String },
    isSyntheticDemo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

VesselSchema.index({ lat: 1, lon: 1 });
VesselSchema.index({ status: 1, authorizationStatus: 1 });

export const Vessel = mongoose.model<IVessel>('Vessel', VesselSchema);
