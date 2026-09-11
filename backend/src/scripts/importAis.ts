import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { ENV } from '../config/env';
import { AISData } from '../models/AISData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Standard maritime vessel type mapping from numerical AIS type codes
const AIS_TYPE_MAP: Record<string, string> = {
  '30': 'Fishing',
  '31': 'Towing / Tug',
  '32': 'Towing Large',
  '33': 'Dredger',
  '34': 'Dive Vessel',
  '35': 'Military Ops',
  '36': 'Sailing Vessel',
  '37': 'Pleasure Craft / Skiff',
  '50': 'Pilot Vessel',
  '51': 'Search and Rescue',
  '52': 'Tug',
  '53': 'Port Tender',
  '55': 'Law Enforcement',
  '57': 'Spare / Patrol',
  '60': 'Passenger',
  '65': 'Passenger High Speed',
  '69': 'Passenger Other',
  '70': 'Cargo',
  '71': 'Cargo Hazmat A',
  '72': 'Cargo Hazmat B',
  '79': 'Cargo Other',
  '80': 'Tanker',
  '81': 'Tanker Hazmat A',
  '89': 'Tanker Other',
  '90': 'Other',
};

// 3 Curated DEMO AIS Records (Preserved for existing frontend scenarios)
export const CURATED_DEMO_AIS = [
  {
    mmsi: '503891240',
    vesselName: 'DEMO CARGO ALPHA',
    latitude: 13.11472,
    longitude: 80.38042,
    position: { type: 'Point' as const, coordinates: [80.38042, 13.11472] as [number, number] },
    speed: 8.5,
    sog: 8.5,
    heading: 90,
    vesselType: 'Cargo',
    destination: 'CHENNAI PORT',
    imo: '9123456',
    callSign: '9V8812',
    callsign: '9V8812',
    flag: 'Singapore',
    timestamp: new Date('2026-09-08T05:12:18.000Z'),
    dataSource: 'DEMO' as const,
    isSyntheticDemo: true,
  },
  {
    mmsi: '419001234',
    vesselName: 'DEMO TANKER BETA',
    latitude: 13.0652,
    longitude: 80.3621,
    position: { type: 'Point' as const, coordinates: [80.3621, 13.0652] as [number, number] },
    speed: 12.0,
    sog: 12.0,
    heading: 180,
    vesselType: 'Tanker',
    destination: 'ENNORE TERMINAL',
    imo: '9345678',
    callSign: 'AW1234',
    callsign: 'AW1234',
    flag: 'India',
    timestamp: new Date('2026-09-08T05:12:18.000Z'),
    dataSource: 'DEMO' as const,
    isSyntheticDemo: true,
  },
  {
    mmsi: '419009988',
    vesselName: 'DEMO FAST SKIFF',
    latitude: 13.095,
    longitude: 80.365,
    position: { type: 'Point' as const, coordinates: [80.365, 13.095] as [number, number] },
    speed: 18.0,
    sog: 18.0,
    heading: 45,
    vesselType: 'Pleasure Craft / Skiff',
    destination: 'INSHORE PATROL',
    flag: 'India',
    timestamp: new Date('2026-09-08T05:12:18.000Z'),
    dataSource: 'DEMO' as const,
    isSyntheticDemo: true,
  },
];

function parseNumber(val: string | undefined): number | undefined {
  if (!val || val.trim() === '' || val.trim() === 'N/A' || val.trim() === 'null') return undefined;
  const num = parseFloat(val.trim());
  return isNaN(num) ? undefined : num;
}

function parseString(val: string | undefined): string | undefined {
  if (!val || val.trim() === '' || val.trim() === 'N/A' || val.trim() === 'null') return undefined;
  return val.trim();
}

