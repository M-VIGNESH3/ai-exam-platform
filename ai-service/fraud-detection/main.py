
from fastapi import FastAPI

app = FastAPI(title="fraud-detection")

@app.get("/health")
def health_check():
    return {"service": "fraud-detection", "status": "healthy"}
