from fastapi import FastAPI

app = FastAPI(title="Wakhar WMS", version="1.0.0")

@app.get("/")
def root():
    return {"message": "Wakhar WMS is running"}
