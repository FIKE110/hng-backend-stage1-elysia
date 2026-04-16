# Profile Intelligence Service

A RESTful API that enriches names using external APIs (Genderize, Agify, Nationalize), stores the data in PostgreSQL, and provides endpoints for profile management.

## Overview

This service implements a **Profile Intelligence System** that:
1. Accepts a name as input
2. Enriches it using three external APIs (Genderize, Agify, Nationalize)
3. Stores the processed data in PostgreSQL
4. Provides CRUD endpoints for profile retrieval and management

## Features

- **Multi-API Integration**: Consumes Genderize, Agify, and Nationalize APIs
- **Data Persistence**: PostgreSQL database storage
- **Idempotency**: Prevents duplicate profiles (same name returns existing record)
- **Query Filtering**: Filter profiles by gender, country_id, age_group
- **UUID v7**: All profile IDs use UUID v7 format
- **UTC Timestamps**: All timestamps in ISO 8601 format

## API Endpoints

### 1. POST /api/profiles

Create a new profile by enriching a name with external APIs.

**Request:**
```bash
curl -X POST http://localhost:3000/api/profiles \
  -H "Content-Type: application/json" \
  -d '{"name": "ella"}'
```

**Success Response (201):**
```json
{
  "status": "success",
  "data": {
    "id": "b3f9c1e2-7d4a-4c91-9c2a-1f0a8e5b6d12",
    "name": "ella",
    "gender": "female",
    "gender_probability": 0.99,
    "sample_size": 1234,
    "age": 46,
    "age_group": "adult",
    "country_id": "US",
    "country_probability": 0.85,
    "created_at": "2026-04-01T12:00:00Z"
  }
}
```

**Idempotency Response (201):**
If the same name already exists, returns the existing profile:
```json
{
  "status": "success",
  "message": "Profile already exists",
  "data": {
    "id": "existing-id",
    "name": "ella",
    ...
  }
}
```

### 2. GET /api/profiles/:id

Get a profile by its unique ID.

**Request:**
```bash
curl http://localhost:3000/api/profiles/b3f9c1e2-7d4a-4c91-9c2a-1f0a8e5b6d12
```

**Success Response (200):**
```json
{
  "status": "success",
  "data": {
    "id": "b3f9c1e2-7d4a-4c91-9c2a-1f0a8e5b6d12",
    "name": "emmanuel",
    "gender": "male",
    "gender_probability": 0.99,
    "sample_size": 1234,
    "age": 25,
    "age_group": "adult",
    "country_id": "NG",
    "country_probability": 0.85,
    "created_at": "2026-04-01T12:00:00Z"
  }
}
```

### 3. GET /api/profiles

List all profiles with optional query filters.

**Request - All Profiles:**
```bash
curl http://localhost:3000/api/profiles
```

**Request - Filtered Profiles:**
```bash
curl "http://localhost:3000/api/profiles?gender=male&country_id=NG"
# or
curl "http://localhost:3000/api/profiles?age_group=adult"
```

**Success Response (200):**
```json
{
  "status": "success",
  "count": 2,
  "data": [
    {
      "id": "id-1",
      "name": "emmanuel",
      "gender": "male",
      "age": 25,
      "age_group": "adult",
      "country_id": "NG"
    },
    {
      "id": "id-2",
      "name": "sarah",
      "gender": "female",
      "age": 28,
      "age_group": "adult",
      "country_id": "US"
    }
  ]
}
```

### 4. DELETE /api/profiles/:id

Delete a profile by its ID.

**Request:**
```bash
curl -X DELETE http://localhost:3000/api/profiles/b3f9c1e2-7d4a-4c91-9c2a-1f0a8e5b6d12
```

**Success Response:** `204 No Content`

## Query Parameters

For `GET /api/profiles`:

| Parameter | Type | Description |
|-----------|------|-------------|
| gender | string | Filter by gender (case-insensitive) |
| country_id | string | Filter by country code (case-insensitive) |
| age_group | string | Filter by age group (child, teenager, adult, senior) |

## Error Handling

All errors follow a consistent structure:

```json
{
  "status": "error",
  "message": "<error message>"
}
```

### Error Codes

