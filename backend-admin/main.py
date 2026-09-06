from fastapi import FastAPI

app = FastAPI(root_path="/api/admin")

@app.get("/")
def read_root():
    return {"Hello": "Admin"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
