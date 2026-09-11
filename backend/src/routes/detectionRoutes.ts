import { Router } from 'express';
import {
  submitDetection,
  getDetections,
  getDetectionsByTrack,
  getDetectionsByCamera,
} from '../controllers/detectionController';

const router = Router();

// ML / YOLO Ingestion Endpoint
router.post('/', submitDetection);

// Detection retrieval
router.get('/', getDetections);
router.get('/track/:trackId', getDetectionsByTrack);
router.get('/camera/:cameraId', getDetectionsByCamera);

export default router;
