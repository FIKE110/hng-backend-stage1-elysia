import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
import dotenv from 'dotenv';
import { pool, initDatabase, createProfile, findProfileByName, findProfileById, deleteProfile, listProfiles, Profile } from './db';
import { fetchAndProcessProfile } from './genderize';

dotenv.config();

const app = new Elysia()
  .use(cors({
    origin: '*',
    credentials: true,
  }))
  .get('/', () => ({ message: 'Profile Intelligence Service API' }));

const profileSchema = t.Object({
  name: t.String({ minLength: 1 }),
});

app.post(
  '/api/profiles',
  async ({ set, body }) => {
    const { name } = body as { name: string };

    if (!name || name.trim() === '') {
      set.status = 400;
      return { status: 'error', message: 'Missing or empty name' };
    }

    try {
      const existing = await findProfileByName(name);
      if (existing) {
        set.status = 201;
        return {
          status: 'success',
          message: 'Profile already exists',
          data: formatProfile(existing),
        };
      }

      const processed = await fetchAndProcessProfile(name);
      const created = await createProfile(processed);

      set.status = 201;
      return {
        status: 'success',
        data: formatProfile(created),
      };
    } catch (error: any) {
      if (error?.service) {
        set.status = 502;
        return { status: 'error', message: error.message };
      }
      console.error('Error creating profile:', error);
      set.status = 500;
      return { status: 'error', message: 'Internal server error' };
    }
  },
  {
    body: profileSchema,
  }
);

app.get('/api/profiles/:id', async ({ set, params }) => {
  const profile = await findProfileById(params.id);

  if (!profile) {
    set.status = 404;
    return { status: 'error', message: 'Profile not found' };
  }

  return {
    status: 'success',
    data: formatProfile(profile),
  };
});

app.get('/api/profiles', async ({ query }) => {
  const gender = query.gender as string | undefined;
  const country_id = query.country_id as string | undefined;
  const age_group = query.age_group as string | undefined;

  const profiles = await listProfiles({ gender, country_id, age_group });

  return {
    status: 'success',
    count: profiles.length,
    data: profiles.map(formatProfileList),
  };
});

app.delete('/api/profiles/:id', async ({ set, params }) => {
  const deleted = await deleteProfile(params.id);

  if (!deleted) {
    set.status = 404;
    return { status: 'error', message: 'Profile not found' };
  }

  set.status = 204;
  return;
});

function formatProfile(profile: Profile) {
  return {
    id: profile.id,
    name: profile.name,
    gender: profile.gender,
    gender_probability: profile.gender_probability,
    sample_size: profile.sample_size,
    age: profile.age,
    age_group: profile.age_group,
    country_id: profile.country_id,
    country_probability: profile.country_probability,
    created_at: profile.created_at.toISOString(),
  };
}

function formatProfileList(profile: Profile) {
  return {
    id: profile.id,
    name: profile.name,
    gender: profile.gender,
    age: profile.age,
    age_group: profile.age_group,
    country_id: profile.country_id,
  };
}

app.listen(process.env.PORT || 3000, async () => {
  console.log(`Server is running on http://localhost:${process.env.PORT || 3000}`);
  try {
    await initDatabase();
    console.log('Database connected');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
});

export default app;