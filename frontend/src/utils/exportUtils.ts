import { VesselDetection } from '../types/maritime';

export function exportToCSV(detections: VesselDetection[]) {
  const headers = [
    'ID',
    'Timestamp',
    'Latitude',
    'Longitude',
    'Source',
    'Status',
    'Confidence(%)',
    'Length(m)',
    'Heading(deg)',
    'Speed(kts)',
    'VesselType',
    'VesselName',
    'MMSI',
    'Flag',
    'AIS_SpatialMatch(m)',
    'AIS_TimeDiff(min)'
  ];

  const rows = detections.map(d => [
    d.id,
    d.displayTime,
    d.lat,
    d.lon,
    d.source,
    d.correlationStatus,
    d.detectionConfidence,
    d.estimates.length,
    d.estimates.heading,
    d.estimates.speed,
    d.estimates.vesselType,
    d.vesselName || 'N/A (Dark)',
    d.mmsi || 'N/A',
    d.flag || 'N/A',
    d.correlation?.spatialMatchMeters ?? 'N/A',
    d.correlation?.timeDiffMinutes ?? 'N/A'
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  downloadBlob(csvContent, 'text/csv;charset=utf-8;', `revenant_detections_${Date.now()}.csv`);
}

export function exportToGeoJSON(detections: VesselDetection[]) {
  const featureCollection = {
    type: 'FeatureCollection',
    features: detections.map(d => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [d.lon, d.lat]
      },
      properties: {
        id: d.id,
        timestamp: d.displayTime,
        source: d.source,
        status: d.correlationStatus,
        detectionConfidence: d.detectionConfidence,
        vesselType: d.estimates.vesselType,
        length: d.estimates.length,
        heading: d.estimates.heading,
        speed: d.estimates.speed,
        vesselName: d.vesselName || null,
        mmsi: d.mmsi || null,
        flag: d.flag || null,
        region: d.region
      }
    }))
  };

  downloadBlob(JSON.stringify(featureCollection, null, 2), 'application/json', `revenant_detections_${Date.now()}.geojson`);
}

export function exportToKML(detections: VesselDetection[]) {
  const placemarks = detections.map(d => `
    <Placemark>
      <name>${d.id} - ${d.correlationStatus === 'CORRELATED' ? (d.vesselName || 'Vessel') : 'Dark Detection'}</name>
      <description>
        <![CDATA[
          <b>Status:</b> ${d.correlationStatus}<br/>
          <b>Source:</b> ${d.source}<br/>
          <b>Time:</b> ${d.displayTime}<br/>
          <b>Type:</b> ${d.estimates.vesselType} (${d.estimates.length}m)<br/>
          ${d.mmsi ? `<b>MMSI:</b> ${d.mmsi}<br/>` : ''}
          ${d.flag ? `<b>Flag:</b> ${d.flag}<br/>` : ''}
        ]]>
      </description>
      <Point>
        <coordinates>${d.lon},${d.lat},0</coordinates>
      </Point>
    </Placemark>
  `).join('');

  const kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>REVENANT Detections</name>
    ${placemarks}
  </Document>
</kml>`;

  downloadBlob(kmlContent, 'application/vnd.google-earth.kml+xml', `revenant_detections_${Date.now()}.kml`);
}

function downloadBlob(content: string, mimeType: string, filename: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
