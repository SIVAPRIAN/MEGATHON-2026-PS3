import { Request, Response, NextFunction } from 'express';
import { Vessel } from '../models/Vessel';

export const getVessels = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, vesselType, authorizationStatus, search, geofenceStatus } = req.query;

    const filter: any = {};
    if (status && typeof status === 'string' && status !== 'ALL') {
      filter.status = status;
    }
    if (vesselType && typeof vesselType === 'string') {
      filter.vesselType = vesselType;
    }
    if (authorizationStatus && typeof authorizationStatus === 'string') {
      filter.authorizationStatus = authorizationStatus;
    }
    if (geofenceStatus && typeof geofenceStatus === 'string') {
      filter.geofenceStatus = geofenceStatus;
    }
    if (search && typeof search === 'string') {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { vesselId: { $regex: search, $options: 'i' } },
        { mmsi: { $regex: search, $options: 'i' } },
      ];
    }

    const vessels = await Vessel.find(filter).sort({ updatedAt: -1 }).limit(200);

    res.json({
      success: true,
      count: vessels.length,
      data: vessels,
    });
  } catch (error) {
    next(error);
  }
};

export const getVesselById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const vessel = await Vessel.findOne({
      $or: [{ vesselId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!vessel) {
      res.status(404).json({ success: false, message: `Vessel with ID ${id} not found` });
      return;
    }

    res.json({ success: true, data: vessel });
  } catch (error) {
    next(error);
  }
};

export const createVessel = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const vesselData = req.body;
    if (!vesselData.vesselId) {
      const count = await Vessel.countDocuments();
      vesselData.vesselId = `VSL-${String(count + 1).padStart(3, '0')}`;
    }

    const newVessel = await Vessel.create(vesselData);
    res.status(201).json({ success: true, data: newVessel });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({ success: false, message: 'Vessel with this ID or MMSI already exists' });
      return;
    }
    next(error);
  }
};

export const updateVessel = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const updatedVessel = await Vessel.findOneAndUpdate(
      { $or: [{ vesselId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedVessel) {
      res.status(404).json({ success: false, message: `Vessel with ID ${id} not found` });
      return;
    }

    res.json({ success: true, data: updatedVessel });
  } catch (error) {
    next(error);
  }
};

export const deleteVessel = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const deletedVessel = await Vessel.findOneAndDelete({
      $or: [{ vesselId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!deletedVessel) {
      res.status(404).json({ success: false, message: `Vessel with ID ${id} not found` });
      return;
    }

    res.json({ success: true, message: 'Vessel deleted successfully', data: deletedVessel });
  } catch (error) {
    next(error);
  }
};
