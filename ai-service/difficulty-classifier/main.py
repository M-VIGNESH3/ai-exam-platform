
from fastapi import FastAPI

app = FastAPI(title="difficulty-classifier")

@app.get("/health")
def health_check():
    return {"service": "difficulty-classifier", "status": "healthy"}
