# Deployment

This repo is a **split deployment**: the React SPA in `web/` goes to Vercel, the
FastAPI service in `backend/` goes to a container host. They cannot both live on
Vercel — see "Why the backend can't run on Vercel" below.

## 1. Frontend → Vercel

`vercel.json` at the repo root configures everything, so no dashboard build
settings are needed. Import the repo and deploy.

The only required setting is one environment variable:

| Variable       | Value                                 |
| -------------- | ------------------------------------- |
| `VITE_API_URL` | Public HTTPS URL of the deployed API  |

It is read at **build time** (`web/src/lib/api.js`), so change it and redeploy —
setting it after the fact does nothing until the next build.

`.vercelignore` keeps `backend/`, `.venv/` and the 106 MB of Git-LFS model
artifacts out of the upload; without it every deploy ships them and either times
out or fails on LFS pointers Vercel does not resolve.

The rewrite rule sends every non-asset path to `index.html`, which is what
`react-router-dom`'s `BrowserRouter` needs — otherwise a hard refresh on
`/dashboard` returns a 404.

## 2. Backend → Render / Railway / Fly.io

`backend/Dockerfile` builds and runs the API and now honours the `$PORT` that
these platforms inject.

Build context is the **repo root** (the Dockerfile copies `backend/`), so set:

- Dockerfile path: `backend/Dockerfile`
- Build context / root directory: `.`

Environment variables to set on the API service:

| Variable                    | Notes                                                    |
| --------------------------- | -------------------------------------------------------- |
| `SECRET_KEY`                | Required. Random 64-hex string. Omitting it regenerates one per process, which invalidates every JWT on restart. |
| `DATABASE_URL`              | `postgresql://…`. The SQLite default is ephemeral on any container host — data is lost on redeploy. |
| `CORS_ORIGINS`              | Must include the Vercel origin, e.g. `https://your-app.vercel.app`. Comma-separated. |
| `BOOTSTRAP_ADMIN_EMAIL`     | Optional; creates the first admin on startup.             |
| `BOOTSTRAP_ADMIN_PASSWORD`  | Optional; pairs with the above.                           |

Enable Git LFS on the host so `backend/artifacts/*.joblib` are fetched as real
files. If LFS is not resolved the API starts but every model endpoint fails —
check `GET /system/model-status` after deploy.

Generated PDFs are written to `backend/generated_reports/`, which is container
local. Attach a persistent disk (or move to object storage) if reports must
survive a restart.

## Why the backend can't run on Vercel

- Vercel's Python serverless functions cap at **250 MB unzipped**. `scikit-learn`
  + `scipy` + `pandas` + `numpy` + `reportlab` alone are already close to that,
  and `backend/artifacts/` adds **106 MB** on top (`model3_text_condition.joblib`
  is 104 MB by itself).
- Cold start would deserialise those joblib models on every scaled-to-zero
  invocation.
- The filesystem is read-only apart from `/tmp`, so the SQLite default and the
  PDF report directory both break.
- Vercel does not check out Git LFS objects, so the artifacts would arrive as
  text pointer files.

None of these are fixable by configuration; the service needs a long-lived
container.

## Local development

Unchanged — `start.ps1` / `docker-compose.yml`.
