import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) throw new Error("Missing MONGODB_URI");

let clientPromise = global._mongoClientPromise;

if (!clientPromise) {
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 8000, // <— quan trọng
    connectTimeoutMS: 8000,
  });
  clientPromise = client.connect();
  global._mongoClientPromise = clientPromise;
}

export async function getDb() {
  const client = await clientPromise;
  return client.db();
}