| Status Code | Description |
|------------|-------------|
| 400 | Bad Request - Missing or empty name |
| 404 | Not Found - Profile not found |
| 422 | Unprocessable Entity - Invalid type |
| 500 | Internal Server Error |
| 502 | Bad Gateway - External API error |

### External API Errors

```json
{
  "status": "error",
  "message": "Genderize returned an invalid response"
}
```

```json
{
  "status": "error",
  "message": "Agify returned an invalid response"
}
```

```json
{
  "status": "error",
  "message": "Nationalize returned an invalid response"
}
```

### Edge Cases

| Condition | Response |
|-----------|----------|
| name is empty or missing | 400 - "Missing or empty name" |
| External API returns invalid data | 502 - "X returned an invalid response" |
| Profile not found | 404 - "Profile not found" |

## Data Processing

### External APIs Used

| API | Purpose | Fields Used |
|-----|---------|-------------|
| Genderize | Gender prediction | gender, probability, count |
| Agify | Age estimation | age |
| Nationalize | Country origin | country_id, probability |

### Processing Rules

1. **Genderize**: `count` is renamed to `sample_size`
2. **Agify**: Age is classified into groups:
   - 0-12: `child`
   - 13-19: `teenager`
   - 20-59: `adult`
   - 60+: `senior`
3. **Nationalize**: Picks the country with highest probability as `country_id`

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | PostgreSQL connection string |
| PORT | No | Server port (default: 3000) |
| NODE_ENV | No | Environment (production/development) |

## Setup

### Prerequisites

- [Bun](https://bun.sh) runtime
- PostgreSQL database (local or cloud)

### Local Development

1. Clone the repository:
```bash
git clone <repository-url>
cd stage-1-hng
```

2. Install dependencies:
```bash
bun install
```

3. Set up environment variables (optional if DATABASE_URL exists in .env):
```bash
# Create .env file
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
PORT=3000
NODE_ENV=development
```

4. Run the development server:
```bash
bun run dev
```

The server will start at `http://localhost:3000`

### Database Setup

The application automatically creates the `profiles` table on startup:

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  gender VARCHAR(50),
  gender_probability FLOAT,
  sample_size INTEGER,
  age INTEGER,
  age_group VARCHAR(50),
  country_id VARCHAR(10),
  country_probability FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Deployment

### Deploy to Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Set environment variables in Vercel dashboard:
   - DATABASE_URL: Your PostgreSQL connection string

### Deploy to Railway

1. Install Railway CLI:
```bash
npm i -g @railway/cli
```

2. Login and initialize:
```bash
railway login
railway init
```

3. Add PostgreSQL plugin:
```bash
railway add postgres
```

4. Deploy:
```bash
railway up
```

### Deploy to Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set the following:
   - Build Command: `bun install`
   - Start Command: `bun run start`
4. Add environment variable: DATABASE_URL

### Deploy to Heroku

1. Create a new app on Heroku
2. Add PostgreSQL add-on:
```bash
heroku addons:create heroku-postgresql
```
3. Set buildpack:
```bash
heroku buildpacks:set heroku/builder
```
4. Deploy:
```bash
git push heroku main
```

## Tech Stack

- **Runtime**: [Bun](https://bun.sh)
- **Framework**: [Elysia](https://elysiajs.com)
- **Database**: PostgreSQL (Neon, or any PostgreSQL provider)
- **External APIs**: [Genderize](https://genderize.io), [Agify](https://agify.io), [Nationalize](https://nationalize.io)

## Project Structure

```
stage-1-hng/
├── src/
│   ├── index.ts      # Main application and routes
│   ├── db.ts        # Database connection and queries
│   ├── genderize.ts # External API integration
│   └── uuid.ts      # UUID v7 generator
├── .env             # Environment variables
├── package.json     # Dependencies
├── tsconfig.json   # TypeScript config
└── README.md       # This file
```

## Testing

Test the API using curl:

```bash
# Create a profile
curl -X POST http://localhost:3000/api/profiles \
  -H "Content-Type: application/json" \
  -d '{"name": "john"}'

# Get the created profile
curl http://localhost:3000/api/profiles

# Filter profiles
curl "http://localhost:3000/api/profiles?gender=male"

# Delete a profile
curl -X DELETE http://localhost:3000/api/profiles/{id}
```

## License

MIT