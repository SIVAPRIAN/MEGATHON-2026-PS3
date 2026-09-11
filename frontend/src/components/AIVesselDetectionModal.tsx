import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  Scan,
  Crosshair,
  Database,
  CheckCircle,
  AlertTriangle,
  Compass,
  MapPin,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Sliders,
  Image as ImageIcon
} from 'lucide-react';
import { EOCamera } from '../types/maritime';
import { MOCK_CAMERAS } from '../data/mockCameras';

export interface DetectedVessel {
  vessel_id: number;
  class_id: number;
  vessel_type: string;
  confidence: number;
  bounding_box: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
  center_pixel: {
    x: number;
    y: number;
  };
  latitude?: number | null;
  longitude?: number | null;
  geolocation?: {
    latitude: number;
    longitude: number;
    estimated_distance_km: number;
    bearing_deg: number;
    calibrated_camera_id: string;
  } | null;
}

export interface MLAnalysisResponse {
  success: boolean;
  analysis_id: string;
  timestamp: string;
  image: string;
  annotated_image_url: string;
  vessel_count: number;
  vessels: DetectedVessel[];
  confidence_threshold: number;
  camera_metadata?: any;
  status: string;
  mongodb_persisted: boolean;
  model_version: string;
}

interface AIVesselDetectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedCamera?: EOCamera | null;
  onPlotVesselOnMap?: (vessel: DetectedVessel) => void;
}

