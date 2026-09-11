import React from 'react';
import { DetailDrawer } from './DetailDrawer';
import { EOCamera } from '../types/maritime';
import { Vessel } from '../data/vessels';
import { getDistanceMeters, isPointInFov } from '../utils/geoUtils';
import { Video, Compass, Radio, ExternalLink } from 'lucide-react';

interface CameraPopupCardProps {
  camera: EOCamera | null;
  onClose: () => void;
  onViewEo: (camera: EOCamera) => void;
  vessels?: Vessel[];
}

export const CameraPopupCard: React.FC<CameraPopupCardProps> = ({
  camera,
  onClose,
  onViewEo,
  vessels = [],
}) => {
  const observationRadiusKm = camera?.rangeKm || 15;

  // Geographically calculate vessels within observation radius & FOV
  const nearbyVessels = React.useMemo(() => {
    if (!camera || !vessels.length) return [];
    return vessels.filter((v) => {
      const distM = getDistanceMeters(camera.lon, camera.lat, v.lon, v.lat);
      return distM <= observationRadiusKm * 1000;
    });
  }, [camera, vessels, observationRadiusKm]);

  const fovVessels = React.useMemo(() => {
    if (!camera || !vessels.length) return [];
    return vessels.filter((v) =>
      isPointInFov(
        camera.lat,
        camera.lon,
        v.lat,
        v.lon,
        camera.heading,
        camera.fov,
        observationRadiusKm
      )
    );
  }, [camera, vessels, observationRadiusKm]);

  const aisNearby = nearbyVessels.filter((v) => v.status === 'CORRELATED').length;
  const darkNearby = nearbyVessels.filter((v) => v.status === 'DARK').length;

  const aisInFov = fovVessels.filter((v) => v.status === 'CORRELATED');
  const darkInFov = fovVessels.filter((v) => v.status === 'DARK');

  if (!camera) return null;

  const siteTitle = camera.siteName || camera.name.replace(/^PSS\s+/i, '');
  const isDemoActive = camera.status === 'DEMO ACTIVE';

  return (
    <DetailDrawer
      isOpen={!!camera}
      onClose={onClose}
      title={`EO CAMERA • ${siteTitle}`}
      badge={camera.id}
      icon={
        <span
          className={`w-2 h-2 rounded-full ${
            isDemoActive ? 'bg-sky-400' : 'bg-slate-500'
          }`}
        />
      }
      headerBg="bg-[#0f172a]"
      headerBorder="border-slate-800"
    >
      {/* Official Designation Banner */}
      <div className="px-3 py-1.5 bg-[#0b111e] border-b border-slate-800 text-[10px] text-slate-300 flex items-center justify-between font-medium">
        <div className="flex items-center gap-1.5">
          <Radio className="w-3 h-3 text-sky-400" />
          <span>Coastal Optical Site • Physical Shore Station</span>
        </div>
        <span className="text-[9px] font-mono font-bold text-slate-400">{camera.state || 'India'}</span>
      </div>

      {/* Sensor Metadata Body */}
      <div className="p-3 space-y-2.5 text-[11px] text-slate-200">
        {/* Network and Source Information */}
        <div className="grid grid-cols-2 gap-2 bg-[#111827] p-2 rounded border border-slate-800">
          <div>
            <span className="text-[8.5px] text-slate-400 uppercase block font-semibold">Network</span>
            <span className="font-bold text-slate-100 text-[10.5px]">DGLL NAIS</span>
          </div>
          <div>
            <span className="text-[8.5px] text-slate-400 uppercase block font-semibold">Reference</span>
            <a
              href={camera.sourceUrl || 'https://www.dgll.gov.in/about-DGLL/Service-reminders/nais'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-0.5"
            >
              <span>dgll.gov.in</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
          <div>
            <span className="text-[8.5px] text-slate-400 uppercase block font-semibold">Site Class</span>
            <span className="text-slate-300">Shore Station (PSS)</span>
          </div>
          <div>
            <span className="text-[8.5px] text-slate-400 uppercase block font-semibold">Telemetry</span>
            <span className="font-medium text-emerald-400 font-mono text-[10px]">OPERATIONAL</span>
          </div>
        </div>

        {/* Geographic Coordinates */}
        <div className="grid grid-cols-2 gap-2 bg-[#111827] p-2 rounded border border-slate-800">
          <div>
            <span className="text-[8.5px] text-slate-400 uppercase block font-semibold">Latitude</span>
            <span className="font-mono text-slate-100 font-bold">
              {camera.lat.toFixed(4)}° N
            </span>
          </div>
          <div>
            <span className="text-[8.5px] text-slate-400 uppercase block font-semibold">Longitude</span>
            <span className="font-mono text-slate-100 font-bold">
              {camera.lon.toFixed(4)}° E
            </span>
          </div>
        </div>

        {/* Sensor View Parameters: Heading, FOV, Range */}
        <div className="bg-[#101b2b] p-2 rounded border border-sky-900/60">
          <div className="text-[9px] text-sky-300 font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Optical Azimuth & Arc</span>
            <span className="text-[8px] text-slate-400 font-normal">Seaward Arc</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className="bg-[#0b111e] p-1 rounded border border-slate-800">
              <span className="text-[8px] text-slate-400 uppercase block font-semibold">Heading</span>
              <div className="flex items-center justify-center gap-0.5 mt-0.5 font-mono font-bold text-slate-200">
                <Compass
                  className="w-3 h-3 text-sky-400"
                  style={{ transform: `rotate(${camera.heading}deg)` }}
                />
                <span>{camera.heading.toString().padStart(3, '0')}°</span>
              </div>
            </div>
            <div className="bg-[#0b111e] p-1 rounded border border-slate-800">
              <span className="text-[8px] text-slate-400 uppercase block font-semibold">FOV Angle</span>
              <span className="font-mono font-bold text-slate-200 block mt-0.5">{camera.fov}°</span>
            </div>
            <div className="bg-[#0b111e] p-1 rounded border border-slate-800">
              <span className="text-[8px] text-slate-400 uppercase block font-semibold">Range</span>
              <span className="font-mono font-bold text-sky-400 block mt-0.5">
                {camera.rangeKm} km
              </span>
            </div>
          </div>
        </div>

        {/* Nearby Vessels in Geographic Range */}
        <div className="bg-[#111827] p-2 rounded border border-slate-800 text-[10px] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wider">
              Contacts in Sector ({observationRadiusKm} km)
            </span>
            <span className="text-[8.5px] font-mono font-semibold text-slate-400">
              {nearbyVessels.length > 0 ? `${nearbyVessels.length} Targets` : 'Clear'}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              AIS-Correlated:
            </span>
            <span className="font-mono font-medium text-slate-200">
              {aisNearby > 0 ? `${aisNearby} Targets` : 'None'}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Uncorrelated (No AIS):
            </span>
            <span className="font-mono font-medium text-rose-400">
              {darkNearby > 0 ? `${darkNearby} Targets` : 'None'}
            </span>
          </div>
        </div>

        {/* Vessels Inside Camera FOV */}
        {fovVessels.length > 0 && (
          <div className="bg-[#101b2b] p-2 rounded border border-sky-900/60 text-[10px] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-sky-300 uppercase tracking-wider">
                Inside Optical FOV
              </span>
              <span className="text-[8px] font-mono text-sky-400 uppercase font-semibold">Wedge Verified</span>
            </div>
            {darkInFov.map((v) => (
              <div key={v.id} className="flex items-center justify-between text-rose-300 font-medium">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Target: <strong className="font-mono">{v.id}</strong>
                </span>
                <span className="text-[8.5px] font-mono bg-rose-950 text-rose-300 border border-rose-800 px-1 py-0.5 rounded font-semibold">
                  NO AIS
                </span>
              </div>
            ))}
            {aisInFov.slice(0, 3).map((v) => (
              <div key={v.id} className="flex items-center justify-between text-slate-200 font-medium">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                  Target: <strong className="font-mono">{v.name}</strong>
                </span>
                <span className="text-[8.5px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 px-1 py-0.5 rounded font-semibold">
                  MATCHED
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Note */}
        <div className="text-[8.5px] text-slate-500 bg-[#0b111e] p-1.5 rounded border border-slate-800 leading-tight">
          <span className="font-semibold text-slate-400">Note:</span> Coastal optical station model based on DGLL NAIS physical reference stations. Demonstration sensor model.
        </div>

        {/* Action: VIEW OPTICAL OBSERVATION */}
        <button
          onClick={() => onViewEo(camera)}
          className="w-full mt-1 flex items-center justify-center gap-2 py-2 px-3 bg-sky-600 hover:bg-sky-500 text-white rounded font-semibold text-[11px] shadow-sm transition-colors"
        >
          <Video className="w-3.5 h-3.5" />
          <span>VIEW OPTICAL OBSERVATION</span>
        </button>
      </div>
    </DetailDrawer>
  );
};
