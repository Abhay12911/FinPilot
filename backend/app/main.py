from fastapi import FastAPI

from app.auth import router as auth_router

app = FastAPI(title="FinPilot API")

app.include_router(auth_router)


@app.get("/")
def root():
    return {
        "message": "FinPilot API is running"
    }

