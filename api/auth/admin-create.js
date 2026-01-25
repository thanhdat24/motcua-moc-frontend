import { getDb } from '../_db.js';
import { hash } from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const adminKey = req.headers['x-admin-key'];
  if (!process.env.ADMIN_SETUP_KEY) {
    return res.status(500).json({ error: 'ADMIN_SETUP_KEY not set' });
  }
  if (adminKey !== process.env.ADMIN_SETUP_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing username or password' });
  }

  const db = await getDb();
  const users = db.collection('users');

  const exists = await users.findOne({ username });
  if (exists) return res.status(409).json({ error: 'User already exists' });

  const passwordHash = await hash(password, 10);
  await users.insertOne({
    username,
    passwordHash,
    createdAt: new Date(),
  });

  return res.status(200).json({ ok: true });
}
