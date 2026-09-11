import { Router } from 'express';
import dashboardRoutes from './dashboardRoutes';
import vesselRoutes from './vesselRoutes';
import trackRoutes from './trackRoutes';
import detectionRoutes from './detectionRoutes';
import cameraRoutes from './cameraRoutes';
import zoneRoutes from './zoneRoutes';
import alertRoutes from './alertRoutes';
import aisRoutes from './aisRoutes';
import patrolRoutes from './patrolRoutes';
import auditLogRoutes from './auditLogRoutes';

const router = Router();

router.use('/dashboard', dashboardRoutes);
router.use('/vessels', vesselRoutes);
router.use('/tracks', trackRoutes);
router.use('/detections', detectionRoutes);
router.use('/cameras', cameraRoutes);
router.use('/zones', zoneRoutes);
router.use('/alerts', alertRoutes);
router.use('/ais', aisRoutes);
router.use('/patrols', patrolRoutes);
router.use('/audit-logs', auditLogRoutes);

// System health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'Coastal Surveillance REST API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

export default router;
