import { Router } from 'express';
import {
  getTracks,
  getTrackById,
  getTrackHistory,
  createTrack,
  updateTrack,
  closeTrack,
} from '../controllers/trackController';

const router = Router();

router.get('/', getTracks);
router.get('/:id', getTrackById);
router.get('/:id/history', getTrackHistory);
router.post('/', createTrack);
router.put('/:id', updateTrack);
router.post('/:id/close', closeTrack);

export default router;
