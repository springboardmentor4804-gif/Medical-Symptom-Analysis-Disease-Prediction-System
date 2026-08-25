MedAssist Backend - Users & Registration

Run the API (from backend folder):

```powershell
..\venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
```

Registration endpoint:

POST /register
Body JSON:
{
  "full_name": "Name",
  "email": "email@example.com",
  "password": "min8chars",
  "role": "patient"  // or doctor or admin
  "phone": "optional"
}

DB session: `db.connection.get_db_session()`

Frontend test pages (open in browser while server runs):
- `backend/frontend/patient_register.html`
- `backend/frontend/provider_register.html`

Confirmation flow:
- After registration the API returns a `confirmation_token` for testing. Call `GET /confirm?token=...` to confirm the email (this currently deletes the confirmation row).

To run locally:

```powershell
..\venv\Scripts\python -m pip install -r requirements.txt
..\venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
# Then open one of the frontend HTML files in your browser (or use curl/Postman)
```
