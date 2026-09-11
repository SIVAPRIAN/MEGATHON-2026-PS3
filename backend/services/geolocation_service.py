"""
REVENANT Geolocation Service
Strictly independent of the YOLO ML model.
Converts detected target center pixel (x, y) into geographic latitude/longitude
using coastal camera optical calibration (station lat/lon, azimuth heading, horizontal FOV, and range).
"""

import math
from typing import Optional, Dict, Any, Tuple

EARTH_RADIUS_KM = 6371.0

def to_rad(deg: float) -> float:
    return deg * math.pi / 180.0

def to_deg(rad: float) -> float:
    return rad * 180.0 / math.pi

def destination_point(
    lat: float,
    lon: float,
    distance_km: float,
    bearing_deg: float
) -> Tuple[float, float]:
    """
    Computes (lat, lon) destination given starting position, distance (km), and bearing (degrees).
    Matches the geodesy implementation in frontend/src/utils/geoUtils.ts.
    """
    d_r = distance_km / EARTH_RADIUS_KM
    lat1 = to_rad(lat)
    lon1 = to_rad(lon)
    brng = to_rad(bearing_deg)

    lat2 = math.asin(
        math.sin(lat1) * math.cos(d_r) +
        math.cos(lat1) * math.sin(d_r) * math.cos(brng)
    )

    lon2 = lon1 + math.atan2(
        math.sin(brng) * math.sin(d_r) * math.cos(lat1),
        math.cos(d_r) - math.sin(lat1) * math.sin(lat2)
    )

    return (round(to_deg(lat2), 6), round(to_deg(lon2), 6))

class GeolocationService:
    @staticmethod
    def estimate_coordinates(
        center_x: float,
        center_y: float,
        image_width: int,
        image_height: int,
        camera_metadata: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, float]]:
        """
        Converts center pixel into latitude and longitude if camera calibration metadata is available.
        Returns None if no camera calibration is supplied.
        """
        if not camera_metadata:
            return None

        cam_lat = camera_metadata.get('lat') or camera_metadata.get('camera_lat')
        cam_lon = camera_metadata.get('lon') or camera_metadata.get('camera_lon')

        if cam_lat is None or cam_lon is None:
            return None

        try:
            cam_lat = float(cam_lat)
            cam_lon = float(cam_lon)
            cam_heading = float(camera_metadata.get('heading', camera_metadata.get('camera_heading', 90.0)))
            cam_fov = float(camera_metadata.get('fov', camera_metadata.get('camera_fov', 60.0)))
            cam_range_km = float(camera_metadata.get('range_km', camera_metadata.get('camera_range_km', 12.0)))
        except (ValueError, TypeError):
            return None

        # Horizontal angular offset from camera optical centerline (-fov/2 to +fov/2)
        norm_x = (center_x / max(image_width, 1)) - 0.5  # [-0.5, 0.5]
        azimuth_offset = norm_x * cam_fov
        target_bearing = (cam_heading + azimuth_offset) % 360.0

        # Vertical perspective estimation: lower in frame (larger y) = closer; higher in frame = near horizon/max range
        norm_y = (center_y / max(image_height, 1))
        norm_y = max(0.05, min(0.95, norm_y))
        # Closer to camera bottom (e.g. 0.9 = 20% range, 0.5 = 60% range, 0.1 = 90% range)
        estimated_distance_km = cam_range_km * (1.0 - (norm_y * 0.75))
        estimated_distance_km = max(0.5, min(cam_range_km, estimated_distance_km))

        lat, lon = destination_point(cam_lat, cam_lon, estimated_distance_km, target_bearing)

        return {
            "latitude": lat,
            "longitude": lon,
            "estimated_distance_km": round(estimated_distance_km, 2),
            "bearing_deg": round(target_bearing, 1),
            "calibrated_camera_id": camera_metadata.get('camera_id') or camera_metadata.get('id', 'CUSTOM_CALIBRATION')
        }
