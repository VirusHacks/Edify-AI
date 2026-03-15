# Environment setup for gen-ed

This guide walks through the environment variables required by the project and how to obtain and validate them on Windows using PowerShell.

IMPORTANT: Never commit your real `.env` file. Use `.env.example` as a template and copy it to `.env`.

---

## 1) Database (Postgres / Neon)

Required variables (from `.env.example`):
- POSTGRES_URL (pooled)
- POSTGRES_URL_NON_POOLING
- POSTGRES_USER
- POSTGRES_HOST
- POSTGRES_PASSWORD
- POSTGRES_DATABASE
- POSTGRES_URL_NO_SSL
- POSTGRES_PRISMA_URL
- DRIZZLE_DATABASE_URL
- DATABASE_URL_UNPOOLED

Example pooled URL:
```
postgres://<USER>:<PASSWORD>@<HOST>:5432/<DATABASE>?sslmode=require
```

How to get:
- If you're using Neon: copy connection string from Neon dashboard (choose pooled or unpooled as needed).
- For other Postgres providers, construct the connection string using the example above.

Quick PowerShell validation (after setting `.env`):
```powershell
# Install psql client if you don't have it. Or use a simple TCP test:
Test-NetConnection -ComputerName $env:PGHOST -Port 5432

# If psql is available, try connecting:
psql "$env:POSTGRES_URL"
```

---

## 2) Authentication (Kinde)

Variables:
- KINDE_CLIENT_ID
- KINDE_CLIENT_SECRET
- KINDE_ISSUER_URL
- KINDE_SITE_URL
- KINDE_POST_LOGOUT_REDIRECT_URL
- KINDE_POST_LOGIN_REDIRECT_URL

How to get:
- Create an application in your Kinde dashboard. Copy the client ID and secret.
- Set the redirect URIs to `http://localhost:3000` (or your dev origin) and the post-login redirect to `/dashboard`.

Quick validation:
```powershell
# Verify issuer is reachable
Invoke-WebRequest -Uri $env:KINDE_ISSUER_URL -UseBasicParsing
```

---

## 3) Firebase

Variables:
- NEXT_PUBLIC_FIREBASE_API_KEY
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
- NEXT_PUBLIC_FIREBASE_PROJECT_ID
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- NEXT_PUBLIC_FIREBASE_APP_ID
- NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID

How to get:
- In Firebase console, create (or use) a project and copy the web app config.
- These values are the client SDK config fields.

Quick validation:
```powershell
# Simple test: check the auth domain resolves
Resolve-DnsName $env:NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
```

---

## 4) Google / YouTube / Analytics / Gemini / AI keys

Variables include:
- NEXT_PUBLIC_YOUTUBE_API_KEY
- NEXT_PUBLIC_GOOGLE_ANALYTICS
- NEXT_PUBLIC_GEMINI_API_KEY
- GOOGLE_AI_KEY

How to get:
- Create credentials in Google Cloud Console for each API you need and enable the API (YouTube Data API, Analytics, etc.).
- For Gemini or other AI providers, follow the provider's docs to obtain an API key.

Quick validation:
```powershell
# Example: call YouTube API (quota applies)
$uri = "https://www.googleapis.com/youtube/v3/channels?part=id&forUsername=GoogleDevelopers&key=$env:NEXT_PUBLIC_YOUTUBE_API_KEY"
Invoke-WebRequest -Uri $uri -UseBasicParsing
```

---

## 5) Inngest Cloud (Background Jobs)

Inngest handles background job processing for meetings transcription, async workflows, etc.

**Required Variables:**
- `INNGEST_EVENT_KEY` - For sending events to Inngest Cloud
- `INNGEST_SIGNING_KEY` - For validating webhook requests from Inngest Cloud

**How to get:**

