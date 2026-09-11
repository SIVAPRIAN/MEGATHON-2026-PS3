// Indian Maritime EEZ (Exclusive Economic Zone 200 NM) and Territorial Limits GeoJSON
export const INDIAN_EEZ_GEOJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        name: 'India Mainland EEZ',
        type: 'EEZ',
        area: '2,014,900 sq km',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            // Gujarat western limit
            [68.10, 23.60],
            [67.00, 22.80],
            [66.50, 21.50],
            [67.20, 20.00],
            [68.50, 19.00],
            // Maharashtra & Goa offshore 200 NM
            [70.00, 18.00],
            [70.50, 16.50],
            [71.20, 15.00],
            // Karnataka & Kerala
            [71.80, 13.50],
            [72.50, 11.50],
            [73.50, 9.50],
            [74.50, 8.00],
            // Kanyakumari South & Gulf of Mannar border with Sri Lanka
            [76.00, 6.80],
            [77.50, 6.20],
            [79.00, 6.50],
            // Palk Bay & East coast
            [80.00, 8.50],
            [81.50, 10.50],
            // Tamil Nadu / Andhra Pradesh offshore 200 NM
            [83.00, 12.50],
            [84.50, 14.50],
            [86.00, 16.50],
            // Odisha & West Bengal offshore
            [87.50, 18.50],
            [89.00, 20.00],
            [89.50, 21.20],
            // Coastline return path
            [88.20, 21.70],
            [86.80, 20.40],
            [85.00, 19.30],
            [83.30, 17.70],
            [80.30, 13.10],
            [79.80, 10.30],
            [78.10, 8.80],
            [77.55, 8.08],
            [76.57, 8.88],
            [76.22, 9.96],
            [74.80, 12.92],
            [73.80, 15.40],
            [72.83, 18.92],
            [70.00, 21.00],
            [69.00, 22.24],
            [68.10, 23.60]
          ]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        name: 'Andaman & Nicobar Islands EEZ',
        type: 'EEZ',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [91.50, 14.00],
            [94.00, 14.00],
            [95.00, 12.00],
            [95.50, 9.00],
            [95.00, 6.50],
            [93.00, 6.00],
            [91.50, 7.50],
            [91.00, 10.50],
            [91.50, 14.00]
          ]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        name: 'Lakshadweep Islands EEZ',
        type: 'EEZ',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [71.00, 12.50],
            [74.00, 12.50],
            [74.50, 9.50],
            [73.50, 8.00],
            [71.50, 8.00],
            [71.00, 10.00],
            [71.00, 12.50]
          ]
        ]
      }
    }
  ]
};

// Major Indian Maritime Ports
export const MAJOR_PORTS = [
  { name: 'Port of Mumbai', lat: 18.9438, lon: 72.8465, code: 'INBOM' },
  { name: 'JNPT (Nhava Sheva)', lat: 18.9500, lon: 72.9500, code: 'INNSA' },
  { name: 'Cochin Port (Kochi)', lat: 9.9650, lon: 76.2700, code: 'INCOK' },
  { name: 'Kollam Port', lat: 8.8780, lon: 76.5750, code: 'INKOL' },
  { name: 'Vizhinjam International Seaport', lat: 8.3750, lon: 76.9900, code: 'INVZJ' },
  { name: 'Chennai Port', lat: 13.0842, lon: 80.2980, code: 'INMAA' },
  { name: 'Kamarajar (Ennore)', lat: 13.2600, lon: 80.3400, code: 'INENR' },
  { name: 'Visakhapatnam Port', lat: 17.6950, lon: 83.2980, code: 'INVTZ' },
  { name: 'Paradip Port', lat: 20.2640, lon: 86.6720, code: 'INPRT' },
  { name: 'Kandla (Deendayal)', lat: 23.0100, lon: 70.2200, code: 'INIXY' },
  { name: 'Port Blair', lat: 11.6670, lon: 92.7350, code: 'INIXZ' },
];
