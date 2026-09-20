from fastapi import FastAPI

app = FastAPI(root_path="/api/template")

@app.get("/")
def read_root():
    return {"Hello": "Template"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
