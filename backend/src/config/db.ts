import mongoose from 'mongoose';
import { ENV } from './env';

let isConnected = false;

export const connectDB = async (): Promise<boolean> => {
  const uri = ENV.MONGODB_URI;

  if (!uri || uri.includes('<cluster-url>') || uri.includes('<username>') || uri.includes('<password>')) {
    console.warn('\n========================================================================');
    console.warn('⚠️  MONGODB ATLAS CONNECTION NOTICE:');
    console.warn('   No valid MONGODB_URI found in your .env file.');
    console.warn('   To connect to your cloud database, set MONGODB_URI in .env:');
    console.warn('   MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/coastal_surveillance');
    console.warn('   The REST API will boot in STANDBY/DEMO mode.');
    console.warn('========================================================================\n');
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, {
      dbName: ENV.DB_NAME,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    console.log(`\n✅ MongoDB Atlas Connected: ${conn.connection.host} (DB: ${conn.connection.name})`);
    return true;
  } catch (error: any) {
    isConnected = false;
    console.error('\n❌ MongoDB Atlas Connection Error:');
    console.error(`   ${error.message || error}`);
    console.warn('   Please check your network connection, IP whitelist (0.0.0.0/0), and MONGODB_URI credentials.\n');
    return false;
  }
};

export const isDBConnected = (): boolean => isConnected && mongoose.connection.readyState === 1;

export const closeDB = async (): Promise<void> => {
  if (isConnected) {
    await mongoose.connection.close();
    isConnected = false;
  }
};
