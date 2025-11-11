from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import API route files
from Login import router as login_router # type: ignore
from Threshold import router as threshold_router
# Later you will import:
# from reports import router as reports_router
# from threshold import router as threshold_router

app = FastAPI(
    title="UMBC Accessibility Map API",
    description="Backend for routing, reports, authentication, and threshold controls",
    version="1.0"
)

# allow frontend to call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # change to your frontend domain when deployed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# include login routes
app.include_router(login_router, prefix="/auth", tags=["Authentication"])
app.include_router(threshold_router, prefix="/main", tags=["Main Page"])

@app.get("/")
def home():
    return {"status": "API Running", "message": "Welcome to the UMBC Accessibility Backend!"}
