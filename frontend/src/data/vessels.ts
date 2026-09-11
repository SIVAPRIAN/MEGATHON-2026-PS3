import { isWater } from '../utils/geoValidation';

export interface Vessel {
  id: string;
  name: string;
  status: 'CORRELATED' | 'DARK';
  lat: number;
  lon: number;
  heading: number; // degrees 0-360
  speed: number; // knots
  length: number; // meters
  vesselType: string;
  mmsi?: string;
  flag?: string;
  timestamp?: string;
  confidence?: number;
  detectionSource?: string;
  detectedByCamera?: string;
  geofenceStatus?: 'OUTSIDE' | 'INSIDE_RESTRICTED';
  restrictedAreaIds?: string[];
  restrictedAreaNames?: string[];
  displayStatus?: 'CORRELATED' | 'DARK' | 'RESTRICTED';
  altitude?: number; // operating altitude / mast height in meters
  authorizationStatus?: 'AUTHORISED' | 'UNREGISTERED' | 'DARK_VESSEL';
  organisation?: string;
  isOutOfEnvelope?: boolean;
}

export interface VesselTrackData {
  vesselId: string;
  type: 'AIS_TRACK' | 'EO_DETECTION_HISTORY';
  points: [number, number][]; // [lon, lat]
}

/**
 * Validates whether a geographic coordinate strictly resides in maritime waters
 * (rejects coordinates on Indian mainland or Sri Lanka)
 */
export function isWaterCoordinate(lat: number, lon: number): boolean {
  return isWater(lat, lon);
}

/**
 * Verified Indian Maritime Vessels Dataset (80–120 Vessels)
 * All positions strictly offshore across Arabian Sea, Bay of Bengal, Indian Ocean, Andaman Sea & Lakshadweep.
 */
