import { Router } from 'express';
import {
  getVessels,
  getVesselById,
  createVessel,
  updateVessel,
  deleteVessel,
} from '../controllers/vesselController';

const router = Router();

router.get('/', getVessels);
router.get('/:id', getVesselById);
router.post('/', createVessel);
router.put('/:id', updateVessel);
router.delete('/:id', deleteVessel);

export default router;
