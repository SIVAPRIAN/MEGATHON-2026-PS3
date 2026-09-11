import { ZoneType } from '../types/maritime';

export interface AuthorisedRegistryEntry {
  identifier: string; // MMSI, CallSign, or Vessel ID
  registeredName: string;
  callSign?: string;
  organisation: 'INDIAN NAVY' | 'INDIAN COAST GUARD' | 'PORT OF CHENNAI' | 'MERCHANT MARINE' | 'LICENSED FISHERIES';
  permitType: 'UNRESTRICTED_NAVAL' | 'COASTAL_TRANSIT' | 'COMMERCIAL_APPROVED' | 'INSHORE_LICENSED';
  allowedZoneTypes: ZoneType[]; // Which zones this vessel is cleared to enter
  altitudeEnvelope: {
    minAltitudeMeters: number; // e.g. 0m sea level
    maxAltitudeMeters: number; // e.g. 45m mast height or 120m UAV corridor
    maxSpeedKnots: number;
  };
  validUntil: string;
}

/**
 * Official Authorised Maritime & Coastal Registry
 * Used by the Geofence & Surveillance Engine to validate every position report.
 */
export const AUTHORISED_REGISTRY: AuthorisedRegistryEntry[] = [
  {
    identifier: 'VSL-001',
    registeredName: 'INS CHENNAI (D65)',
    callSign: 'VWCJ',
    organisation: 'INDIAN NAVY',
    permitType: 'UNRESTRICTED_NAVAL',
    allowedZoneTypes: ['RED', 'YELLOW', 'GREEN', 'RESTRICTED'],
    altitudeEnvelope: {
      minAltitudeMeters: 0,
      maxAltitudeMeters: 55,
      maxSpeedKnots: 32,
    },
    validUntil: '2030-12-31',
  },
  {
    identifier: 'VSL-002',
    registeredName: 'ICGS SAMUDRA PAHERIDAR',
    callSign: 'AVSK',
    organisation: 'INDIAN COAST GUARD',
    permitType: 'UNRESTRICTED_NAVAL',
    allowedZoneTypes: ['RED', 'YELLOW', 'GREEN', 'RESTRICTED'],
    altitudeEnvelope: {
      minAltitudeMeters: 0,
      maxAltitudeMeters: 40,
      maxSpeedKnots: 28,
    },
    validUntil: '2029-12-31',
  },
  {
    identifier: '503891240', // VSL-003 MMSI
    registeredName: 'MAERSK DHARWAD',
    callSign: '9V8201',
    organisation: 'MERCHANT MARINE',
    permitType: 'COMMERCIAL_APPROVED',
    allowedZoneTypes: ['YELLOW', 'GREEN'], // NOT allowed in RED exclusion zones
    altitudeEnvelope: {
      minAltitudeMeters: 0,
      maxAltitudeMeters: 48,
      maxSpeedKnots: 24,
    },
    validUntil: '2028-06-30',
  },
  {
    identifier: 'VSL-003',
    registeredName: 'MAERSK DHARWAD',
    callSign: '9V8201',
    organisation: 'MERCHANT MARINE',
    permitType: 'COMMERCIAL_APPROVED',
    allowedZoneTypes: ['YELLOW', 'GREEN'], // NOT allowed in RED exclusion zones
    altitudeEnvelope: {
      minAltitudeMeters: 0,
      maxAltitudeMeters: 48,
      maxSpeedKnots: 24,
    },
    validUntil: '2028-06-30',
  },
  {
    identifier: 'VSL-004',
    registeredName: 'TUG SAGAR 04',
    callSign: 'ATUG',
    organisation: 'PORT OF CHENNAI',
    permitType: 'COASTAL_TRANSIT',
    allowedZoneTypes: ['YELLOW', 'GREEN'],
    altitudeEnvelope: {
      minAltitudeMeters: 0,
      maxAltitudeMeters: 25,
      maxSpeedKnots: 14,
    },
    validUntil: '2027-12-31',
  },
  {
    identifier: 'VSL-011',
    registeredName: 'CHENNAI TRADER',
    callSign: 'ATRD',
    organisation: 'MERCHANT MARINE',
    permitType: 'COMMERCIAL_APPROVED',
    allowedZoneTypes: ['YELLOW', 'GREEN'], // Prohibited from RED zones!
    altitudeEnvelope: {
      minAltitudeMeters: 0,
      maxAltitudeMeters: 45,
      maxSpeedKnots: 20,
    },
    validUntil: '2028-12-31',
  },
  {
    identifier: 'VSL-010',
    registeredName: 'SWARNA GODAVARI',
    callSign: 'ASGD',
    organisation: 'MERCHANT MARINE',
    permitType: 'COMMERCIAL_APPROVED',
    allowedZoneTypes: ['YELLOW', 'GREEN'],
    altitudeEnvelope: {
      minAltitudeMeters: 0,
      maxAltitudeMeters: 45,
      maxSpeedKnots: 18,
    },
    validUntil: '2028-12-31',
  },
  {
    identifier: 'IN-UAV-01',
    registeredName: 'COASTAL PATROL UAV-01',
    callSign: 'DRN1',
    organisation: 'INDIAN COAST GUARD',
    permitType: 'UNRESTRICTED_NAVAL',
    allowedZoneTypes: ['RED', 'YELLOW', 'GREEN', 'RESTRICTED'],
    altitudeEnvelope: {
      minAltitudeMeters: 25,
      maxAltitudeMeters: 120, // Coastal surveillance altitude corridor: 25m - 120m
      maxSpeedKnots: 95,
    },
    validUntil: '2030-01-01',
  },
];

/**
 * Checks an identifier against the official authorised registry
 */
export function checkAuthorisedRegistry(
  vesselId: string,
  mmsi?: string
): AuthorisedRegistryEntry | null {
  const match = AUTHORISED_REGISTRY.find(
    (entry) =>
      entry.identifier === vesselId ||
      (mmsi && entry.identifier === mmsi) ||
      (entry.callSign && entry.callSign === vesselId)
  );
  return match || null;
}