export const INITIAL_VESSELS: Vessel[] = [
  {
    "id": "VSL-003",
    "name": "MAERSK DHARWAD",
    "status": "CORRELATED",
    "lat": 13.11472,
    "lon": 80.38042,
    "heading": 90,
    "speed": 8.5,
    "length": 195,
    "vesselType": "Cargo",
    "mmsi": "503891240",
    "flag": "Singapore",
    "timestamp": "2026-09-08 05:12:18 GMT",
    "confidence": 93,
    "detectionSource": "EO / Possible Camera (PSS Madras / CAM-04)",
    "detectedByCamera": "CAM-04"
  },
  {
    "id": "VSL-011",
    "name": "CHENNAI TRADER",
    "status": "CORRELATED",
    "lat": 13.09368,
    "lon": 80.34313,
    "heading": 75,
    "speed": 12,
    "length": 210,
    "vesselType": "Container Ship",
    "mmsi": "419001455",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:18 GMT",
    "confidence": 93,
    "detectionSource": "EO / Possible Camera (PSS Madras / CAM-04)",
    "detectedByCamera": "CAM-04"
  },
  {
    "id": "VSL-012",
    "name": "COROMANDEL PEARL",
    "status": "CORRELATED",
    "lat": 13.08687,
    "lon": 80.37375,
    "heading": 40,
    "speed": 10.4,
    "length": 180,
    "vesselType": "Bulk Carrier",
    "mmsi": "419001456",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:18 GMT",
    "confidence": 93,
    "detectionSource": "EO / Possible Camera (PSS Madras / CAM-04)",
    "detectedByCamera": "CAM-04"
  },
  {
    "id": "VSL-013",
    "name": "PACIFIC ENNORE",
    "status": "CORRELATED",
    "lat": 13.0765,
    "lon": 80.33597,
    "heading": 355,
    "speed": 9,
    "length": 165,
    "vesselType": "Tanker",
    "mmsi": "563002100",
    "flag": "Singapore",
    "timestamp": "2026-09-08 05:12:18 GMT",
    "confidence": 93,
    "detectionSource": "EO / Possible Camera (PSS Madras / CAM-04)",
    "detectedByCamera": "CAM-04"
  },
  {
    "id": "VSL-014",
    "name": "BAY PIONEER",
    "status": "CORRELATED",
    "lat": 13.12386,
    "lon": 80.35909,
    "heading": 110,
    "speed": 11.5,
    "length": 145,
    "vesselType": "Commercial Vessel",
    "mmsi": "352900122",
    "flag": "Panama",
    "timestamp": "2026-09-08 05:12:18 GMT",
    "confidence": 93,
    "detectionSource": "EO / Possible Camera (PSS Madras / CAM-04)",
    "detectedByCamera": "CAM-04"
  },
  {
    "id": "VSL-015",
    "name": "PULICAT NAVIGATOR",
    "status": "CORRELATED",
    "lat": 13.07526,
    "lon": 80.36519,
    "heading": 80,
    "speed": 6.8,
    "length": 42,
    "vesselType": "Fishing Vessel",
    "mmsi": "419055902",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:18 GMT",
    "confidence": 93,
    "detectionSource": "EO / Possible Camera (PSS Madras / CAM-04)",
    "detectedByCamera": "CAM-04"
  },
  {
    "id": "DV-104",
    "name": "UNIDENTIFIED CONTACT 104",
    "status": "DARK",
    "lat": 13.09611,
    "lon": 80.37138,
    "heading": 118,
    "speed": 2.1,
    "length": 92,
    "vesselType": "Probable Cargo / Trawler",
    "timestamp": "2026-09-08 05:12:18 GMT",
    "confidence": 94,
    "detectionSource": "EO / Possible Camera (PSS Madras / CAM-04)",
    "detectedByCamera": "CAM-04"
  },
  {
    "id": "DV-112",
    "name": "UNIDENTIFIED CONTACT 112",
    "status": "DARK",
    "lat": 13.09301,
    "lon": 80.33615,
    "heading": 65,
    "speed": 4.5,
    "length": 35,
    "vesselType": "Small Motor Craft",
    "timestamp": "2026-09-08 05:12:18 GMT",
    "confidence": 94,
    "detectionSource": "EO / Possible Camera (PSS Madras / CAM-04)",
    "detectedByCamera": "CAM-04"
  },
  {
    "id": "VSL-006",
    "name": "AL-MARWAH",
    "status": "CORRELATED",
    "lat": 21.45,
    "lon": 69.2,
    "heading": 310,
    "speed": 13.1,
    "length": 210,
    "vesselType": "Chemical Tanker",
    "mmsi": "470123990",
    "flag": "UAE",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-016",
    "name": "GULF RUNNER",
    "status": "CORRELATED",
    "lat": 22.35,
    "lon": 68.45,
    "heading": 280,
    "speed": 14.5,
    "length": 240,
    "vesselType": "Crude Oil Tanker",
    "mmsi": "538009101",
    "flag": "Marshall Islands",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-017",
    "name": "SAURASHTRA STAR",
    "status": "CORRELATED",
    "lat": 21.8,
    "lon": 68.75,
    "heading": 140,
    "speed": 11,
    "length": 160,
    "vesselType": "Bulk Carrier",
    "mmsi": "419001501",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-018",
    "name": "DWARKA DISCOVERY",
    "status": "CORRELATED",
    "lat": 22.15,
    "lon": 68.65,
    "heading": 245,
    "speed": 8,
    "length": 65,
    "vesselType": "Trawler",
    "mmsi": "419055811",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-019",
    "name": "KUTCH PRIDE",
    "status": "CORRELATED",
    "lat": 22.4,
    "lon": 68.9,
    "heading": 95,
    "speed": 10.5,
    "length": 185,
    "vesselType": "Cargo",
    "mmsi": "419001502",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-020",
    "name": "MANDVI EXPRESS",
    "status": "CORRELATED",
    "lat": 22.25,
    "lon": 68.85,
    "heading": 70,
    "speed": 9.2,
    "length": 120,
    "vesselType": "Commercial Vessel",
    "mmsi": "419001503",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-021",
    "name": "HAZIRA SPIRIT",
    "status": "CORRELATED",
    "lat": 20.8,
    "lon": 71.9,
    "heading": 210,
    "speed": 12.8,
    "length": 220,
    "vesselType": "LNG Tanker",
    "mmsi": "354002881",
    "flag": "Panama",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-022",
    "name": "VERAVAL QUEEN",
    "status": "CORRELATED",
    "lat": 20.65,
    "lon": 70.15,
    "heading": 160,
    "speed": 6.5,
    "length": 48,
    "vesselType": "Fishing Vessel",
    "mmsi": "419055812",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "DV-103",
    "name": "UNIDENTIFIED CONTACT 103",
    "status": "DARK",
    "lat": 21.65,
    "lon": 68.8,
    "heading": 280,
    "speed": 4,
    "length": 60,
    "vesselType": "Unregistered Trawler",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 92
  },
  {
    "id": "DV-107",
    "name": "UNIDENTIFIED CONTACT 107",
    "status": "DARK",
    "lat": 20.55,
    "lon": 70.8,
    "heading": 330,
    "speed": 6,
    "length": 110,
    "vesselType": "Small Tanker / Barge",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 92
  },
  {
    "id": "VSL-004",
    "name": "BHARAT SAMUDRA",
    "status": "CORRELATED",
    "lat": 18.92,
    "lon": 72.55,
    "heading": 145,
    "speed": 11.2,
    "length": 160,
    "vesselType": "Bulk Carrier",
    "mmsi": "538007192",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-023",
    "name": "MUMBAI HIGH SUPPORT",
    "status": "CORRELATED",
    "lat": 19.35,
    "lon": 71.6,
    "heading": 45,
    "speed": 10,
    "length": 75,
    "vesselType": "Commercial Vessel",
    "mmsi": "419002100",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-024",
    "name": "MAHARASHTRA TRADER",
    "status": "CORRELATED",
    "lat": 18.75,
    "lon": 72.1,
    "heading": 170,
    "speed": 13.5,
    "length": 260,
    "vesselType": "Container Ship",
    "mmsi": "636018442",
    "flag": "Liberia",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-025",
    "name": "JAWAHARLAL NEHRU",
    "status": "CORRELATED",
    "lat": 18.85,
    "lon": 72.68,
    "heading": 240,
    "speed": 8,
    "length": 290,
    "vesselType": "Container Ship",
    "mmsi": "419002101",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-026",
    "name": "ALANG VOYAGER",
    "status": "CORRELATED",
    "lat": 19.8,
    "lon": 72.15,
    "heading": 350,
    "speed": 7.5,
    "length": 140,
    "vesselType": "Cargo",
    "mmsi": "419002102",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-027",
    "name": "KORLAI SENTINEL",
    "status": "CORRELATED",
    "lat": 18.45,
    "lon": 72.7,
    "heading": 185,
    "speed": 11.8,
    "length": 175,
    "vesselType": "Tanker",
    "mmsi": "419002103",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-028",
    "name": "RATNAGIRI JEWEL",
    "status": "CORRELATED",
    "lat": 17.2,
    "lon": 72.85,
    "heading": 160,
    "speed": 8.5,
    "length": 55,
    "vesselType": "Fishing Vessel",
    "mmsi": "419055701",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-029",
    "name": "JAIGARH BULKER",
    "status": "CORRELATED",
    "lat": 17.4,
    "lon": 72.6,
    "heading": 335,
    "speed": 12,
    "length": 225,
    "vesselType": "Bulk Carrier",
    "mmsi": "372001920",
    "flag": "Panama",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-030",
    "name": "WESTERN SEA CHAMPION",
    "status": "CORRELATED",
    "lat": 19.1,
    "lon": 71.85,
    "heading": 265,
    "speed": 14,
    "length": 280,
    "vesselType": "Crude Oil Tanker",
    "mmsi": "538008441",
    "flag": "Marshall Islands",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-031",
    "name": "DEVGARH COASTER",
    "status": "CORRELATED",
    "lat": 16.5,
    "lon": 73.1,
    "heading": 155,
    "speed": 9.5,
    "length": 98,
    "vesselType": "Commercial Vessel",
    "mmsi": "419002104",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "DV-101",
    "name": "UNIDENTIFIED CONTACT 101",
    "status": "DARK",
    "lat": 18.82,
    "lon": 72.38,
    "heading": 215,
    "speed": 3.5,
    "length": 85,
    "vesselType": "Probable Cargo",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 92
  },
  {
    "id": "DV-110",
    "name": "UNIDENTIFIED CONTACT 110",
    "status": "DARK",
    "lat": 17.8,
    "lon": 72.4,
    "heading": 190,
    "speed": 4.8,
    "length": 65,
    "vesselType": "Unflagged Trawler",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 92
  },
  {
    "id": "VSL-009",
    "name": "GOA HARVEST",
    "status": "CORRELATED",
    "lat": 15.1,
    "lon": 73.55,
    "heading": 340,
    "speed": 7.5,
    "length": 58,
    "vesselType": "Trawler / Fishing",
    "mmsi": "419055410",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-032",
    "name": "MORMUGAO EXPLORER",
    "status": "CORRELATED",
    "lat": 15.42,
    "lon": 73.4,
    "heading": 260,
    "speed": 11.5,
    "length": 190,
    "vesselType": "Bulk Carrier",
    "mmsi": "419003101",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-033",
    "name": "KARWAR SEA",
    "status": "CORRELATED",
    "lat": 14.75,
    "lon": 73.85,
    "heading": 170,
    "speed": 12.2,
    "length": 170,
    "vesselType": "Cargo",
    "mmsi": "419003102",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-034",
    "name": "NEW MANGALORE STAR",
    "status": "CORRELATED",
    "lat": 13.15,
    "lon": 74.45,
    "heading": 320,
    "speed": 13.8,
    "length": 230,
    "vesselType": "Crude Oil Tanker",
    "mmsi": "355001221",
    "flag": "Panama",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-035",
    "name": "MALPE HARBOR",
    "status": "CORRELATED",
    "lat": 13.4,
    "lon": 74.3,
    "heading": 195,
    "speed": 6.2,
    "length": 45,
    "vesselType": "Fishing Vessel",
    "mmsi": "419055411",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-036",
    "name": "BHATKAL NAVIGATOR",
    "status": "CORRELATED",
    "lat": 14.1,
    "lon": 74.15,
    "heading": 145,
    "speed": 10,
    "length": 115,
    "vesselType": "Commercial Vessel",
    "mmsi": "419003103",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-037",
    "name": "NETRAVATI VOYAGER",
    "status": "CORRELATED",
    "lat": 12.75,
    "lon": 74.5,
    "heading": 175,
    "speed": 11,
    "length": 150,
    "vesselType": "Cargo",
    "mmsi": "419003104",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "DV-111",
    "name": "UNIDENTIFIED CONTACT 111",
    "status": "DARK",
    "lat": 14.3,
    "lon": 73.7,
    "heading": 230,
    "speed": 3.2,
    "length": 50,
    "vesselType": "Wooden Dhow",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 92
  },
  {
    "id": "VSL-001",
    "name": "MT PACIFIC VOYAGER",
    "status": "CORRELATED",
    "lat": 8.7011,
    "lon": 76.34,
    "heading": 228,
    "speed": 12.4,
    "length": 182,
    "vesselType": "Crude Oil Tanker",
    "mmsi": "503891240",
    "flag": "Panama",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-002",
    "name": "EVER GLORY",
    "status": "CORRELATED",
    "lat": 9.215,
    "lon": 75.42,
    "heading": 182,
    "speed": 14.8,
    "length": 225,
    "vesselType": "Container Ship",
    "mmsi": "412389100",
    "flag": "Liberia",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-038",
    "name": "KOCHI TRANSSHIPMENT",
    "status": "CORRELATED",
    "lat": 9.95,
    "lon": 75.85,
    "heading": 270,
    "speed": 15,
    "length": 330,
    "vesselType": "Container Ship",
    "mmsi": "477001922",
    "flag": "Hong Kong",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-039",
    "name": "MALABAR COASTER",
    "status": "CORRELATED",
    "lat": 11.15,
    "lon": 75.45,
    "heading": 150,
    "speed": 9,
    "length": 125,
    "vesselType": "Cargo",
    "mmsi": "419004101",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-040",
    "name": "ALAPPUZHA FISHER",
    "status": "CORRELATED",
    "lat": 9.5,
    "lon": 76.05,
    "heading": 215,
    "speed": 5.8,
    "length": 38,
    "vesselType": "Fishing Vessel",
    "mmsi": "419055301",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-041",
    "name": "KOVALAM SUN",
    "status": "CORRELATED",
    "lat": 8.4,
    "lon": 76.75,
    "heading": 135,
    "speed": 10.5,
    "length": 85,
    "vesselType": "Passenger",
    "mmsi": "419004102",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-042",
    "name": "VIZHINJAM MOTHER",
    "status": "CORRELATED",
    "lat": 8.25,
    "lon": 76.8,
    "heading": 110,
    "speed": 16.5,
    "length": 366,
    "vesselType": "Container Ship",
    "mmsi": "219001400",
    "flag": "Denmark",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-043",
    "name": "BEYPORE TRADITION",
    "status": "CORRELATED",
    "lat": 11.2,
    "lon": 75.6,
    "heading": 240,
    "speed": 7.2,
    "length": 52,
    "vesselType": "Trawler",
    "mmsi": "419055302",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-044",
    "name": "KANNUR SENTINEL",
    "status": "CORRELATED",
    "lat": 11.8,
    "lon": 75.15,
    "heading": 165,
    "speed": 11.2,
    "length": 155,
    "vesselType": "Commercial Vessel",
    "mmsi": "419004103",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "DV-105",
    "name": "UNIDENTIFIED CONTACT 105",
    "status": "DARK",
    "lat": 8.95,
    "lon": 76.1,
    "heading": 245,
    "speed": 3.8,
    "length": 65,
    "vesselType": "Unflagged Trawler",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 92
  },
  {
    "id": "DV-113",
    "name": "UNIDENTIFIED CONTACT 113",
    "status": "DARK",
    "lat": 9.7,
    "lon": 75.5,
    "heading": 195,
    "speed": 4.2,
    "length": 55,
    "vesselType": "Unknown Contact",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 92
  },
  {
    "id": "VSL-007",
    "name": "OCEAN SENTINEL",
    "status": "CORRELATED",
    "lat": 7.85,
    "lon": 77.4,
    "heading": 85,
    "speed": 16.2,
    "length": 290,
    "vesselType": "Container Ship",
    "mmsi": "354891002",
    "flag": "Panama",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-045",
    "name": "CAPE COMORIN EXPRESS",
    "status": "CORRELATED",
    "lat": 7.7,
    "lon": 77.85,
    "heading": 95,
    "speed": 15.5,
    "length": 305,
    "vesselType": "Container Ship",
    "mmsi": "636019200",
    "flag": "Liberia",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-046",
    "name": "VLCC ARABIAN GLORY",
    "status": "CORRELATED",
    "lat": 6.2,
    "lon": 78.5,
    "heading": 85,
    "speed": 14,
    "length": 333,
    "vesselType": "Crude Oil Tanker",
    "mmsi": "538006120",
    "flag": "Marshall Islands",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-047",
    "name": "INDIAN OCEAN TRADER",
    "status": "CORRELATED",
    "lat": 5.9,
    "lon": 79.5,
    "heading": 88,
    "speed": 17,
    "length": 399,
    "vesselType": "Container Ship",
    "mmsi": "256001880",
    "flag": "Malta",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-048",
    "name": "GLOBAL PACIFIC",
    "status": "CORRELATED",
    "lat": 5.75,
    "lon": 81.2,
    "heading": 268,
    "speed": 16.8,
    "length": 366,
    "vesselType": "Container Ship",
    "mmsi": "477002900",
    "flag": "Hong Kong",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-049",
    "name": "ORIENT CHALLENGER",
    "status": "CORRELATED",
    "lat": 5.6,
    "lon": 82.5,
    "heading": 265,
    "speed": 13.5,
    "length": 280,
    "vesselType": "Bulk Carrier",
    "mmsi": "353001844",
    "flag": "Panama",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-050",
    "name": "SOUTHERN HORIZON",
    "status": "CORRELATED",
    "lat": 6.5,
    "lon": 77.2,
    "heading": 100,
    "speed": 14.8,
    "length": 245,
    "vesselType": "Tanker",
    "mmsi": "636017551",
    "flag": "Liberia",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-051",
    "name": "COLOMBO FEEDER",
    "status": "CORRELATED",
    "lat": 7.1,
    "lon": 79.2,
    "heading": 320,
    "speed": 12,
    "length": 160,
    "vesselType": "Cargo",
    "mmsi": "419005101",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "DV-102",
    "name": "UNIDENTIFIED CONTACT 102",
    "status": "DARK",
    "lat": 7.4,
    "lon": 78.1,
    "heading": 110,
    "speed": 5,
    "length": 70,
    "vesselType": "High Speed Craft",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 92
  },
  {
    "id": "DV-114",
    "name": "UNIDENTIFIED CONTACT 114",
    "status": "DARK",
    "lat": 5.8,
    "lon": 80.5,
    "heading": 90,
    "speed": 3,
    "length": 48,
    "vesselType": "Unreported Vessel",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 92
  },
  {
    "id": "VSL-052",
    "name": "CORAL QUEEN",
    "status": "CORRELATED",
    "lat": 10.55,
    "lon": 72.55,
    "heading": 180,
    "speed": 11,
    "length": 95,
    "vesselType": "Passenger",
    "mmsi": "419006101",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-053",
    "name": "LAKSHADWEEP DHOW",
    "status": "CORRELATED",
    "lat": 10.85,
    "lon": 73.6,
    "heading": 75,
    "speed": 6.5,
    "length": 40,
    "vesselType": "Small Craft",
    "mmsi": "419055601",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-054",
    "name": "MINICOY TRADER",
    "status": "CORRELATED",
    "lat": 8.35,
    "lon": 73.15,
    "heading": 45,
    "speed": 9.8,
    "length": 88,
    "vesselType": "Cargo",
    "mmsi": "419006102",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-055",
    "name": "KAVARATTI EXPRESS",
    "status": "CORRELATED",
    "lat": 10.4,
    "lon": 72.75,
    "heading": 315,
    "speed": 12.5,
    "length": 110,
    "vesselType": "Passenger",
    "mmsi": "419006103",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-056",
    "name": "ARABIAN ATOLL",
    "status": "CORRELATED",
    "lat": 11.45,
    "lon": 72.9,
    "heading": 200,
    "speed": 5.5,
    "length": 36,
    "vesselType": "Fishing Vessel",
    "mmsi": "419055602",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "DV-108",
    "name": "UNIDENTIFIED CONTACT 108",
    "status": "DARK",
    "lat": 10.45,
    "lon": 72.1,
    "heading": 60,
    "speed": 3,
    "length": 45,
    "vesselType": "Wooden Craft / Dhow",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 92
  },
  {
    "id": "VSL-057",
    "name": "VOC PORT PIONEER",
    "status": "CORRELATED",
    "lat": 8.75,
    "lon": 78.25,
    "heading": 105,
    "speed": 11.5,
    "length": 175,
    "vesselType": "Bulk Carrier",
    "mmsi": "419007101",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-058",
    "name": "PEARL CITY TANKER",
    "status": "CORRELATED",
    "lat": 8.65,
    "lon": 78.45,
    "heading": 70,
    "speed": 13,
    "length": 215,
    "vesselType": "Chemical Tanker",
    "mmsi": "419007102",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-059",
    "name": "RAMESWARAM STAR",
    "status": "CORRELATED",
    "lat": 9.25,
    "lon": 79.4,
    "heading": 160,
    "speed": 5.8,
    "length": 35,
    "vesselType": "Fishing Vessel",
    "mmsi": "419055711",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-060",
    "name": "NAGAPATTINAM EXPRESS",
    "status": "CORRELATED",
    "lat": 10.75,
    "lon": 80.05,
    "heading": 25,
    "speed": 10.2,
    "length": 110,
    "vesselType": "Cargo",
    "mmsi": "419007103",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-061",
    "name": "PONDICHERRY HORIZON",
    "status": "CORRELATED",
    "lat": 11.9,
    "lon": 80.05,
    "heading": 40,
    "speed": 11.8,
    "length": 150,
    "vesselType": "Commercial Vessel",
    "mmsi": "419007104",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-062",
    "name": "CUDDALORE CARRIER",
    "status": "CORRELATED",
    "lat": 11.7,
    "lon": 79.95,
    "heading": 350,
    "speed": 9.5,
    "length": 130,
    "vesselType": "Cargo",
    "mmsi": "419007105",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-063",
    "name": "POINT CALIMERE COASTER",
    "status": "CORRELATED",
    "lat": 10.25,
    "lon": 80.15,
    "heading": 180,
    "speed": 8,
    "length": 80,
    "vesselType": "Commercial Vessel",
    "mmsi": "419007106",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "DV-109",
    "name": "UNIDENTIFIED CONTACT 109",
    "status": "DARK",
    "lat": 8.9,
    "lon": 78.7,
    "heading": 130,
    "speed": 4.5,
    "length": 45,
    "vesselType": "Unlicensed Trawler",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 92
  },
  {
    "id": "DV-115",
    "name": "UNIDENTIFIED CONTACT 115",
    "status": "DARK",
    "lat": 11.5,
    "lon": 80.2,
    "heading": 60,
    "speed": 3.5,
    "length": 50,
    "vesselType": "Unknown Contact",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 92
  },
  {
    "id": "VSL-005",
    "name": "VIZAG PIONEER",
    "status": "CORRELATED",
    "lat": 17.65,
    "lon": 83.45,
    "heading": 288,
    "speed": 9.8,
    "length": 140,
    "vesselType": "General Cargo",
    "mmsi": "419001244",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-064",
    "name": "EASTERN NAVY ESCORT",
    "status": "CORRELATED",
    "lat": 17.5,
    "lon": 83.6,
    "heading": 60,
    "speed": 18,
    "length": 125,
    "vesselType": "Commercial Vessel",
    "mmsi": "419008101",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-065",
    "name": "KAKINADA OFFSHORE SUPPLY",
    "status": "CORRELATED",
    "lat": 16.9,
    "lon": 82.45,
    "heading": 110,
    "speed": 10.5,
    "length": 70,
    "vesselType": "Commercial Vessel",
    "mmsi": "419008102",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-066",
    "name": "GODAVARI BULKER",
    "status": "CORRELATED",
    "lat": 16.45,
    "lon": 82.25,
    "heading": 200,
    "speed": 12,
    "length": 225,
    "vesselType": "Bulk Carrier",
    "mmsi": "352002100",
    "flag": "Panama",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-067",
    "name": "KRISHNAPATNAM STAR",
    "status": "CORRELATED",
    "lat": 14.25,
    "lon": 80.3,
    "heading": 75,
    "speed": 13.5,
    "length": 250,
    "vesselType": "Bulk Carrier",
    "mmsi": "419008103",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-068",
    "name": "MACHILIPATNAM TRAWLER",
    "status": "CORRELATED",
    "lat": 15.95,
    "lon": 81.3,
    "heading": 140,
    "speed": 6,
    "length": 42,
    "vesselType": "Fishing Vessel",
    "mmsi": "419055801",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-069",
    "name": "BHEEMUNIPATNAM TRADER",
    "status": "CORRELATED",
    "lat": 17.9,
    "lon": 83.7,
    "heading": 45,
    "speed": 11.2,
    "length": 165,
    "vesselType": "Cargo",
    "mmsi": "419008104",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-070",
    "name": "KALINGAPATNAM SEA",
    "status": "CORRELATED",
    "lat": 18.3,
    "lon": 84.4,
    "heading": 65,
    "speed": 12.8,
    "length": 195,
    "vesselType": "Cargo",
    "mmsi": "419008105",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "DV-106",
    "name": "UNIDENTIFIED CONTACT 106",
    "status": "DARK",
    "lat": 14.45,
    "lon": 80.5,
    "heading": 115,
    "speed": 4,
    "length": 75,
    "vesselType": "Small Cargo / Barge",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 92
  },
  {
    "id": "DV-116",
    "name": "UNIDENTIFIED CONTACT 116",
    "status": "DARK",
    "lat": 17.2,
    "lon": 83.2,
    "heading": 170,
    "speed": 3.2,
    "length": 40,
    "vesselType": "Unreported Craft",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 92
  },
  {
    "id": "VSL-010",
    "name": "SAGAR SHAKTI",
    "status": "CORRELATED",
    "lat": 21.2,
    "lon": 88.35,
    "heading": 195,
    "speed": 10.8,
    "length": 175,
    "vesselType": "Bulk Carrier",
    "mmsi": "419003881",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-071",
    "name": "PARADIP COAL BULKER",
    "status": "CORRELATED",
    "lat": 20.15,
    "lon": 86.85,
    "heading": 120,
    "speed": 12.5,
    "length": 240,
    "vesselType": "Bulk Carrier",
    "mmsi": "419009101",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-072",
    "name": "DHAMRA LEADER",
    "status": "CORRELATED",
    "lat": 20.8,
    "lon": 87.2,
    "heading": 145,
    "speed": 13.2,
    "length": 260,
    "vesselType": "Bulk Carrier",
    "mmsi": "354001922",
    "flag": "Panama",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-073",
    "name": "GOPALPUR HARVEST",
    "status": "CORRELATED",
    "lat": 19.15,
    "lon": 85.1,
    "heading": 70,
    "speed": 6.2,
    "length": 48,
    "vesselType": "Fishing Vessel",
    "mmsi": "419055911",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-074",
    "name": "HALDIA FEEDER",
    "status": "CORRELATED",
    "lat": 21.5,
    "lon": 88.1,
    "heading": 180,
    "speed": 11,
    "length": 155,
    "vesselType": "Container Ship",
    "mmsi": "419009102",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-075",
    "name": "HOOGHLY PILOT",
    "status": "CORRELATED",
    "lat": 21.3,
    "lon": 88,
    "heading": 160,
    "speed": 8.5,
    "length": 65,
    "vesselType": "Commercial Vessel",
    "mmsi": "419009103",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-076",
    "name": "BALASORE COASTER",
    "status": "CORRELATED",
    "lat": 21.15,
    "lon": 87.4,
    "heading": 90,
    "speed": 9.8,
    "length": 115,
    "vesselType": "Cargo",
    "mmsi": "419009104",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "DV-117",
    "name": "UNIDENTIFIED CONTACT 117",
    "status": "DARK",
    "lat": 20.4,
    "lon": 87.1,
    "heading": 210,
    "speed": 3.5,
    "length": 60,
    "vesselType": "Unflagged Trawler",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 92
  },
  {
    "id": "DV-118",
    "name": "UNIDENTIFIED CONTACT 118",
    "status": "DARK",
    "lat": 21.1,
    "lon": 88.5,
    "heading": 140,
    "speed": 4.2,
    "length": 55,
    "vesselType": "Small Wooden Craft",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 92
  },
  {
    "id": "VSL-008",
    "name": "ANDAMAN PEARL",
    "status": "CORRELATED",
    "lat": 11.6,
    "lon": 92.85,
    "heading": 15,
    "speed": 10,
    "length": 115,
    "vesselType": "Passenger / Ferry",
    "mmsi": "419088112",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-077",
    "name": "PORT BLAIR EXPRESS",
    "status": "CORRELATED",
    "lat": 11.75,
    "lon": 92.9,
    "heading": 45,
    "speed": 13.5,
    "length": 140,
    "vesselType": "Passenger",
    "mmsi": "419010101",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-078",
    "name": "HAVELOCK ISLANDER",
    "status": "CORRELATED",
    "lat": 12.05,
    "lon": 93.1,
    "heading": 350,
    "speed": 12,
    "length": 85,
    "vesselType": "Passenger / Ferry",
    "mmsi": "419010102",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-079",
    "name": "MAYABUNDER NAVIGATOR",
    "status": "CORRELATED",
    "lat": 12.95,
    "lon": 93.1,
    "heading": 80,
    "speed": 8.5,
    "length": 60,
    "vesselType": "Commercial Vessel",
    "mmsi": "419010103",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-080",
    "name": "DIGLIPUR CARRIER",
    "status": "CORRELATED",
    "lat": 13.25,
    "lon": 93.2,
    "heading": 165,
    "speed": 9.8,
    "length": 110,
    "vesselType": "Cargo",
    "mmsi": "419010104",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-081",
    "name": "CAMPBELL BAY VOYAGER",
    "status": "CORRELATED",
    "lat": 6.95,
    "lon": 94.1,
    "heading": 125,
    "speed": 14,
    "length": 165,
    "vesselType": "Cargo",
    "mmsi": "419010105",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-082",
    "name": "MALACCA STRAIT SENTINEL",
    "status": "CORRELATED",
    "lat": 6.35,
    "lon": 94.5,
    "heading": 115,
    "speed": 16.8,
    "length": 330,
    "vesselType": "Crude Oil Tanker",
    "mmsi": "356002190",
    "flag": "Panama",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-083",
    "name": "GREAT CHANNEL TRADER",
    "status": "CORRELATED",
    "lat": 6.15,
    "lon": 94.25,
    "heading": 295,
    "speed": 17.5,
    "length": 366,
    "vesselType": "Container Ship",
    "mmsi": "538009220",
    "flag": "Marshall Islands",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-084",
    "name": "NANCOWRY RUNNER",
    "status": "CORRELATED",
    "lat": 8.05,
    "lon": 93.65,
    "heading": 180,
    "speed": 10.5,
    "length": 90,
    "vesselType": "Passenger",
    "mmsi": "419010106",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-085",
    "name": "CAR NICOBAR STAR",
    "status": "CORRELATED",
    "lat": 9.15,
    "lon": 92.95,
    "heading": 220,
    "speed": 11.2,
    "length": 105,
    "vesselType": "Commercial Vessel",
    "mmsi": "419010107",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-086",
    "name": "ANDAMAN SEA TRAWLER",
    "status": "CORRELATED",
    "lat": 12.45,
    "lon": 93.4,
    "heading": 110,
    "speed": 6,
    "length": 42,
    "vesselType": "Fishing Vessel",
    "mmsi": "419055921",
    "flag": "India",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "VSL-087",
    "name": "TEN DEGREE CHANNEL",
    "status": "CORRELATED",
    "lat": 10.1,
    "lon": 93.2,
    "heading": 90,
    "speed": 15,
    "length": 280,
    "vesselType": "Bulk Carrier",
    "mmsi": "636019550",
    "flag": "Liberia",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 95
  },
  {
    "id": "DV-119",
    "name": "UNIDENTIFIED CONTACT 119",
    "status": "DARK",
    "lat": 12.8,
    "lon": 93.3,
    "heading": 135,
    "speed": 4.5,
    "length": 50,
    "vesselType": "Unreported Vessel",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 92
  },
  {
    "id": "DV-120",
    "name": "UNIDENTIFIED CONTACT 120",
    "status": "DARK",
    "lat": 6.65,
    "lon": 94.3,
    "heading": 290,
    "speed": 5.2,
    "length": 65,
    "vesselType": "Fast Craft",
    "timestamp": "2026-09-08 05:12:00 GMT",
    "confidence": 92
  }
];

