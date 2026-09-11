import { Request, Response, NextFunction } from 'express';
import { Track } from '../models/Track';

export const getTracks = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, cameraId, vesselId } = req.query;
    const filter: any = {};

    if (status && typeof status === 'string') {
      filter.trackingStatus = status;
    }
    if (cameraId && typeof cameraId === 'string') {
      filter.cameraId = cameraId;
    }
    if (vesselId && typeof vesselId === 'string') {
      filter.vesselId = vesselId;
    }

    const tracks = await Track.find(filter).sort({ lastSeen: -1 }).limit(100);

    res.json({
      success: true,
      count: tracks.length,
      data: tracks,
    });
  } catch (error) {
    next(error);
  }
};

export const getTrackById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const track = await Track.findOne({
      $or: [{ trackId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!track) {
      res.status(404).json({ success: false, message: `Track with ID ${id} not found` });
      return;
    }

    res.json({ success: true, data: track });
  } catch (error) {
    next(error);
  }
};

export const getTrackHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const track = await Track.findOne({
      $or: [{ trackId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!track) {
      res.status(404).json({ success: false, message: `Track with ID ${id} not found` });
      return;
    }

    res.json({
      success: true,
      trackId: track.trackId,
      pointsCount: track.history.length,
      data: track.history,
    });
  } catch (error) {
    next(error);
  }
};

export const createTrack = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const trackData = req.body;
    if (!trackData.trackId) {
      const count = await Track.countDocuments();
      trackData.trackId = `V-${String(count + 1).padStart(2, '0')}`;
    }

    const newTrack = await Track.create(trackData);
    res.status(201).json({ success: true, data: newTrack });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({ success: false, message: 'Track ID already exists' });
      return;
    }
    next(error);
  }
};

export const updateTrack = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const updatedTrack = await Track.findOneAndUpdate(
      { $or: [{ trackId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedTrack) {
      res.status(404).json({ success: false, message: `Track with ID ${id} not found` });
      return;
    }

    res.json({ success: true, data: updatedTrack });
  } catch (error) {
    next(error);
  }
};

export const closeTrack = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const closedTrack = await Track.findOneAndUpdate(
      { $or: [{ trackId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] },
      { $set: { trackingStatus: 'CLOSED' } },
      { new: true }
    );

    if (!closedTrack) {
      res.status(404).json({ success: false, message: `Track with ID ${id} not found` });
      return;
    }

    res.json({ success: true, message: `Track ${id} marked as CLOSED`, data: closedTrack });
  } catch (error) {
    next(error);
  }
};