export async function importAisDataset(): Promise<boolean> {
  console.log('\n========================================================================');
  console.log('🚢 SYNTHETIC AIS CSV DATASET IMPORT PIPELINE');
  console.log('========================================================================\n');

  const uri = ENV.MONGODB_URI;
  if (!uri || uri.includes('<cluster-url>') || uri.includes('<username>') || uri.includes('<password>')) {
    console.error('❌ Missing valid MONGODB_URI in .env file.');
    return false;
  }

  // 1. Locate dataset file
  const candidatePaths = [
    path.resolve('data/ais/ais_synthetic.csv'),
    path.resolve('../data/ais/ais_synthetic.csv'),
    path.resolve(__dirname, '../../../data/ais/ais_synthetic.csv'),
    path.resolve(__dirname, '../../data/ais/ais_synthetic.csv'),
    path.resolve('data/ais_synthetic.csv'),
    path.resolve('../data/ais_synthetic.csv'),
  ];

  let filePath = candidatePaths.find((p) => fs.existsSync(p));

  if (!filePath) {
    console.error(`❌ AIS CSV dataset file not found in candidate paths:\n   ${candidatePaths.join('\n   ')}`);
    return false;
  }

  console.log(`📂 Reading dataset from: ${filePath}`);
  const csvContent = fs.readFileSync(filePath, 'utf8');
  const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length < 2) {
    console.error('❌ CSV file is empty or missing headers.');
    return false;
  }

  const header = lines[0].split(',').map((h) => h.trim());
  console.log(`📋 Header Columns (${header.length}):`, header.join(', '));
  console.log(`📊 Total observation rows: ${lines.length - 1}`);

  try {
    console.log('\nConnecting to MongoDB Atlas...');
    await mongoose.connect(uri, { dbName: ENV.DB_NAME });
    console.log('Connected to MongoDB Atlas.');

    // Drop old single mmsi unique index if it exists
    try {
      await AISData.collection.dropIndex('mmsi_1');
      console.log('   Dropped legacy unique index (mmsi_1)');
    } catch {
      // index might not exist or already dropped
    }

    // Step A: Ensure curated DEMO records exist and are preserved
    console.log('\n1. Ensuring curated 3 DEMO AIS records are preserved...');
    for (const demoRec of CURATED_DEMO_AIS) {
      await AISData.updateOne(
        { mmsi: demoRec.mmsi, timestamp: demoRec.timestamp },
        { $set: demoRec },
        { upsert: true }
      );
    }
    console.log('   ✅ 3 Curated DEMO records verified.');

    // Step B: Parse CSV and prepare bulk operations
    console.log('\n2. Parsing and transforming CSV observations...');
    const bulkOps: any[] = [];
    let validRows = 0;
    let skippedRows = 0;

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',');
      if (row.length < 5) {
        skippedRows++;
        continue;
      }

      const mmsi = parseString(row[0]);
      const dateStr = parseString(row[1]); // e.g. "2026-03-31"
      const timeStr = parseString(row[2]); // e.g. "03:43:54"
      const lon = parseNumber(row[3]);
      const lat = parseNumber(row[4]);

      if (!mmsi || !dateStr || !timeStr || lon === undefined || lat === undefined) {
        skippedRows++;
        continue;
      }

      // Construct proper ISO Date
      const timestamp = new Date(`${dateStr}T${timeStr}.000Z`);
      if (isNaN(timestamp.getTime())) {
        skippedRows++;
        continue;
      }

      const sog = parseNumber(row[5]) ?? 0;
      const cog = parseNumber(row[6]);
      const heading = parseNumber(row[7]) ?? 0;
      const vesselName = parseString(row[8]) || `AIS-${mmsi}`;
      const imo = parseString(row[9]);
      const callSign = parseString(row[10]);
      const rawType = parseString(row[11]);
      const vesselType = rawType ? (AIS_TYPE_MAP[rawType] || `Type-${rawType}`) : 'Cargo';
      const status = parseString(row[12]);
      const length = parseNumber(row[13]);
      const width = parseNumber(row[14]);
      const draft = parseNumber(row[15]);
      const cargo = parseString(row[16]);
      const transceiver = parseString(row[17]);

      const doc = {
        mmsi,
        vesselName,
        latitude: lat,
        longitude: lon,
        position: {
          type: 'Point',
          coordinates: [lon, lat], // [longitude, latitude] GeoJSON standard
        },
        sog,
        speed: sog,
        cog,
        heading,
        vesselType,
        imo,
        callSign,
        callsign: callSign,
        status,
        length,
        width,
        draft,
        cargo,
        transceiver,
        timestamp,
        dataSource: 'SYNTHETIC_DATASET',
        isSyntheticDemo: true,
      };

      // Idempotent upsert on composite key (mmsi, timestamp)
      bulkOps.push({
        updateOne: {
          filter: { mmsi, timestamp },
          update: { $set: doc },
          upsert: true,
        },
      });

      validRows++;
    }

    console.log(`   Valid records parsed: ${validRows} (Skipped malformed: ${skippedRows})`);

    // Step C: Execute bulkWrite in batches
    console.log('\n3. Executing idempotent bulk upsert to MongoDB Atlas (aisdatas)...');
    const BATCH_SIZE = 500;
    let upsertedCount = 0;
    let modifiedCount = 0;
    let matchedCount = 0;

    for (let i = 0; i < bulkOps.length; i += BATCH_SIZE) {
      const batch = bulkOps.slice(i, i + BATCH_SIZE);
      const res = await AISData.bulkWrite(batch, { ordered: false });
      upsertedCount += res.upsertedCount;
      modifiedCount += res.modifiedCount;
      matchedCount += res.matchedCount;
      process.stdout.write(`   Processed batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(bulkOps.length / BATCH_SIZE)}...\r`);
    }
    console.log('\n   ✅ BulkWrite completed.');

    // Step D: Ensure indexes are created explicitly
    console.log('\n4. Syncing collection indexes (2dsphere & composite keys)...');
    // Drop old single mmsi unique index if it exists
    try {
      await AISData.collection.dropIndex('mmsi_1');
    } catch {
      // index might not exist or already dropped
    }
    await AISData.collection.createIndex({ position: '2dsphere' });
    await AISData.collection.createIndex({ mmsi: 1, timestamp: 1 }, { unique: true });
    await AISData.collection.createIndex({ timestamp: -1 });
    await AISData.collection.createIndex({ dataSource: 1 });
    console.log('   ✅ Indexes verified (2dsphere, { mmsi: 1, timestamp: 1 }).');

    // Step E: Verification report
    const [totalAis, demoCount, datasetCount] = await Promise.all([
      AISData.countDocuments(),
      AISData.countDocuments({ dataSource: 'DEMO' }),
      AISData.countDocuments({ dataSource: 'SYNTHETIC_DATASET' }),
    ]);

    console.log('\n========================================================================');
    console.log('🎉 AIS DATASET IMPORT SUCCESSFUL');
    console.log(`   - Curated DEMO AIS Records:       ${demoCount} (Preserved)`);
    console.log(`   - Synthetic Dataset Observations: ${datasetCount} (Imported)`);
    console.log(`   - Total AIS Records in MongoDB:   ${totalAis}`);
    console.log(`   - Upsert Operations:              ${upsertedCount} new, ${matchedCount} existing verified`);
    console.log('========================================================================\n');

    await mongoose.connection.close();
    return true;
  } catch (error: any) {
    console.error('❌ Error during AIS import:', error.message || error);
    await mongoose.connection.close();
    return false;
  }
}

if (process.argv[1]?.includes('importAis')) {
  importAisDataset().then((success) => process.exit(success ? 0 : 1));
}
