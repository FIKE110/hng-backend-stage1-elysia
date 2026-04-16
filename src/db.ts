import pg from 'pg';
import { generateUUIDV7 } from './uuid';
const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL UNIQUE,
        gender VARCHAR(50),
        gender_probability FLOAT,
        sample_size INTEGER,
        age INTEGER,
        age_group VARCHAR(50),
        country_id VARCHAR(10),
        country_probability FLOAT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('Database initialized successfully');
  } finally {
    client.release();
  }
}

export interface Profile {
  id: string;
  name: string;
  gender: string | null;
  gender_probability: number | null;
  sample_size: number | null;
  age: number | null;
  age_group: string | null;
  country_id: string | null;
  country_probability: number | null;
  created_at: Date;
}

export async function findProfileByName(name: string): Promise<Profile | null> {
  const result = await pool.query('SELECT * FROM profiles WHERE name = $1', [name.toLowerCase()]);
  return result.rows[0] || null;
}

export async function findProfileById(id: string): Promise<Profile | null> {
  const result = await pool.query('SELECT * FROM profiles WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function createProfile(profile: Omit<Profile, 'id' | 'created_at'>): Promise<Profile> {
  const result = await pool.query(
    `INSERT INTO profiles (name, gender, gender_probability, sample_size, age, age_group, country_id, country_probability)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      profile.name.toLowerCase(),
      profile.gender,
      profile.gender_probability,
      profile.sample_size,
      profile.age,
      profile.age_group,
      profile.country_id,
      profile.country_probability,
    ]
  );
  return result.rows[0];
}

export async function deleteProfile(id: string): Promise<boolean> {
  const result = await pool.query('DELETE FROM profiles WHERE id = $1', [id]);
  return result.rowCount !== null && result.rowCount > 0;
}

export async function listProfiles(filters: { gender?: string; country_id?: string; age_group?: string }): Promise<Profile[]> {
  let query = 'SELECT * FROM profiles WHERE 1=1';
  const params: (string | undefined)[] = [];
  let paramIndex = 1;

  if (filters.gender) {
    query += ` AND LOWER(gender) = $${paramIndex++}`;
    params.push(filters.gender?.toLowerCase());
  }
  if (filters.country_id) {
    query += ` AND UPPER(country_id) = $${paramIndex++}`;
    params.push(filters.country_id?.toUpperCase());
  }
  if (filters.age_group) {
    query += ` AND LOWER(age_group) = $${paramIndex++}`;
    params.push(filters.age_group?.toLowerCase());
  }

  query += ' ORDER BY created_at DESC';

  const result = await pool.query(query, params);
  return result.rows;
}