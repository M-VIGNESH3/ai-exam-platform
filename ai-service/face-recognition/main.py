
from fastapi import FastAPI

app = FastAPI(title="face-recognition")

@app.get("/health")
def health_check():
    return {"service": "face-recognition", "status": "healthy"}
