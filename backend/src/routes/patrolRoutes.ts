import { Router } from 'express';
import {
  getPatrols,
  getPatrolById,
  createPatrol,
  updatePatrol,
  assignPatrol,
  releasePatrol,
} from '../controllers/patrolController';

const router = Router();

router.get('/', getPatrols);
router.get('/:id', getPatrolById);
router.post('/', createPatrol);
router.put('/:id', updatePatrol);
router.put('/:id/assign', assignPatrol);
router.put('/:id/release', releasePatrol);

export default router;
