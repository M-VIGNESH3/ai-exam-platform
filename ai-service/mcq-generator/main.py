
from fastapi import FastAPI

app = FastAPI(title="mcq-generator")

@app.get("/health")
def health_check():
    return {"service": "mcq-generator", "status": "healthy"}
