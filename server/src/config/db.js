import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let isConnected = false;

export async function connectToDatabase() {
  if (isConnected) return;

  // MONGODB_ATLAS 환경변수를 우선 사용, 없으면 로컬 MongoDB 사용
  const mongoUri = process.env.MONGODB_ATLAS || 'mongodb://127.0.0.1:27017/jambro-shopping-mall';

  mongoose.set('strictQuery', true);

  await mongoose.connect(mongoUri, { autoIndex: true });

  isConnected = true;
  const dbType = process.env.MONGODB_ATLAS ? 'MongoDB Atlas' : 'Local MongoDB';
  console.log(`${dbType} connected`);
}


