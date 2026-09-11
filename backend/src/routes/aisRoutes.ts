import { Router } from 'express';
import {
  ingestAISFeed,
  getAISTargets,
  getAISTargetByMMSI,
  getAISHistoryByMMSI,
  correlateAIS,
} from '../controllers/aisController';

const router = Router();

router.post('/feed', ingestAISFeed);
router.get('/targets', getAISTargets);
router.get('/targets/:mmsi', getAISTargetByMMSI);
router.get('/history/:mmsi', getAISHistoryByMMSI);
router.post('/correlate', correlateAIS);

export default router;
