import { Request, Response, NextFunction } from 'express';
import { PatrolUnit } from '../models/PatrolUnit';
import { AuditLog } from '../models/AuditLog';

export const getPatrols = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, available } = req.query;
    const filter: any = {};

    if (status && typeof status === 'string') filter.status = status;
    if (available !== undefined) filter.availability = available === 'true';

    const patrols = await PatrolUnit.find(filter).sort({ patrolId: 1 });

    res.json({
      success: true,
      count: patrols.length,
      data: patrols,
    });
  } catch (error) {
    next(error);
  }
};

export const getPatrolById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const patrol = await PatrolUnit.findOne({
      $or: [{ patrolId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!patrol) {
      res.status(404).json({ success: false, message: `Patrol Unit with ID ${id} not found` });
      return;
    }

    res.json({ success: true, data: patrol });
  } catch (error) {
    next(error);
  }
};

export const createPatrol = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const patrolData = req.body;
    if (!patrolData.patrolId) {
      const count = await PatrolUnit.countDocuments();
      patrolData.patrolId = `PATROL-${String(count + 1).padStart(2, '0')}`;
    }

    const newPatrol = await PatrolUnit.create(patrolData);
    res.status(201).json({ success: true, data: newPatrol });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({ success: false, message: 'Patrol unit ID already exists' });
      return;
    }
    next(error);
  }
};

export const updatePatrol = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const updatedPatrol = await PatrolUnit.findOneAndUpdate(
      { $or: [{ patrolId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedPatrol) {
      res.status(404).json({ success: false, message: `Patrol Unit with ID ${id} not found` });
      return;
    }

    res.json({ success: true, data: updatedPatrol });
  } catch (error) {
    next(error);
  }
};

export const assignPatrol = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { alertId, operatorId = 'OPERATOR_1' } = req.body;

    if (!alertId) {
      res.status(400).json({ success: false, message: 'alertId is required for patrol dispatch' });
      return;
    }

    const patrol = await PatrolUnit.findOneAndUpdate(
      { $or: [{ patrolId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] },
      {
        $set: {
          status: 'RESPONDING',
          assignedAlert: alertId,
          availability: false,
        },
      },
      { new: true }
    );

    if (!patrol) {
      res.status(404).json({ success: false, message: `Patrol Unit with ID ${id} not found` });
      return;
    }

    // Audit log
    const logCount = await AuditLog.countDocuments();
    await AuditLog.create({
      eventId: `EVT-${100 + logCount + 1}`,
      operatorId,
      eventType: 'PATROL_ASSIGNED',
      targetId: patrol.patrolId,
      action: `Assigned patrol unit ${patrol.name} (${patrol.patrolId}) to alert ${alertId}`,
      reason: 'INCIDENT_RESPONSE',
      metadata: { patrolId: patrol.patrolId, alertId },
    });

    res.json({ success: true, message: `Patrol ${patrol.name} dispatched to alert ${alertId}`, data: patrol });
  } catch (error) {
    next(error);
  }
};

export const releasePatrol = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { operatorId = 'OPERATOR_1' } = req.body;

    const patrol = await PatrolUnit.findOneAndUpdate(
      { $or: [{ patrolId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] },
      {
        $set: {
          status: 'AVAILABLE',
          assignedAlert: null,
          availability: true,
        },
      },
      { new: true }
    );

    if (!patrol) {
      res.status(404).json({ success: false, message: `Patrol Unit with ID ${id} not found` });
      return;
    }

    // Audit log
    const logCount = await AuditLog.countDocuments();
    await AuditLog.create({
      eventId: `EVT-${100 + logCount + 1}`,
      operatorId,
      eventType: 'PATROL_ASSIGNED',
      targetId: patrol.patrolId,
      action: `Released patrol unit ${patrol.name} (${patrol.patrolId}) back to available status`,
      reason: 'INCIDENT_STAND_DOWN',
      metadata: { patrolId: patrol.patrolId },
    });

    res.json({ success: true, message: `Patrol ${patrol.name} released to available status`, data: patrol });
  } catch (error) {
    next(error);
  }
};
