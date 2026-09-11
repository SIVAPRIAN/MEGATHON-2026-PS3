import { Request, Response, NextFunction } from 'express';
import { Vessel } from '../models/Vessel';
import { Track } from '../models/Track';
import { Alert } from '../models/Alert';
import { Camera } from '../models/Camera';
import { PatrolUnit } from '../models/PatrolUnit';
import { RestrictedZone } from '../models/RestrictedZone';
import { AuditLog } from '../models/AuditLog';

export const getDashboardSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [
      totalVessels,
      correlatedVessels,
      darkVessels,
      activeTracks,
      activeAlerts,
      criticalAlerts,
      totalCameras,
      onlineCameras,
      totalPatrols,
      activePatrols,
      activeZones,
      recentEvents,
    ] = await Promise.all([
      Vessel.countDocuments(),
      Vessel.countDocuments({ status: 'CORRELATED' }),
      Vessel.countDocuments({ status: 'DARK' }),
      Track.countDocuments({ trackingStatus: 'ACTIVE' }),
      Alert.countDocuments({ currentState: 'ACTIVE' }),
      Alert.countDocuments({ currentState: 'ACTIVE', priority: 'CRITICAL' }),
      Camera.countDocuments(),
      Camera.countDocuments({ status: { $in: ['ONLINE', 'DEMO ACTIVE'] } }),
      PatrolUnit.countDocuments(),
      PatrolUnit.countDocuments({ status: { $in: ['ON_PATROL', 'RESPONDING'] } }),
      RestrictedZone.countDocuments({ status: 'ACTIVE' }),
      AuditLog.find().sort({ timestamp: -1 }).limit(10),
    ]);

    res.json({
      success: true,
      data: {
        vessels: {
          total: totalVessels,
          correlated: correlatedVessels,
          dark: darkVessels,
        },
        tracks: {
          active: activeTracks,
        },
        alerts: {
          active: activeAlerts,
          critical: criticalAlerts,
        },
        cameras: {
          total: totalCameras,
          online: onlineCameras,
        },
        patrols: {
          total: totalPatrols,
          active: activePatrols,
        },
        zones: {
          active: activeZones,
        },
        recentEvents,
      },
    });
  } catch (error) {
    next(error);
  }
};
