# Profile Intelligence Service

A RESTful API that enriches names using external APIs (Genderize, Agify, Nationalize), stores the data in PostgreSQL, and provides endpoints for profile management.

## Features

- **Multi-API Integration**: Enriches names using three external APIs
- **Data Persistence**: PostgreSQL database for storing profiles
- **Idempotency**: Prevents duplicate profiles for the same name
- **Filtering**: Query profiles by gender, country_id, and age_group
- **UUID v7**: All IDs use UUID v7 format
- **UTC Timestamps**: All timestamps in ISO 8601 format

## API Endpoints

### POST /api/profiles
Create a new profile by enriching a name.

```bash
curl -X POST http://localhost:3000/api/profiles \
  -H "Content-Type: application/json" \
  -d '{"name": "ella"}'
```

### GET /api/profiles/:id
Get a profile by ID.

```bash
curl http://localhost:3000/api/profiles/{id}
```

### GET /api/profiles
List all profiles with optional filters.

```bash
# All profiles
curl http://localhost:3000/api/profiles

# Filtered profiles
curl "http://localhost:3000/api/profiles?gender=male&country_id=NG"
```

### DELETE /api/profiles/:id
Delete a profile by ID.

```bash
curl -X DELETE http://localhost:3000/api/profiles/{id}
```

## Setup

1. Install dependencies:
```bash
bun install
```

2. Set up environment variables:
```bash
# For local development, use your local PostgreSQL URL
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
PORT=3000
```

3. Run the server:
```bash
bun run dev
```

## Tech Stack

- **Runtime**: Bun
- **Framework**: Elysia
- **Database**: PostgreSQL (Neon)
- **APIs**: Genderize, Agify, Nationalize