MedAssist React Frontend

This is a small Vite + React app with two registration pages.

Run:

```bash
cd backend/frontend
npm install
npm run dev
```

Open `http://localhost:5173` and choose Patient or Provider registration.

The app posts to `http://127.0.0.1:8000/register` and expects a `confirmation_token` in the JSON response for testing the confirmation flow.
