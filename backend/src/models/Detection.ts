import mongoose, { Schema, Document } from 'mongoose';

export interface IBoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface IEstimatedPosition {
  lat: number;
  lon: number;
}

export interface IDetection extends Document {
  detectionId: string;
  trackId: string;
  cameraId: string;
  timestamp: Date;
  class: string;
  confidence: number;
  boundingBox: IBoundingBox;
  estimatedPosition?: IEstimatedPosition;
  imageUrl?: string;
  metadata?: Record<string, any>;
  isSyntheticDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BoundingBoxSchema = new Schema<IBoundingBox>(
  {
    x1: { type: Number, required: true },
    y1: { type: Number, required: true },
    x2: { type: Number, required: true },
    y2: { type: Number, required: true },
  },
  { _id: false }
);

const EstimatedPositionSchema = new Schema<IEstimatedPosition>(
  {
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
  },
  { _id: false }
);

const DetectionSchema = new Schema<IDetection>(
  {
    detectionId: { type: String, required: true, unique: true, index: true },
    trackId: { type: String, required: true, index: true },
    cameraId: { type: String, required: true, index: true },
    timestamp: { type: Date, default: Date.now, index: true },
    class: { type: String, default: 'vessel' },
    confidence: { type: Number, required: true, min: 0, max: 100 },
    boundingBox: { type: BoundingBoxSchema, required: true },
    estimatedPosition: { type: EstimatedPositionSchema },
    imageUrl: { type: String },
    metadata: { type: Schema.Types.Mixed },
    isSyntheticDemo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

DetectionSchema.index({ cameraId: 1, timestamp: -1 });
DetectionSchema.index({ trackId: 1, timestamp: -1 });

export const Detection = mongoose.model<IDetection>('Detection', DetectionSchema);
