import { INDIAN_COASTAL_SENSOR_SITES, CoastalSensorSite } from './indiaCoastalSensorSites';
import { EOCamera } from '../types/maritime';

/**
 * 87 Official DGLL NAIS Physical Shore Stations (PSS)
 * Re-exported as MOCK_CAMERAS for seamless compatibility across map controllers.
 * PSS-051 (Madras Lighthouse) is anchored as primary demonstration EO camera CAM-04.
 */
export const MOCK_CAMERAS: (EOCamera | CoastalSensorSite)[] = INDIAN_COASTAL_SENSOR_SITES.map((cam) => {
  if (cam.id === 'PSS-051' || cam.siteName === 'Madras') {
    return {
      ...cam,
      id: 'CAM-04',
      stationCode: 'PSS-051',
      name: 'PSS Madras (CAM-04)',
      status: 'DEMO ACTIVE' as const,
    };
  }
  return cam;
});

export { INDIAN_COASTAL_SENSOR_SITES };
