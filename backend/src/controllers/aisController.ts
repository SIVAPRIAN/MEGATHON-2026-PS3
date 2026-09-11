import { Request, Response, NextFunction } from 'express';
import { AISData } from '../models/AISData';
import { correlateTargetWithAIS } from '../services/aisCorrelationService';

export const ingestAISFeed = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      mmsi,
      latitude,
      longitude,
      speed = 0,
      sog,
      heading = 0,
      cog,
      vesselName,
      vesselType,
      imo,
      callSign,
      callsign,
      flag,
      status,
      length,
      width,
      draft,
      cargo,
      transceiver,
      timestamp,
      dataSource = 'SYNTHETIC_DATASET',
    } = req.body;

    if (!mmsi || latitude === undefined || longitude === undefined) {
      res.status(400).json({ success: false, message: 'mmsi, latitude, and longitude are required' });
      return;
    }

    const obsTime = timestamp ? new Date(timestamp) : new Date();

    const aisRecord = await AISData.findOneAndUpdate(
      { mmsi, timestamp: obsTime },
      {
        $set: {
          mmsi,
          vesselName: vesselName || `MMSI-${mmsi}`,
          latitude,
          longitude,
          position: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          speed: sog !== undefined ? sog : speed,
          sog: sog !== undefined ? sog : speed,
          cog,
          heading,
          vesselType: vesselType || 'Cargo',
          imo,
          callSign: callSign || callsign,
          callsign: callSign || callsign,
          flag,
          status,
          length,
          width,
          draft,
          cargo,
          transceiver,
          timestamp: obsTime,
          dataSource,
          isSyntheticDemo: true,
        },
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, message: 'AIS feed observation ingested', data: aisRecord });
  } catch (error) {
    next(error);
  }
};

export const getAISTargets = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { search, dataSource, near, radiusMeters = 50000, limit = 100 } = req.query;
    const filter: any = {};

    if (dataSource && typeof dataSource === 'string' && dataSource !== 'ALL') {
      filter.dataSource = dataSource;
    }

    if (search && typeof search === 'string') {
      filter.$or = [
        { mmsi: { $regex: search, $options: 'i' } },
        { vesselName: { $regex: search, $options: 'i' } },
        { callSign: { $regex: search, $options: 'i' } },
        { imo: { $regex: search, $options: 'i' } },
      ];
    }

    // Geographic Proximity Query using MongoDB 2dsphere $near / $maxDistance
    if (near && typeof near === 'string') {
      const parts = near.split(',').map((p) => parseFloat(p.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        const [nearLon, nearLat] = parts;
        filter.position = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [nearLon, nearLat],
            },
            $maxDistance: Number(radiusMeters),
          },
        };
      }
    }

    const maxLimit = Math.min(1000, Math.max(1, Number(limit)));
    const targets = await AISData.find(filter).sort({ timestamp: -1 }).limit(maxLimit);

    res.json({
      success: true,
      count: targets.length,
      data: targets,
    });
  } catch (error) {
    next(error);
  }
};

export const getAISTargetByMMSI = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { mmsi } = req.params;
    const target = await AISData.findOne({ mmsi }).sort({ timestamp: -1 });

    if (!target) {
      res.status(404).json({ success: false, message: `AIS Target with MMSI ${mmsi} not found` });
      return;
    }

    res.json({ success: true, data: target });
  } catch (error) {
    next(error);
  }
};

export const getAISHistoryByMMSI = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { mmsi } = req.params;
    const { limit = 100 } = req.query;

    const observations = await AISData.find({ mmsi })
      .sort({ timestamp: 1 })
      .limit(Number(limit));

    if (observations.length === 0) {
      res.status(404).json({ success: false, message: `No AIS observation history found for MMSI ${mmsi}` });
      return;
    }

    res.json({
      success: true,
      mmsi,
      count: observations.length,
      vesselName: observations[0].vesselName,
      data: observations,
    });
  } catch (error) {
    next(error);
  }
};

export const correlateAIS = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { lat, lon, heading, maxRadiusMeters = 2000 } = req.body;

    if (lat === undefined || lon === undefined) {
      res.status(400).json({ success: false, message: 'lat and lon are required for correlation' });
      return;
    }

    const result = await correlateTargetWithAIS(
      Number(lat),
      Number(lon),
      heading ? Number(heading) : undefined,
      Number(maxRadiusMeters)
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
