import { AISTrackPoint } from '../types/maritime';

export interface VesselTrack {
  mmsi: string;
  vesselName: string;
  color: string;
  points: AISTrackPoint[];
}

export const MOCK_TRACKS: Record<string, VesselTrack> = {
  '503891240': {
    mmsi: '503891240',
    vesselName: 'MT PACIFIC VOYAGER',
    color: '#0f172a',
    points: [
      { time: '01:00 GMT', lat: 8.2100, lon: 75.9200, speed: 12.4, heading: 225 },
      { time: '02:15 GMT', lat: 8.3500, lon: 76.0500, speed: 11.8, heading: 226 },
      { time: '03:30 GMT', lat: 8.5200, lon: 76.1900, speed: 9.2, heading: 228 },
      { time: '04:45 GMT', lat: 8.6400, lon: 76.2900, speed: 6.1, heading: 228 },
      { time: '05:11 GMT', lat: 8.7011, lon: 76.3400, speed: 5.0, heading: 228 },
    ]
  },
  '412389100': {
    mmsi: '412389100',
    vesselName: 'EVER GLORY',
    color: '#0f172a',
    points: [
      { time: '00:30 GMT', lat: 18.2100, lon: 71.9200, speed: 14.1, heading: 140 },
      { time: '02:00 GMT', lat: 18.5500, lon: 72.1000, speed: 13.5, heading: 142 },
      { time: '03:30 GMT', lat: 18.8200, lon: 72.3500, speed: 10.2, heading: 145 },
      { time: '05:12 GMT', lat: 18.9600, lon: 72.5000, speed: 7.4, heading: 148 },
    ]
  },
  '636019283': {
    mmsi: '636019283',
    vesselName: 'MAERSK DHARWAD',
    color: '#0f172a',
    points: [
      { time: '01:10 GMT', lat: 12.4500, lon: 80.9500, speed: 15.0, heading: 350 },
      { time: '02:40 GMT', lat: 12.7800, lon: 80.7000, speed: 13.2, heading: 345 },
      { time: '04:00 GMT', lat: 13.0100, lon: 80.5500, speed: 8.8, heading: 338 },
      { time: '05:15 GMT', lat: 13.1200, lon: 80.4500, speed: 5.2, heading: 335 },
    ]
  },
  '538007192': {
    mmsi: '538007192',
    vesselName: 'BHARAT SAMUDRA',
    color: '#0f172a',
    points: [
      { time: '02:00 GMT', lat: 17.1500, lon: 83.8500, speed: 11.5, heading: 295 },
      { time: '03:30 GMT', lat: 17.4200, lon: 83.6500, speed: 10.0, heading: 290 },
      { time: '05:00 GMT', lat: 17.6500, lon: 83.4500, speed: 6.4, heading: 288 },
    ]
  }
};
