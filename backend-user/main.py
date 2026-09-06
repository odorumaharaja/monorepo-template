from fastapi import FastAPI

app = FastAPI(root_path="/api/user")

@app.get("/")
def read_root():
    return {"Hello": "User"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
