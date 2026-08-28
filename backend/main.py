import os
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from routes.auth import router as auth_router
# from routes.medical_history import router as medical_history_router
from routes.prediction import router as prediction_router
from routes.analytics import router as analytics_router
from routes.reports import router as reports_router

app = FastAPI(title="MedAssist AI API")

# MedAssist FastAPI Server Config
# Configure CORS
# Allow any origin with credentials using a regex pattern, or explicit '*'
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router)
# app.include_router(medical_history_router)
app.include_router(prediction_router)
app.include_router(analytics_router)
app.include_router(reports_router)

@app.get("/")
async def root():
    return {"message": "MedAssist AI API is running..."}

# General exception handler to match the NodeJS behavior
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    return JSONResponse(
        status_code=status_code,
        content={
            "message": str(exc),
            "stack": None if os.getenv("NODE_ENV") == "production" else f"{type(exc).__name__}: {str(exc)}"
        }
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 5000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