1. Go to [Inngest Cloud Dashboard](https://app.inngest.com/)
2. Create an account or sign in
3. Create a new app or use existing one
4. Go to **Settings** → **Keys**
5. Copy:
   - **Event Key** → `INNGEST_EVENT_KEY`
   - **Signing Key** → `INNGEST_SIGNING_KEY`

**Setting up with Google Cloud Run:**

1. **Deploy your app to Cloud Run first** (so you have a public URL)

2. **Register your app with Inngest Cloud:**
   - In Inngest Dashboard, go to your app
   - Click **"Sync App"** or add a new app
   - Enter your Cloud Run URL: `https://your-app-xxxxx.run.app/api/inngest`
   - Inngest will send a request to verify your endpoint

3. **Add environment variables to Cloud Run:**
   ```bash
   # Using gcloud CLI
   gcloud run services update YOUR_SERVICE_NAME \
     --set-env-vars="INNGEST_EVENT_KEY=your_event_key" \
     --set-env-vars="INNGEST_SIGNING_KEY=your_signing_key"
   ```
   
   Or in Cloud Run Console:
   - Go to your service → Edit & Deploy New Revision
   - Under "Variables & Secrets" → Add your Inngest keys

4. **Verify the connection:**
   - In Inngest Dashboard, check if your functions appear
   - The `meetingsProcessing` function should be visible
   - Try triggering a test event

**Quick validation:**
```powershell
# Test that your Inngest endpoint responds
Invoke-WebRequest -Uri "https://your-app.run.app/api/inngest" -UseBasicParsing

# Send a test event (requires curl or Invoke-RestMethod)
$headers = @{ "Content-Type" = "application/json" }
$body = '{"name": "test/event", "data": {}}'
Invoke-RestMethod -Uri "https://inn.gs/e/$env:INNGEST_EVENT_KEY" -Method POST -Headers $headers -Body $body
```

**Troubleshooting:**
- If functions don't appear: Check that `INNGEST_SIGNING_KEY` is set correctly
- If events aren't processed: Verify `INNGEST_EVENT_KEY` is correct
- Check Cloud Run logs for any Inngest-related errors

---

## 6) Supabase Storage (for file uploads)

**Note:** We use Neon for database storage and Supabase ONLY for file storage (resumes, documents).

Variables:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

How to get:
1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret key** → `SUPABASE_SERVICE_ROLE_KEY`

4. Create a storage bucket:
   - Go to Storage in Supabase dashboard
   - Create a bucket named `resumes`
   - Set it to **public** (so resume URLs can be accessed)

Quick validation:
```powershell
# Test Supabase URL is reachable
Invoke-WebRequest -Uri "$env:NEXT_PUBLIC_SUPABASE_URL/rest/v1/" -UseBasicParsing
```

---

## 7) Stream / Realtime services

Variables:
- NEXT_PUBLIC_STREAM_API_KEY
- STREAM_SECRET_KEY

How to get:
- Create an app in your Stream/Realtime provider dashboard. Copy keys.

Validation:
```powershell
# Simple HTTP ping if provider exposes it (replace with provider's health endpoint)
Invoke-WebRequest -Uri "https://api.getstream.io/" -UseBasicParsing
```

---

## 8) Perplexity AI (Market Intelligence)

The personalized career roadmap feature uses Perplexity AI's Sonar models to provide real-time market intelligence, job trends, and industry analysis.

Variables:
- PERPLEXITY_API_KEY

How to get:
1. Go to [Perplexity AI](https://www.perplexity.ai/)
2. Sign up or log in to your account
3. Navigate to API settings: https://www.perplexity.ai/settings/api
4. Generate a new API key
5. Copy the key to your `.env` file

Validation:
```powershell
# Test the API key (replace YOUR_API_KEY)
$headers = @{ "Authorization" = "Bearer $env:PERPLEXITY_API_KEY"; "Content-Type" = "application/json" }
$body = '{"model":"sonar","messages":[{"role":"user","content":"Hello"}]}'
Invoke-RestMethod -Uri "https://api.perplexity.ai/chat/completions" -Method Post -Headers $headers -Body $body
```

**Features enabled by Perplexity API:**
- Real-time job market analysis
- Salary range insights
- Top hiring companies identification
- Skill demand trends
- 2030 future outlook predictions
- Certification recommendations
- Personalized skill gap analysis

**Note:** The personalized roadmap feature will still work without Perplexity API but won't include real-time market intelligence. It will fall back to AI-generated content only.

---

## 9) Other APIs

Variables:
- GROQ_API_KEY (Sanity/GROQ)
- HUGGINGFACE_API_KEY
- MISTRAL_API_KEY
- Any other keys used by your app

Get them from respective provider dashboards.

---

## 10) Local workflow

1. Copy `.env.example` to `.env`:
```powershell
cp .env.example .env
```
2. Open `.env` and fill values.
3. Start the dev server:
```powershell
npm install
npm run dev
```
4. For local Inngest development, run the Inngest dev server:
```powershell
npm run ingest
```
This starts a local Inngest dev server that mimics Inngest Cloud.

---

## 11) Security notes
- Store production secrets in a secrets manager (e.g., Vercel envs, AWS Secrets Manager, GitHub Actions secrets) instead of committing them.
- Rotate keys if they're accidentally leaked.

---

If you want, I can also:
- Add example values (non-functional placeholders) next to each key in `.env.example`.
- Add a small PowerShell script `scripts/validate-env.ps1` that checks required vars exist and performs simple reachability checks.

Tell me which of the above you'd like me to implement next.

