import { Router } from 'express';
import {
  getCameras,
  getCameraById,
  addCamera,
  updateCamera,
  updateCameraStatus,
} from '../controllers/cameraController';

const router = Router();

router.get('/', getCameras);
router.get('/:id', getCameraById);
router.post('/', addCamera);
router.put('/:id', updateCamera);
router.put('/:id/status', updateCameraStatus);

export default router;