export const AIVesselDetectionModal: React.FC<AIVesselDetectionModalProps> = ({
  isOpen,
  onClose,
  preselectedCamera = null,
  onPlotVesselOnMap,
}) => {
  const [activeTab, setActiveTab] = useState<'scan' | 'history'>('scan');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.40);
  const [selectedCameraId, setSelectedCameraId] = useState<string>(preselectedCamera?.id || '');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<MLAnalysisResponse | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<any[]>([]);
  const [modelHealth, setModelHealth] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync preselected camera if changed
  useEffect(() => {
    if (preselectedCamera) {
      setSelectedCameraId(preselectedCamera.id);
    }
  }, [preselectedCamera]);

  // Load ML service health
  useEffect(() => {
    if (!isOpen) return;

    fetch('/api/ml/health')
      .then((res) => res.json())
      .then((data) => setModelHealth(data))
      .catch((err) => console.warn('[ML Health] Error fetching health:', err));

    loadRecentAnalyses();
  }, [isOpen]);

  const loadRecentAnalyses = () => {
    fetch('/api/ml/analyses?limit=15')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.analyses)) {
          setRecentAnalyses(data.analyses);
        }
      })
      .catch((err) => console.warn('[ML Analyses] Error fetching history:', err));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAnalysisResult(null);
      setErrorMessage(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAnalysisResult(null);
      setErrorMessage(null);
    }
  };

  const loadSampleImage = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/vessels/sample_coastal_vessel.jpg');
      const blob = await res.blob();
      const file = new File([blob], 'sample_coastal_vessel.jpg', { type: 'image/jpeg' });
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAnalysisResult(null);
      setErrorMessage(null);
      // Auto-set lower threshold to ensure detection on sample
      setConfidenceThreshold(0.30);
    } catch (err) {
      setErrorMessage('Failed to load sample image');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunDetection = async () => {
    if (!selectedFile) {
      setErrorMessage('Please select or drag an image first.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('confidence_threshold', confidenceThreshold.toString());

    // Attach camera calibration if selected
    const camera = MOCK_CAMERAS.find((c) => c.id === selectedCameraId);
    if (camera) {
      formData.append('camera_id', camera.id);
      formData.append('camera_lat', camera.lat.toString());
      formData.append('camera_lon', camera.lon.toString());
      formData.append('camera_heading', camera.heading.toString());
      formData.append('camera_fov', camera.fov.toString());
      formData.append('camera_range_km', (camera.rangeKm || 15).toString());
    }

    try {
      const response = await fetch('/api/ml/detect-vessels', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(errData.detail || `Server returned error ${response.status}`);
      }

      const result: MLAnalysisResponse = await response.json();
      setAnalysisResult(result);
      loadRecentAnalyses();
    } catch (err: any) {
      console.error('[ML Detection] Error:', err);
      setErrorMessage(err.message || 'Error processing vessel detection.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const activeCamera = MOCK_CAMERAS.find((c) => c.id === selectedCameraId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 select-none animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-[#0f172a] border border-slate-700 rounded-lg shadow-2xl overflow-hidden font-sans text-slate-200 max-h-[92vh] flex flex-col">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#0b111e] border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-slate-100 tracking-wide">
                  REVENANT AI VESSEL DETECTOR
                </span>
                <span className="bg-sky-950 text-sky-300 border border-sky-800 text-[8.5px] font-mono px-1.5 py-0.5 rounded font-semibold uppercase">
                  YOLO11n • SeaShips 6-Class
                </span>
                {modelHealth?.status === 'ONLINE' && (
                  <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[8px] font-mono px-1.5 py-0.2 rounded font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    LIVE MODEL ({modelHealth.target_device?.toUpperCase()})
                  </span>
                )}
              </div>
              <span className="text-[9.5px] text-slate-400 font-mono block">
                revenant_vessel_detector.pt • Real PyTorch Weights • MongoDB Atlas Integrated
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Tabs */}
            <div className="flex bg-[#080d17] p-0.5 rounded border border-slate-800 text-[10.5px]">
              <button
                onClick={() => setActiveTab('scan')}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  activeTab === 'scan' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Scan & Detect
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1 rounded font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === 'history' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Database className="w-3 h-3" />
                <span>History ({recentAnalyses.length})</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
              title="Close Detector"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4 text-[11px]">
          {activeTab === 'scan' ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Left Column: Image Upload & Parameters (5 cols) */}
              <div className="md:col-span-5 space-y-3">
                {/* Upload Box */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px] ${
                    selectedFile
                      ? 'border-sky-500/50 bg-[#111c2e]/60'
                      : 'border-slate-700 hover:border-sky-500/50 bg-[#0b111e]/80 hover:bg-[#111c2e]/40'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {previewUrl ? (
                    <div className="relative w-full">
                      <img
                        src={previewUrl}
                        alt="Upload preview"
                        className="max-h-36 mx-auto rounded border border-slate-700 object-contain shadow-md"
                      />
                      <span className="text-[9px] text-sky-400 font-mono mt-1.5 block">
                        {selectedFile?.name} ({(selectedFile?.size ? selectedFile.size / 1024 : 0).toFixed(1)} KB)
                      </span>
                      <span className="text-[8px] text-slate-500">Click or drop to replace</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-sky-400 mb-1.5" />
                      <span className="font-semibold text-slate-200 block text-[11.5px]">
                        Drop Optical Camera Image Here
                      </span>
                      <span className="text-slate-400 text-[9.5px] block mt-0.5">
                        Supports JPG, PNG, WebP coastal imagery
                      </span>
                    </>
                  )}
                </div>

                {/* Quick Sample Button */}
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                    Testing Shortcut:
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      loadSampleImage();
                    }}
                    className="text-[9.5px] text-sky-400 hover:text-sky-300 font-mono underline flex items-center gap-1"
                  >
                    <ImageIcon className="w-3 h-3" />
                    <span>Load Coastal Vessel Sample</span>
                  </button>
                </div>

                {/* Confidence Threshold Slider */}
                <div className="bg-[#111827] p-2.5 rounded border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9.5px] text-slate-300 font-semibold flex items-center gap-1">
                      <Sliders className="w-3 h-3 text-sky-400" />
                      Confidence Threshold
                    </span>
                    <span className="font-mono text-sky-400 font-bold text-[11px]">
                      {(confidenceThreshold * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.10"
                    max="0.95"
                    step="0.05"
                    value={confidenceThreshold}
                    onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                  <div className="flex justify-between text-[8px] font-mono text-slate-500">
                    <span>10% (High Recall)</span>
                    <span>Default: 40%</span>
                    <span>95% (Strict)</span>
                  </div>
                </div>

                {/* Optional Coastal Camera Station Calibration */}
                <div className="bg-[#111827] p-2.5 rounded border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9.5px] text-slate-300 font-semibold flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-400" />
                      Station Calibration (Geolocation)
                    </span>
                    <span className="text-[8px] font-mono text-slate-400">
                      {activeCamera ? 'Calibrated' : 'Uncalibrated'}
                    </span>
                  </div>
                  <select
                    value={selectedCameraId}
                    onChange={(e) => setSelectedCameraId(e.target.value)}
                    className="w-full bg-[#0b111e] border border-slate-700 text-slate-200 text-[10px] rounded p-1.5 font-mono focus:border-sky-500 outline-none"
                  >
                    <option value="">No Camera Association (Pixel-Only)</option>
                    {MOCK_CAMERAS.slice(0, 15).map((cam) => (
                      <option key={cam.id} value={cam.id}>
                        {cam.id} • {cam.siteName || cam.name} ({cam.lat.toFixed(2)}°N, {cam.lon.toFixed(2)}°E, {cam.heading}°)
                      </option>
                    ))}
                  </select>
                  {activeCamera && (
                    <div className="text-[8.5px] font-mono text-slate-400 bg-[#080d17] p-1.5 rounded border border-slate-800/80">
                      Heading: <strong className="text-slate-200">{activeCamera.heading}°</strong> | FOV:{' '}
                      <strong className="text-slate-200">{activeCamera.fov}°</strong> | Max Range:{' '}
                      <strong className="text-slate-200">{activeCamera.rangeKm} km</strong>
                    </div>
                  )}
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="bg-rose-950/80 border border-rose-800 text-rose-200 p-2 rounded flex items-center gap-2 text-[10px]">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Primary Action Button */}
                <button
                  type="button"
                  onClick={handleRunDetection}
                  disabled={isLoading || !selectedFile}
                  className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded font-bold text-[12px] flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>RUNNING YOLO11n INFERENCE...</span>
                    </>
                  ) : (
                    <>
                      <Scan className="w-4 h-4 text-white" />
                      <span>DETECT VESSELS (revenant_vessel_detector.pt)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Right Column: Real Model Results (7 cols) */}
              <div className="md:col-span-7 bg-[#0b111e] p-3 rounded-lg border border-slate-800 flex flex-col">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <Crosshair className="w-3.5 h-3.5 text-sky-400" />
                    <span className="font-bold uppercase tracking-wider text-slate-200">
                      Detection Analysis Output
                    </span>
                  </div>
                  {analysisResult && (
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${
                        analysisResult.vessel_count > 0
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : 'bg-amber-950 text-amber-300 border-amber-800'
                      }`}
                    >
                      {analysisResult.vessel_count} TARGET(S) CONFIRMED
                    </span>
                  )}
                </div>

                {analysisResult ? (
                  <div className="mt-3 space-y-3 flex-1">
                    {/* Annotated Output Image */}
                    <div className="relative rounded overflow-hidden border border-slate-800 bg-black text-center">
                      <img
                        src={analysisResult.annotated_image_url}
                        alt="Annotated detection output"
                        className="max-h-64 mx-auto object-contain w-full"
                      />
                      <div className="absolute bottom-1.5 right-2 bg-black/80 backdrop-blur-xs px-2 py-0.5 rounded text-[8.5px] font-mono text-sky-400 border border-slate-800">
                        Model: revenant_vessel_detector.pt
                      </div>
                    </div>

                    {/* Metadata Strip */}
                    <div className="grid grid-cols-3 gap-2 text-[9px] font-mono bg-[#111827] p-2 rounded border border-slate-800 text-slate-400">
                      <div>
                        <span className="block text-slate-500 uppercase">Analysis ID</span>
                        <strong className="text-slate-200">{analysisResult.analysis_id}</strong>
                      </div>
                      <div>
                        <span className="block text-slate-500 uppercase">Timestamp</span>
                        <strong className="text-slate-200">
                          {new Date(analysisResult.timestamp).toLocaleTimeString()}
                        </strong>
                      </div>
                      <div>
                        <span className="block text-slate-500 uppercase">Database Status</span>
                        <strong className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle className="w-2.5 h-2.5" />
                          Atlas Persisted
                        </strong>
                      </div>
                    </div>

                    {/* Detected Vessels List */}
                    <div className="space-y-2">
                      <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-300 block">
                        Classified Vessel Targets ({analysisResult.vessels.length}):
                      </span>

                      {analysisResult.vessels.length === 0 ? (
                        <div className="text-center py-4 bg-[#111827] rounded border border-slate-800 text-slate-400">
                          <span className="block text-[11px]">No vessels detected</span>
                          <span className="text-[9px] text-slate-500">
                            Try lowering the confidence threshold slider and re-running.
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {analysisResult.vessels.map((vessel) => (
                            <div
                              key={vessel.vessel_id}
                              className="bg-[#111827] p-2 rounded border border-slate-800 hover:border-slate-700 transition-colors flex items-start justify-between text-[10px]"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-sky-400 bg-sky-950 px-1 py-0.2 rounded border border-sky-800 text-[9px]">
                                    #{vessel.vessel_id}
                                  </span>
                                  <span className="font-bold text-slate-100 uppercase tracking-wide">
                                    {vessel.vessel_type.replace(/_/g, ' ')}
                                  </span>
                                  <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950 border border-emerald-800 px-1 rounded font-semibold">
                                    {(vessel.confidence * 100).toFixed(1)}% CONF
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-x-3 text-[9px] font-mono text-slate-400">
                                  <span>
                                    Box: [{vessel.bounding_box.x1}, {vessel.bounding_box.y1}, {vessel.bounding_box.x2}, {vessel.bounding_box.y2}]
                                  </span>
                                  <span>
                                    Center: ({vessel.center_pixel.x}, {vessel.center_pixel.y})
                                  </span>
                                </div>

                                {vessel.latitude && vessel.longitude && (
                                  <div className="text-[9px] font-mono text-emerald-300 bg-[#080d17] p-1 rounded border border-emerald-900/60 flex items-center gap-2">
                                    <MapPin className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                                    <span>
                                      GPS: {vessel.latitude.toFixed(4)}°N, {vessel.longitude.toFixed(4)}°E (Distance: {vessel.geolocation?.estimated_distance_km} km)
                                    </span>
                                  </div>
                                )}
                              </div>

                              {onPlotVesselOnMap && vessel.latitude && vessel.longitude && (
                                <button
                                  type="button"
                                  onClick={() => onPlotVesselOnMap(vessel)}
                                  className="py-1 px-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded font-bold text-[9px] flex items-center gap-1 shrink-0 ml-2"
                                >
                                  <ExternalLink className="w-2.5 h-2.5" />
                                  <span>Plot on Map</span>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500">
                    <Scan className="w-12 h-12 text-slate-700 mb-2" />
                    <span className="text-[12px] font-semibold text-slate-400">
                      No Detection Analysis Executed
                    </span>
                    <span className="text-[9.5px] text-slate-500 max-w-xs mt-1">
                      Upload or drag an optical vessel image and click &quot;Detect Vessels&quot; to run inference with revenant_vessel_detector.pt.
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* History Tab: Records fetched directly from MongoDB Atlas */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-300 uppercase tracking-wider">
                  MongoDB Atlas Stored Analyses ({recentAnalyses.length})
                </span>
                <button
                  type="button"
                  onClick={loadRecentAnalyses}
                  className="text-sky-400 hover:text-sky-300 font-mono text-[10px] flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh Atlas Records</span>
                </button>
              </div>

              {recentAnalyses.length === 0 ? (
                <div className="text-center py-8 bg-[#0b111e] rounded border border-slate-800 text-slate-500">
                  <Database className="w-8 h-8 mx-auto mb-1 text-slate-600" />
                  <span>No saved analyses found in MongoDB Atlas.</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                  {recentAnalyses.map((rec) => (
                    <div
                      key={rec.analysis_id}
                      className="bg-[#0b111e] p-3 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between text-[11px]"
                    >
                      <div className="flex items-center gap-3">
                        {rec.annotated_image_url && (
                          <img
                            src={rec.annotated_image_url}
                            alt="thumb"
                            className="w-12 h-12 rounded object-cover border border-slate-800 shrink-0"
                          />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-100">{rec.analysis_id}</span>
                            <span
                              className={`text-[8.5px] font-mono px-1.5 py-0.2 rounded border font-semibold ${
                                rec.detected_vessel_count > 0
                                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                  : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}
                            >
                              {rec.detected_vessel_count} TARGETS
                            </span>
                          </div>
                          <span className="text-[9.5px] font-mono text-slate-500 block mt-0.5">
                            {new Date(rec.timestamp).toLocaleString()} • Threshold:{' '}
                            {rec.confidence_threshold * 100}%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {rec.vessels?.map((v: any) => (
                          <span
                            key={v.vessel_id}
                            className="bg-[#111827] text-slate-300 border border-slate-800 px-1.5 py-0.5 rounded text-[8.5px] font-mono"
                          >
                            {v.vessel_type} ({(v.confidence * 100).toFixed(0)}%)
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info strip */}
        <div className="px-4 py-1.5 bg-[#080d17] border-t border-slate-800 flex items-center justify-between text-[9px] text-slate-400 font-mono">
          <span>Model: revenant_vessel_detector.pt (SeaShips RGB YOLO11n)</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <Database className="w-2.5 h-2.5" />
            Atlas Database: coastal_surveillance • Collection: analyses
          </span>
        </div>
      </div>
    </div>
  );
};
