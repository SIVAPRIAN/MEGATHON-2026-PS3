import { Request, Response, NextFunction } from 'express';
import { Camera } from '../models/Camera';
import { AuditLog } from '../models/AuditLog';

export const getCameras = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, type } = req.query;
    const filter: any = {};

    if (status && typeof status === 'string') filter.status = status;
    if (type && typeof type === 'string') filter.cameraType = type;

    const cameras = await Camera.find(filter).sort({ cameraId: 1 });

    res.json({
      success: true,
      count: cameras.length,
      data: cameras,
    });
  } catch (error) {
    next(error);
  }
};

export const getCameraById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const camera = await Camera.findOne({
      $or: [{ cameraId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!camera) {
      res.status(404).json({ success: false, message: `Camera with ID ${id} not found` });
      return;
    }

    res.json({ success: true, data: camera });
  } catch (error) {
    next(error);
  }
};

export const addCamera = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const cameraData = req.body;
    if (!cameraData.cameraId) {
      const count = await Camera.countDocuments();
      cameraData.cameraId = `CAM-${String(count + 1).padStart(2, '0')}`;
    }

    const newCamera = await Camera.create(cameraData);
    res.status(201).json({ success: true, data: newCamera });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({ success: false, message: 'Camera ID already exists' });
      return;
    }
    next(error);
  }
};

export const updateCamera = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const updatedCamera = await Camera.findOneAndUpdate(
      { $or: [{ cameraId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedCamera) {
      res.status(404).json({ success: false, message: `Camera with ID ${id} not found` });
      return;
    }

    res.json({ success: true, data: updatedCamera });
  } catch (error) {
    next(error);
  }
};

export const updateCameraStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, operatorId = 'SYSTEM' } = req.body;

    if (!status) {
      res.status(400).json({ success: false, message: 'Status field is required' });
      return;
    }

    const camera = await Camera.findOneAndUpdate(
      { $or: [{ cameraId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] },
      { $set: { status } },
      { new: true }
    );

    if (!camera) {
      res.status(404).json({ success: false, message: `Camera with ID ${id} not found` });
      return;
    }

    // Append to audit log
    const logCount = await AuditLog.countDocuments();
    await AuditLog.create({
      eventId: `EVT-${100 + logCount + 1}`,
      operatorId,
      eventType: 'CAMERA_STATUS_CHANGED',
      targetId: camera.cameraId,
      action: `Changed camera ${camera.cameraId} status to ${status}`,
      reason: 'OPERATOR_COMMAND',
      metadata: { cameraId: camera.cameraId, newStatus: status },
    });

    res.json({ success: true, data: camera });
  } catch (error) {
    next(error);
  }
};
