# MedAssist Backend Database Setup (PostgreSQL)

## 1) Install dependencies

```powershell
cd backend
..\venv\Scripts\python -m pip install -r requirements.txt
```

## 2) Configure environment

```powershell
Copy-Item .env.example .env
```

Update `.env` with your PostgreSQL credentials.

## 3) Create schema in PostgreSQL

```powershell
..\venv\Scripts\python -m db.init_db
```

If successful, the script prints:

`PostgreSQL connection successful and schema initialized.`

## 4) Reuse connection in app code

Use `db.connection.engine` for SQLAlchemy engine access, or `db.connection.get_db_session()` for transactional sessions.

## Schema files

- `db/schema.sql`: Full MedAssist relational schema + staging tables for CSV imports
- `db/connection.py`: PostgreSQL connection setup
- `db/init_db.py`: Applies the schema to PostgreSQL
