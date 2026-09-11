import { Router } from 'express';
import {
  getAlerts,
  getAlertById,
  createAlert,
  acknowledgeAlert,
  resolveAlert,
  dispositionAlert,
} from '../controllers/alertController';

const router = Router();

router.get('/', getAlerts);
router.get('/:id', getAlertById);
router.post('/', createAlert);
router.put('/:id/acknowledge', acknowledgeAlert);
router.put('/:id/resolve', resolveAlert);
router.put('/:id/disposition', dispositionAlert);

export default router;