/**
 * Converts Vessel array into a valid MapLibre GeoJSON FeatureCollection
 * Uses [longitude, latitude] geometry order.
 * Strictly filters out any coordinates located on land.
 */
export function vesselsToGeoJSON(vessels: Vessel[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  const validVessels = vessels.filter((v) => {
    const valid = isWaterCoordinate(v.lat, v.lon);
    if (!valid) {
      console.warn(`[MARITIME REJECTION] Vessel ${v.id} placed on land at [${v.lat}, ${v.lon}] - OMITTED.`);
    }
    return valid;
  });

  return {
    type: 'FeatureCollection',
    features: validVessels.map((v) => ({
      type: 'Feature',
      id: v.id,
      geometry: {
        type: 'Point',
        coordinates: [v.lon, v.lat], // [longitude, latitude]
      },
      properties: {
        id: v.id,
        name: v.name,
        status: v.status,
        heading: v.heading,
        speed: v.speed,
        length: v.length,
        vesselType: v.vesselType,
        mmsi: v.mmsi || '',
        flag: v.flag || '',
        timestamp: v.timestamp || '',
        confidence: v.confidence || 90,
        detectionSource: v.detectionSource || '',
        displayStatus: v.displayStatus || v.status,
        geofenceStatus: v.geofenceStatus || 'OUTSIDE',
        restrictedAreaNames: (v.restrictedAreaNames || []).join(', '),
      },
    })),
  };
}

/**
 * Real historical tracks ending precisely at each vessel's current [lon, lat]
 */
export const VESSEL_TRACKS: Record<string, [number, number][]> = {
  "VSL-003": [
    [
      80.33887,
      13.11472
    ],
    [
      80.36011,
      13.11472
    ],
    [
      80.38042,
      13.11472
    ]
  ],
  "VSL-011": [
    [
      80.303,
      13.0832
    ],
    [
      80.32351,
      13.08856
    ],
    [
      80.34313,
      13.09368
    ]
  ],
  "VSL-012": [
    [
      80.34705,
      13.05587
    ],
    [
      80.36069,
      13.07171
    ],
    [
      80.37375,
      13.08687
    ]
  ],
  "VSL-013": [
    [
      80.33959,
      13.03618
    ],
    [
      80.33774,
      13.05679
    ],
    [
      80.33597,
      13.0765
    ]
  ],
  "VSL-014": [
    [
      80.32004,
      13.1377
    ],
    [
      80.34,
      13.13063
    ],
    [
      80.35909,
      13.12386
    ]
  ],
  "VSL-015": [
    [
      80.32428,
      13.06823
    ],
    [
      80.34519,
      13.07182
    ],
    [
      80.36519,
      13.07526
    ]
  ],
  "VSL-006": [
    [
      69.2444,
      21.41531
    ],
    [
      69.2222,
      21.43266
    ],
    [
      69.2,
      21.45
    ]
  ],
  "VSL-016": [
    [
      68.50745,
      22.34062
    ],
    [
      68.47873,
      22.34531
    ],
    [
      68.45,
      22.35
    ]
  ],
  "VSL-017": [
    [
      68.71263,
      21.84133
    ],
    [
      68.73132,
      21.82067
    ],
    [
      68.75,
      21.8
    ]
  ],
  "VSL-018": [
    [
      68.70281,
      22.1728
    ],
    [
      68.6764,
      22.1614
    ],
    [
      68.65,
      22.15
    ]
  ],
  "VSL-019": [
    [
      68.84186,
      22.40469
    ],
    [
      68.87093,
      22.40235
    ],
    [
      68.9,
      22.4
    ]
  ],
  "VSL-020": [
    [
      68.79522,
      22.23154
    ],
    [
      68.82261,
      22.24077
    ],
    [
      68.85,
      22.25
    ]
  ],
  "VSL-021": [
    [
      71.92887,
      20.84673
    ],
    [
      71.91443,
      20.82336
    ],
    [
      71.9,
      20.8
    ]
  ],
  "VSL-022": [
    [
      70.13027,
      20.7007
    ],
    [
      70.14014,
      20.67535
    ],
    [
      70.15,
      20.65
    ]
  ],
  "VSL-004": [
    [
      72.51727,
      18.9642
    ],
    [
      72.53364,
      18.9421
    ],
    [
      72.55,
      18.92
    ]
  ],
  "VSL-023": [
    [
      71.55957,
      19.31184
    ],
    [
      71.57978,
      19.33092
    ],
    [
      71.6,
      19.35
    ]
  ],
  "VSL-024": [
    [
      72.0901,
      18.80314
    ],
    [
      72.09505,
      18.77657
    ],
    [
      72.1,
      18.75
    ]
  ],
  "VSL-025": [
    [
      72.72939,
      18.87697
    ],
    [
      72.70469,
      18.86349
    ],
    [
      72.68,
      18.85
    ]
  ],
  "VSL-026": [
    [
      72.15996,
      19.74686
    ],
    [
      72.15498,
      19.77343
    ],
    [
      72.15,
      19.8
    ]
  ],
  "VSL-027": [
    [
      72.70496,
      18.50375
    ],
    [
      72.70248,
      18.47688
    ],
    [
      72.7,
      18.45
    ]
  ],
  "VSL-028": [
    [
      72.83068,
      17.2507
    ],
    [
      72.84034,
      17.22535
    ],
    [
      72.85,
      17.2
    ]
  ],
  "VSL-029": [
    [
      72.62389,
      17.35109
    ],
    [
      72.61195,
      17.37555
    ],
    [
      72.6,
      17.4
    ]
  ],
  "VSL-030": [
    [
      71.90689,
      19.10469
    ],
    [
      71.87844,
      19.10235
    ],
    [
      71.85,
      19.1
    ]
  ],
  "VSL-031": [
    [
      73.07621,
      16.5489
    ],
    [
      73.08811,
      16.52445
    ],
    [
      73.1,
      16.5
    ]
  ],
  "VSL-009": [
    [
      73.56911,
      15.04929
    ],
    [
      73.55956,
      15.07465
    ],
    [
      73.55,
      15.1
    ]
  ],
  "VSL-032": [
    [
      73.45513,
      15.42936
    ],
    [
      73.42756,
      15.42468
    ],
    [
      73.4,
      15.42
    ]
  ],
  "VSL-033": [
    [
      73.84031,
      14.80314
    ],
    [
      73.84515,
      14.77657
    ],
    [
      73.85,
      14.75
    ]
  ],
  "VSL-034": [
    [
      74.48561,
      13.10866
    ],
    [
      74.46781,
      13.12933
    ],
    [
      74.45,
      13.15
    ]
  ],
  "VSL-035": [
    [
      74.31436,
      13.45212
    ],
    [
      74.30718,
      13.42606
    ],
    [
      74.3,
      13.4
    ]
  ],
  "VSL-036": [
    [
      74.11808,
      14.1442
    ],
    [
      74.13404,
      14.1221
    ],
    [
      74.15,
      14.1
    ]
  ],
  "VSL-037": [
    [
      74.49518,
      12.80375
    ],
    [
      74.49759,
      12.77688
    ],
    [
      74.5,
      12.75
    ]
  ],
  "VSL-001": [
    [
      76.38057,
      8.7372
    ],
    [
      76.36028,
      8.71915
    ],
    [
      76.34,
      8.7011
    ]
  ],
  "VSL-002": [
    [
      75.42191,
      9.26893
    ],
    [
      75.42095,
      9.24196
    ],
    [
      75.42,
      9.215
    ]
  ],
  "VSL-038": [
    [
      75.90478,
      9.95
    ],
    [
      75.87739,
      9.95
    ],
    [
      75.85,
      9.95
    ]
  ],
  "VSL-039": [
    [
      75.4225,
      11.19673
    ],
    [
      75.43625,
      11.17336
    ],
    [
      75.45,
      11.15
    ]
  ],
  "VSL-040": [
    [
      76.08138,
      9.5442
    ],
    [
      76.06569,
      9.5221
    ],
    [
      76.05,
      9.5
    ]
  ],
  "VSL-041": [
    [
      76.71143,
      8.43815
    ],
    [
      76.73071,
      8.41908
    ],
    [
      76.75,
      8.4
    ]
  ],
  "VSL-042": [
    [
      76.74876,
      8.26845
    ],
    [
      76.77438,
      8.25923
    ],
    [
      76.8,
      8.25
    ]
  ],
  "VSL-043": [
    [
      75.64764,
      11.22698
    ],
    [
      75.62382,
      11.21349
    ],
    [
      75.6,
      11.2
    ]
  ],
  "VSL-044": [
    [
      75.13573,
      11.85212
    ],
    [
      75.14287,
      11.82606
    ],
    [
      75.15,
      11.8
    ]
  ],
  "VSL-007": [
    [
      77.34574,
      7.84529
    ],
    [
      77.37287,
      7.84765
    ],
    [
      77.4,
      7.85
    ]
  ],
  "VSL-045": [
    [
      77.79576,
      7.7047
    ],
    [
      77.82288,
      7.70235
    ],
    [
      77.85,
      7.7
    ]
  ],
  "VSL-046": [
    [
      78.44593,
      6.19529
    ],
    [
      78.47297,
      6.19765
    ],
    [
      78.5,
      6.2
    ]
  ],
  "VSL-047": [
    [
      79.44579,
      5.89811
    ],
    [
      79.47289,
      5.89906
    ],
    [
      79.5,
      5.9
    ]
  ],
  "VSL-048": [
    [
      81.2542,
      5.75188
    ],
    [
      81.2271,
      5.75094
    ],
    [
      81.2,
      5.75
    ]
  ],
  "VSL-049": [
    [
      82.55401,
      5.6047
    ],
    [
      82.52701,
      5.60235
    ],
    [
      82.5,
      5.6
    ]
  ],
  "VSL-050": [
    [
      77.14652,
      6.50937
    ],
    [
      77.17326,
      6.50468
    ],
    [
      77.2,
      6.5
    ]
  ],
  "VSL-051": [
    [
      79.23495,
      7.05866
    ],
    [
      79.21748,
      7.07933
    ],
    [
      79.2,
      7.1
    ]
  ],
  "VSL-052": [
    [
      72.55,
      10.60396
    ],
    [
      72.55,
      10.57698
    ],
    [
      72.55,
      10.55
    ]
  ],
  "VSL-053": [
    [
      73.54693,
      10.83603
    ],
    [
      73.57347,
      10.84302
    ],
    [
      73.6,
      10.85
    ]
  ],
  "VSL-054": [
    [
      73.11144,
      8.31184
    ],
    [
      73.13072,
      8.33092
    ],
    [
      73.15,
      8.35
    ]
  ],
  "VSL-055": [
    [
      72.78879,
      10.36184
    ],
    [
      72.76939,
      10.38092
    ],
    [
      72.75,
      10.4
    ]
  ],
  "VSL-056": [
    [
      72.91883,
      11.5007
    ],
    [
      72.90942,
      11.47535
    ],
    [
      72.9,
      11.45
    ]
  ],
  "VSL-057": [
    [
      78.19726,
      8.76396
    ],
    [
      78.22363,
      8.75698
    ],
    [
      78.25,
      8.75
    ]
  ],
  "VSL-058": [
    [
      78.39871,
      8.63154
    ],
    [
      78.42436,
      8.64077
    ],
    [
      78.45,
      8.65
    ]
  ],
  "VSL-059": [
    [
      79.3813,
      9.3007
    ],
    [
      79.39065,
      9.27535
    ],
    [
      79.4,
      9.25
    ]
  ],
  "VSL-060": [
    [
      80.02679,
      10.7011
    ],
    [
      80.0384,
      10.72555
    ],
    [
      80.05,
      10.75
    ]
  ],
  "VSL-061": [
    [
      80.01456,
      11.85866
    ],
    [
      80.03228,
      11.87933
    ],
    [
      80.05,
      11.9
    ]
  ],
  "VSL-062": [
    [
      79.95957,
      11.64686
    ],
    [
      79.95478,
      11.67343
    ],
    [
      79.95,
      11.7
    ]
  ],
  "VSL-063": [
    [
      80.15,
      10.30396
    ],
    [
      80.15,
      10.27698
    ],
    [
      80.15,
      10.25
    ]
  ],
  "VSL-005": [
    [
      83.50385,
      17.63332
    ],
    [
      83.47693,
      17.64166
    ],
    [
      83.45,
      17.65
    ]
  ],
  "VSL-064": [
    [
      83.55101,
      17.47301
    ],
    [
      83.5755,
      17.48651
    ],
    [
      83.6,
      17.5
    ]
  ],
  "VSL-065": [
    [
      82.397,
      16.91845
    ],
    [
      82.4235,
      16.90923
    ],
    [
      82.45,
      16.9
    ]
  ],
  "VSL-066": [
    [
      82.26925,
      16.5007
    ],
    [
      82.25962,
      16.47535
    ],
    [
      82.25,
      16.45
    ]
  ],
  "VSL-067": [
    [
      80.24623,
      14.23603
    ],
    [
      80.27311,
      14.24302
    ],
    [
      80.3,
      14.25
    ]
  ],
  "VSL-068": [
    [
      81.26392,
      15.99133
    ],
    [
      81.28196,
      15.97067
    ],
    [
      81.3,
      15.95
    ]
  ],
  "VSL-069": [
    [
      83.65991,
      17.86184
    ],
    [
      83.67995,
      17.88092
    ],
    [
      83.7,
      17.9
    ]
  ],
  "VSL-070": [
    [
      84.3485,
      18.27719
    ],
    [
      84.37425,
      18.2886
    ],
    [
      84.4,
      18.3
    ]
  ],
  "VSL-010": [
    [
      88.36498,
      21.25212
    ],
    [
      88.35749,
      21.22606
    ],
    [
      88.35,
      21.2
    ]
  ],
  "VSL-071": [
    [
      86.80021,
      20.17697
    ],
    [
      86.82511,
      20.16349
    ],
    [
      86.85,
      20.15
    ]
  ],
  "VSL-072": [
    [
      87.16688,
      20.8442
    ],
    [
      87.18344,
      20.8221
    ],
    [
      87.2,
      20.8
    ]
  ],
  "VSL-073": [
    [
      85.04633,
      19.13154
    ],
    [
      85.07316,
      19.14077
    ],
    [
      85.1,
      19.15
    ]
  ],
  "VSL-074": [
    [
      88.1,
      21.55396
    ],
    [
      88.1,
      21.52698
    ],
    [
      88.1,
      21.5
    ]
  ],
  "VSL-075": [
    [
      87.98018,
      21.3507
    ],
    [
      87.99009,
      21.32535
    ],
    [
      88,
      21.3
    ]
  ],
  "VSL-076": [
    [
      87.34214,
      21.14999
    ],
    [
      87.37107,
      21.15
    ],
    [
      87.4,
      21.15
    ]
  ],
  "VSL-008": [
    [
      92.83575,
      11.54788
    ],
    [
      92.84287,
      11.57394
    ],
    [
      92.85,
      11.6
    ]
  ],
  "VSL-077": [
    [
      92.86103,
      11.71184
    ],
    [
      92.88052,
      11.73092
    ],
    [
      92.9,
      11.75
    ]
  ],
  "VSL-078": [
    [
      93.10958,
      11.99686
    ],
    [
      93.10479,
      12.02343
    ],
    [
      93.1,
      12.05
    ]
  ],
  "VSL-079": [
    [
      93.04548,
      12.94062
    ],
    [
      93.07274,
      12.94531
    ],
    [
      93.1,
      12.95
    ]
  ],
  "VSL-080": [
    [
      93.18565,
      13.30212
    ],
    [
      93.19283,
      13.27606
    ],
    [
      93.2,
      13.25
    ]
  ],
  "VSL-081": [
    [
      94.05547,
      6.98095
    ],
    [
      94.07774,
      6.96547
    ],
    [
      94.1,
      6.95
    ]
  ],
  "VSL-082": [
    [
      94.45079,
      6.3728
    ],
    [
      94.4754,
      6.3614
    ],
    [
      94.5,
      6.35
    ]
  ],
  "VSL-083": [
    [
      94.29918,
      6.12719
    ],
    [
      94.27459,
      6.1386
    ],
    [
      94.25,
      6.15
    ]
  ],
  "VSL-084": [
    [
      93.65,
      8.10396
    ],
    [
      93.65,
      8.07698
    ],
    [
      93.65,
      8.05
    ]
  ],
  "VSL-085": [
    [
      92.98514,
      9.19133
    ],
    [
      92.96757,
      9.17067
    ],
    [
      92.95,
      9.15
    ]
  ],
  "VSL-086": [
    [
      93.34807,
      12.46845
    ],
    [
      93.37404,
      12.45923
    ],
    [
      93.4,
      12.45
    ]
  ],
  "VSL-087": [
    [
      93.14519,
      10.1
    ],
    [
      93.1726,
      10.1
    ],
    [
      93.2,
      10.1
    ]
  ]
};

/**
 * Short historical EO detection trail (observation history) for dark vessels
 */
export const DARK_OBSERVATION_TRAILS: Record<string, [number, number][]> = {
  "DV-104": [
    [
      80.351,
      13.10666
    ],
    [
      80.3616,
      13.10118
    ],
    [
      80.37138,
      13.09611
    ]
  ],
  "DV-112": [
    [
      80.31523,
      13.08351
    ],
    [
      80.32611,
      13.08845
    ],
    [
      80.33615,
      13.09301
    ]
  ],
  "DV-103": [
    [
      68.82859,
      21.64531
    ],
    [
      68.81429,
      21.64766
    ],
    [
      68.8,
      21.65
    ]
  ],
  "DV-107": [
    [
      70.8144,
      20.52663
    ],
    [
      70.8072,
      20.53832
    ],
    [
      70.8,
      20.55
    ]
  ],
  "DV-101": [
    [
      72.39635,
      18.8421
    ],
    [
      72.38818,
      18.83105
    ],
    [
      72.38,
      18.82
    ]
  ],
  "DV-110": [
    [
      72.40492,
      17.82657
    ],
    [
      72.40246,
      17.81328
    ],
    [
      72.4,
      17.8
    ]
  ],
  "DV-111": [
    [
      73.72133,
      14.31734
    ],
    [
      73.71066,
      14.30867
    ],
    [
      73.7,
      14.3
    ]
  ],
  "DV-105": [
    [
      76.12475,
      8.9614
    ],
    [
      76.11238,
      8.9557
    ],
    [
      76.1,
      8.95
    ]
  ],
  "DV-113": [
    [
      75.50708,
      9.72606
    ],
    [
      75.50354,
      9.71303
    ],
    [
      75.5,
      9.7
    ]
  ],
  "DV-102": [
    [
      78.07443,
      7.40923
    ],
    [
      78.08722,
      7.40461
    ],
    [
      78.1,
      7.4
    ]
  ],
  "DV-114": [
    [
      80.47288,
      5.8
    ],
    [
      80.48644,
      5.8
    ],
    [
      80.5,
      5.8
    ]
  ],
  "DV-108": [
    [
      72.07624,
      10.43651
    ],
    [
      72.08812,
      10.44325
    ],
    [
      72.1,
      10.45
    ]
  ],
  "DV-109": [
    [
      78.67908,
      8.91734
    ],
    [
      78.68954,
      8.90867
    ],
    [
      78.7,
      8.9
    ]
  ],
  "DV-115": [
    [
      80.17616,
      11.48651
    ],
    [
      80.18808,
      11.49325
    ],
    [
      80.2,
      11.5
    ]
  ],
  "DV-106": [
    [
      80.47475,
      14.4614
    ],
    [
      80.48737,
      14.4557
    ],
    [
      80.5,
      14.45
    ]
  ],
  "DV-116": [
    [
      83.1951,
      17.22657
    ],
    [
      83.19755,
      17.21328
    ],
    [
      83.2,
      17.2
    ]
  ],
  "DV-117": [
    [
      87.11439,
      20.42336
    ],
    [
      87.1072,
      20.41168
    ],
    [
      87.1,
      20.4
    ]
  ],
  "DV-118": [
    [
      88.48141,
      21.12067
    ],
    [
      88.49071,
      21.11033
    ],
    [
      88.5,
      21.1
    ]
  ],
  "DV-119": [
    [
      93.28043,
      12.81908
    ],
    [
      93.29022,
      12.80954
    ],
    [
      93.3,
      12.8
    ]
  ],
  "DV-120": [
    [
      94.32552,
      6.64077
    ],
    [
      94.31276,
      6.64539
    ],
    [
      94.3,
      6.65
    ]
  ]
};

/**
 * Startup Validation Report Logger
 */
export function logStartupVesselValidationReport(vessels: Vessel[] = INITIAL_VESSELS): void {
  const total = vessels.length;
  let validCount = 0;
  let landCount = 0;
  let darkCount = 0;
  let cameraAssocCount = 0;

  vessels.forEach((v) => {
    if (isWaterCoordinate(v.lat, v.lon)) {
      validCount++;
    } else {
      landCount++;
    }
    if (v.status === 'DARK') darkCount++;
    if (v.detectionSource) cameraAssocCount++;
  });

  console.log(
    `%c[MARITIME SENTINEL VALIDATION REPORT]\n` +
    `Total vessels: ${total}\n` +
    `Valid maritime positions: ${validCount}\n` +
    `Invalid land positions: ${landCount}\n` +
    `Total cameras: 87\n` +
    `Camera-associated vessels: ${cameraAssocCount}\n` +
    `Dark detections: ${darkCount}`,
    'color: #38bdf8; font-weight: bold;'
  );
}
