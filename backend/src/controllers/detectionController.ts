import { Request, Response, NextFunction } from 'express';
import { Detection } from '../models/Detection';
import { processIncomingDetection } from '../services/trackService';

export const submitDetection = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { trackId, cameraId, confidence, boundingBox } = req.body;

    if (!trackId || !cameraId || confidence === undefined || !boundingBox) {
      res.status(400).json({
        success: false,
        message: 'Missing required detection fields: trackId, cameraId, confidence, boundingBox',
      });
      return;
    }

    const result = await processIncomingDetection(req.body);

    res.status(201).json({
      success: true,
      message: 'Detection ingested and processed successfully',
      data: {
        detectionId: result.detection.detectionId,
        trackId: result.track.trackId,
        timestamp: result.detection.timestamp,
        boundingBox: result.detection.boundingBox,
        estimatedPosition: result.detection.estimatedPosition,
        geofence: result.geofence,
        alertGenerated: result.alertGenerated,
        correlation: result.correlation,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getDetections = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { trackId, cameraId, limit = 100 } = req.query;
    const filter: any = {};

    if (trackId && typeof trackId === 'string') filter.trackId = trackId;
    if (cameraId && typeof cameraId === 'string') filter.cameraId = cameraId;

    const detections = await Detection.find(filter)
      .sort({ timestamp: -1 })
      .limit(Number(limit));

    res.json({
      success: true,
      count: detections.length,
      data: detections,
    });
  } catch (error) {
    next(error);
  }
};

export const getDetectionsByTrack = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { trackId } = req.params;
    const detections = await Detection.find({ trackId }).sort({ timestamp: 1 });

    res.json({
      success: true,
      trackId,
      count: detections.length,
      data: detections,
    });
  } catch (error) {
    next(error);
  }
};

export const getDetectionsByCamera = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { cameraId } = req.params;
    const detections = await Detection.find({ cameraId }).sort({ timestamp: -1 }).limit(100);

    res.json({
      success: true,
      cameraId,
      count: detections.length,
      data: detections,
    });
  } catch (error) {
    next(error);
  }
};
