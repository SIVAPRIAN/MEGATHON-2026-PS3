import { Request, Response, NextFunction } from 'express';
import { AuditLog } from '../models/AuditLog';

export const getAuditLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { eventType, targetId, limit = 100 } = req.query;
    const filter: any = {};

    if (eventType && typeof eventType === 'string') filter.eventType = eventType;
    if (targetId && typeof targetId === 'string') filter.targetId = targetId;

    const logs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(Number(limit));

    res.json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

export const createAuditLog = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const logData = req.body;
    if (!logData.eventId) {
      logData.eventId = `EVT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    }

    const log = await AuditLog.findOneAndUpdate(
      { eventId: logData.eventId },
      { $set: logData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
};
