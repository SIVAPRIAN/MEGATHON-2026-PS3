import { Request, Response, NextFunction } from 'express';
import { Alert } from '../models/Alert';
import { createSurveillanceAlert, applyAlertDisposition } from '../services/alertService';
import { AuditLog } from '../models/AuditLog';

export const getAlerts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { currentState, priority, type, targetId } = req.query;
    const filter: any = {};

    if (currentState && typeof currentState === 'string') filter.currentState = currentState;
    if (priority && typeof priority === 'string') filter.priority = priority;
    if (type && typeof type === 'string') filter.type = type;
    if (targetId && typeof targetId === 'string') filter.targetId = targetId;

    const alerts = await Alert.find(filter).sort({ createdAt: -1 }).limit(100);

    res.json({
      success: true,
      count: alerts.length,
      data: alerts,
    });
  } catch (error) {
    next(error);
  }
};

export const getAlertById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const alert = await Alert.findOne({
      $or: [{ alertId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!alert) {
      res.status(404).json({ success: false, message: `Alert with ID ${id} not found` });
      return;
    }

    res.json({ success: true, data: alert });
  } catch (error) {
    next(error);
  }
};

export const createAlert = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const newAlert = await createSurveillanceAlert(req.body);
    res.status(201).json({ success: true, data: newAlert });
  } catch (error) {
    next(error);
  }
};

export const acknowledgeAlert = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { operatorId = 'OPERATOR_1' } = req.body;

    const alert = await Alert.findOneAndUpdate(
      { $or: [{ alertId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] },
      {
        $set: {
          acknowledgedBy: operatorId,
          acknowledgedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!alert) {
      res.status(404).json({ success: false, message: `Alert with ID ${id} not found` });
      return;
    }

    // Audit log
    const logCount = await AuditLog.countDocuments();
    await AuditLog.create({
      eventId: `EVT-${100 + logCount + 1}`,
      operatorId,
      eventType: 'ALERT_CONFIRMED',
      targetId: alert.alertId,
      action: `Operator ${operatorId} acknowledged alert ${alert.alertId}`,
      reason: 'OPERATOR_ACK',
      metadata: { alertId: alert.alertId },
    });

    res.json({ success: true, data: alert });
  } catch (error) {
    next(error);
  }
};

export const resolveAlert = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { operatorId = 'OPERATOR_1', notes } = req.body;

    const alert = await Alert.findOneAndUpdate(
      { $or: [{ alertId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] },
      {
        $set: {
          currentState: 'RESOLVED',
          'disposition.operatorId': operatorId,
          'disposition.timestamp': new Date(),
          'disposition.action': 'CONFIRM',
          'disposition.reason': 'AUTHORIZED_ACTIVITY',
          'disposition.notes': notes || 'Resolved by operator',
        },
      },
      { new: true }
    );

    if (!alert) {
      res.status(404).json({ success: false, message: `Alert with ID ${id} not found` });
      return;
    }

    // Audit log
    const logCount = await AuditLog.countDocuments();
    await AuditLog.create({
      eventId: `EVT-${100 + logCount + 1}`,
      operatorId,
      eventType: 'ALERT_CONFIRMED',
      targetId: alert.alertId,
      action: `Resolved alert ${alert.alertId}`,
      reason: 'RESOLUTION',
      metadata: { alertId: alert.alertId, notes },
    });

    res.json({ success: true, message: `Alert ${id} resolved successfully`, data: alert });
  } catch (error) {
    next(error);
  }
};

export const dispositionAlert = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { operatorId = 'OPERATOR_1', action, reason, notes } = req.body;

    if (!action || !reason) {
      res.status(400).json({ success: false, message: 'Action and reason fields are required' });
      return;
    }

    const updatedAlert = await applyAlertDisposition(id, operatorId, action, reason, notes);

    if (!updatedAlert) {
      res.status(404).json({ success: false, message: `Alert with ID ${id} not found` });
      return;
    }

    res.json({ success: true, data: updatedAlert });
  } catch (error) {
    next(error);
  }
};
