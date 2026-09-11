import { Router } from 'express';
import {
  getZones,
  getZoneById,
  createZone,
  updateZone,
  deleteZone,
  checkPointInZone,
} from '../controllers/zoneController';

const router = Router();

router.get('/', getZones);
router.get('/check-point', checkPointInZone);
router.post('/check-point', checkPointInZone);
router.get('/:id', getZoneById);
router.post('/', createZone);
router.put('/:id', updateZone);
router.delete('/:id', deleteZone);

export default router;
