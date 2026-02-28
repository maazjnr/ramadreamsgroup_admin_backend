# Ramadreams Admin Backend

Express + MongoDB backend for admin property management.

## Features
- JWT admin authentication
- Property CRUD (create, edit, delete, list)
- Image/video upload to Cloudinary with validation
- Media cleanup on update/delete
- Public listing endpoints for published properties
- Automatic one-time seeding of legacy customer-site properties on empty database

## Quick Start
1. Install dependencies:
   `npm install`
2. Create env file:
   `cp .env.example .env`
3. Update environment values (Mongo URI, JWT secret, admin credentials).
4. Start dev server:
   `npm run dev`

To force-sync legacy listings manually:
`npm run seed:legacy`

Default server URL: `http://localhost:5000`

## Environment Variables
- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `CLIENT_ORIGINS` (comma-separated list)
- `ADMIN_NAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `MAX_UPLOAD_MB`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_FOLDER`

## API Endpoints
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `GET /api/v1/properties/public`
- `GET /api/v1/properties/public/:idOrSlug`
- `GET /api/v1/properties` (admin)
- `GET /api/v1/properties/:id` (admin)
- `POST /api/v1/properties` (admin, multipart `media`)
- `PATCH /api/v1/properties/:id` (admin, multipart `media`)
- `DELETE /api/v1/properties/:id` (admin)

## Production Subdomain Example
- API subdomain: `adminbackend.ramadreamsgroup.com`
- Reverse proxy should forward `/api/v1/*` to backend
- Set `CLIENT_ORIGINS` to your allowed frontend origin(s), for example:
  `http://localhost:3000,http://localhost:5174,https://adminfrontend.ramadreamsgroup.com,https://ramadreamsgroup.com,https://www.ramadreamsgroup.com`
# ramadreamsgroup_admin_backend
