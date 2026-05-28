
from fastapi import FastAPI

app = FastAPI(title="object-detection")

@app.get("/health")
def health_check():
    return {"service": "object-detection", "status": "healthy"}
