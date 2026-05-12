Render deployment - server

Option A (Docker)
- Render can build the Dockerfile at the repository root. The included Dockerfile builds the `client/` Next.js app and the `server/` Node API and places the built client artifacts into `server/.next` and `server/public` for optional serving.
- Create a new Web Service on Render, set the repo and branch, and choose Docker.
- If you want reproducible infrastructure, import the root `render.yaml` Blueprint instead of configuring the service by hand.
- The service health check is set to `/health` in `render.yaml` so Render can verify the API is alive after deploy.
- Set environment variables in the Render dashboard:
  - `SUPABASE_DB_URL` (Supabase transaction pooler URL)
  - `DB_SSL=true`
  - `CLERK_ISSUER_URL` and `CLERK_JWKS_URL` for backend auth verification
  - `CLERK_API_KEY` and `OPENROUTER_KEY` as needed

Option B (Native Node)
- Create a Node Web Service on Render, set the root directory to the repository, and configure the build command and start command:
  - Build command: `cd client && npm ci && npm run build && cd ../server && npm ci`
  - Start command: `cd server && npm start`
- Alternatively set the service root to `/server` and use Render's `Build Command` as:
  - `cd ../client && npm ci && npm run build && cd ../server && npm ci`
- Ensure `Procfile` in `server/` exists (web: npm start)

Environment variables to set on Render
- `SUPABASE_DB_URL` - your Supabase pooler connection
- `DB_SSL` - `true`
- `CLERK_ISSUER_URL` - Clerk issuer URL for token verification
- `CLERK_JWKS_URL` - Clerk JWKS URL for token verification
- `CLERK_API_KEY` - if you later add Clerk server-side management calls
- `OPENROUTER_KEY` - if using AI

Notes
- If you prefer a separate frontend deployment, deploy the `client/` app to Vercel or Render Static Site, and point the frontend's API client to your Render server URL.
- I can also add a `render.yaml` manifest if you want reproducible service definitions.
- When using the Docker Blueprint, the service will use `healthCheckPath: /health`.
