import { Request, Response, NextFunction } from 'express';
import { RestrictedZone } from '../models/RestrictedZone';
import { AuditLog } from '../models/AuditLog';
import { evaluateGeofence } from '../services/geospatialService';

export const getZones = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, zoneType } = req.query;
    const filter: any = {};

    if (status && typeof status === 'string') filter.status = status;
    if (zoneType && typeof zoneType === 'string') filter.zoneType = zoneType;

    const zones = await RestrictedZone.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: zones.length,
      data: zones,
    });
  } catch (error) {
    next(error);
  }
};

export const getZoneById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const zone = await RestrictedZone.findOne({
      $or: [{ zoneId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!zone) {
      res.status(404).json({ success: false, message: `Restricted zone with ID ${id} not found` });
      return;
    }

    res.json({ success: true, data: zone });
  } catch (error) {
    next(error);
  }
};

export const createZone = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const zoneData = req.body;
    if (!zoneData.zoneId) {
      const count = await RestrictedZone.countDocuments();
      zoneData.zoneId = `RA-${String(count + 1).padStart(3, '0')}`;
    }

    // Ensure GeoJSON structure: coordinates must be closed loop [lon, lat]
    if (zoneData.geometry?.coordinates) {
      const coords = zoneData.geometry.coordinates[0];
      if (coords && coords.length > 2) {
        const first = coords[0];
        const last = coords[coords.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) {
          coords.push([first[0], first[1]]); // Close polygon for standard GeoJSON
        }
      }
    }

    const newZone = await RestrictedZone.create(zoneData);

    // Audit log
    const logCount = await AuditLog.countDocuments();
    await AuditLog.create({
      eventId: `EVT-${100 + logCount + 1}`,
      operatorId: newZone.createdBy || 'OPERATOR_1',
      eventType: 'ZONE_CREATED',
      targetId: newZone.zoneId,
      action: `Created ${newZone.zoneType} restricted zone: ${newZone.name}`,
      reason: 'USER_ACTION',
      metadata: { zoneId: newZone.zoneId, zoneType: newZone.zoneType },
    });

    res.status(201).json({ success: true, data: newZone });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({ success: false, message: 'Zone ID already exists' });
      return;
    }
    next(error);
  }
};

export const updateZone = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const updatedZone = await RestrictedZone.findOneAndUpdate(
      { $or: [{ zoneId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedZone) {
      res.status(404).json({ success: false, message: `Zone with ID ${id} not found` });
      return;
    }

    // Audit log
    const logCount = await AuditLog.countDocuments();
    await AuditLog.create({
      eventId: `EVT-${100 + logCount + 1}`,
      operatorId: 'OPERATOR_1',
      eventType: 'ZONE_UPDATED',
      targetId: updatedZone.zoneId,
      action: `Updated restricted zone: ${updatedZone.name}`,
      reason: 'USER_ACTION',
      metadata: { zoneId: updatedZone.zoneId },
    });

    res.json({ success: true, data: updatedZone });
  } catch (error) {
    next(error);
  }
};

export const deleteZone = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const deletedZone = await RestrictedZone.findOneAndDelete({
      $or: [{ zoneId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!deletedZone) {
      res.status(404).json({ success: false, message: `Zone with ID ${id} not found` });
      return;
    }

    // Audit log
    const logCount = await AuditLog.countDocuments();
    await AuditLog.create({
      eventId: `EVT-${100 + logCount + 1}`,
      operatorId: 'OPERATOR_1',
      eventType: 'ZONE_DELETED',
      targetId: deletedZone.zoneId,
      action: `Deleted restricted zone: ${deletedZone.name}`,
      reason: 'USER_ACTION',
      metadata: { zoneId: deletedZone.zoneId },
    });

    res.json({ success: true, message: 'Zone deleted successfully', data: deletedZone });
  } catch (error) {
    next(error);
  }
};

export const checkPointInZone = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const lat = Number(req.body?.lat ?? req.query?.lat);
    const lon = Number(req.body?.lon ?? req.query?.lon);

    if (isNaN(lat) || isNaN(lon)) {
      res.status(400).json({ success: false, message: 'Valid lat and lon numbers are required' });
      return;
    }

    const evaluation = await evaluateGeofence(lat, lon);

    res.json({
      success: true,
      data: {
        latitude: lat,
        longitude: lon,
        isInsideRestricted: evaluation.isInsideRestricted,
        highestSeverity: evaluation.highestSeverity,
        matchingZoneIds: evaluation.zoneIds,
        matchingZoneNames: evaluation.zoneNames,
      },
    });
  } catch (error) {
    next(error);
  }
};
